module.exports = grammar({
  name: "surrealql",

  conflicts: ($) => [
    [$.select_list, $.select_item],
    [$.dotted_identifier, $.identifier],
    [$.field_reference, $.function_call],
  ],

  extras: ($) => [/\s+/, $.comment],

  precedences: ($) => [
    [
      "primary",
      "postfix",
      "unary",
      "multiplicative",
      "additive",
      "comparative",
      "and",
      "or",
    ],
    ["field", "edge"],
    ["expression", "clause"],
  ],

  rules: {
    // ==========================================
    // Root
    // ==========================================
    source_file: ($) => repeat(choice($.statement, $.comment)),

    statement: ($) =>
      seq(
        choice(
          $.select_statement,
          $.create_statement,
          // Future: $.update_statement,
          // Future: $.delete_statement,
          // Future: $.relate_statement,
          // Future: $.define_statement,
          $.expression,
        ),
        optional(";"),
      ),

    // ==========================================
    // Comments
    // ==========================================
    comment: ($) =>
      token(
        choice(
          seq("//", /.*/),
          seq("#", /.*/),
          seq("--", /.*/),
          seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/"),
        ),
      ),

    // ==========================================
    // Identifiers and References
    // ==========================================
    raw_identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    dotted_identifier: ($) =>
      prec.left(
        "primary",
        seq($.raw_identifier, repeat1(seq(".", $.raw_identifier))),
      ),

    identifier: ($) =>
      prec(
        "primary",
        choice(
          $.raw_identifier,
          $.dotted_identifier,
          // Record ID moved to separate rule with lower precedence
          prec.left(-1, $.record_id),
        ),
      ),

    variable_name: ($) => seq("$", $.raw_identifier),

    record_id: ($) =>
      seq(
        $.raw_identifier,
        ":",
        choice($.raw_identifier, $.number, $.string, $.variable_name),
      ),

    // ==========================================
    // Field and Edge References
    // ==========================================
    field_reference: ($) =>
      prec.left(
        "field",
        choice(
          $.identifier,
          seq($.identifier, repeat1(seq(".", $.identifier))),
          seq($.identifier, $.edge_path),
        ),
      ),

    edge_path: ($) =>
      choice(
        seq("->", $.identifier),
        seq("<-", $.identifier),
        seq("->", $.identifier, "->", $.identifier),
        seq("<-", $.identifier, "<-", $.identifier),
      ),

    edge_reference: ($) =>
      prec(
        "edge",
        seq(
          optional($.identifier),
          $.edge_path,
          optional(seq("AS", $.identifier)),
        ),
      ),

    // ==========================================
    // Literals and Basic Values
    // ==========================================
    string: ($) =>
      choice(seq('"', repeat(/[^"]/), '"'), seq("'", repeat(/[^']/), "'")),

    number: ($) => /\d+/,

    duration: ($) =>
      seq($.number, choice("ns", "µs", "ms", "s", "m", "h", "d", "w", "y")),

    // Data Structures
    object: ($) => seq("{", commaSep($.object_property), "}"),
    object_property: ($) =>
      seq(choice($.object_key, $.string), ":", $.expression),
    object_key: ($) =>
      prec.left("primary", choice($.raw_identifier, $.dotted_identifier)),

    array: ($) => seq("[", commaSep($.expression), "]"),

    // ==========================================
    // Functions and Calls
    // ==========================================
    namespace_call: ($) =>
      prec.left(
        "postfix",
        seq(
          $.raw_identifier,
          "::",
          $.raw_identifier,
          optional(seq("(", optional($.argument_list), ")")),
        ),
      ),

    function_call: ($) =>
      prec.left(
        "postfix",
        seq(
          choice(
            $.identifier,
            $.namespace_call,
            seq($.identifier, repeat1(seq(".", $.identifier))),
          ),
          "(",
          optional($.argument_list),
          ")",
        ),
      ),

    argument_list: ($) => commaSep1($.expression),

    // ==========================================
    // Expressions
    // ==========================================
    expression: ($) =>
      prec.left(
        "or",
        choice(
          $.or_expr,
          $.and_expr,
          $.comparison_expr,
          $.additive_expr,
          $.multiplicative_expr,
          $.value_expr,
          seq("(", $.expression, ")"),
        ),
      ),

    or_expr: ($) =>
      prec.left("or", seq($.expression, choice("OR", "||"), $.expression)),

    and_expr: ($) =>
      prec.left("and", seq($.expression, choice("AND", "&&"), $.expression)),

    comparison_expr: ($) =>
      prec.left(
        "comparative",
        seq(
          $.expression,
          choice("=", "!=", ">", "<", ">=", "<=", "CONTAINS", "INSIDE"),
          $.expression,
        ),
      ),

    value_expr: ($) =>
      prec(
        "primary",
        choice(
          $.field_reference,
          $.function_call,
          $.namespace_call,
          $.string,
          $.number,
          $.duration,
          $.variable_name,
          $.object,
          $.array,
          seq("(", $.expression, ")"),
        ),
      ),

    additive_expr: ($) =>
      prec.left("additive", seq($.expression, choice("+", "-"), $.expression)),

    multiplicative_expr: ($) =>
      prec.left(
        "multiplicative",
        seq($.expression, choice("*", "/", "%"), $.expression),
      ),

    // ==========================================
    // SELECT Statement Components
    // ==========================================
    select_statement: ($) =>
      seq(
        "SELECT",
        choice(
          seq("VALUE", $.expression, optional(seq("AS", $.identifier))),
          seq(
            prec("primary", optional($.select_list)),
            optional($.omit_clause), // OMIT comes right after SELECT fields
          ),
        ),
        $.from_clause,
        optional($.clause_sequence),
      ),

    select_list: ($) => prec.left(choice("*", commaSep1($.select_item))),

    select_item: ($) =>
      prec.left(
        choice(
          "*",
          $.field_reference,
          $.function_call,
          $.edge_reference,
          seq($.expression, "AS", $.identifier),
        ),
      ),

    // ==========================================
    // Table References and Sources
    // ==========================================
    table_reference: ($) =>
      prec.left(
        choice(
          $.field_reference,
          seq("(", $.select_statement, ")"),
          seq("[", commaSep1($.expression), "]"),
        ),
      ),

    // ==========================================
    // Clauses
    // ==========================================
    clause_sequence: ($) => prec.left("clause", repeat1($.clause)),

    clause: ($) =>
      choice(
        $.where_clause,
        $.split_clause,
        $.omit_clause,
        $.group_clause,
        $.order_clause,
        $.limit_clause,
        $.start_clause,
        $.fetch_clause,
        $.timeout_clause,
        $.parallel_clause,
        $.tempfiles_clause,
        $.explain_clause,
      ),

    from_clause: ($) =>
      seq(
        "FROM",
        optional("ONLY"),
        commaSep1($.table_reference),
        optional($.with_clause),
      ),

    with_clause: ($) =>
      seq("WITH", choice("NOINDEX", seq("INDEX", commaSep1($.identifier)))),

    where_clause: ($) => seq("WHERE", $.expression),

    return_clause: ($) =>
      seq("RETURN", choice("BEFORE", "AFTER", "DIFF", $.select_list)),

    split_clause: ($) => seq("SPLIT", $.field_reference),

    omit_clause: ($) => seq("OMIT", commaSep1($.omit_item)),

    // Handles destructuring of omit.
    omit_item: ($) =>
      choice(
        $.field_reference,
        seq($.field_reference, ".", $.destructure_block),
      ),

    destructure_block: ($) => seq("{", commaSep1($.raw_identifier), "}"),

    group_clause: ($) =>
      seq("GROUP", optional("BY"), choice("ALL", commaSep1($.expression))),

    order_clause: ($) => seq("ORDER", optional("BY"), commaSep1($.order_item)),

    order_item: ($) =>
      seq(
        choice($.expression, seq("RAND", "(", ")")),
        optional(
          choice(
            "COLLATE",
            "NUMERIC",
            "ASC",
            "DESC",
            seq("COLLATE", choice("ASC", "DESC")),
            seq("NUMERIC", choice("ASC", "DESC")),
          ),
        ),
      ),

    limit_clause: ($) => seq("LIMIT", optional("BY"), $.expression),

    start_clause: ($) => seq("START", optional("AT"), $.expression),

    fetch_clause: ($) =>
      seq(
        "FETCH",
        commaSep1(
          choice(
            $.identifier,
            seq($.edge_path, optional(seq("AS", $.identifier))),
          ),
        ),
      ),

    timeout_clause: ($) => seq("TIMEOUT", $.duration),

    parallel_clause: ($) => "PARALLEL",
    tempfiles_clause: ($) => "TEMPFILES",
    explain_clause: ($) => seq("EXPLAIN", optional("FULL")),

    // CREATE Statement
    create_statement: ($) =>
      seq(
        "CREATE",
        optional("ONLY"),
        commaSep1(choice($.identifier, $.variable_name, $.record_id)),
        choice($.content_clause, $.set_clause, $.unset_clause),
        optional($.return_clause),
        optional($.timeout_clause),
        optional($.parallel_clause),
      ),

    // UPDATE Statement
    update_statement: ($) =>
      seq(
        "UPDATE",
        optional("ONLY"),
        commaSep1($.expression),
        optional(
          choice(
            $.content_clause,
            $.merge_clause,
            $.patch_clause,
            $.set_clause,
            $.unset_clause,
          ),
        ),
        optional($.where_clause),
        optional($.return_clause),
        optional($.timeout_clause),
        optional($.parallel_clause),
      ),

    // Data Manipulation Clauses
    content_clause: ($) => seq("CONTENT", $.object),
    merge_clause: ($) => seq("MERGE", $.object),
    patch_clause: ($) => seq("PATCH", $.array),
    set_clause: ($) => seq("SET", commaSep1($.field_assignment)),
    unset_clause: ($) => seq("UNSET", commaSep1($.field_assignment)),
    field_assignment: ($) => seq($.field_reference, "=", $.expression),
  },
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}

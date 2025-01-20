module.exports = grammar({
  name: "surrealql",

  conflicts: ($) => [
    [$.select_list, $.select_item],
    [$.dotted_identifier, $.identifier],
  ],

  extras: ($) => [/\s+/, $.comment],

  precedences: ($) => [
    [
      "primary", // Highest precedence: identifiers, literals
      "postfix", // Function calls, field access
      "unary", // Unary operators
      "multiplicative", // *, /, %
      "additive", // +, -
      "comparative", // =, !=, >, <, etc.
      "and",
      "or", // Lowest precedence
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
          // Future: $.create_statement,
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
        choice($.raw_identifier, $.dotted_identifier, $.record_id),
      ),

    record_id: ($) =>
      prec(
        "primary",
        seq(
          $.raw_identifier,
          ":",
          choice($.raw_identifier, $.number, $.string),
        ),
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
  },
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}

# 🌟 tree-sitter-surrealql

A [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for [SurrealQL](https://surrealdb.com/docs/surrealql), the query language for SurrealDB.

[![Build Status](https://placeholder-for-build-badge.svg)](https://placeholder-for-build-url)
[![NPM version](https://placeholder-for-npm-badge.svg)](https://placeholder-for-npm-url)

## 🚀 Features

- Complete syntax highlighting for SurrealQL queries
- Supports all SurrealQL statements:
  - `SELECT` statements with all clauses
  - *Future: `CREATE`, `UPDATE`, `DELETE` statements*
  - *Future: `DEFINE`, `RELATE` statements*
- Powers the [Zed](https://zed.dev) SurrealQL extension *(coming soon)*

## 🔧 Installation

```bash
npm install tree-sitter-surrealql
```

## 📚 Usage

### With Neovim

```lua
local parser_config = require "nvim-treesitter.parsers".get_parser_configs()
parser_config.surrealql = {
    install_info = {
        url = "https://github.com/username/tree-sitter-surrealql",
        files = {"src/parser.c"},
        branch = "main",
    },
    filetype = "surql",
}
```

### With Tree-sitter CLI

```bash
tree-sitter parse example.surql
```

## 🎨 Syntax Examples

```sql
-- Basic SELECT
SELECT * FROM user WHERE age >= 18;

-- Complex queries with edge traversal
SELECT ->purchased->product AS purchases
FROM user
FETCH purchases;

-- Function calls with namespaces
SELECT time::now() AS current_time,
       string::lowercase(name) AS lower_name
FROM user;
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📜 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- [Zed SurrealQL Extension](https://github.com/DrewRidley/zed-surrealql) - Official SurrealQL extension for Zed editor
- [SurrealDB](https://surrealdb.com) - Official SurrealDB website

## ⭐ Support

If you find this helpful, please star the repository!

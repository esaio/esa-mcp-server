# esa MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**日本語** | [English](README.en.md)

esa.io の公式 MCP(Model Context Protocol)サーバー(STDIO Transport版)

## 概要

AI アシスタントと情報共有サービス [esa](https://esa.io) をつなぐ MCP サーバーです。Model Context Protocol 経由で、AI アシスタントから esa の記事を読んだり、作成・更新・管理などができます。

## 使えるツール

### チーム管理
- `esa_get_teams` - 所属している esa チームの一覧
- `esa_get_team_stats` - チームの統計情報（メンバー数、記事数、コメント数など）
- `esa_get_team_tags` - チーム内で使われているタグと使用回数
- `esa_get_team_members` - チームメンバーとその役割・プロフィール

### 記事管理

- `esa_search_posts` - 記事を検索
- `esa_get_post` - 記事IDから記事を取得
- `esa_create_post` - 新しい記事を作成（タグ、カテゴリー、WIP ステータス付き）
- `esa_update_post` - 記事を更新（タイトル、本文、タグ、カテゴリー、WIP ステータス）

### 記事の操作
- `esa_archive_post` - 記事をアーカイブ（Archived/ カテゴリーへ移動）
- `esa_ship_post` - 記事を Ship It!（WIP を外して公開）
- `esa_duplicate_post` - 記事を複製するための準備（タイトルと本文を取得）

### コメント管理
- `esa_get_comment` - コメント ID からコメントを取得
- `esa_create_comment` - 記事にコメントを追加
- `esa_update_comment` - コメントを編集
- `esa_delete_comment` - コメントを削除
- `esa_get_post_comments` - 記事のコメント一覧（ページング対応）
- `esa_get_team_comments` - チーム全体のコメント一覧（ページング対応）

### カテゴリー管理
- `esa_get_categories` - 指定パス配下のカテゴリー一覧
- `esa_get_top_categories` - トップレベルのカテゴリー一覧

### ヘルプとドキュメント
- `esa_get_search_options_help` - esa の検索構文ヘルプ
- `esa_get_markdown_syntax_help` - esa の Markdown 記法ヘルプ
- `esa_search_help` - esa のドキュメントから機能や用語を検索

## リソース

- `esa_recent_posts` - 最近更新された記事の一覧
  - テンプレート: `esa://teams/{teamName}/posts/recent`
  - 戻り値: 最近更新された記事の JSON リスト

## プロンプト

- `esa_summarize_post` - esa の記事を要約
  - 入力: チーム名と記事ID
  - 出力: 記事の構造化された要約

## MCP クライアントの設定

MCP クライアントの設定ファイルに以下を追加します：

### 用意する環境変数

- ESA_ACCESS_TOKEN: アクセストークン
   - 必要なスコープ: `read write` または `admin:comment read:post write:post read:category read:tag read:team read:member`
   - [PAT v2](https://docs.esa.io/posts/559)を推奨します。
- LANG: UI の言語設定

<details>
<summary><b>Claude Desktop でのインストール</b></summary>

`claude_desktop_config.json` への追加方法：

#### オプション 1: docker(推奨)

```json
{
  "mcpServers": {
    "esa": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "ESA_ACCESS_TOKEN",
        "-e",
        "LANG",
        "ghcr.io/esaio/esa-mcp-server"
      ],
      "env": {
        "ESA_ACCESS_TOKEN": "your_personal_access_token",
        "LANG": "ja"
      }
    }
  }
}
```

#### オプション 2: npx

```json
{
  "mcpServers": {
    "esa": {
      "command": "/path/to/your/npx",
      "args": [
        "@esaio/esa-mcp-server"
      ],
      "env": {
        "ESA_ACCESS_TOKEN": "your_personal_access_token",
        "LANG": "ja"
      }
    }
  }
}
```

> **注意**: `/path/to/your/npx` は `which npx` で調べたパスに置き換えてください。


</details>


<details>
<summary><b>Cursor でのインストール</b></summary>

`設定` -> `Cursor Settings` -> `MCP` -> `Add new global MCP server` に移動します

Cursor の `~/.cursor/mcp.json` ファイルに以下の設定を貼り付けることを推奨します。プロジェクトフォルダに `.cursor/mcp.json` を作成することで、特定のプロジェクトにインストールすることも可能です。詳細は [Cursor MCP docs](https://docs.cursor.com/context/model-context-protocol) を参照してください。


#### Cursor ローカルサーバー接続（`npx` 使用）

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=esa&config=ewogICAgICAiY29tbWFuZCI6ICJucHgiLAogICAgICAiYXJncyI6IFsKICAgICAgICAiQGVzYWlvL2VzYS1tY3Atc2VydmVyIgogICAgICBdLAogICAgICAiZW52IjogewogICAgICAgICJFU0FfQUNDRVNTX1RPS0VOIjogInlvdXJfcGVyc29uYWxfYWNjZXNzX3Rva2VuIiwKICAgICAgICAiTEFORyI6ICJlbiIKICAgICAgfQogICAgfQ==)

```json
{
  "mcpServers": {
    "esa": {
      "command": "npx",
      "args": [
        "@esaio/esa-mcp-server"
      ],
      "env": {
        "ESA_ACCESS_TOKEN": "your_personal_access_token",
        "LANG": "ja"
      }
    },
  }
}

```

</details>

<details>
<summary><b>VS Code でのインストール</b></summary>

[<img alt="Install in VS Code (npx)" src="https://img.shields.io/badge/VS_Code-VS_Code?style=flat-square&label=Install%20Esa%20MCP&color=0098FF">](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%7B%22name%22%3A%22esa%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22%40esaio%2Fesa-mcp-server%40latest%22%5D%2C%20%22env%22%3A%7B%22ESA_ACCESS_TOKEN%22%3A%22your_personal_access_token%22%2C%22LANG%22%3A%22ja%22%7D%7D)

VS Code の MCP 設定ファイルに以下を追加してください。詳細は [VS Code MCP docs](https://code.visualstudio.com/docs/copilot/chat/mcp-servers) を参照してください。

#### VS Code ローカルサーバー接続（`npx` 使用）

```json
"mcp": {
  "servers": {
    "esa": {
      "type": "stdio",
      "command": "npx",
      "args": ["@esaio/esa-mcp-server"],
      "env": {
        "ESA_ACCESS_TOKEN": "your_personal_access_token",
        "LANG": "ja"
      }
    }
  }
}
```

</details>



## リンク

- [esa.io](https://esa.io) - 情報共有サービス esa
- [Model Context Protocol](https://modelcontextprotocol.io) - MCP の詳細
- [API ドキュメント](https://docs.esa.io/posts/102) - esa API リファレンス
- [Claude Desktop](https://claude.ai/download) - MCP 対応の AI アシスタント

## サポート

- 📧 Support: [Feedback Form](https://esa.io/feedbacks/new)
- 🐛 Issues: [GitHub Issues](https://github.com/esaio/esa-mcp-server/issues)
- 📖 Help: [esa Docs](https://docs.esa.io)

---

Made with ❤️ by the esa team

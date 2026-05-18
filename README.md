# esa MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**日本語** | [English](https://github.com/esaio/esa-mcp-server/blob/main/README.en.md)

esa.io の公式 MCP(Model Context Protocol)サーバー(STDIO Transport 版)

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
- `esa_get_post` - 記事 ID から記事を取得
- `esa_create_post` - 新しい記事を作成（タグ、カテゴリー、WIP ステータス付き）
- `esa_update_post` - 記事を更新（タイトル、本文、タグ、カテゴリー、WIP ステータス）

### 記事の操作

- `esa_archive_post` - 記事をアーカイブ（Archived/ カテゴリーへ移動）
- `esa_ship_post` - 記事を Ship It!（WIP を外して公開）
- `esa_duplicate_post` - 記事を複製（同じタイトル・本文の WIP 記事を作成。別チームへの複製も可能）

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
- `esa_get_all_category_paths` - チーム内の全カテゴリーパス一覧（記事数付き、フィルタリング対応）
  - カテゴリ構造の把握、整理、統合の計画に最適
  - フィルター例: `prefix: "dev"` で開発関連、`match: "api"` で API 関連を検索

### 添付ファイル

- `esa_get_attachment` - 記事やコメントの添付ファイルを取得
  - サポート形式（JPEG, PNG, GIF, WebP）で 30MB 以下の画像は base64 エンコードで返却
  - その他のファイル、大きな画像、または forceSignedUrl 指定時は署名付き URL（有効期限 5 分）を返却

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
  - 入力: チーム名と記事 ID
  - 出力: 記事の構造化された要約

## MCP クライアントの設定

MCP クライアントの設定ファイルに以下を追加します：

### 用意する環境変数

- ESA_ACCESS_TOKEN: アクセストークン
  - 必要なスコープ: `read write` または `admin:comment read:post write:post read:category read:tag read:attachment read:team read:member`
  - [PAT v2](https://docs.esa.io/posts/559)を推奨します。
- LANG: UI の言語設定

### Claude Desktop の例

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
      "command": "/Users/your-username/.nodenv/shims/npx",
      "args": ["@esaio/esa-mcp-server"],
      "env": {
        "ESA_ACCESS_TOKEN": "your_personal_access_token",
        "LANG": "ja"
      }
    }
  }
}
```

> **注意**: `/path/to/your/node` は `which node` で調べたパスに置き換えてください。

## レジストリ

このパッケージはルート直下に `registry.json` を同梱しており、登録されているツール / リソース / プロンプトの一覧を公開しています。サーバーを起動せずにプログラムから読み取れます:

```js
import registry from "@esaio/esa-mcp-server/registry.json" with { type: "json" };
```

スキーマ:

```json
{
  "tools": [{ "name": "esa_get_teams" }, "..."],
  "resources": [
    { "name": "esa_recent_posts", "uriTemplate": "esa://teams/{teamName}/posts/recent" }
  ],
  "prompts": [{ "name": "esa_summarize_post" }]
}
```

`registry.json` は `npm run build:registry` で生成され、登録内容と差分が出ると CI で fail します。

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

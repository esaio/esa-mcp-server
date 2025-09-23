# esa MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[日本語](README.md) | **English**

Official Model Context Protocol (MCP) server for esa.io - STDIO transport version.

## Overview

This MCP server provides seamless integration between AI assistants and [esa.io](https://esa.io), a collaborative documentation platform. It enables AI assistants to read, create, update, and manage esa documents directly through the Model Context Protocol.

## Available Tools

### Team Management
- `esa_get_teams` - Get user's accessible esa teams
- `esa_get_team_stats` - Get team statistics (members, posts, comments, stars, watches, active users)
- `esa_get_team_tags` - Get all tags used in team posts with count
- `esa_get_team_members` - Get team members with roles and profile information

### Post Management

- `esa_search_posts` - Search for posts in esa.io
- `esa_get_post` - Get a specific post by post number
- `esa_create_post` - Create a new post with tags, category, and WIP status
- `esa_update_post` - Update existing post (title, content, tags, category, WIP status)

### Post Actions
- `esa_archive_post` - Archive a post by moving to Archived/ category
- `esa_ship_post` - Ship a post (mark as complete by setting wip to false)
- `esa_duplicate_post` - Prepare a post for duplication (retrieve name and body_md)

### Comment Management
- `esa_get_comment` - Get a specific comment by ID
- `esa_create_comment` - Create a new comment on a post
- `esa_update_comment` - Update an existing comment
- `esa_delete_comment` - Delete a comment
- `esa_get_post_comments` - Get comments for a specific post with pagination
- `esa_get_team_comments` - Get team comments with pagination

### Category Management
- `esa_get_categories` - Get categories and subcategories for a specific path
- `esa_get_top_categories` - Get all top-level categories for a team

### Help & Documentation
- `esa_get_search_options_help` - Get esa search syntax documentation
- `esa_get_markdown_syntax_help` - Get esa Markdown syntax documentation
- `esa_search_help` - Search esa documentation for features and terminology

## Available Resources

- `esa_recent_posts` - Fetch recent updated posts from esa team
  - Template: `esa://teams/{teamName}/posts/recent`
  - Returns: JSON list of recently updated posts

## Available Prompts

- `esa_summarize_post` - Summarize an esa post content
  - Input: Team name and post number
  - Output: Structured summary of the post content

## MCP Client Configuration

Add to your MCP client configuration file:

### Required Environment Variables

- ESA_ACCESS_TOKEN: Access Token
   - Required scopes: `read write` or `admin:comment read:post write:post read:category read:tag read:team read:member`
   - [PAT v2](https://docs.esa.io/posts/559) is recommended.
- LANG: Language for UI

<details>
<summary><b>Install in Claude Desktop</b></summary>

Add to `claude_desktop_config.json`:

#### Option 1: Docker (Recommended)

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
        "LANG": "en"
      }
    }
  }
}
```

#### Option 2: npx

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
        "LANG": "en"
      }
    }
  }
}
```

> **Note**: Replace `/path/to/your/npx` with the output of `which npx` command.


</details>


<details>
<summary><b>Install in Cursor</b></summary>

Go to: `Settings` -> `Cursor Settings` -> `MCP` -> `Add new global MCP server`

Pasting the following configuration into your Cursor `~/.cursor/mcp.json` file is the recommended approach. You may also install in a specific project by creating `.cursor/mcp.json` in your project folder. See [Cursor MCP docs](https://docs.cursor.com/context/model-context-protocol) for more info.


#### Cursor Local Server Connection with `npx`

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
        "LANG": "en"
      }
    },
  }
}

```

</details>

<details>
<summary><b>Install in VS Code</b></summary>

[<img alt="Install in VS Code (npx)" src="https://img.shields.io/badge/VS_Code-VS_Code?style=flat-square&label=Install%20Esa%20MCP&color=0098FF">](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%7B%22name%22%3A%22esa%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22%40esaio%2Fesa-mcp-server%40latest%22%5D%2C%20%22env%22%3A%7B%22ESA_ACCESS_TOKEN%22%3A%22your_personal_access_token%22%2C%22LANG%22%3A%22en%22%7D%7D)

Add this to your VS Code MCP config file. See [VS Code MCP docs](https://code.visualstudio.com/docs/copilot/chat/mcp-servers) for more info.

#### VS Code Local Server Connection with `npx`

```json
"mcp": {
  "servers": {
    "esa": {
      "type": "stdio",
      "command": "npx",
      "args": ["@esaio/esa-mcp-server"],
      "env": {
        "ESA_ACCESS_TOKEN": "your_personal_access_token",
        "LANG": "en"
      }
    }
  }
}
```

</details>


## Links

- [esa.io](https://esa.io) - The collaborative documentation platform
- [Model Context Protocol](https://modelcontextprotocol.io) - Learn more about MCP
- [API Documentation](https://docs.esa.io/posts/102) - esa.io API reference
- [Claude Desktop](https://claude.ai/download) - AI assistant with MCP support

## Support

- 📧 Support: [Feedback Form](https://esa.io/feedbacks/new)
- 🐛 Issues: [GitHub Issues](https://github.com/esaio/esa-mcp-server/issues)
- 📖 Help: [esa Docs](https://docs.esa.io)

---

Made with ❤️ by the esa team

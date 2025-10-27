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

### Attachments

- `esa_get_attachment` - Retrieve attachment files that are only accessible when logged into esa on the web (supports text, images, PDFs, etc.)

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
  - Required scopes: `read write` or `admin:comment read:post write:post read:category read:tag read:attachment read:team read:member`
  - [PAT v2](https://docs.esa.io/posts/559) is recommended.
- LANG: Language for UI

### Claude Desktop Example

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
      "command": "/Users/your-username/.nodenv/shims/npx",
      "args": ["@esaio/esa-mcp-server"],
      "env": {
        "ESA_ACCESS_TOKEN": "your_personal_access_token",
        "LANG": "en"
      }
    }
  }
}
```

> **Note**: Replace `/path/to/your/node` with the output of `which node` command.

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

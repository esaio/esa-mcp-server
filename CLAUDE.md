# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage report

# Linting
npm run lint         # Check for linting issues
npm run lint:fix     # Auto-fix linting and formatting issues

# Type checking
npm run type-check   # Check TypeScript types without building
```

## Architecture Overview

This is an MCP (Model Context Protocol) server implementation for esa.io, using STDIO transport for communication. The architecture follows a simple structure:

### Core Components

1. **MCP Server Setup** (`src/index.ts`): Entry point that initializes the MCP server with STDIO transport. Handles transport lifecycle events and graceful error handling.

2. **Configuration** (`src/config/index.ts`): Centralized configuration management that reads from environment variables. Required env vars:
   - `ESA_ACCESS_TOKEN`: Required for esa.io API authentication
   - `ESA_API_BASE_URL`: Optional API base URL (defaults to https://api.esa.io)

### Key Technical Details

- **Module System**: ES modules (type: "module" in package.json)
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **Code Style**: Enforced by Biome (2 spaces, double quotes, semicolons, trailing commas)
- **Node Version**: Requires Node.js >= 20.19.4

### MCP Server Pattern

The server follows the standard MCP pattern:
1. Validate configuration on startup
2. Create McpServer instance with name and version
3. Initialize StdioServerTransport for STDIO communication
4. Handle transport lifecycle (onclose, onerror)
5. Connect server to transport

When extending functionality, new tools and resources should be registered with the server instance before connecting to transport.

## Testing Guidelines

### Test Writing Principles

When writing tests, follow these principles for maintainable and readable test code:

1. **Import Order Optimization**
   - Type imports first (`import type`)
   - External dependencies next
   - Internal modules last
   - Group related imports together

2. **Mock Creation Patterns**
   - Use `as unknown as` pattern for type casting to keep mocks minimal and focused
   - Create helper functions for complex mock objects (e.g., `createMockConfig`, `createMockServer`)
   - Extract repetitive mock setup into shared helper functions (e.g., `setupServerMocks`)
   - Return mock instances from helper functions for assertion access

3. **Mock Documentation**
   - Add concise comments explaining the purpose of each mock
   - Focus on WHY the mock is needed, not WHAT it does
   - Keep comments brief and directly above the mock definition

4. **Module Mocking with vi.doMock**
   - Use `vi.doMock` for replacing entire modules during import resolution
   - Always call `vi.doMock` before the module import
   - Use dynamic imports (`await import()`) after setting up module mocks
   - Remember that `vi.doMock` is fundamentally different from `vi.fn()` - it intercepts module loading

5. **Test Structure**
   - Keep each test focused on a single behavior
   - Use descriptive test names that explain the expected outcome
   - Group related tests with `describe` blocks
   - Clean up mocks in `beforeEach`/`afterEach` hooks

### Example Test Pattern

- READ src/__tests__/index.test.ts

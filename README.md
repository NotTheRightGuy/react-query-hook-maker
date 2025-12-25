# Applift Hook Maker

A VS Code extension that accelerates React Query development by automatically generating TypeScript types, API functions, query keys, and React hooks from API endpoint specifications.

## Features

This extension helps developers quickly scaffold React Query hooks with proper TypeScript typing by:

- **Automatic TypeScript Type Generation**: Uses Quicktype to generate TypeScript interfaces from example JSON responses
- **Smart Response Type Detection**: Automatically detects and handles:
  - Standard API response wrappers (`WithResponse<T>`)
  - Paginated responses (`WithCustomRecordResponse<K, T>`)
  - Custom response structures
- **Complete Hook Scaffolding**: Generates all necessary code components:
  - TypeScript type definitions (request/response models)
  - API functions with proper error handling
  - Query keys using factory pattern
  - React hooks (`useQuery`, `useMutation`, `useInfiniteQuery`)
- **Intelligent Variable Extraction**: Automatically extracts variables from:
  - URL path parameters (e.g., `${audienceId}`)
  - Request body/query parameters
- **Flexible JSON Parsing**: Supports relaxed JSON formats including:
  - Comments
  - Trailing commas
  - Unquoted keys
- **File Management**: Remembers your last-used files for quick appending of generated code

## Usage

### Basic Workflow

1. Open the Command Palette (`Cmd+Shift+P` on macOS or `Ctrl+Shift+P` on Windows/Linux)
2. Type "Generate API Hook" and select the command
3. Follow the interactive prompts:
   - **Feature Name**: Enter the feature name (e.g., `getAudienceList`)
   - **HTTP Method**: Select from GET, POST, PUT, DELETE, or PATCH
   - **API Endpoint**: Enter the endpoint URL (e.g., `/api/v1/audience/${audienceId}`)
   - **Example Response**: Paste a sample JSON response from the API
   - **Params/Payload**: Enter example parameters or request payload (JSON)
   - **Hook Type**: Select `useQuery`, `useMutation`, or `useInfiniteQuery`
4. The extension generates four code snippets and prompts you to append them to your project files:
   - TypeScript models/types
   - API function
   - Query key definition
   - React hook

### Example

**Input:**
- Feature Name: `getAudienceList`
- HTTP Method: `GET`
- API Endpoint: `/api/v1/audience/list`
- Example Response:
```json
{
  "success": true,
  "data": {
    "totalRecords": 100,
    "filteredRecords": 10,
    "audienceList": [
      {
        "id": 1,
        "name": "Test Audience",
        "status": "active"
      }
    ]
  }
}
```
- Hook Type: `useQuery`

**Generated Code:**

TypeScript types, API function with cancellation support, query key factory, and a typed React hook ready to use in your application.

## Requirements

This extension is designed for React projects using:
- TypeScript
- Tanstack React Query (React Query v4+)
- Axios for HTTP requests

Your project should have the following patterns:
- `WithResponse<T>` type wrapper for standard API responses
- `WithCustomRecordResponse<K, T>` type for paginated responses
- `useInvalidateCommonQueries()` hook for cache invalidation (for mutations)
- `showSnackbarOnApiError()` utility for error display

## Extension Settings

This extension does not contribute any VS Code settings. All configuration is done through the interactive prompts.

## Tips

- **Reuse Last Files**: The extension remembers your last-used files for each code type (models, API, query keys, hooks), making it faster to generate multiple hooks
- **URL Parameters**: Use template literal syntax `${variableName}` in your API URL to automatically extract path parameters
- **Relaxed JSON**: You can paste JSON with comments or trailing commas - the extension will parse it correctly
- **Complex Objects**: The extension handles nested objects and arrays in both responses and request parameters

## Known Issues

- The extension assumes specific naming patterns and helper functions (`WithResponse`, `showSnackbarOnApiError`, etc.) used in the Applift codebase
- Generated code may need minor adjustments for projects with different architectural patterns

## Release Notes

### 0.0.1

Initial release of Applift Hook Maker featuring:
- Interactive API hook generation
- Automatic TypeScript type generation from JSON
- Support for useQuery, useMutation, and useInfiniteQuery
- Smart response type detection (standard, paginated, custom)
- URL and parameter variable extraction
- File memory for quick code appending

---

**Enjoy faster React Query development!**

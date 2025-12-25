
You requested to automatically resolve imports generally when generating files.
I have implemented an intelligent import resolver that:
1.  **Identifies Dependencies**: Scans the generated code for known symbols (e.g., `useQuery`, `getInstance`, `WithResponse`).
2.  **Locates Definitions**: Uses the VS Code Workspace Symbol provider to find where project-specific symbols are defined in your workspace.
3.  **Calculates Paths**: Computes the correct relative import path from the target file to the definition file.
4.  **Injects Imports**: Prepends the necessary `import` statements to the target file, ensuring no duplicates if the file already imports them.

### Changes
- Created `src/resolveImports.ts`: Contains the logic for finding symbols and generating import statements.
- Updated `src/extension.ts`: Integrated the import resolver into the file appending workflow.

Now, when you generate a hook or API function and select a destination file, the extension will automatically add the required imports at the top of that file.

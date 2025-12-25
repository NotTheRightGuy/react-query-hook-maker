import * as vscode from "vscode";
import type { Options } from "prettier";

export const formatCode = async (code: string): Promise<string> => {
    try {
        const prettier = await import("prettier");
        // Try to resolve prettier config from workspace
        const workspaceFolders = vscode.workspace.workspaceFolders;
        let options: Options = { parser: "typescript" };

        if (workspaceFolders && workspaceFolders.length > 0) {
            const configFile = await prettier.resolveConfig(
                workspaceFolders[0].uri.fsPath
            );
            if (configFile) {
                options = { ...configFile, parser: "typescript" };
            }
        }

        return await prettier.format(code, options);
    } catch (e) {
        console.error("Prettier formatting failed", e);
        return code;
    }
};

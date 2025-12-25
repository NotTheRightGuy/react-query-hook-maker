
import * as vscode from "vscode";
import { generateHookCommand } from "./commands/generateHook";
import { generateHookFromOpenApiCommand } from "./commands/generateHookFromOpenApi";

export function activate(context: vscode.ExtensionContext) {
    console.log("React Query Hook Builder is now active!");

    let disposable = vscode.commands.registerCommand(
        "extension.generateHook",
        () => generateHookCommand(context)
    );

    let openApiDisposable = vscode.commands.registerCommand(
        "extension.generateHookFromOpenAPI",
         () => generateHookFromOpenApiCommand(context)
    );

    context.subscriptions.push(disposable, openApiDisposable);
}

export function deactivate() {}

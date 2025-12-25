
import * as vscode from "vscode";
import { generateFiles } from "../lib/generateFiles";
import { appendToFile } from "../lib/utils/FileSystemUtils";
import { formatCode } from "../lib/utils/FormatUtils";

export async function generateHookCommand(context: vscode.ExtensionContext) {
    // 1. Get Feature Name
    const featureName = await vscode.window.showInputBox({
        prompt: "Enter feature name (e.g. getAudienceList): ",
        ignoreFocusOut: true,
    });

    const methodType = await vscode.window.showQuickPick(
        ["GET", "POST", "PUT", "DELETE", "PATCH"],
        {
            placeHolder: "Select HTTP Method",
            ignoreFocusOut: true,
        }
    );

    // 3. Get API URL
    const apiUrl = await vscode.window.showInputBox({
        prompt: "Enter API Endpoint URL: ",
        ignoreFocusOut: true,
    });

    const exampleResponse = await vscode.window.showInputBox({
        prompt: "Enter example JSON response: ",
        ignoreFocusOut: true,
    });

    const headers = await vscode.window.showInputBox({
        prompt: "Enter example params or payload (JSON): ",
        ignoreFocusOut: true,
    });

    // 2. Select Hook Type
    const hookType = await vscode.window.showQuickPick(
        ["useQuery", "useMutation", "useInfiniteQuery"],
        {
            placeHolder: "Select Hook Type",
        }
    );

    if (!featureName || !methodType || !apiUrl || !hookType) {
        vscode.window.showErrorMessage("Missing required inputs");
        return;
    }

    try {
        const generated = await generateFiles({
            featureName,
            methodType,
            apiUrl,
            exampleResponse: exampleResponse || "",
            params: headers || "",
            hookType,
        });

        // Ask for each part with unique state keys
        if (generated.model) {
            const formatted = await formatCode(generated.model);
            await appendToFile(
                context,
                formatted,
                "Model/Types",
                "lastPath_model"
            );
        }
        if (generated.api) {
            const formatted = await formatCode(generated.api);
            await appendToFile(
                context,
                formatted,
                "API Function",
                "lastPath_api"
            );
        }
        if (generated.queryKey) {
            const formatted = await formatCode(generated.queryKey);
            await appendToFile(
                context,
                formatted,
                "Query Key",
                "lastPath_queryKey"
            );
        }
        if (generated.hook) {
            const formatted = await formatCode(generated.hook);
            await appendToFile(context, formatted, "Hook", "lastPath_hook");
        }
    } catch (e) {
        vscode.window.showErrorMessage("Error generating files: " + e);
    }
}

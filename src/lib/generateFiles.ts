
import { GenerateFilesProps, GenerateFileResponse } from "./types";
import { generateModels, generateBatchModels } from "./generators/ModelGenerator";
import { generateApiFunction } from "./generators/ApiGenerator";
import { generateQueryKey } from "./generators/QueryKeyGenerator";
import { generateHook } from "./generators/HookGenerator";

export { generateBatchModels };

export async function generateFiles(
    props: GenerateFilesProps
): Promise<GenerateFileResponse> {
    const { featureName, hookType } = props;

    const pascalName = featureName.charAt(0).toUpperCase() + featureName.slice(1);
    const camelName = featureName.charAt(0).toLowerCase() + featureName.slice(1);
    const apiFunctionName = camelName;
    const queryKeyName = `${camelName}Key`;

    // 1. Generate Models
    const modelResult = await generateModels(props, pascalName);

    // 2. Generate API Function
    const apiFunction = await generateApiFunction(props, modelResult, pascalName, camelName, queryKeyName);

    // 3. Generate Query Key
    const queryKeyDefinition = generateQueryKey(props, modelResult, camelName, queryKeyName);

    // 4. Generate Hook
    const hookBody = generateHook(props, modelResult, pascalName, camelName, apiFunctionName, queryKeyName);

    // Combine Model parts
    const modelOutput = [modelResult.variablesDefinition, modelResult.responseModel]
            .filter(Boolean)
            .join("\n\n");

    return {
        model: modelOutput,
        api: apiFunction,
        queryKey: queryKeyDefinition,
        hook: hookBody,
    };
}

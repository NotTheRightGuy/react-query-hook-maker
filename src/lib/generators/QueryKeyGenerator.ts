
import { GenerateFilesProps, ModelResult } from "../types";

export function generateQueryKey(
    props: GenerateFilesProps,
    modelResult: ModelResult,
    camelName: string,
    queryKeyName: string
): string {
    const { hookType, paramsSchema } = props;
    const { paramsJson, variablesInterfaceName } = modelResult;

    const hasVariables = paramsSchema ? true : Object.keys(paramsJson).length > 0;

    if (hookType !== 'useMutation') {
        let queryKeyArgsType = `{ scope: '${camelName}' }`;
        
        if (hasVariables) {
            queryKeyArgsType += ` & ${variablesInterfaceName}`;
        }
    
        return `export const ${queryKeyName} = {
      keys: (args: ${queryKeyArgsType}) => [args] as const,
    };`;
    }
    return "";
}

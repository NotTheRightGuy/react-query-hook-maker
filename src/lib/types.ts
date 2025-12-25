
export interface GenerateFilesProps {
    featureName: string;
    methodType: string;
    apiUrl: string;
    exampleResponse: string;
    params: string;
    hookType: string;
    responseSchema?: string;
    paramsSchema?: string;
    skipModelGeneration?: boolean;
    wrapperArgs?: string;
}

export interface GenerateFileResponse {
    model: string;
    queryKey: string;
    api: string;
    hook: string;
}

export interface GeneratorContext {
    pascalName: string;
    camelName: string;
    featureName: string;
    apiUrl: string;
    method: string;
    hookType: string;
    isInfinite: boolean;
    wrapperArgs?: string;
}

export interface ModelResult {
    responseModel: string;
    apiReturnType: string;
    variablesDefinition: string;
    variablesType: string;
    paramsJson: Record<string, any>;
    urlVars: string[];
    variablesInterfaceName: string; 
}

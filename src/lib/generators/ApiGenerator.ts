
import { GenerateFilesProps, ModelResult } from "../types";
import { getSafeVarName, getUniqueVarMapping } from "../utils/StringUtils";

export async function generateApiFunction(
    props: GenerateFilesProps,
    modelResult: ModelResult,
    pascalName: string,
    camelName: string,
    queryKeyName: string
): Promise<string> {
    const { hookType, paramsSchema, methodType, wrapperArgs, apiUrl } = props;
    const { variablesType, paramsJson, urlVars, apiReturnType } = modelResult;

    // Normalize URL
    const processedApiUrl = apiUrl.replace(/(\$?)\{(\w+)\}/g, (match, prefix, varName) => `\${${getSafeVarName(varName)}}`);

    let apiArgsRaw = "";
    let apiArgsTyped = "";

    if (variablesType !== "void" && variablesType !== "any") {
        const keys = Object.keys(paramsJson);
        if (keys.length > 0) {
            const mapping = getUniqueVarMapping(keys);
            apiArgsRaw = `{ ${mapping.map(m => m.key === m.safe ? m.key : `${JSON.stringify(m.key)}: ${m.safe}`).join(", ")} }`;
            apiArgsTyped = `: ${variablesType}`;
        }
    } else if (urlVars.length > 0) {
        const mapping = getUniqueVarMapping(urlVars);
        apiArgsRaw = `{ ${mapping.map(m => m.key === m.safe ? m.key : `${JSON.stringify(m.key)}: ${m.safe}`).join(", ")} }`;
        apiArgsTyped = `: { ${urlVars.map((v) => `${JSON.stringify(v)}: any`).join("; ")} }`;
    }

    let bodyParams: string[] = [];
    if (paramsSchema) {
        try {
            const parsedSchema = JSON.parse(paramsSchema);
             if (parsedSchema.properties) {
                bodyParams = Object.keys(parsedSchema.properties).filter(
                    (k) => !urlVars.includes(k)
                );
             }
        } catch (e) {
            // ignore
        }
    } else {
        bodyParams = Object.keys(paramsJson).filter((k) => !urlVars.includes(k));
    }

    const httpMethod = methodType.toLowerCase();
    const apiFunctionName = camelName;

    if (hookType === "useQuery" || hookType === "useInfiniteQuery") {
        let allVars: string[] = [];
        if (paramsSchema) {
             try {
                const parsed = JSON.parse(paramsSchema);
                if (parsed.properties) {
                     allVars = [...new Set([...urlVars, ...Object.keys(parsed.properties)])];
                } else {
                     allVars = urlVars;
                }
             } catch(e) { allVars = urlVars; }
        } else {
             allVars = [...new Set([...urlVars, ...Object.keys(paramsJson)])];
        }

        const varMapping = allVars.map(key => ({ key, safe: getSafeVarName(key) }));
        const destructureString = varMapping.length > 0 
            ? varMapping.map(({key, safe}) => key === safe ? key : `${JSON.stringify(key)}: ${safe}`).join(", ")
            : "";

        let axiosCall = "";
        const method = httpMethod;
        const dataVars = bodyParams;
        
        const dataString = dataVars.length > 0 
             ? `{ ${dataVars.map(k => {
                 const safe = getSafeVarName(k);
                 return k === safe ? k : `${JSON.stringify(k)}: ${safe}`;
             }).join(", ")} }` 
             : "{}";
        
        if (hookType === "useInfiniteQuery") {
             const hasPageNo = dataVars.includes("pageNo");
             if (hasPageNo) {
                 const structVars = dataVars.map(v => {
                     const safe = getSafeVarName(v);
                     const keyPart = v === safe ? v : `${JSON.stringify(v)}: ${safe}`;
                     if (v === "pageNo") {return `pageNo: ${safe} ?? pageParam ?? 1`;}
                     return keyPart;
                 });
                 const newDataString = `{ ${structVars.join(", ")} }`;
                 
                 if (method === "get" || method === "delete") {
                    const paramsConfig = `params: ${newDataString}, `;
                    axiosCall = `await getInstance().${method}(\`${processedApiUrl}\`, { ${paramsConfig}cancelToken: source.token })`;
                 } else {
                    axiosCall = `await getInstance().${method}(\`${processedApiUrl}\`, ${newDataString}, { cancelToken: source.token })`;
                 }
             } else {
                  if (method === "get" || method === "delete") {
                    const paramsConfig =
                        dataVars.length > 0 ? `params: ${dataString}, ` : "";
                    axiosCall = `await getInstance().${method}(\`${processedApiUrl}\`, { ${paramsConfig}cancelToken: source.token })`;
                 } else {
                    axiosCall = `await getInstance().${method}(\`${processedApiUrl}\`, ${dataString}, { cancelToken: source.token })`;
                 }
             }
        } else {
             if (method === "get" || method === "delete") {
                const paramsConfig =
                    dataVars.length > 0 ? `params: ${dataString}, ` : "";
                axiosCall = `await getInstance().${method}(\`${processedApiUrl}\`, { ${paramsConfig}cancelToken: source.token })`;
             } else {
                axiosCall = `await getInstance().${method}(\`${processedApiUrl}\`, ${dataString}, { cancelToken: source.token })`;
             }
        }

         let internalReturnType = apiReturnType;
        let returnBlock = "return response.data;";
        
        if (wrapperArgs) {
            internalReturnType = `${wrapperArgs}<${apiReturnType}>`;
            returnBlock = `if (response.data.success !== true) {
      return Promise.reject('Something went wrong!');
    }
    return response.data?.data;`;
        }

        return `export const ${apiFunctionName} = async (
  context: QueryFunctionContext<ReturnType<typeof ${queryKeyName}.keys>>
): Promise<${apiReturnType}> => {
  const { signal, queryKey } = context;
  const { ${destructureString} } = queryKey[0];
${hookType === "useInfiniteQuery" ? "  const { pageParam } = context;" : ""}

  const { CancelToken } = axios;
  const source = CancelToken.source();
  signal?.addEventListener('abort', () => {
    source.cancel(\`${processedApiUrl} - Request cancelled\`);
  });

  try {
    const response: AxiosResponse<${internalReturnType}> =
      ${axiosCall};
    ${returnBlock}
  } catch (e) {
    return Promise.reject(((e as any).response as AxiosResponse) ?? e);
  }
};`;
    } else {
        const method = httpMethod;
        let axiosCall = "";
        const dataVars = bodyParams;
        const dataString =
            dataVars.length > 0 ? `, { ${dataVars.join(", ")} }` : "";

        if (method === "get" || method === "delete") {
            axiosCall = `await getInstance().${method}(\`${processedApiUrl}\`${dataString})`;
        } else {
            axiosCall = `await getInstance().${method}(\`${processedApiUrl}\`${dataString})`;
        }

        let internalReturnType = apiReturnType;
        let returnBlock = "return response.data;";
        
        if (wrapperArgs) {
            internalReturnType = `${wrapperArgs}<${apiReturnType}>`;
            returnBlock = `if (response.data.success !== true) {
      return Promise.reject('Something went wrong!');
    }
    return response.data?.data;`;
        }

        return `export const ${apiFunctionName} = async (${apiArgsRaw}${apiArgsTyped}): Promise<${apiReturnType}> => {
  try {
    const response: AxiosResponse<${internalReturnType}> =
      ${axiosCall};
    ${returnBlock}
  } catch (e) {
    return Promise.reject((e as AxiosError).response ?? e);
  }
};`;
    }
}

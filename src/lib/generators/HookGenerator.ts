
import { GenerateFilesProps, ModelResult } from "../types";
import { getSafeVarName, getUniqueVarMapping } from "../utils/StringUtils";

export function generateHook(
    props: GenerateFilesProps,
    modelResult: ModelResult,
    pascalName: string,
    camelName: string,
    apiFunctionName: string,
    queryKeyName: string
): string {
    const { hookType, paramsSchema, apiUrl } = props;
    const { paramsJson, variablesInterfaceName, apiReturnType, urlVars, variablesType, variablesDefinition } = modelResult;

    const hookName = `use${pascalName}`;
    const hasVariables = paramsSchema ? true : Object.keys(paramsJson).length > 0;

    let allVars: string[] = [];
    if (paramsSchema) {
         try {
            const parsed = JSON.parse(paramsSchema);
             if (parsed.properties) {
                 allVars = [...new Set([...urlVars, ...Object.keys(parsed.properties)])];
            } else { allVars = urlVars; }
         } catch(e) { allVars = urlVars; }
    } else {
         allVars = [...new Set([...urlVars, ...Object.keys(paramsJson)])];
    }
    
    if (hookType === "useQuery") {
        const extraHookOptions = `options?: { enabled?: boolean }`;
        let hookPropsType = "";
        
        if (hasVariables) {
             hookPropsType = `${variablesInterfaceName} & { ${extraHookOptions} }`;
        } else {
             hookPropsType = `{ ${extraHookOptions} }`;
        }
        
        let hookDestructure = "";
        if (allVars.length > 0) {
           const mapping = getUniqueVarMapping(allVars);
           hookDestructure = `{ ${mapping.map(m => m.key === m.safe ? m.key : `${JSON.stringify(m.key)}: ${m.safe}`).join(", ")}, options }`;
        } else {
           hookDestructure = `{ options }`;
        }

        let keysObject = `scope: '${camelName}'`;
        if (allVars.length > 0) {
             const mapping = getUniqueVarMapping(allVars);
             keysObject += `, ${mapping.map(m => m.key === m.safe ? m.key : `${JSON.stringify(m.key)}: ${m.safe}`).join(", ")}`;
        }

        return `export const ${hookName} = (${hookDestructure}: ${hookPropsType}) => {
  const response = useQuery(
    ${queryKeyName}.keys({
      ${keysObject}
    }),
    ${apiFunctionName},
    {
      ...options
    }
  );
  return response;
};`;

    } else if (hookType === "useInfiniteQuery") {
         const extraHookOptions = `options?: { enabled?: boolean }`;
         let hookPropsType = "";
         if (hasVariables) {
              hookPropsType = `${variablesInterfaceName} & { ${extraHookOptions} }`;
         } else {
              hookPropsType = `{ ${extraHookOptions} }`;
         }
         
         let hookDestructure = "";
         if (allVars.length > 0) {
            const mapping = getUniqueVarMapping(allVars);
            hookDestructure = `{ ${mapping.map(m => m.key === m.safe ? m.key : `${JSON.stringify(m.key)}: ${m.safe}`).join(", ")}, options }`;
         } else {
            hookDestructure = `{ options }`;
         }
 
         let keysObject = `scope: '${camelName}'`;
         if (allVars.length > 0) {
              const mapping = getUniqueVarMapping(allVars);
              keysObject += `, ${mapping.map(m => m.key === m.safe ? m.key : `${JSON.stringify(m.key)}: ${m.safe}`).join(", ")}`;
         }
 
         return `export const ${hookName} = (${hookDestructure}: ${hookPropsType}) => {
   const queryData = useInfiniteQuery(
     ${queryKeyName}.keys({
       ${keysObject}
     }),
     ${apiFunctionName},
     {
       getNextPageParam: (lastPage: any, pages: any) => {
         const totalRecordsFetched = pages.reduce((prev: number, one: any) => {
           return prev + (one?.data?.length || 0); 
         }, 0);
         
         if (lastPage?.totalRecords !== undefined && totalRecordsFetched < lastPage.totalRecords) {
           return pages.length + 1;
         }
         if (lastPage?.filteredRecords !== undefined && totalRecordsFetched < lastPage.filteredRecords) {
            return pages.length + 1;
         }
         return null;
       },
       onError: (e: AxiosResponse<any>) => {
         // showSnackbarOnApiError(e); // Optional
       },
       enabled: options?.enabled,
     }
   );
   return queryData;
 };`;
 
     } else if (hookType === "useMutation") {
        return `export const ${hookName} = (options?: {
  onSuccess?: (
    data: ${apiReturnType},
    variables: ${variablesType},
    context: unknown
  ) => void;
  onError?: (error: AxiosResponse) => void;
}) => {
  const invalidateQueries = useInvalidateCommonQueries();
  return useMutation({
    mutationFn: ${apiFunctionName},
    onSuccess: (...args) => {
      invalidateQueries();
      options?.onSuccess?.(...args);
    },
    onError: (error: AxiosResponse) => {
      showSnackbarOnApiError(error);
      options?.onError?.(error);
    },
  });
};`;
    } else {
        // Fallback or "other" type
        const hookArgs =
            hasVariables && variablesDefinition.trim() !== ""
                ? `variables: ${pascalName}Variables, options?: UseQueryOptions<${apiReturnType}>`
                : `options?: UseQueryOptions<${apiReturnType}>`;

        let keysCall = `${queryKeyName}.keys({ scope: '${camelName}' })`;
        if (hasVariables) {
            keysCall = `${queryKeyName}.keys({ scope: '${camelName}', ...variables })`;
        }

        return `export const ${hookName} = (${hookArgs}) => {
  return useQuery({
    queryKey: ${keysCall},
    queryFn: ${apiFunctionName},
    ...options
  });
};`;
    }
}


import * as vscode from 'vscode';
import * as path from 'path';

const PROJECT_SYMBOLS = [
    'getInstance',
    'WithResponse',
    'WithCustomRecordResponse',
    'WithRecordResponse',
    'useInvalidateCommonQueries',
    'showSnackbarOnApiError'
];

const LIBRARY_IMPORTS: Record<string, string> = {
    'useQuery': '@tanstack/react-query',
    'useMutation': '@tanstack/react-query',
    'useInfiniteQuery': '@tanstack/react-query',
    'UseQueryOptions': '@tanstack/react-query',
    'QueryFunctionContext': '@tanstack/react-query',
    'AxiosResponse': 'axios',
    'AxiosError': 'axios',
    'axios': 'axios'
};

function matchesSymbol(content: string, symbol: string): boolean {
    const regex = new RegExp(`\\b${symbol}\\b`);
    return regex.test(content);
}

function isAlreadyImported(content: string, symbol: string): boolean {
    // Check if symbol appears in an import statement
    // Matches: import ... symbol ... from 
    // This is a heuristic.
    const regexSafe = new RegExp(`import\\s+[\\s\\S]*?\\b${symbol}\\b[\\s\\S]*?from`);
    return regexSafe.test(content);
}

export async function getImportsForContent(
    content: string,
    targetFilePath: string,
    existingContent: string = ''
): Promise<string[]> {
    const importsToAdd: string[] = [];
    
    // 1. Library Imports
    const libsToImport = new Map<string, Set<string>>();
    
    for (const [sym, lib] of Object.entries(LIBRARY_IMPORTS)) {
        if (matchesSymbol(content, sym) && !isAlreadyImported(existingContent, sym)) {
             if (!libsToImport.has(lib)) {
                libsToImport.set(lib, new Set());
            }
            libsToImport.get(lib)!.add(sym);
        }
    }

    for (const [lib, syms] of libsToImport) {
        const symsArray = Array.from(syms);
        const defaultImport = symsArray.find(s => s === 'axios');
        // If default import is axios, remove it from named imports
        const namedImports = symsArray.filter(s => s !== 'axios');
        
        // Check if default import is already present in existing content for this lib
        // If "import axios from 'axios'" exists, don't re-import default.
        const defaultAlreadyImported = defaultImport ? isAlreadyImported(existingContent, defaultImport) : false;

        let importStmt = '';
        
        if (defaultImport && !defaultAlreadyImported && namedImports.length > 0) {
            importStmt = `import ${defaultImport}, { ${namedImports.join(', ')} } from '${lib}';`;
        } else if (defaultImport && !defaultAlreadyImported) {
             importStmt = `import ${defaultImport} from '${lib}';`;
        } else if (namedImports.length > 0) {
            // Check if there are named imports that are NOT imported
            const neededNamedImports = namedImports.filter(n => !isAlreadyImported(existingContent, n));
            if (neededNamedImports.length > 0) {
                 importStmt = `import { ${neededNamedImports.join(', ')} } from '${lib}';`;
            }
        }
        
        if (importStmt) {
            importsToAdd.push(importStmt);
        }
    }

    // 2. Project Imports
    const symbolsToFind = PROJECT_SYMBOLS.filter(sym => matchesSymbol(content, sym) && !isAlreadyImported(existingContent, sym));
    
    for (const sym of symbolsToFind) {
        const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
            'vscode.executeWorkspaceSymbolProvider', 
            sym
        );
        
        const validSymbol = symbols?.find(s => {
            return !s.location.uri.fsPath.includes('node_modules') &&
                   s.name === sym && // Exact match check
                   (s.kind === vscode.SymbolKind.Function || 
                    s.kind === vscode.SymbolKind.Constant ||
                    s.kind === vscode.SymbolKind.Interface || 
                    s.kind === vscode.SymbolKind.Variable ||
                    s.kind === vscode.SymbolKind.Class);
        });

        if (validSymbol) {
             const symbolAbsPath = validSymbol.location.uri.fsPath;
             
             // Check if we are importing from self
             if (symbolAbsPath !== targetFilePath) {
                 const importPath = getRelativeImportPath(targetFilePath, symbolAbsPath);
                 importsToAdd.push(`import { ${sym} } from '${importPath}';`);
             }
        }
    }

    return importsToAdd;
}

function getRelativeImportPath(from: string, to: string): string {
    let rel = path.relative(path.dirname(from), to);
    if (!rel.startsWith('.')) {
        rel = './' + rel;
    }
    // Remove extension
    rel = rel.replace(/\.(ts|tsx|js|jsx|d\.ts)$/, '');
    return rel;
}

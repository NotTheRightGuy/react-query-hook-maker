
export function getSafeVarName(key: string): string {
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {return key;}
    let safe = key.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
    safe = safe.replace(/[^a-zA-Z0-9_$]/g, '');
    if (/^\d/.test(safe)) {safe = 'var' + safe;}
    const reserved = ['interface', 'class', 'let', 'var', 'const', 'import', 'export', 'type', 'switch', 'case', 'break', 'if', 'else', 'return', 'new', 'this', 'void', 'delete', 'catch', 'try', 'throw', 'typeof', 'instanceof', 'in', 'of', 'for', 'while', 'do', 'continue'];
    if (reserved.includes(safe)) {safe = '_' + safe;}
    return safe || 'variable';
}

export function getUniqueVarMapping(keys: string[]) {
    const mapping = keys.map(key => ({ key, safe: getSafeVarName(key) }));
    const seen = new Set<string>();
    for (const m of mapping) {
        let s = m.safe;
        let counter = 2;
        while (seen.has(s)) {
           s = `${m.safe}_${counter}`;
           counter++;
        }
        m.safe = s;
        seen.add(s);
    }
    return mapping;
}

export async function parseJson(input: string): Promise<any> {
    try {
        const JSON5 = (await import("json5")).default;
        return JSON5.parse(input);
    } catch (e) {
        try {
            let repaired = input.replace(
                /([}\]"])(?!\s*[,}])\s*"/g,
                '$1, "'
            );
            repaired = repaired.replace(/(\d+)(?!\s*[,}])\s*"/g, '$1, "');

            const JSON5 = (await import("json5")).default;
            return JSON5.parse(repaired);
        } catch (e2) {
            throw new Error(
                `Invalid JSON: ${
                    (e as Error).message
                }. Repair attempt failed: ${(e2 as Error).message}`
            );
        }
    }
}

export interface ImportInfo {
    module: string;
    isExternal: boolean;
    line: number;
}

export interface IParser {
    parseImports(content: string): ImportInfo[];
    getLineCount(content: string): number;
}

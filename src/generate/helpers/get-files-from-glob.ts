import { globSync } from 'glob';

export function getFilesFromGlob(rootDir: string, includePatterns: string[], excludePatterns: string[]): string[] {
    const matchingFiles = new Set<string>();
    for(const includePattern of includePatterns) {
        const globMatches = globSync(includePattern, {cwd: rootDir, root: rootDir});
        globMatches.forEach((m: string) => matchingFiles.add(m));
    }
    for(const excludePattern of excludePatterns) {
        const globMatches = globSync(excludePattern, {cwd: rootDir, root: rootDir});
        globMatches.forEach((m: string) => matchingFiles.delete(m));
    }
    return Array.from(matchingFiles.values()).sort();
}
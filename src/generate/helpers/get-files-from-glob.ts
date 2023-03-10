import glob from 'glob';
const { sync } = glob;

export function getFilesFromGlob(rootDir: string, includePatterns: string[], excludePatterns: string[]): string[] {
    const matchingFiles = new Set<string>();
    for(const includePattern of includePatterns) {
        const globMatches = sync(includePattern, {cwd: rootDir, root: rootDir});
        globMatches.forEach((m: string) => matchingFiles.add(m));
    }
    for(const excludePattern of excludePatterns) {
        const globMatches = sync(excludePattern, {cwd: rootDir, root: rootDir});
        globMatches.forEach((m: string) => matchingFiles.delete(m));
    }
    return Array.from(matchingFiles.values());
}
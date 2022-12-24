import glob from 'glob';

export function getFilesFromGlob(rootDir: string, includePatterns: string[], excludePatterns: string[]): string[] {
    const matchingFiles = new Set<string>();
    for(const includePattern of includePatterns) {
        const globMatches = glob.sync(includePattern, {cwd: rootDir, root: rootDir});
        globMatches.forEach((m: string) => matchingFiles.add(m));
    }
    return Array.from(matchingFiles.values())
}
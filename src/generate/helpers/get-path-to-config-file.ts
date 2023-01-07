import { existsSync, lstatSync } from "fs";
import { join } from "path";

export function getPathToConfigFile(pathArgument: string): string {
    try {
        if(existsSync(pathArgument)) {
            if(lstatSync(pathArgument).isDirectory()) {
                const filePath = join(pathArgument, 'naorm-config.json');
                if(existsSync(filePath)) {
                    return filePath;
                }
            } else { 
                return pathArgument;
            }
        }
        throw 'Err';
    } catch(e) {
        throw new Error('Config file not found at ' + pathArgument);
    }
}
import "server-only";
import * as fs from 'fs';

const ENV_FILE_PATH = "./.env";

interface EnvironmentVariables {
    [key: string]: string;
}

// Cache for environment variables
let envCache: EnvironmentVariables | null = null;

/**
 * Reads environment variables from the .env file
 * @returns Object containing environment variables
 */
function readEnvironmentFile(): EnvironmentVariables {
    try {
        if (!fs.existsSync(ENV_FILE_PATH)) {
            return {};
        }

        const fileContent = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
        const variables: EnvironmentVariables = {};

        fileContent.split('\n').forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, ...valueParts] = trimmedLine.split('=');
                const value = valueParts.join('=').trim();
                if (key && value) {
                    variables[key.trim()] = value;
                }
            }
        });

        return variables;
    } catch (error) {
        console.error('Error reading environment file:', error);
        return {};
    }
}

/**
 * Writes environment variables to the .env file
 * @param variables Object containing environment variables
 */
function writeEnvironmentFile(variables: EnvironmentVariables): void {
    try {
        let content = fs.existsSync(ENV_FILE_PATH) 
            ? fs.readFileSync(ENV_FILE_PATH, 'utf-8')
            : '';

        // Update existing variables
        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`^${key}=.*$`, 'm');
            if (regex.test(content)) {
                content = content.replace(regex, `${key}=${value}`);
            } else {
                // Add new variable at the end
                content += (content ? '\n' : '') + `${key}=${value}`;
            }
        });

        fs.writeFileSync(ENV_FILE_PATH, content);
        envCache = variables; // Update cache
    } catch (error) {
        console.error('Error writing environment file:', error);
        throw error;
    }
}

/**
 * Gets an environment variable value from either process.env or the .env file
 * @param key The environment variable key
 * @returns The environment variable value or undefined if not found
 */
export function getEnv(key: string): string | undefined {
    // First check process.env
    if (process.env[key] !== undefined) {
        return process.env[key];
    }

    // If not found in process.env, check the .env file
    if (!envCache) {
        envCache = readEnvironmentFile();
    }
    return envCache[key];
}

/**
 * Sets an environment variable value in the .env file
 * @param key The environment variable key
 * @param value The environment variable value
 */
export function setEnv(key: string, value: string): void {
    if (!envCache) {
        envCache = readEnvironmentFile();
    }

    // Update process.env
    process.env[key] = value;
    
    // Update the variable
    envCache[key] = value;
    
    // Write back to file
    writeEnvironmentFile(envCache);
}

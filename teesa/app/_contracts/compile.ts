import 'server-only';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getEnv, setEnv } from '@/lib/environments';

export async function compile() {
    const execAsync = promisify(exec);

    try {
        console.log('Compiling contract...');

        const network = getEnv('BLOCKCHAIN_NETWORK');
        const { stdout, stderr } = await execAsync(`cd ../contracts && npx hardhat compile-contract ${network}`);

        console.log('Compilation output:');
        console.log(stdout);
    } catch (error: any) {
        console.error('Error:', error);
        throw error;
    }
}
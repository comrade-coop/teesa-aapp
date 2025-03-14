import 'server-only';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getEnv, setEnv } from '@/lib/environments';

export async function deploy() {
    const execAsync = promisify(exec);

    try {
        console.log('Deploying contract...');

        const network = getEnv('BLOCKCHAIN_NETWORK');
        const { stdout, stderr } = await execAsync(`cd ../contracts && npx hardhat deploy-contract ${network}`);

        console.log('Deployment output:');
        console.log(stdout);

        // Extract contract address from the output
        const addressMatch = stdout.match(/Contract address:\s*(\w+)/);
        const contractAddress = addressMatch ? addressMatch[1] : null;

        if (!contractAddress) {
            throw new Error('Contract address not found in deployment output');
        }

        console.log(`Contract address: ${contractAddress}`);

        return contractAddress;
    } catch (error: any) {
        // Check for insufficient funds error
        if (error.stderr?.includes('insufficient funds') || error.message?.includes('insufficient funds')
            || error.stderr?.includes('IGN410: Gas estimation failed') || error.message?.includes('IGN410: Gas estimation failed')) {
            console.error('Deployment failed: Insufficient funds in wallet to pay for gas fees. Please add funds to your wallet and try again.');
        } else {
            console.error('Error:', error);
        }
        
        throw error;
    }
}
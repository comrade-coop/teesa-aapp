import path from "path";

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

export type Network = {
    name: string;
    displayName: string;
    rpcUrl: string;
    chainId: number;
    explorerUrl: string;
}

export const networks: Network[] = [
    {
        name: 'mainnet',
        displayName: 'Ethereum',
        rpcUrl: process.env.RPC_URL_MAINNET!,
        chainId: 1,
        explorerUrl: 'https://etherscan.io'
    },
    {
        name: 'sepolia',
        displayName: 'Sepolia Testnet',
        rpcUrl: process.env.RPC_URL_SEPOLIA!,
        chainId: 11155111,
        explorerUrl: 'https://sepolia.etherscan.io'
    },
    {
        name: 'base',
        displayName: 'Base',
        rpcUrl: process.env.RPC_URL_BASE!,
        chainId: 8453,
        explorerUrl: 'https://basescan.org'
    },
    {
        name: 'baseSepolia',
        displayName: 'Base Sepolia Testnet',
        rpcUrl: process.env.RPC_URL_BASE_SEPOLIA!,
        chainId: 84532,
        explorerUrl: 'https://sepolia.basescan.org'
    }
]

export function getNetwork(): Network {
    const network = process.env.CONTRACT_NETWORK;
    if (!network) {
        throw new Error('CONTRACT_NETWORK is not set');
    } else if (typeof network !== 'string' || !networks.some(n => n.name === network)) {
        throw new Error('CONTRACT_NETWORK must be one of: ' + networks.map(n => n.name).join(', '));
    }
    
    return networks.find(n => n.name === network)!;
}
import path from "path";

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

type Network = {
    name: string;
    rpcUrl: string;
    chainId: number;
}

export const networks: Network[] = [
    {
        name: 'mainnet',
        rpcUrl: process.env.RPC_URL_MAINNET!,
        chainId: 1
    },
    {
        name: 'sepolia',
        rpcUrl: process.env.RPC_URL_SEPOLIA!,
        chainId: 11155111
    },
    {
        name: 'base',
        rpcUrl: process.env.RPC_URL_BASE!,
        chainId: 8453
    },
    {
        name: 'baseSepolia',
        rpcUrl: process.env.RPC_URL_BASE_SEPOLIA!,
        chainId: 84532
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
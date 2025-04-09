import { ethers } from "ethers";
import path from 'path';

require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

export function getOwnerWalletAddress() {
    const walletPrivateKey = process.env.WALLET_PRIVATE_KEY;
    if (!walletPrivateKey) {
        throw new Error('WALLET_PRIVATE_KEY environment variable is not set');
    }

    const wallet = new ethers.Wallet(walletPrivateKey);
    return wallet.address;
}
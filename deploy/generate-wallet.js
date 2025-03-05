import { ethers } from "ethers";
import { readFileSync, writeFileSync } from 'fs';

// Function to check if wallet credentials exist
function hasWalletCredentials(envContent) {
    return envContent.includes('WALLET_PRIVATE_KEY=') && 
           envContent.match(/WALLET_PRIVATE_KEY=.*$/m)[0].length > 'WALLET_PRIVATE_KEY='.length;
}

// Read both .env files
const contractsEnvPath = '/app/contracts/.env';
const teesaEnvPath = '/app/teesa/.env';
const contractsEnvContent = readFileSync(contractsEnvPath, 'utf8');
const teesaEnvContent = readFileSync(teesaEnvPath, 'utf8');

// Check if both files already have wallet credentials
if (hasWalletCredentials(contractsEnvContent) && hasWalletCredentials(teesaEnvContent)) {
    console.log("Wallet credentials already exist in both .env files. Skipping wallet generation.");
    process.exit(0);
}

// Generate new wallet
const wallet = ethers.Wallet.createRandom();
const privateKey = wallet.privateKey;
const address = wallet.address;

// Update contracts/.env file
let newContractsEnvContent = contractsEnvContent;
newContractsEnvContent = newContractsEnvContent.replace(/WALLET_PRIVATE_KEY=.*$/m, `WALLET_PRIVATE_KEY=${privateKey.slice(2)}`);
writeFileSync(contractsEnvPath, newContractsEnvContent);

// Update teesa/.env file
let newTeesaEnvContent = teesaEnvContent;
newTeesaEnvContent = newTeesaEnvContent.replace(/WALLET_PRIVATE_KEY=.*$/m, `WALLET_PRIVATE_KEY=${privateKey.slice(2)}`);
newTeesaEnvContent = newTeesaEnvContent.replace(/WALLET_ADDRESS=.*$/m, `WALLET_ADDRESS=${address}`);
writeFileSync(teesaEnvPath, newTeesaEnvContent);

console.log("New wallet credentials saved to .env files:");
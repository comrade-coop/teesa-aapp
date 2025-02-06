import { ethers } from "ethers";
import { readFileSync, writeFileSync } from 'fs';

// Generate new wallet
const wallet = ethers.Wallet.createRandom();
const privateKey = wallet.privateKey;
const address = wallet.address;

// Update contracts/.env file
const contractsEnvPath = '/app/contracts/.env';
let contractsEnvContent = readFileSync(contractsEnvPath, 'utf8');
contractsEnvContent = contractsEnvContent.replace(/WALLET_PRIVATE_KEY=.*$/m, `WALLET_PRIVATE_KEY=${privateKey.slice(2)}`);
writeFileSync(contractsEnvPath, contractsEnvContent);

// Update teesa/.env file
const teesaEnvPath = '/app/teesa/.env';
let teesaEnvContent = readFileSync(teesaEnvPath, 'utf8');
teesaEnvContent = teesaEnvContent.replace(/WALLET_PRIVATE_KEY=.*$/m, `WALLET_PRIVATE_KEY=${privateKey.slice(2)}`);
teesaEnvContent = teesaEnvContent.replace(/WALLET_ADDRESS=.*$/m, `WALLET_ADDRESS=${address}`);
writeFileSync(teesaEnvPath, teesaEnvContent);

console.log("New wallet credentials saved to .env files:");
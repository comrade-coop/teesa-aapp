'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { deployContract } from "./_actions/deploy-contract";
import { getAccountFundsAmount } from './_actions/get-wallet-details';
import { useEffect, useState } from 'react';
import { DeployContractResult } from './_models/deploy-contract-result-enum';
import { transferFundsToTeesaWallet, TransferFundsToTeesaWalletResult } from '../_contracts/transfer-funds-to-teesa-wallet';
import { getContractInitialized } from '../_actions/get-contract-initiliazed';

export default function Page() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const [walletAddress, setWalletAddress] = useState<string>();
  const [walletBalance, setWalletBalance] = useState('');
  const [deployContractMessage, setDeployContractMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [transferFundsMessage, setTransferFundsMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<number | ''>('');
  const [contractInitialized, setContractInitialized] = useState(false);

  useEffect(() => {
    fetchWalletDetails();
    fetchContractInitialized();
  }, []);

  async function fetchWalletDetails() {
    const { balance, address } = await getAccountFundsAmount();
    setWalletAddress(address);
    setWalletBalance(balance);
  }

  async function fetchContractInitialized() {
    const contractInitializedResult = await getContractInitialized();
    setContractInitialized(contractInitializedResult);
  }

  async function onClick() {
    setLoading(true);
    setDeployContractMessage({text: 'Deploying contract...', type: 'info' });

    const result = await deployContract();
    
    setLoading(false);

    if (result == DeployContractResult.Success) {
      window.location.href = '/game';
    } else if (result == DeployContractResult.FailedInsufficientFunds) {
      setDeployContractMessage({ text: 'Insufficient funds in Teesa wallet to pay for gas fees. Please add funds to the Teesa wallet and try again.', type: 'error' });
    } else {
      setDeployContractMessage({ text: 'Failed to deploy contract', type: 'error' });
    }
  }

  async function handleSend() {
    if (!userWalletAddress || amount === '') {
      return;
    }

    try {
      setLoading(true);
      setTransferFundsMessage({text: 'Sending ETH...', type: 'info' });
      
      const result = await transferFundsToTeesaWallet(userWalletAddress, wallets, amount);
      
      setLoading(false);

      if (result == TransferFundsToTeesaWalletResult.Success) {
        setTransferFundsMessage({ text: 'ETH sent successfully', type: 'success' });
        setAmount('' as any);
        await fetchWalletDetails();
      } else if (result == TransferFundsToTeesaWalletResult.FailedInsufficientFunds) {
        setTransferFundsMessage({ text: 'Insufficient funds in Teesa wallet to pay for gas fees. Please add funds to the Teesa wallet and try again.', type: 'error' });
      } else if (result == TransferFundsToTeesaWalletResult.FailedWalletNotFound) {
        setTransferFundsMessage({ text: 'Wallet not found. Please connect to the correct wallet and try again.', type: 'error' });
      } else {
        setTransferFundsMessage({ text: 'Failed to send ETH', type: 'error' });
      }
    } catch (error) {
      console.error('Failed to send ETH:', error);
    }
  }

  const userWalletAddress = (ready && authenticated) ? user?.wallet?.address : undefined;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-4">
      <h1 className="text-2xl font-bold text-white mb-4">Initialize Game Contract</h1>

      <div className="text-white mb-4">
        <p>Teesa Wallet Address: <span className="font-bold">{walletAddress || ''}</span></p>
        <p>Teesa Wallet Balance: <span className="font-bold">{walletBalance || '0'} ETH</span></p>
      </div>

      {contractInitialized ? (
        <p className="text-green-400">Contract initialized successfully</p>
      ) : (
        <button
          onClick={onClick}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          disabled={loading}
      >
          Initialize contract
        </button>
      )}

      {deployContractMessage && (
        <p className={`mt-2 ${
          deployContractMessage.type === 'success' ? 'text-green-400' : 
          deployContractMessage.type === 'error' ? 'text-red-400' : 
          'text-white italic'
        }`}>
          {deployContractMessage.text}
        </p>
      )}

      {ready && (
        <div className="flex flex-col items-center justify-center mt-12">
          {!authenticated && (
            <button
              onClick={login}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-fit text-base"
              disabled={loading}
            >
              Connect Wallet
            </button>
          )}
          {authenticated && (
            <>
              <p className="text-white">Connected wallet: {userWalletAddress}</p>

              <div className="flex gap-2 items-center mt-4">
                <input
                  type="number"
                  placeholder="Amount in ETH"
                  className="px-4 py-2 rounded-lg bg-gray-700 text-white"
                  step="0.000001"
                  min="0.000001"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
                <button
                  onClick={handleSend}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={loading}
                >
                  Send ETH
                </button>
              </div>

              {transferFundsMessage && (
                <p className={`mt-2 ${
                  transferFundsMessage.type === 'success' ? 'text-green-400' : 
                  transferFundsMessage.type === 'error' ? 'text-red-400' : 
                  'text-white italic'
                }`}>
                  {transferFundsMessage.text}
                </p>
              )}

              <button
                onClick={logout}
                className="px-6 py-3 mt-6 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                disabled={loading}
              >
                Disconnect
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
} 
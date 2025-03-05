'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { deployContract } from "./_actions/deploy-contract";
import { getAccountFundsAmount } from './_actions/get-wallet-details';
import { useEffect, useState } from 'react';
import { DeployContractResult } from './_models/deploy-contract-result-enum';
import { transferFundsToTeesaWallet, TransferFundsToTeesaWalletResult } from '../_contracts/transfer-funds-to-teesa-wallet';
import { getContractInitialized } from '../_actions/get-contract-initiliazed';
import { fundPrizePool } from './_actions/fund-prize-pool';
import { ExecuteContractActionClientResult } from '../_contracts/execute-contract-action-client';

export default function Page() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const [walletAddress, setWalletAddress] = useState<string>();
  const [walletBalance, setWalletBalance] = useState('');
  const [deployContractMessage, setDeployContractMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [sendEthMessage, setSendEthMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [fundPrizePoolMessage, setFundPrizePoolMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [teesaAmount, setTeesaAmount] = useState<number | ''>('');
  const [prizePoolAmount, setPrizePoolAmount] = useState<number | ''>('');
  const [contractInitialized, setContractInitialized] = useState(false);

  const userWalletAddress = (ready && authenticated && user?.wallet?.address) ? user.wallet.address : undefined;

  useEffect(() => {
    fetchWalletDetails();
    fetchContractInitialized();
  }, []);

  async function fetchWalletDetails() {
    try {
      const { balance, address } = await getAccountFundsAmount();
      setWalletAddress(address);
      setWalletBalance(balance);
    } catch (error) {
      console.error('Failed to fetch wallet details:', error);
      setWalletAddress(undefined);
      setWalletBalance('0');
    }
  }

  async function fetchContractInitialized() {
    try {
      const contractInitializedResult = await getContractInitialized();
      setContractInitialized(contractInitializedResult);
    } catch (error) {
      console.error('Failed to fetch contract initialization status:', error);
      setContractInitialized(false);
    }
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

  async function handleSendToTeesa() {
    if (!userWalletAddress) {
      setSendEthMessage({ text: 'Please connect your wallet first', type: 'error' });
      return;
    }

    if (teesaAmount === '' || teesaAmount <= 0) {
      setSendEthMessage({ text: 'Please enter a valid amount greater than 0', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      setSendEthMessage({text: 'Sending ETH...', type: 'info' });
      
      const result = await transferFundsToTeesaWallet(userWalletAddress, wallets, teesaAmount);
      
      setLoading(false);

      if (result == TransferFundsToTeesaWalletResult.Success) {
        setSendEthMessage({ text: 'ETH sent successfully', type: 'success' });
        setTeesaAmount('');
        await fetchWalletDetails();
      } else if (result == TransferFundsToTeesaWalletResult.FailedInsufficientFunds) {
        setSendEthMessage({ text: 'Insufficient funds in Teesa wallet to pay for gas fees. Please add funds to the Teesa wallet and try again.', type: 'error' });
      } else if (result == TransferFundsToTeesaWalletResult.FailedWalletNotFound) {
        setSendEthMessage({ text: 'Wallet not found. Please connect to the correct wallet and try again.', type: 'error' });
      } else {
        setSendEthMessage({ text: 'Failed to send ETH', type: 'error' });
      }
    } catch (error) {
      console.error('Failed to send ETH:', error);
      setSendEthMessage({ text: 'Failed to send ETH', type: 'error' });
    }
  }

  async function handleFundPrizePool() {
    if (!userWalletAddress) {
      setFundPrizePoolMessage({ text: 'Please connect your wallet first', type: 'error' });
      return;
    }

    if (prizePoolAmount === '' || prizePoolAmount <= 0) {
      setFundPrizePoolMessage({ text: 'Please enter a valid amount greater than 0', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      setFundPrizePoolMessage({text: 'Funding prize pool...', type: 'info' });
      
      const result = await fundPrizePool(userWalletAddress, wallets, prizePoolAmount);
      
      setLoading(false);

      if (result == ExecuteContractActionClientResult.Success) {
        setFundPrizePoolMessage({ text: 'Prize pool funded successfully', type: 'success' });
        setPrizePoolAmount('');
        await fetchWalletDetails();
      } else if (result == ExecuteContractActionClientResult.FailedWalletNotFound) {
        setFundPrizePoolMessage({ text: 'Wallet not found. Please connect to the correct wallet and try again.', type: 'error' });
      } else {
        setFundPrizePoolMessage({ text: 'Failed to fund prize pool', type: 'error' });
      }
    } catch (error) {
      console.error('Failed to fund prize pool:', error);
      setFundPrizePoolMessage({ text: 'Failed to fund prize pool', type: 'error' });
    }
  }

  return (
    <div className="h-full bg-gray-900 overflow-auto">
      <div className="py-8">
        <div className="w-full max-w-2xl mx-auto px-4 space-y-8">
          {/* Header */}
          <h1 className="text-3xl font-bold text-white text-center mb-8">Teesa Game Contract</h1>

          {/* Teesa Wallet Section */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Teesa Wallet</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Address:</span>
                <span className="font-mono text-white">{walletAddress || 'Not available'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Balance:</span>
                <span className="font-mono text-white">{walletBalance || '0'} ETH</span>
              </div>
            </div>
          </div>

          {/* Send ETH to Teesa Wallet Section */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Send ETH to Teesa Wallet</h2>
            <div className="space-y-4">
              <input
                type="number"
                placeholder="Amount in ETH"
                className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                step="0.000001"
                min="0.000001"
                value={teesaAmount}
                onChange={(e) => setTeesaAmount(Number(e.target.value))}
              />
              <button
                onClick={handleSendToTeesa}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                Send ETH
              </button>
              {sendEthMessage && (
                <p className={`text-sm ${
                  sendEthMessage.type === 'success' ? 'text-green-400' : 
                  sendEthMessage.type === 'error' ? 'text-red-400' : 
                  'text-white italic'
                }`}>
                  {sendEthMessage.text}
                </p>
              )}
            </div>
          </div>

          {/* Contract Deployment or Prize Pool Section */}
          {!contractInitialized ? (
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white mb-4">Deploy Contract</h2>
              <button
                onClick={onClick}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                Deploy Contract
              </button>
              {deployContractMessage && (
                <p className={`mt-2 text-sm ${
                  deployContractMessage.type === 'success' ? 'text-green-400' : 
                  deployContractMessage.type === 'error' ? 'text-red-400' : 
                  'text-white italic'
                }`}>
                  {deployContractMessage.text}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white mb-4">Fund Prize Pool</h2>
              <div className="space-y-4">
                <input
                  type="number"
                  placeholder="Amount in ETH"
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  step="0.000001"
                  min="0.000001"
                  value={prizePoolAmount}
                  onChange={(e) => setPrizePoolAmount(Number(e.target.value))}
                />
                <button
                  onClick={handleFundPrizePool}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  Fund Prize Pool
                </button>
                {fundPrizePoolMessage && (
                  <p className={`text-sm ${
                    fundPrizePoolMessage.type === 'success' ? 'text-green-400' : 
                    fundPrizePoolMessage.type === 'error' ? 'text-red-400' : 
                    'text-white italic'
                  }`}>
                    {fundPrizePoolMessage.text}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Wallet Connection Section */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Wallet Connection</h2>
            {!authenticated ? (
              <button
                onClick={login}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                Connect Wallet
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Connected Address:</span>
                  <span className="font-mono text-white">{userWalletAddress}</span>
                </div>
                <button
                  onClick={logout}
                  className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  Disconnect Wallet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
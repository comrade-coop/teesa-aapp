'use client';

import { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ClaimSharesResult } from '../_models/claim-shares-result-enum';

interface ClaimInterfaceProps {
  title: string;
  actionButtonText: string;
  onAction: (walletAddress: string, wallets: any[]) => Promise<ClaimSharesResult>;
}

export function ClaimInterface({ title, actionButtonText, onAction }: ClaimInterfaceProps) {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const walletAddress = (ready && authenticated) ? user?.wallet?.address : undefined;

  async function handleAction() {
    if (!walletAddress) {
      return;
    }

    setLoading(true);
    setMessage({text: 'Action in progress...', type: 'info' });

    const result = await onAction(walletAddress, wallets);
    
    setLoading(false);

    if(result == ClaimSharesResult.Success) {
      setMessage({ text: 'Action successful', type: 'success' });
    } else if (result == ClaimSharesResult.FailedWalletNotFound) {
      setMessage({ text: 'Action failed. Wallet not found.', type: 'error' });
    } else {
      setMessage({ text: 'Action failed. Please try again.', type: 'error' });
    }
  }

  return (
    <div className="h-full bg-gray-900 overflow-auto">
      <div className="py-8">
        <div className="w-full max-w-2xl mx-auto px-4 space-y-8">
          {/* Header */}
          <h1 className="text-3xl font-bold text-white text-center mb-8">{title}</h1>

          {/* Action Section */}
          {authenticated && (
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white mb-4">Claim Action</h2>
              <div className="space-y-4">
                <button
                  disabled={loading}
                  onClick={handleAction}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {actionButtonText}
                </button>
                {message && (
                  <p className={`text-sm ${
                    message.type === 'success' ? 'text-green-400' : 
                    message.type === 'error' ? 'text-red-400' : 
                    'text-white italic'
                  }`}>
                    {message.text}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Wallet Connection Section */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Wallet Connection</h2>
            {ready && (
              <>
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
                      <span className="font-mono text-white">{walletAddress}</span>
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
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
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const walletAddress = (ready && authenticated) ? user?.wallet?.address : undefined;

  async function handleAction() {
    if (!walletAddress) {
      return;
    }

    setLoading(true);
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
    <div className="flex flex-col items-center justify-center w-full h-full gap-4 p-4">
      <h1 className="text-2xl font-bold text-white mb-4">{title}</h1>
      
      {ready && (
        <>
          {!authenticated && (
            <button
              onClick={login}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-fit text-base"
            >
              Connect Wallet
            </button>
          )}
          {authenticated && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-white">Connected wallet: {walletAddress}</p>
              <div className="flex gap-3">
                <button
                  disabled={loading}
                  onClick={handleAction}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {actionButtonText}
                </button>
                <button
                  disabled={loading}
                  onClick={logout}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Disconnect
                </button>
              </div>
              {message && (
                <p className={`mt-2 ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {message.text}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
} 
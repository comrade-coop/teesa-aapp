'use client';

import { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { withdrawShare } from './_actions/withdraw-share';

export default function Page() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const walletAddress = (ready && authenticated) ? user?.wallet?.address : undefined;

  async function handleWithdraw() {
    if (!walletAddress) {
      return;
    }

    setLoadingWithdraw(true);
    const success = await withdrawShare(walletAddress, wallets);
    setLoadingWithdraw(false);

    if(success) {
      setMessage({ text: 'Withdraw successful', type: 'success' });
    } else {
      setMessage({ text: 'Withdraw failed. Please try again.', type: 'error' });
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4 p-4">
      
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
                  disabled={loadingWithdraw}
                  onClick={handleWithdraw}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Withdraw
                </button>
                <button
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
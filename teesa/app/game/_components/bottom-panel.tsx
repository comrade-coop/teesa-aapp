import { cn, isNullOrWhiteSpace } from '@/lib/utils';
import { Loader2, SendHorizonal } from 'lucide-react';

export function BottomPanel({
  className,
  gameEnded,
  winnerAddress,
  isLoggedIn,
  gameAbandoned,
  walletAddress,
  loading,
  onLogin,
  onChatMessage
}: {
  className?: string,
  gameEnded: boolean,
  winnerAddress: string | undefined,
  isLoggedIn: boolean,
  gameAbandoned: boolean,
  walletAddress: string | undefined,
  loading: boolean,
  onLogin: () => void,
  onChatMessage: (message: string) => void
}) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const form = event.target as HTMLFormElement;
    const message = form.message.value;
    form.reset();

    if (isNullOrWhiteSpace(message)) {
      return;
    }

    onChatMessage(message);
  }

  const loginButton = (
    <div className="mb-4 px-4">
    <button
      className="w-full p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white uppercase rounded-full shadow-xl hover:opacity-90 transition-opacity"
        onClick={onLogin}>
        Connect Wallet
      </button>
    </div>
  );

  const chatForm = (
    <div className="relative mb-4 mx-4">
      <form onSubmit={handleSubmit}>
        <input
          className="w-full p-4 pr-14 bg-slate-800/50 border border-blue-500/30 rounded-full shadow-xl text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          name="message"
          placeholder="Write a message"
        />
        <button
          type="submit"
          disabled={loading}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-full shadow-lg disabled:bg-slate-700 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
        >
          {loading ?
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="sr-only">Loading...</span>
            </>
            :
            <>
              <SendHorizonal className="w-5 h-5" />
              <span className="sr-only">Send message</span>
            </>
          }
        </button>
      </form>
    </div>
  );

  const gameEndedMessage = (
    <div className="mb-4 px-4">
      <div
        className="w-full uppercase text-center p-4 bg-slate-800/50 border border-blue-500/30 rounded-full shadow-xl text-slate-200">
        Game ended!
        {winnerAddress && (
          <span className="ms-1">
            Winner: <br />
            <span className="text-green-500"> {winnerAddress} </span>
          </span>
          )}
      </div>
    </div>
  );

  const gameAbandonedMessage = (
    <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 m-4">
        <p className="text-yellow-300 text-center">
          The game has been abandoned due to inactivity. You can now claim your share of the prize pool.
          {walletAddress && (
            <a href="/claim/user" className="text-yellow-400 hover:text-yellow-300 underline ml-2">
              Claim your share
            </a>
          )}
        </p>
      </div>
  );

  return <div
    className={cn("", className)}
  >
    {(!isLoggedIn && !gameEnded && !gameAbandoned) && loginButton}
    {(isLoggedIn && !gameEnded && !gameAbandoned) && chatForm}
    {(!gameEnded && gameAbandoned) && gameAbandonedMessage}
    {gameEnded && gameEndedMessage}
  </div>
}
import { cn, isNullOrWhiteSpace } from '@/lib/utils';
import { Loader2, SendHorizonal } from 'lucide-react';

export function BottomPanel({
  className,
  gameEnded,
  winnerAddress,
  isLoggedIn,
  gameAbandoned,
  loading,
  onLogin,
  onChatMessage
}: {
  className?: string,
  gameEnded: boolean,
  winnerAddress: string | undefined,
  isLoggedIn: boolean,
  gameAbandoned: boolean,
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
        className="w-full p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white uppercase rounded-full shadow-xl hover:opacity-90 transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:from-blue-500 hover:to-blue-600"
        onClick={onLogin}>
        Connect Wallet to Make Guesses and Win Rewards
      </button>
    </div>
  );

  const chatForm = (
    <div className="relative mb-4 mx-4">
      <div className="relative">
        <div className="absolute -inset-[2px] bg-gradient-to-r from-blue-500/20 via-blue-500/15 to-blue-400/20 rounded-full blur-sm"></div>
        <form onSubmit={handleSubmit} className="relative">
          <input
            className="w-full p-4 pr-14 bg-slate-900/15 focus:bg-slate-900/50 border border-blue-500/30 rounded-full shadow-xl text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
            name="message"
            placeholder="Write a message"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-2 rounded-full shadow-lg disabled:bg-slate-700 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(147,51,234,0.5)] hover:from-purple-500 hover:to-indigo-500"
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
    </div>
  );

  const gameEndedMessage = (
    <div className="mb-4 px-4">
      <div
        className="w-full uppercase text-center p-4 bg-slate-800/50 border border-blue-500/30 rounded-full shadow-xl text-slate-200 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.2)]">
        Game ended!
        {winnerAddress && (
          <span className="ms-1">
            Winner: <br />
            <span className="text-green-500 font-bold drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]"> {winnerAddress} </span>
          </span>
        )}
        <div className="mt-2 text-sm text-blue-400 animate-[pulse_2s_ease-in-out_infinite] drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
          🔄 Game will restart soon...
        </div>
      </div>
    </div>
  );

  const gameAbandonedMessage = (
    <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 m-4 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
      <p className="text-yellow-300 text-center">
        The game has been abandoned due to inactivity. You can now claim your share of the prize pool.
        <a href="/claim/user" className="text-yellow-400 hover:text-yellow-300 hover:shadow-[0_0_8px_rgba(234,179,8,0.5)] underline ml-2 transition-all duration-300">
          Claim your share
        </a>
      </p>
      <p className="text-center mt-2 text-blue-400 animate-[pulse_2s_ease-in-out_infinite] drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
        🔄 Game will restart soon...
      </p>
    </div>
  );

  return <div
    className={cn("", className)}
  >
    {(!isLoggedIn && !gameEnded && !gameAbandoned) && (
      <>
        {chatForm}
        <div className="relative mb-4 mx-4">
          <div className="relative">
            <div className="absolute -inset-[2px] bg-gradient-to-r from-blue-500/20 via-blue-500/15 to-blue-400/20 rounded-full blur-sm"></div>
            <button
              className="w-full p-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-xl hover:opacity-90 transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:from-blue-500 hover:to-blue-600 relative"
              onClick={onLogin}>
              Connect Wallet to Make Guesses and Win Rewards
            </button>
          </div>
        </div>
      </>
    )}
    {(isLoggedIn && !gameEnded && !gameAbandoned) && chatForm}
    {(!gameEnded && gameAbandoned) && gameAbandonedMessage}
    {gameEnded && gameEndedMessage}
  </div>
}
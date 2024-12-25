import { cn, isNullOrWhiteSpace } from '@/lib/utils';
import { SendHorizonal } from 'lucide-react';

export function ChatInput({
  className,
  gameEnded,
  isLoggedIn,
  loading,
  onLogin,
  onChatMessage
}: {
  className?: string,
  gameEnded: boolean,
  isLoggedIn: boolean,
  loading: boolean,
  onLogin: () => void,
  onChatMessage: (message: string) => void
}) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if(!loading) {
      return;
    }

    const form = event.target as HTMLFormElement;
    const message = form.message.value;
    form.reset();

    if(isNullOrWhiteSpace(message)) {
      return;
    }

    onChatMessage(message);
  }

  const loginButton = (
    <button
      className="mb-4 w-full p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white uppercase rounded-full shadow-xl hover:opacity-90 transition-opacity"
      onClick={onLogin}>
      Connect Wallet
    </button>
  );

  const chatForm = (
    <div className="relative mb-4">
      <form onSubmit={handleSubmit}>
        <input
          className="w-full p-4 pr-14 bg-slate-800/50 border border-blue-500/30 rounded-full shadow-xl text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          name="message"
          placeholder="Write a message"
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-full shadow-lg disabled:bg-slate-700 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
        >
          <SendHorizonal className="w-5 h-5" />
          <span className="sr-only">Send message</span>
        </button>
      </form>
    </div>
  );

  const gameEndedMessage = (
    <div
      className="flex flex-row items-center justify-center mb-4 w-full uppercase p-4 bg-slate-800/50 border border-blue-500/30 rounded-full shadow-xl text-slate-200">
      Game ended
    </div>
  )

  return <div
    className={cn("", className)}
  >
    {(!isLoggedIn && !gameEnded) && loginButton}
    {(isLoggedIn && !gameEnded) && chatForm}
    {gameEnded && gameEndedMessage}
  </div>
}
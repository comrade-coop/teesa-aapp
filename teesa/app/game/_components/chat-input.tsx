import { cn, isNullOrWhiteSpace } from '@/lib/utils';
import { usePrivy } from '@privy-io/react-auth';
import { SendHorizonal } from 'lucide-react';

export function ChatInput({
  className,
  gameEnded,
  canSendMessages,
  onChatMessage
}: {
  className?: string,
  gameEnded: boolean,
  canSendMessages: boolean,
  onChatMessage: any
}) {
  const { ready, authenticated, login } = usePrivy();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if(!canSendMessages) {
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
      className="mb-4 w-full p-4 border bg-slate-800 text-white uppercase rounded-full shadow-xl"
      onClick={login}>
      Log in
    </button>
  );

  const chatForm = (
    <div className="relative mb-4">
      <form onSubmit={handleSubmit}>
        <input
          className="w-full p-4 pr-14 border border-gray-300 rounded-full shadow-xl"
          name="message"
          placeholder="Write a message"
        />
        <button
          type="submit"
          disabled={!canSendMessages}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-slate-800 text-white p-2 rounded-full shadow-lg disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          <SendHorizonal className="w-5 h-5" />
          <span className="sr-only">Send message</span>
        </button>
      </form>
    </div>
  );

  const gameEndedMessage = (
    <div
      className="flex flex-row items-center justify-center mb-4 w-full uppercase p-4 border border-gray-300 rounded-full shadow-xl">
      Game ended
    </div>
  )

  return <div
    className={cn("", className)}
  >
    {(!gameEnded && ready && !authenticated) && loginButton}
    {(!gameEnded && ready && authenticated) && chatForm}
    {gameEnded && gameEndedMessage}
  </div>
}
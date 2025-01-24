import { useEffect, useRef } from "react";
import { MessageUiStateModel } from "../_models/message-ui-state-model";

export function MessagesList({
  messages,
  scrollToBottom
}: {
  messages: MessageUiStateModel[],
  scrollToBottom: boolean
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollToBottom) {
      return;
    }

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 500);
  }, [scrollToBottom]);

  return <div className="flex-1 overflow-auto my-4">
    <div className="mx-4">
    {
      messages.map((message) => (
        <div key={message.id}>
          {message.display}
        </div>
      ))
    }
    </div>

    <div ref={messagesEndRef} />
  </div>
}
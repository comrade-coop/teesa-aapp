import { useEffect, useRef } from "react";
import { MessageUiStateModel } from "../_models/message-ui-state-model";

export function MessagesList({
  messages
}: {
  messages: MessageUiStateModel[]
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
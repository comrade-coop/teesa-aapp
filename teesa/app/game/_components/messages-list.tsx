import { useEffect, useRef, useState } from "react";
import { MessageUiStateModel } from "../_models/message-ui-state-model";
import { ChevronDown } from "lucide-react";
import { INITIAL_MESSAGE } from "@/app/_core/game-const";
import { LlmChatMessage } from "./llm-chat-message";

export function MessagesList({
  messages,
  showingAllMessages,
  scrollToBottom
}: {
  messages: MessageUiStateModel[],
  showingAllMessages: boolean,
  scrollToBottom: boolean
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    if (!scrollToBottom) {
      return;
    }

    scrollToBottomSmooth();
  }, [scrollToBottom]);

  // Check scroll position when messages change or on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkScrollPosition = () => {
      // Show button when not at bottom
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
      setShowScrollButton(!isAtBottom);
    };

    // Check initially and when messages change
    checkScrollPosition();

    container.addEventListener('scroll', checkScrollPosition);
    return () => container.removeEventListener('scroll', checkScrollPosition);
  }, [messages]);

  const scrollToBottomSmooth = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="flex-1 overflow-auto my-4 relative" ref={containerRef}>

      <div className="mx-4">

        {showingAllMessages && <LlmChatMessage message={INITIAL_MESSAGE} />}

        {
          messages.map((message) => (
            <div key={message.id}>
              {message.display}
            </div>
          ))
        }
      </div>

      <div ref={messagesEndRef} />

      {showScrollButton && (
        <div className="sticky bottom-0 w-full flex justify-center pb-4 pointer-events-none">
          <button
            onClick={scrollToBottomSmooth}
            className="bg-gradient-to-b from-purple-600 to-indigo-600 text-white p-3 rounded-full shadow-lg hover:opacity-90 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(147,51,234,0.5)] hover:from-purple-500 hover:to-indigo-500 z-10 pointer-events-auto"
            aria-label="Scroll to bottom"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
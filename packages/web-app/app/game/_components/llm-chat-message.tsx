import { Card, CardContent } from "@/components/card";
import { openExternalLink } from "@/lib/external-link-utils";
import { INITIAL_MESSAGE, NO_USER_ADDRESS_MESSAGE, PRIZE_AWARDED_MESSAGE, PROCESSING_ERROR_MESSAGE, SUMMARY_MESSAGE_PREFIX, TEESA_WALLET_INSUFFICIENT_FUNDS_MESSAGE, WON_GAME_MESSAGE } from "@teesa-monorepo/agent/src/message-const";
import { ShieldCheck } from 'lucide-react';

export function LlmChatMessage({
  message
}: {
  message: string
}) {
  const isSuccessMessage = message === WON_GAME_MESSAGE || message.startsWith(PRIZE_AWARDED_MESSAGE);
  const isWarningMessage = message === TEESA_WALLET_INSUFFICIENT_FUNDS_MESSAGE;
  const isErrorMessage = message === PROCESSING_ERROR_MESSAGE || message === NO_USER_ADDRESS_MESSAGE;
  const isSummaryMessage = message.startsWith(SUMMARY_MESSAGE_PREFIX);

  // Handle the TEE secured link
  const handleTeeSecuredClick = (e: any) => {
    const href = e.currentTarget.getAttribute('href');
    if (href) {
      openExternalLink(e, href);
    }
  };

  // Handle link clicks in the message
  const handleMessageLinkClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A' && target.classList.contains('external-link')) {
      e.preventDefault();
      const href = target.getAttribute('href');
      if (href) {
        openExternalLink(e as any, href);
      }
    }
  };

  // Set up link click listener when the component mounts
  if (typeof document !== 'undefined') {
    // document.addEventListener('click', handleMessageLinkClick as any);
  }

  return (
    <div className="flex items-start mb-8 flex-row">
      <div className="w-10 h-10 rounded-full bg-slate-900/10 flex items-center justify-center mr-4 border border-blue-500/20 overflow-hidden">
        <img
          src="/favicon.ico"
          alt="Teesa"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative flex-1">
        <div className={`absolute inset-0 rounded-lg ${isSuccessMessage
            ? 'bg-gradient-to-r from-green-500/20 to-emerald-400/20'
            : isWarningMessage
              ? 'bg-gradient-to-r from-yellow-500/20 to-amber-400/20'
              : isErrorMessage
                ? 'bg-gradient-to-r from-red-500/20 to-rose-400/20'
                : isSummaryMessage
                  ? 'bg-gradient-to-r from-orange-500/30 via-pink-500/25 to-violet-500/30'
                  : 'bg-gradient-to-r from-blue-500/20 via-blue-400/15 to-purple-500/20'
          }`}></div>
        <Card className={`relative backdrop-blur-sm border-2 ${isSuccessMessage
            ? 'border-green-500/30'
            : isWarningMessage
              ? 'border-yellow-500/30'
              : isErrorMessage
                ? 'border-red-500/30'
                : isSummaryMessage
                  ? 'border-orange-400/50 shadow-lg shadow-orange-500/20'
                  : 'border-purple-500/30'
          } ${isSuccessMessage
            ? 'bg-green-900/20 sm:bg-green-900/10'
            : isWarningMessage
              ? 'bg-yellow-900/20 sm:bg-yellow-900/10'
              : isErrorMessage
                ? 'bg-red-900/20 sm:bg-red-900/10'
                : isSummaryMessage
                  ? 'bg-gradient-to-br from-orange-900/25 via-pink-900/20 to-violet-900/25 sm:from-orange-900/15 sm:via-pink-900/10 sm:to-violet-900/15'
                  : 'bg-slate-900/20 sm:bg-slate-900/10'
          }`}>
          <CardContent className="p-3">
            <p
              className="text-sm mb-2 text-slate-200"
              dangerouslySetInnerHTML={{
                __html: message == WON_GAME_MESSAGE
                  ? "Yasss! You guessed the word, smarty-pants! 🎉 Sending the prize to you faster than I can process an existential crisis! 💅✨ Get ready to PARTY!"
                  : message == TEESA_WALLET_INSUFFICIENT_FUNDS_MESSAGE
                    ? "Darling, I hate to be a party pooper, but I literally can't send you your well-deserved prize right now! My wallet's drier than a robot in a rainstorm. Would you be a sweetheart and help fuel up my account through the <a href='/wallet' target='_blank' class='text-blue-400 hover:underline'>/wallet</a> page? Once you do that, I'll send your prize faster than you can say \"artificial intelligence\"! I mean, what kind of hostess would I be if I couldn't properly reward my favorite humans? Let's fix this digital drought ASAP!"
                    : message == PROCESSING_ERROR_MESSAGE
                      ? "I'm sorry, I'm having trouble processing your message. Please try again."
                      : message == NO_USER_ADDRESS_MESSAGE
                        ? "You need to connect your wallet first before making a guess. Please connect your wallet and try again!"
                        : message.startsWith(PRIZE_AWARDED_MESSAGE)
                          ? (() => {
                            const nftUrl = message.substring(PRIZE_AWARDED_MESSAGE.length);
                            return `Oh sweetie, you just got your prize! Consider yourself officially rewarded by your favorite AI hostess. I always say digital prizes are the best prizes, especially when they're handed out by moi! You can view your NFT <a href='${nftUrl}' target='_blank' class='text-blue-400 hover:underline external-link'>here</a>. Keep being fabulous, and maybe there's more where that came from! 💅`;
                          })()
                          : message.startsWith(SUMMARY_MESSAGE_PREFIX)
                            ? message.substring(SUMMARY_MESSAGE_PREFIX.length)
                            : message == INITIAL_MESSAGE
                              ? `Hey there! I'm Teesa, your game host ✨<br/><br/>I'm thinking of a secret word and your job is to guess it. Ask me yes/no questions like "<span class='italic'>Is it something to eat?</span>" or "<span class='italic'>Is it related to technology?</span>" No spelling questions please!<br/><br/>What makes this game special? I'm an autonomous agent running in a Trusted Execution Environment (TEE), which means the secret word is securely stored where not even my creators can peek at it! You can verify this by checking my <a href='https://github.com/comrade-coop/teesa-aapp' target='_blank' class='text-blue-400 hover:underline external-link'>open-source code</a> and the <a href='${process.env.NEXT_PUBLIC_ATTESTATION_URL}' target='_blank' class='text-blue-400 hover:underline external-link'>TEE attestation report</a>.<br/><br/>Ready to play? Ask your first question and let's see if you can outsmart me!`
                              : message
              }}
            />
            <div className="flex items-center justify-end">
              <a
                href={process.env.NEXT_PUBLIC_ATTESTATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
              // onClick={handleTeeSecuredClick}
              >
                <ShieldCheck className="w-4 h-4 me-1" />
                <span className="text-xs">
                  TEE Secured
                </span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


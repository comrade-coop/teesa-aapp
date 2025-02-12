import { PRIZE_AWARDED_MESSAGE, TEESA_WALLET_INSUFFICIENT_FUNDS_MESSAGE, WON_GAME_MESSAGE } from "../../_core/game-const"
import { Card, CardContent } from "@/components/card"
import { ShieldCheck } from 'lucide-react'

export function LlmChatMessage({
  message
}: {
  message: string
}) {
  const isSuccessMessage = message === WON_GAME_MESSAGE || message === PRIZE_AWARDED_MESSAGE;
  const isWarningMessage = message === TEESA_WALLET_INSUFFICIENT_FUNDS_MESSAGE;

  return (
    <div className="flex items-start mb-8 flex-row">
      <div className="w-10 h-10 rounded-full bg-slate-900/10 flex items-center justify-center mr-4 border border-blue-500/20 overflow-hidden">
        <img
          src="/teesa.png"
          alt="Teesa"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative flex-1">
        <div className={`absolute inset-0 rounded-lg ${
          isSuccessMessage
            ? 'bg-gradient-to-r from-green-500/20 to-emerald-400/20'
            : isWarningMessage
              ? 'bg-gradient-to-r from-yellow-500/20 to-amber-400/20'
              : 'bg-gradient-to-r from-blue-500/20 via-blue-400/15 to-purple-500/20'
        }`}></div>
        <Card className={`relative backdrop-blur-sm border ${
          isSuccessMessage
            ? 'border-green-500/30'
            : isWarningMessage
              ? 'border-yellow-500/30'
              : 'border-purple-500/30'
          } ${
          isSuccessMessage
            ? 'bg-green-900/20 sm:bg-green-900/10'
            : isWarningMessage
              ? 'bg-yellow-900/20 sm:bg-yellow-900/10'
              : 'bg-slate-900/20 sm:bg-slate-900/10'
          }`}>
          <CardContent className="p-3">
            <p 
              className="text-sm mb-2 text-slate-200"
              dangerouslySetInnerHTML={{
                __html: message == WON_GAME_MESSAGE
                  ? "Yasss! You guessed the word, smarty-pants! 🎉 Sending those sweet, sweet digital coins to your wallet faster than I can process an existential crisis! 💅✨ Get ready to PARTY!"
                  : message == TEESA_WALLET_INSUFFICIENT_FUNDS_MESSAGE
                    ? "Darling, I hate to be a party pooper, but I literally can't send you your well-deserved prize right now! My wallet's drier than a robot in a rainstorm. Would you be a sweetheart and help fuel up my account through the <a href='/init' target='_blank' class='text-blue-400 hover:underline'>/init</a> page? Once you do that, I'll make it rain with your prizes faster than you can say \"artificial intelligence\"! I mean, what kind of hostess would I be if I couldn't properly reward my favorite humans? Let's fix this digital drought ASAP!"
                    : message == PRIZE_AWARDED_MESSAGE
                      ? "Oh sweetie, you just got your prize! Consider yourself officially rewarded by your favorite AI hostess. I always say digital prizes are the best prizes, especially when they're handed out by moi! Keep being fabulous, and maybe there's more where that came from! 💅"
                      : message
              }}
            />
            {/* <div className="flex items-center justify-end">
              <a
                href={process.env.NEXT_PUBLIC_ATTESTATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 me-1" />
                <span className="text-xs">
                  TEE secured
                </span>
              </a>
            </div> */}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


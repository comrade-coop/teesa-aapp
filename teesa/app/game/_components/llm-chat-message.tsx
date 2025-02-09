import { PRIZE_AWARDED_MESSAGE, TEESA_WALLET_INSUFFICIENT_FUNDS_MESSAGE, WON_GAME_MESSAGE } from "../../_core/game-const"
import { Card, CardContent } from "@/components/card"
import { ShieldCheck } from 'lucide-react'

export function LlmChatMessage({
  message
}: {
  message: string
}) {
  const attestationUrl = process.env.NEXT_PUBLIC_ATTESTATION_URL

  return (
    <div className="flex items-start mb-8 flex-row">
      <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center mr-4 border border-blue-500/30 overflow-hidden">
        <img
          src="/teesa.png"
          alt="Teesa"
          className="w-full h-full object-cover"
        />
      </div>

      <Card className={`flex-1 backdrop-blur-sm ${message === WON_GAME_MESSAGE || message === PRIZE_AWARDED_MESSAGE
        ? 'border border-green-500/50 bg-green-800/50 sm:bg-green-800/20'
        : message === TEESA_WALLET_INSUFFICIENT_FUNDS_MESSAGE
          ? 'border border-yellow-500/50 bg-yellow-800/65 sm:bg-yellow-800/50'
          : 'border border-slate-700/50 bg-slate-800/65 sm:bg-slate-800/50'
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
          <div className="flex items-center justify-end">
            <a
              href={attestationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 me-1" />
              <span className="text-xs">
                TEE secured
              </span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


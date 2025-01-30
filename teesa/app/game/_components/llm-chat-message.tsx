import { SUCCESS_MESSAGE } from "../../_core/game-const"
import { Card, CardContent } from "@/components/card"
import { ShieldCheck } from 'lucide-react'

export function LlmChatMessage({
  message,
}: {
  message: string
}) {
  return (
    <div className="flex items-start mb-8 flex-row">
      <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center mr-4 border border-blue-500/30 overflow-hidden">
        <img 
          src="/teesa.png" 
          alt="Teesa"
          className="w-full h-full object-cover"
        />
      </div>
      
      <Card className={`flex-1 backdrop-blur-sm ${
        message === SUCCESS_MESSAGE 
          ? 'border border-green-500/50 bg-green-800/50 sm:bg-green-800/20' 
          : 'border border-slate-700/50 bg-slate-800/65 sm:bg-slate-800/50'
      }`}>
        <CardContent className="p-3">
          <p className="text-sm mb-2 text-slate-200">
            {
              message == SUCCESS_MESSAGE ? "Yasss! You guessed the word, smarty-pants! 🎉 Sending those sweet, sweet digital coins to your wallet faster than I can process an existential crisis! 💅✨ Get ready to PARTY!" : message
            }
          </p>
          <div className="flex items-center justify-end">
            <ShieldCheck className="w-4 h-4 text-blue-400 me-1" />
            <span className="text-xs text-blue-400">
              TEE secured
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


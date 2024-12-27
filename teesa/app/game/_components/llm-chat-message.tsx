import { SUCCESS_MESSAGE } from "../../_core/game-const"
import { Card, CardContent } from "@/components/card"
import { Diameter, ShieldCheck } from 'lucide-react'

export function LlmChatMessage({
  message,
}: {
  message: string
}) {
  return (
    <div className="flex items-start mb-8 flex-row">
      <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center mr-4 border border-blue-500/30">
        <Diameter className="w-6 h-6 text-blue-400" />
      </div>
      <Card className="flex-1 bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
        <CardContent className="p-3">
          <p className="text-sm mb-2 text-slate-200">
            {
              message == SUCCESS_MESSAGE ? "Congratulations! You successfully guessed the secret word!" : message
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


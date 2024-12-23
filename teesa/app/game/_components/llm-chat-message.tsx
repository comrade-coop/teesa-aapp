import { Card, CardContent } from "@/components/card"
import { Diameter, ShieldCheck } from 'lucide-react'

export function LlmChatMessage({
  message,
}: {
  message: string
}) {
  return (
    <div className="flex items-start mb-8 flex-row">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-4">
        <Diameter className="w-6 h-6 text-muted-foreground" />
      </div>
      <Card className="flex-1 bg-slate-100">
        <CardContent className="p-3">
          <p className="text-sm mb-2">{message}</p>
          <div className="flex items-center justify-end">
            <ShieldCheck className="w-6 h-6 text-muted-foreground me-1" />
            <span className="text-xs text-muted-foreground">
              TEE secured
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


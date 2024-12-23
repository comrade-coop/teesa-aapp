import { Card, CardContent } from "@/components/card"
import { Diameter } from "lucide-react"
import { ReactNode } from "react"

export function SystemMessage({
  message
}: {
  message: ReactNode
}) {
  return (
    <div className="flex items-start flex-row">
      <Card className="flex-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 backdrop-blur-sm">
        <CardContent className="flex flex-row p-3">
          <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center mr-4 border border-blue-500/30">
            <Diameter className="w-6 h-6 text-blue-400" />
          </div>

          <div className="text-sm text-slate-200">{message}</div>
        </CardContent>
      </Card>
    </div>
  )
}
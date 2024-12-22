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
      <Card className="flex-1 bg-slate-200">
        <CardContent className="flex flex-row p-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-4">
            <Diameter className="w-6 h-6 text-muted-foreground" />
          </div>

          <div className="text-sm">{message}</div>
        </CardContent>
      </Card>
    </div>
  )
}
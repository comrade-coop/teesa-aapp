import { Card, CardContent } from "@/components/card"
import { Placeholder } from "@/components/placeholder"
import { Diameter } from "lucide-react"

export function LlmChatMessagePlaceholder() {
  return (
    <div className="flex items-start mb-8 flex-row">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-4">
        <Diameter className="w-6 h-6 text-muted-foreground" />
      </div>

      <Card className="flex-1">
        <CardContent className="p-3">
          <Placeholder className="w-full h-4 mb-2" />
          <Placeholder className="w-3/4 h-4 mb-2" />
          <div className="flex justify-end">
            <Placeholder className="w-16 h-3" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


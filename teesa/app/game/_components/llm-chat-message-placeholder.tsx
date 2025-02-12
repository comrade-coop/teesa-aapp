import { Card, CardContent } from "@/components/card"
import { Placeholder } from "@/components/placeholder"

export function LlmChatMessagePlaceholder() {
  return (
    <div className="flex items-start mb-8 flex-row">
      <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center mr-4 border border-blue-500/30 overflow-hidden">
        <img 
          src="/teesa.png" 
          alt="Teesa"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative flex-1">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-blue-400/15 to-purple-500/20 rounded-lg"></div>
        <Card className="relative border border-purple-500/30 bg-slate-900/20 sm:bg-slate-900/10 backdrop-blur-sm">
          <CardContent className="p-3">
            <Placeholder className="w-full h-4 mb-2" />
            <Placeholder className="w-3/4 h-4 mb-2" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


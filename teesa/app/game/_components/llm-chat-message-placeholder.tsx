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

      <Card className="flex-1 backdrop-blur-sm border border-slate-700/50 bg-slate-800/65 sm:bg-slate-800/50">
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


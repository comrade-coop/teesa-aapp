import { Card, CardContent } from "@/components/card"
import { getLocaleServer } from "@/lib/server-utils";
import { timestampToFormatedDate } from "@/lib/utils";
import { Diameter } from 'lucide-react'

export async function LlmChatMessage({
  timestamp,
  message
}: {
  timestamp: number,
  message: string
}) {
  const locale = await getLocaleServer();
  const formatedDate = timestampToFormatedDate(locale, timestamp);

  return (
    <div className="flex items-start mb-8 flex-row">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-4">
        <Diameter className="w-6 h-6 text-muted-foreground" />
      </div>
      <Card className="flex-1 bg-slate-100">
        <CardContent className="p-3">
          <p className="text-sm mb-2">{message}</p>
          <div className="flex justify-end">
            <span className="text-xs text-muted-foreground">
              {formatedDate}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


import { Card, CardContent } from "@/components/card"
import { timestampToFormatedDate } from "@/lib/utils"
import { User } from 'lucide-react'

export function UserChatMessage({
  timestamp,
  locale,
  message
}: {
  timestamp: number,
  locale: string,
  message: string
}) {
  const formatedDate = timestampToFormatedDate(locale, timestamp);

  return (
    <div className="flex items-start mb-8 flex-row">
      <Card className="flex-1">
        <CardContent className="p-3">
          <p className="text-sm mb-2">{message}</p>
          <div className="flex justify-end">
            <span className="text-xs text-muted-foreground">
              {formatedDate}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center ml-4">
        <User className="w-6 h-6 text-muted-foreground" />
      </div>
    </div>
  )
}


import { Card, CardContent } from "@/components/card"
import { timestampToFormatedDate } from "@/lib/utils"
import { User } from 'lucide-react'

export function UserChatMessage({
  timestamp,
  locale,
  message,
  userAddress
}: {
  timestamp: number,
  locale: string,
  message: string,
  userAddress: string
}) {
  const formatedDate = timestampToFormatedDate(locale, timestamp);

  return (
    <div className="flex items-start mb-8 flex-row">
      <Card className="flex-1 bg-blue-600/30 sm:bg-blue-600/10 border border-blue-500/20 backdrop-blur-sm">
        <CardContent className="p-3">
          <div className="mb-2 text-xs text-blue-400">
            <span className="break-all">{userAddress}</span>
          </div>
          <p className="text-sm mb-2 text-slate-200">{message}</p>
          <div className="flex justify-end">
            <span className="text-xs text-blue-400">
              {formatedDate}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center ml-4 border border-blue-500/30">
        <User className="w-6 h-6 text-blue-400" />
      </div>
    </div>
  )
}


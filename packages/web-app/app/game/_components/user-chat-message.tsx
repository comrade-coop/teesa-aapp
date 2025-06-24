import { Card, CardContent } from "@/components/card"
import { timestampToFormatedDate } from "@/lib/utils"

export function UserChatMessage({
  timestamp,
  locale,
  message,
  userId
}: {
  timestamp: number,
  locale: string,
  message: string,
  userId: string
}) {
  if (!userId) {
    userId = '';
  }

  const formatedDate = timestampToFormatedDate(locale, timestamp);
  const avatarUrl = `https://api.dicebear.com/6.x/pixel-art/svg?seed=${userId}`;
  const truncatedAddress = `${userId.slice(2, 7)}...${userId.slice(-5)}`;

  return (
    <div className="flex items-start mb-8 flex-row">
      <div className="relative flex-1">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-blue-500/15 to-blue-400/20 rounded-lg"></div>
        <Card className="relative border border-blue-500/30 bg-slate-900/10 sm:bg-slate-900/5 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="mb-2 text-xs text-blue-400">
              <span>{truncatedAddress}</span>
            </div>
            <p className="text-sm mb-2 text-slate-200">{message}</p>
            <div className="flex justify-end">
              <span className="text-xs text-blue-400">
                {formatedDate}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="w-10 h-10 rounded-full bg-slate-900/10 flex items-center justify-center ml-4 border border-blue-500/20 overflow-hidden">
        <img 
          src={avatarUrl}
          alt={`Avatar for ${userId}`}
          className="w-full h-full"
        />
      </div>
    </div>
  )
}


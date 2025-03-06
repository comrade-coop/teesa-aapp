import { MessageTypeEnum } from "@/app/_core/message-type-enum";
import { gameState } from "../../_core/game-state";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const includeSystemMessages = searchParams.has('includeSystemMessages') 
        ? searchParams.get('includeSystemMessages')?.toLowerCase() === 'true'
        : true;

    const history = await gameState.getHistory();
    const result = includeSystemMessages 
        ? history 
        : history.filter(msg => msg.messageType != MessageTypeEnum.SYSTEM);
    
    return Response.json(result);
}
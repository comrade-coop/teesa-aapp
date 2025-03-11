import { gameState } from "../../_core/game-state";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const types = searchParams.getAll('type').map(t => parseInt(t));
    
    const history = await gameState.getHistory();
    const result = types.length > 0
        ? history.filter(msg => types.includes(msg.messageType))
        : history;
    
    return Response.json(result);
}
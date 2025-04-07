import { gameState } from "../../_core/game-state";

interface GameDetails {
    gameId: string;
    winnerAddress: string | undefined;
}

export async function GET(request: Request) {
    const gameId = gameState.getId();
    const winnerAddress = await gameState.getWinnerAddress();
    
    const result: GameDetails = {
        gameId: gameId,
        winnerAddress: winnerAddress,
    }
    
    return Response.json(result);
}
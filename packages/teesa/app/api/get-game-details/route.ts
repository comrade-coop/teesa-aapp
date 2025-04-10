import { getNftContractAddress } from "@teesa-monorepo/nft/src/get-nft-contract-address";
import { gameState } from "../../_core/game-state";

interface GameDetails {
    gameId: string;
    winnerAddress: string | undefined;
    nftContractAddress: string;
    nftId: string | undefined;
}

export async function GET(request: Request) {
    const gameId = gameState.getId();
    const winnerAddress = await gameState.getWinnerAddress();
    const nftContractAddress = getNftContractAddress();
    const nftId = await gameState.getNftId();

    const result: GameDetails = {
        gameId: gameId,
        winnerAddress: winnerAddress,
        nftContractAddress: nftContractAddress,
        nftId: nftId
    }
    
    return Response.json(result);
}
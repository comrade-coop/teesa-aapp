'use server';

import { gameState } from "../../_core/game-state";
import { MessageTypeEnum } from "../../_core/message-type-enum";
import { callContractViewMethod } from "../../_contracts/call-contract-view-method";

export async function calculateCurrentFee(): Promise<bigint> {
    const initialFee = await callContractViewMethod('initialFee');
    
    const history = await gameState.getHistory();
    const questions = history.filter(message => message.messageType === MessageTypeEnum.QUESTION);

    // For each question, the fee increases by 10%
    // Calculate the current fee: initialFee * (1.10 ^ questionCount)
    if (questions.length === 0) {
        return initialFee;
    }
    
    // Calculate 1.10^questionCount using BigInt math
    // Since BigInt doesn't support floating point, we'll use a fixed-point approach
    // Multiply by 10^18 for precision, then divide at the end
    const BASE_MULTIPLIER = BigInt(110000); // 1.10 as 110/100
    const PRECISION = BigInt(100000);
    
    let multiplier = PRECISION; // Start with 1.0 (100/100)
    
    for (let i = 0; i < questions.length; i++) {
        // Multiply by 1.10 each time (110/100)
        multiplier = (multiplier * BASE_MULTIPLIER) / PRECISION;
    }
    
    // Apply the multiplier to the initial fee
    const currentFee = (initialFee * multiplier) / PRECISION;
    
    return currentFee;
}
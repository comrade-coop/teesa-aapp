'use server';

import { agentState } from '@teesa-monorepo/agent/src/state/agent-state';
import { AgentClientsEnum } from '@teesa-monorepo/agent/src/state/types';

export async function getMessages() {
    const history = await agentState.getHistory();
    const questions = await agentState.getQuestions();
    const questionMessageIds = questions.map(q => q.messageId);

    return history.filter(h => h.agentClient == AgentClientsEnum.WEB || questionMessageIds.includes(h.id));
}
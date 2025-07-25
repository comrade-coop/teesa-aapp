import fs from 'fs';
import { agentState, STATE_FILE_PATH } from "../../src/state/agent-state";

export async function setSecretWord(secretWord: string) {
  await agentState.reset();

  let attempts = 0;
  const maxAttempts = 10;

  // Add a delay so that the file's last modified time is updated
  await new Promise(resolve => setTimeout(resolve, 500));
  
  while (attempts < maxAttempts) {
    try {
      if (fs.existsSync(STATE_FILE_PATH)) {
        const stateData = JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf-8'));
        stateData.secretWord = secretWord;
        fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(stateData, null, 2));
        
        // Verify the update was successful
        const verifyData = JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf-8'));
        if (verifyData.secretWord === secretWord) {
          return;
        }
      }
    } catch (error) { }
    
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error(`Failed to set secret word after ${maxAttempts} attempts`);
}
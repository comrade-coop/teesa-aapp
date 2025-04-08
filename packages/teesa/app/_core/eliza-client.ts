import 'server-only'
import { gameState } from './game-state';
export async function sendMessageEliza(message: string, systemMessage?: string | undefined): Promise<string> {
  // Construct the full message by combining system message and user message if needed
  const fullMessage = systemMessage
    ? `${systemMessage}\n\n---\n${message}`
    : message;

  // Get environment variables
  const apiUrl = process.env.ELIZA_API_URL;
  const agentId = process.env.ELIZA_AGENT_ID;

  if (!apiUrl || !agentId) {
    throw new Error('Missing required environment variables: ELIZA_API_URL or ELIZA_AGENT_ID');
  }

  // Create URLSearchParams for form data
  const formData = new URLSearchParams();
  formData.append('text', fullMessage);
  formData.append('roomId', gameState.getId() || 'Teesa Word Guessing Game');

  // Make the API request
  const response = await fetch(`${apiUrl}/${agentId}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  // Parse the response
  const data = await response.json();

  // Extract and return the text from the first message
  if (Array.isArray(data) && data.length > 0 && data[0].text) {
    return data[0].text;
  }

  throw new Error('Invalid response format from Eliza API');
}
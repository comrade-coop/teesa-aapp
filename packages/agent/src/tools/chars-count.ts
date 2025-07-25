import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const toolMetadata = {
  name: "charsCount",
  description: "Count the number of characters in a text",
  schema: z.object({
    text: z.string().describe("The text to count the characters of"),
  }),
};

export const charsCount = tool(
  async (input: { text: string }) => {
    console.log("TOOL: charsCount");

    const { text } = input;
    return text.length;
  },
  toolMetadata
);
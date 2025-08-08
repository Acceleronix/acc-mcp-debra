import { convertToCoreMessages, smoothStream, streamText } from "ai";
import { selectThreadWithMessagesAction } from "../actions";
import { customModelProvider } from "lib/ai/models";
import { SUMMARIZE_PROMPT } from "lib/ai/prompts";
import logger from "logger";
import { ChatModel } from "app-types/chat";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { threadId, chatModel } = json as {
      threadId: string;
      chatModel?: ChatModel;
    };

    const thread = await selectThreadWithMessagesAction(threadId);

    if (!thread) {
      return new Response("Thread not found", { status: 404 });
    }

    const messages = convertToCoreMessages(
      thread.messages
        .map((v) => ({
          content: "",
          role: v.role,
          parts: v.parts,
        }))
        .concat({
          content: "",
          parts: [
            {
              type: "text",
              text: "Generate a system prompt based on the conversation so far according to the rules.",
            },
          ],
          role: "user",
        }),
    );

    const model = customModelProvider.getModel(chatModel);
    // Check if this is gpt-5-mini which doesn't support custom temperature
    const isGpt5Mini = model.modelId === "gpt-5-mini";

    const result = streamText({
      model,
      system: SUMMARIZE_PROMPT,
      experimental_transform: smoothStream({ chunking: "word" }),
      messages,
      // Only set temperature for models that support custom temperature
      ...(!isGpt5Mini && { temperature: 0 }),
    });

    return result.toDataStreamResponse();
  } catch (error) {
    logger.error(error);
  }
}

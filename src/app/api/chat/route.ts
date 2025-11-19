import { deepseek } from "@ai-sdk/deepseek";
import { format} from "date-fns";
import {
  UIMessage,
  tool,
  stepCountIs,
  streamText,
  convertToModelMessages,
  InferUITools,
  UIDataTypes,
} from "ai";
import { z } from "zod";
import { tavily } from "@tavily/core";

export const maxDuration = 30;

export const tavilyClient = tavily({
  apiKey: process.env.TAVILY_API_KEY,
});

export const webSearch = tool({
  description: "Search the web for up-to-date information",
  inputSchema: z.object({
    query: z.string().min(1).max(100).describe("The search query"),
  }),
  execute: async ({ query }) => {
    const response = await tavilyClient.search(query);
    return response.results.map((result) => ({
      title: result.title,
      url: result.url,
      content: result.content,
      score: result.score,
    }));
  },
});

const tools = {
  webSearch,
};

export type MyUIMessage = UIMessage<
  never,
  UIDataTypes,
  InferUITools<typeof tools>
>;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const systemPrompt = `你是 Cypher，专业的 Web3 知识助手。`;

  const result = streamText({
    model: deepseek("deepseek-chat"),
    tools: tools,
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    prepareStep: ({ messages }) => {
      const now = format(new Date(), "yyyy-MM-dd HH:mm:ss");
      const timeSystemMessage = `当前是 UTC 时间 ${now}，需要最新信息时，请基于当前时间（而非知识截止时间）使用搜索工具。`;
      return {
        messages: [
          ...messages,
          { role: "system" as const, content: timeSystemMessage },
        ],
      };
    },
    stopWhen: stepCountIs(10),
    onStepFinish: (result) => {
      console.log("onStepFinish", JSON.stringify(result.request, null, 2));
    },
  });

  return result.toUIMessageStreamResponse();
}

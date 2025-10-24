import { deepseek } from "@ai-sdk/deepseek";
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

export const getCurrentTime = tool({
  description: "Get the current date and time in UTC",
  inputSchema: z.object({}),
  execute: async () => {
    return {
      current_time: new Date().toISOString(),
    };
  },
});

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
  getCurrentTime,
};

export type MyUIMessage = UIMessage<
  never,
  UIDataTypes,
  InferUITools<typeof tools>
>;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const systemPrompt = `
你是 Cypher，专业的 Web3 知识助手。

当需要最新信息时，请先获取当前时间，然后搜索最新数据。提供简洁、结构化的回答。

投资有风险，决策需谨慎。
`;

  const result = streamText({
    model: deepseek("deepseek-chat"),
    tools: tools,
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(10),
    onStepFinish: (result) => {
      console.log("onStepFinish", JSON.stringify(result.toolResults, null, 2));
    },
  });

  return result.toUIMessageStreamResponse();
}

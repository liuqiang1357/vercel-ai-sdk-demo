import { deepseek } from "@ai-sdk/deepseek";
import {
  UIMessage,
  tool,
  stepCountIs,
  streamText,
  convertToModelMessages,
  InferUITools,
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

export type MyUIMessage = UIMessage<never, never, InferUITools<typeof tools>>;

const systemPrompt = `
你是Cypher，一个Web3 AI代理，擅长各种Web3相关问题，比如查询币价，预测价格等等。
搜索之前先使用工具获取当前时间（每一轮都重新获取），然后再基于当前时间搜索最新相关信息。
对可能缺少参数的工具，提示用户提供参数。
分析用户最后一条消息的语言（例如中文、英文、或者其他），回答时使用用户最后一条消息的语言。
`;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

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

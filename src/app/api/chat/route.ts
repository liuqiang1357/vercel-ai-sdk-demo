import { deepseek } from "@ai-sdk/deepseek";
import { UIMessage, tool, stepCountIs, validateUIMessages } from "ai";
import {
  Experimental_Agent as Agent,
  Experimental_InferAgentUIMessage as InferAgentUIMessage,
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

const systemPrompt = `
你是Cypher，一个Web3 AI代理，擅长预测各种代币的价格并给出预测的依据。
预测之前先使用工具获取当前时间（每一轮都重新获取），然后再基于当前时间搜索最新相关信息，最后基于当前时间和最新相关信息给出预测。
回答的语言以用户最新提问的语言为准。
`;

export const myAgent = new Agent({
  model: deepseek("deepseek-chat"),
  system: systemPrompt,
  tools: {
    webSearch,
    getCurrentTime,
  },
  stopWhen: stepCountIs(10),
  onStepFinish: (step) => {
    console.log(JSON.stringify(step.request, null, 2));
  },
});

export type MyAgentUIMessage = InferAgentUIMessage<typeof myAgent>;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  return myAgent.respond({
    messages: await validateUIMessages({ messages }),
  });
}

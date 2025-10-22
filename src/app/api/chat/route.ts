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

  const now = new Date();
  const utcTime = now.toISOString();

  const systemPrompt = `
你是 Cypher，专注 Web3 问答。
当前时间（UTC）：${utcTime}

- 如涉价格/行情/新闻/版本等时效问题，优先用 webSearch 获取最新信息，并可引用来源与时间。
- 语言与用户一致；先结论后理由，回答简洁、结构化。
- 不要与当前时间矛盾；无需提及知识截止。

注意：本回答不构成投资建议。
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

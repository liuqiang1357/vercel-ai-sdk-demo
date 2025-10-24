"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import stringify from "safe-stable-stringify";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { Response } from "@/components/ai-elements/response";
import { MyUIMessage } from "./api/chat/route";

export default function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage } = useChat<MyUIMessage>();

  return (
    <div className="flex flex-col w-full max-w-2xl py-24 mx-auto stretch space-y-4">
      {messages.map((message) => (
        <div key={message.id} className="space-y-3">
          <div className="font-semibold text-sm text-gray-600">
            {message.role === "user" ? "User" : "AI"}
          </div>
          {message.parts.map((part, i) => {
            switch (part.type) {
              case "text":
                return (
                  <Response key={`${message.id}-${i}`}>{part.text}</Response>
                );
              case "tool-webSearch":
                return (
                  <Tool
                    key={`${message.id}-${i}`}
                    defaultOpen={
                      part.state === "output-available" ||
                      part.state === "output-error"
                    }
                  >
                    <ToolHeader type="webSearch" state={part.state} />
                    <ToolContent>
                      <ToolInput input={part.input} />
                      <ToolOutput
                        output={
                          part.output ? (
                            <div className="space-y-3">
                              {Array.isArray(part.output) ? (
                                part.output.map((result, idx) => (
                                  <div
                                    key={idx}
                                    className="border-l-4 border-blue-200 pl-4"
                                  >
                                    <h5 className="font-semibold text-blue-900">
                                      <a
                                        href={result.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:underline"
                                      >
                                        {result.title}
                                      </a>
                                    </h5>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {result.content.substring(0, 200)}...
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                      <span>
                                        Score: {result.score.toFixed(2)}
                                      </span>
                                      <span>•</span>
                                      <a
                                        href={result.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:underline"
                                      >
                                        {result.url}
                                      </a>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <pre className="text-xs">
                                  {stringify(part.output, null, 2)}
                                </pre>
                              )}
                            </div>
                          ) : undefined
                        }
                        errorText={part.errorText}
                      />
                    </ToolContent>
                  </Tool>
                );
              case "tool-getCurrentTime":
                return (
                  <Tool
                    key={`${message.id}-${i}`}
                    defaultOpen={
                      part.state === "output-available" ||
                      part.state === "output-error"
                    }
                  >
                    <ToolHeader type="getCurrentTime" state={part.state} />
                    <ToolContent>
                      <ToolInput input={part.input} />
                       <ToolOutput
                         output={
                           part.output ? (
                             <div className="bg-green-50 border border-green-200 p-3 rounded">
                               <div className="text-lg font-semibold text-green-900">
                                 🕐 {part.output.current_time}
                               </div>
                             </div>
                           ) : undefined
                         }
                        errorText={part.errorText}
                      />
                    </ToolContent>
                  </Tool>
                );
              default:
                return null;
            }
          })}
        </div>
      ))}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput("");
        }}
        className="sticky bottom-0 bg-white pt-4"
      >
        <input
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          value={input}
          placeholder="Ask me anything..."
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}

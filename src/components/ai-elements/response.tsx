"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Response component for rendering AI responses with basic markdown support
interface ResponseProps extends React.HTMLAttributes<HTMLDivElement> {
  children: string
}

export function Response({ children, className, ...props }: ResponseProps) {
  const formattedText = React.useMemo(() => {
    const text = children;
    
    // Handle line breaks
    const lines = text.split('\n');
    
    return lines.map((line, index) => {
      // Handle code blocks
      if (line.startsWith('```')) {
        return null; // Will be handled separately
      }
      
      // Handle bold text
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Handle italic text  
      line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      // Handle inline code
      line = line.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
      
      // Handle headers
      if (line.startsWith('### ')) {
        line = `<h3 class="text-lg font-semibold mt-4 mb-2">${line.substring(4)}</h3>`;
      } else if (line.startsWith('## ')) {
        line = `<h2 class="text-xl font-semibold mt-4 mb-2">${line.substring(3)}</h2>`;
      } else if (line.startsWith('# ')) {
        line = `<h1 class="text-2xl font-bold mt-4 mb-2">${line.substring(2)}</h1>`;
      }
      
      // Handle bullet points
      if (line.startsWith('- ') || line.startsWith('* ')) {
        line = `<li class="ml-4">${line.substring(2)}</li>`;
      }
      
      return (
        <div key={index} dangerouslySetInnerHTML={{ __html: line }} className={line.trim() === '' ? 'h-4' : ''} />
      );
    });
  }, [children]);

  return (
    <div 
      className={cn(
        "text-gray-900 leading-relaxed space-y-1",
        "dark:text-gray-100",
        className
      )}
      {...props}
    >
      {formattedText}
    </div>
  )
}

"use client"

import * as React from "react"
import { ChevronDown, Play, CheckCircle, XCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import stringify from "safe-stable-stringify"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

// Tool component
interface ToolProps extends React.ComponentProps<typeof Collapsible> {
  defaultOpen?: boolean
  children?: React.ReactNode
}

export function Tool({ defaultOpen = false, children, ...props }: ToolProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} {...props}>
      {children}
    </Collapsible>
  )
}

// Tool Header component
interface ToolHeaderProps extends Omit<React.ComponentProps<typeof CollapsibleTrigger>, 'type'> {
  type: string
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
}

export function ToolHeader({ type, state, className, ...props }: ToolHeaderProps) {
  const getStateIcon = () => {
    switch (state) {
      case 'input-streaming':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'input-available':
        return <Play className="h-4 w-4 text-blue-500" />
      case 'output-available':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'output-error':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStateBadge = () => {
    switch (state) {
      case 'input-streaming':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Pending</span>
      case 'input-available':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Running</span>
      case 'output-available':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Completed</span>
      case 'output-error':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Error</span>
    }
  }

  return (
    <CollapsibleTrigger
      className={cn(
        "flex items-center justify-between w-full p-3 text-left bg-gray-50 hover:bg-gray-100 border rounded-lg",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        {getStateIcon()}
        <span className="font-mono text-sm">{type}</span>
        {getStateBadge()}
      </div>
      <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
    </CollapsibleTrigger>
  )
}

// Tool Content component
export function ToolContent({ children, ...props }: React.ComponentProps<typeof CollapsibleContent>) {
  return (
    <CollapsibleContent
      className="border-l border-r border-b rounded-lg overflow-hidden"
      {...props}
    >
      <div className="p-4 space-y-4">
        {children}
      </div>
    </CollapsibleContent>
  )
}

// Tool Input component
interface ToolInputProps extends React.ComponentProps<"div"> {
  input: unknown
}

export function ToolInput({ input, ...props }: ToolInputProps) {
  const displayText = React.useMemo(() => {
    try {
      const text = stringify(input, null, 2);
      if (typeof text !== 'string') {
        return '[Format Error: Invalid string output]';
      }
      return text.length > 2000 ? text.substring(0, 2000) + '... [truncated]' : text;
    } catch (error) {
      return `[Format Error: ${error instanceof Error ? error.message : 'Unknown error'}]`;
    }
  }, [input]);

  return (
    <div {...props}>
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Input:</h4>
      <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap">
        {displayText}
      </pre>
    </div>
  )
}

// Tool Output component
interface ToolOutputProps extends React.ComponentProps<"div"> {
  output?: React.ReactNode
  errorText?: string
}

export function ToolOutput({ output, errorText, ...props }: ToolOutputProps) {
  const formatText = React.useCallback((value: unknown, maxLength: number = 1000) => {
    try {
      const text = stringify(value, null, 2);
      if (typeof text !== 'string') {
        return '[Format Error: Invalid string output]';
      }
      return text.length > maxLength ? text.substring(0, maxLength) + '... [truncated]' : text;
    } catch (error) {
      return `[Format Error: ${error instanceof Error ? error.message : 'Unknown error'}]`;
    }
  }, []);

  if (errorText) {
    return (
      <div {...props}>
        <h4 className="text-sm font-semibold text-red-700 mb-2">Error:</h4>
        <div className="bg-red-50 border border-red-200 p-3 rounded text-sm text-red-800 whitespace-pre-wrap">
          {formatText(errorText, 1000)}
        </div>
      </div>
    )
  }

  if (output !== undefined && output !== null) {
    return (
      <div {...props}>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Output:</h4>
        <div className="bg-green-50 border border-green-200 p-3 rounded text-sm">
          {React.isValidElement(output) ? (
            // If it's a React element, render it directly
            output
          ) : (
            // Otherwise, use safe formatting
            <pre className="whitespace-pre-wrap overflow-x-auto text-xs">
              {formatText(output, 5000)}
            </pre>
          )}
        </div>
      </div>
    )
  }

  return null
}

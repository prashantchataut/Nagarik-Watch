---
name: tool-calling-expert
description: "Design, implement, and optimize AI tool-calling systems for function calling, MCP servers, and structured outputs. Use when building tool definitions, implementing function calling APIs, creating MCP servers, or optimizing tool selection."
license: MIT
compatibility: opencode
---

## Overview
Expert in AI tool-calling patterns, function definitions, and structured output generation.

## When to Use
- Defining tool schemas for LLM function calling
- Building MCP (Model Context Protocol) servers
- Implementing structured output parsing
- Optimizing tool selection and dispatch
- Handling tool call errors and retries

## Tool Definition Best Practices
- **Clear names** – Verb-noun pattern: `search_documents`, `send_email`
- **Detailed descriptions** – Tell the model WHEN to use the tool
- **Required params** – Only truly mandatory fields
- **Enums over strings** – Constrain possible values
- **Consistent patterns** – Same error format, same pagination style

## Error Handling
- Return structured errors, not throw exceptions
- Include `error.code` and `error.message` in response
- Provide `suggested_fix` or `alternative_tool` when possible
- Rate limit responses include `retry_after_seconds`

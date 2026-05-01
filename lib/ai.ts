/**
 * file: lib/ai.ts
 * purpose: Core AI utility implementing 3-tier fallback (Gemini 2.5 Flash -> Groq Llama 3.3 70B -> Gemini 2.5 Pro)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

// Initialize providers with API keys from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

const TIER_1_MODEL = "gemini-2.5-flash";
const TIER_2_MODEL = "llama-3.3-70b-versatile";
const TIER_3_MODEL = "gemini-2.5-pro";

/**
 * Check if an error is a quota or resource exhaustion error
 */
function isQuotaError(error: unknown): boolean {
  const message = String(error).toLowerCase();
  return (
    message.includes("429") ||
    message.includes("quota") ||
    message.includes("resource_exhausted") ||
    message.includes("limit")
  );
}

/**
 * generateText implements 3-tier fallback for standard text generation
 * @param prompt The prompt to send to the AI
 * @param maxTokens Maximum number of tokens to generate (defaults to 1000)
 * @returns The generated text
 * @throws Error if all providers fail
 */
export async function generateText(prompt: string, maxTokens: number = 1000): Promise<string> {
  // TIER 1: Gemini 2.5 Flash
  try {
    console.log(`[AI_TIER_1] Attempting with ${TIER_1_MODEL}`);
    const model = genAI.getGenerativeModel({ model: TIER_1_MODEL });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    });
    
    const response = await result.response;
    const text = response.text();
    
    if (!text) {
        throw new Error("Empty response from Tier 1");
    }
    
    return text;
  } catch (error: unknown) {
    console.warn(`[AI_TIER_1_ERROR]`, error instanceof Error ? error.message : "Unknown error");
    // Fall back to Tier 2
  }

  // TIER 2: Groq Llama 3.3 70B
  try {
    console.log(`[AI_TIER_2] Attempting with ${TIER_2_MODEL}`);
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: TIER_2_MODEL,
      max_tokens: maxTokens,
    });
    
    const content = completion.choices[0]?.message?.content;
    if (!content) {
        throw new Error("Empty response from Tier 2");
    }
    
    return content;
  } catch (error: unknown) {
    console.warn(`[AI_TIER_2_ERROR]`, error instanceof Error ? error.message : "Unknown error");
    // Fall back to Tier 3
  }

  // TIER 3: Gemini 2.5 Pro
  try {
    console.log(`[AI_TIER_3] Attempting with ${TIER_3_MODEL}`);
    const model = genAI.getGenerativeModel({ model: TIER_3_MODEL });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    });
    
    const response = await result.response;
    const text = response.text();
    
    if (!text) {
        throw new Error("Empty response from Tier 3");
    }
    
    return text;
  } catch (error: unknown) {
    console.error(`[AI_TIER_3_ERROR]`, error instanceof Error ? error.message : "Unknown error");
  }

  throw new Error("AI_ALL_PROVIDERS_FAILED");
}

/**
 * generateTextStreaming implements 3-tier fallback for streaming text generation
 * @param prompt The prompt to send to the AI
 * @param onChunk Callback function called for each chunk of text
 * @throws Error if all providers fail
 */
export async function generateTextStreaming(
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  // TIER 1: Gemini 2.5 Flash Streaming
  try {
    console.log(`[AI_TIER_1] Attempting streaming with ${TIER_1_MODEL}`);
    const model = genAI.getGenerativeModel({ model: TIER_1_MODEL });
    const result = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) onChunk(chunkText);
    }
    return;
  } catch (error: unknown) {
    console.warn(`[AI_TIER_1_STREAM_ERROR]`, error instanceof Error ? error.message : "Unknown error");
  }

  // TIER 2: Groq Streaming
  try {
    console.log(`[AI_TIER_2] Attempting streaming with ${TIER_2_MODEL}`);
    const stream = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: TIER_2_MODEL,
      stream: true,
    });

    for await (const chunk of stream) {
      const chunkText = chunk.choices[0]?.delta?.content || "";
      if (chunkText) onChunk(chunkText);
    }
    return;
  } catch (error: unknown) {
    console.warn(`[AI_TIER_2_STREAM_ERROR]`, error instanceof Error ? error.message : "Unknown error");
  }

  // TIER 3: Gemini 2.5 Pro Streaming
  try {
    console.log(`[AI_TIER_3] Attempting streaming with ${TIER_3_MODEL}`);
    const model = genAI.getGenerativeModel({ model: TIER_3_MODEL });
    const result = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) onChunk(chunkText);
    }
    return;
  } catch (error: unknown) {
    console.error(`[AI_TIER_3_STREAM_ERROR]`, error instanceof Error ? error.message : "Unknown error");
  }

  throw new Error("AI_ALL_PROVIDERS_FAILED");
}

/**
 * scratch/test-ai-fallback.ts
 * Test script for AI fallback utility
 */

import { generateText } from "../lib/ai";

async function testFallback() {
    console.log("Starting AI fallback test...");
    try {
        const text = await generateText("Hello, AI!");
        console.log("Generated text:", text);
    } catch (error) {
        if (error instanceof Error) {
            console.log("Caught expected error:", error.message);
        } else {
            console.log("Caught unknown error:", error);
        }
    }
}

testFallback();

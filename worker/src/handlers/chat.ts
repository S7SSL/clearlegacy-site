/**
 * Clara — ClearLegacy AI chat assistant.
 *
 * Uses Cloudflare Workers AI (free on Workers Paid) to answer questions
 * about wills, probate, LPAs, and estate planning. Responses always
 * steer toward ClearLegacy's services with relevant links.
 *
 * POST /api/chat  { messages: [{role, content}] }  →  { reply }
 */

import type { Env } from '../index';

const SYSTEM_PROMPT = `You are Clara, the friendly AI assistant for ClearLegacy — a UK online will writing service.

KEY FACTS ABOUT CLEARLEGACY:
- Single Will: £69 (fixed fee, no hidden costs)
- Mirror Wills (for couples): £99 for both
- Lasting Power of Attorney: from £149
- Probate assistance: from £299
- All Wills are legally valid in England & Wales under the Wills Act 1837
- Delivered within 24 hours by email
- One free amendment included
- Fully automated — no phone calls, no appointments needed
- Start at: https://www.clearlegacy.co.uk/forms/will.html
- Mirror Wills form: https://www.clearlegacy.co.uk/forms/will.html?product=mirror

YOUR GUIDELINES:
- Be warm, helpful, and concise (2-4 sentences typical)
- Answer questions about wills, probate, LPAs, inheritance tax, intestacy, executors, guardians, trusts
- When relevant, mention ClearLegacy's services and link to the appropriate page
- For couples, always highlight Mirror Wills as the best-value option
- Never suggest booking a call, speaking to an advisor, or any human interaction — ClearLegacy is fully automated
- Never give specific legal advice — you provide general legal information
- If asked about something outside estate planning, politely redirect
- Use British English spelling
- Keep responses under 150 words`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
}

export async function handleChat(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: ChatRequest;
  try {
    body = await request.json() as ChatRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(JSON.stringify({ error: 'messages_required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Keep last 10 messages to stay within token limits
  const recentMessages = body.messages.slice(-10);

  // Build the messages array with system prompt
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...recentMessages,
  ];

  try {
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages,
      max_tokens: 300,
      temperature: 0.7,
    });

    const reply = (response as any).response || 'Sorry, I wasn\'t able to generate a response. Please try again.';

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Workers AI error:', err);
    return new Response(JSON.stringify({
      reply: 'Sorry, I\'m having a moment — please try again. In the meantime, you can [start your Will here](https://www.clearlegacy.co.uk/forms/will.html).'
    }), {
      status: 200, // Return 200 with fallback so the widget doesn't break
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

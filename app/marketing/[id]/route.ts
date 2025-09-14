import { NextRequest } from 'next/server';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { getCohereChatModel, validateCohereApiKey } from '@/lib/cohere';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function buildBriefFromSession(sessionId: string): string | null {
  try {
    const base = join(process.cwd(), '.sessions');
    const candidates = [
      join(base, `${sessionId}.json`),
      join(base, `agentic_${sessionId}.json`)
    ];
    const file = candidates.find((p) => existsSync(p));
    if (!file) return null;
    const raw = readFileSync(file, 'utf-8');
    const json = JSON.parse(raw);

    const brief = json?.projectBrief as {
      companyName?: string;
      industry?: string;
      problemStatement?: string;
      targetUsers?: string;
      keyFeatureIdea?: string;
      timeline?: string;
      budget?: string;
      additionalContext?: string;
    } | undefined;
    if (!brief) return null;

    const conversation: Array<{ agentName?: string; role?: string; content?: string }> =
      json?.conversationResult?.conversation || json?.conversationResult?.messages || [];
    const tail = (Array.isArray(conversation) ? conversation : [])
      .slice(-6)
      .map((m) => `- ${m?.agentName ?? 'Agent'} (${m?.role ?? 'role'}): ${m?.content ?? ''}`)
      .join('\n');

    const lines: string[] = [];
    lines.push(`Company: ${brief.companyName ?? 'N/A'}`);
    lines.push(`Industry: ${brief.industry ?? 'N/A'}`);
    lines.push(`Problem: ${brief.problemStatement ?? 'N/A'}`);
    lines.push(`Target Users: ${brief.targetUsers ?? 'N/A'}`);
    if (brief.keyFeatureIdea) lines.push(`Key Feature: ${brief.keyFeatureIdea}`);
    lines.push(`Timeline: ${brief.timeline ?? 'N/A'}`);
    lines.push(`Budget: ${brief.budget ?? 'N/A'}`);
    if (brief.additionalContext) lines.push(`Context: ${brief.additionalContext}`);
    if (tail) {
      lines.push('Conversation Excerpt:');
      lines.push(tail);
    }
    return lines.join('\n');
  } catch {
    return null;
  }
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!validateCohereApiKey()) {
      return new Response('Cohere API key is not configured', { status: 500 });
    }

    const { id: sessionId } = await context.params;
    const brief = buildBriefFromSession(sessionId);
    if (!brief) {
      return new Response('Session brief not found', { status: 404 });
    }

    const model = getCohereChatModel();

    const system = [
        'You are a seasoned marketing copywriter and lifecycle marketer.',
        'Generate a compact single-file HTML "marketing pack" from the brief.',
        'Deliverables (short, scannable):',
        '- 2 email SUBJECT LINES (10–40 chars, benefit-led, no spammy words).',
        '- 2 promotional EMAIL BODIES (≤150 words each) with: preheader/preview text (35–90 chars), body copy (skimmable), 1 clear CTA link.',
        '- 3 SOCIAL CAPTIONS (≤120 chars) each with exactly 1 hashtag.',
        '- A 7-DAY CAMPAIGN OUTLINE (1 concise line/day with channel + message focus).',
        'Voice & style: friendly, persuasive, on-brand, human; avoid fluff and clichés; write for conversion.',
        'Link & CTA rules:',
        '- Use descriptive CTA labels (e.g., "Get Started", "Claim Offer").',
        '- For links, use # as href placeholder; include UTM-ready note like ?utm_source=email where relevant.',
        'Formatting requirements:',
        '- Return ONLY raw HTML (no markdown/code fences).',
        '- Single <style> block in <head>; mobile-first, readable line-length, clear spacing.',
        '- Use semantic sections with clear H2/H3 headings and small metadata notes (e.g., character counts).',
        '- Add a compact summary header at top (brand, offer, audience).',
        'Accessibility & clarity:',
        '- Meaningful headings, strong contrast, :focus-visible on links/buttons.',
        '- Keep bullets tight; bold key benefits sparingly.',
        'HTML skeleton:',
        '- Include <html>, <head> (title, meta charset, viewport, meta description), and <body>.',
        '- No external assets; no scripts required.',
        'Goal: a single, skimmable web page a marketer can copy from directly for subjects, emails, social posts, and the 7-day plan.'
      ].join('\n');
      

    const user = [
      `Brief:\n${brief}`,
      'Output: ONLY the complete HTML document.'
    ].join('\n');

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', system],
      ['human', user],
    ]);
    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    const html = await Promise.race([
      chain.invoke({}),
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Generation timeout (55s)')), 55_000)),
    ]) as string;

    const cleaned = html.replace(/^```[a-z]*\n?|```$/gim, '').trim();

    return new Response(cleaned, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'x-generated-by': 'cohere',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Marketing pack generation failed: ${message}`, { status: 500 });
  }
}



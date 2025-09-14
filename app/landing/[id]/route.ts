import { NextRequest } from 'next/server';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { getCohereChatModel, validateCohereApiKey } from '@/lib/cohere';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // allow up to 60s in serverless

function buildBriefFromSession(sessionId: string): string | null {
  try {
    const base = join(process.cwd(), '.sessions');
    const candidates = [
      join(base, `${sessionId}.json`),
      // Some agentic sessions are saved as agentic_${sessionId}.json
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

    const artifacts: Record<string, any> | undefined = json?.conversationResult?.artifacts;
    const list = artifacts ? Object.values(artifacts) : [];
    const preferred: any | undefined = list.find(
      (a: any) => /marketing|website|landing|copy/i.test(a?.type) || /landing|homepage|website/i.test(a?.title || '')
    ) || list[0];

    const conversation: Array<{ agentName?: string; role?: string; content?: string }> = json?.conversationResult?.conversation || [];
    const tail = conversation.slice(-5).map((m) => `- ${m.agentName ?? 'Agent'} (${m.role ?? 'role'}): ${m.content ?? ''}`).join('\n');

    const lines: string[] = [];
    lines.push(`Company: ${brief.companyName ?? 'N/A'}`);
    lines.push(`Industry: ${brief.industry ?? 'N/A'}`);
    lines.push(`Problem: ${brief.problemStatement ?? 'N/A'}`);
    lines.push(`Target Users: ${brief.targetUsers ?? 'N/A'}`);
    if (brief.keyFeatureIdea) lines.push(`Key Feature: ${brief.keyFeatureIdea}`);
    lines.push(`Timeline: ${brief.timeline ?? 'N/A'}`);
    lines.push(`Budget: ${brief.budget ?? 'N/A'}`);
    if (brief.additionalContext) lines.push(`Context: ${brief.additionalContext}`);
    if (preferred?.content) {
      lines.push('Reference Copy:');
      lines.push(preferred.content);
    }
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
      'You are an expert web designer and copywriter. make sure content is correct and make it beautiful',
      'Generate a BEAUTIFUL but VERY SMALL single-file HTML landing page from the brief.',
      'Small-page constraints: make it mostly white for website and promperly formatted',
      '- Keep output compact: ≈120–150 lines and ideally < 8 KB total.',
      'Structure (in order):',
      '- Sticky header with business name/logo and nav links (Home, Menu/Services, Contact).',
      '- Hero with a bold ≤7-word headline, a 1–2 sentence value prop, and two primary CTAs.',
      '- Grid of 3–4 featured products/services with hover-lift cards and prices (if relevant).',
      '- Contact section with address, hours, and call/email/map buttons.',
      '- Simple footer with © current year.',
      'Design:',
      '- Soft warm gradient background;',
      '- Rounded cards, subtle shadows, gentle hover/active states; tasteful emoji or inline SVG allowed.',
      '- Spacing that breathes (comfortable line-height, clear section spacing).',
      'Copy tone:',
      '- Clear, friendly, and concise. Avoid filler. Headline should be punchy and benefit-driven.',
      'Technical requirements:',
      '- Return ONLY raw HTML (no code fences, no markdown).',
      '- Include <html>, <head> (title, meta charset, viewport, OG title/desc, theme-color), and <body>.',
      '- Minimal, mobile-first CSS inside ONE <style> tag; NO external CSS/JS; smooth hover transitions (100–150ms); respect prefers-reduced-motion.',
      '- Provide :focus-visible styles, AA+ color contrast, semantic landmarks (<header>, <main>, <section>, <footer>).',
      '- Prefer CSS shapes or inline SVG; theme color should be white and black',
      '- Minimal JS in ONE <script> tag only for current year and optional smooth-scroll (guarded by prefers-reduced-motion).',
      'Accessibility & SEO:',
      '- Descriptive link/button labels; aria-labels on nav; logical heading order; meaningful alt text.',
      '- Meta description ≤160 chars; concise OG tags; set theme-color to match the primary accent.',
      'Performance:',
      '- Avoid large fonts/assets; no webfont imports; no external icons; keep CSS tight and deduplicated.',
      'Goal: Make it visually appealing for hackathon judges — clean, friendly, and great on phones.'
    ].join('\\n');      

    const user = [
      `Session-Derived Brief:\n${brief}`,
      'Tone: persuasive, trustworthy, focused on conversion.',
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
    return new Response(`Website generation failed: ${message}`, { status: 500 });
  }
}




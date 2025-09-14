import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { validateCohereApiKey, getCohereChatModel } from '@/lib/cohere';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

type GenerateWebsiteRequest = {
  sessionId?: string;
  briefOverride?: string;
  tone?: string;
  theme?: 'light' | 'dark' | 'neutral';
  vertical?: 'car_rental' | 'ecommerce' | 'saas' | 'generic';
};

// Allow up to 120s for generation (useful in serverless environments)
export const maxDuration = 120;

function buildBriefFromSession(sessionId: string): string | null {
  try {
    const path = join(process.cwd(), '.sessions', `${sessionId}.json`);
    if (!existsSync(path)) return null;
    const raw = readFileSync(path, 'utf-8');
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

    // Try to enrich with a marketing/website artifact if present
    const artifacts: Record<string, any> | undefined = json?.conversationResult?.artifacts;
    const list = artifacts ? Object.values(artifacts) : [];
    const preferred: any | undefined = list.find(
      (a: any) => /marketing|website|landing|copy/i.test(a?.type) || /landing|homepage|website/i.test(a?.title || '')
    ) || list[0];

    // Pull a short excerpt of the last few messages to capture tone and positioning
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

export async function POST(request: NextRequest) {
  try {
    if (!validateCohereApiKey()) {
      return NextResponse.json({ success: false, error: 'COHERE_API_KEY is not configured' }, { status: 500 });
    }

    let body: GenerateWebsiteRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const sessionBrief = body.sessionId ? buildBriefFromSession(body.sessionId) : null;
    const brief = body.briefOverride?.trim() || sessionBrief;
    if (!brief) {
      return NextResponse.json({ success: false, error: 'No brief available. Provide sessionId or briefOverride.' }, { status: 400 });
    }

    const model = getCohereChatModel();

    const system = [
      'You are an expert conversion-focused web designer and copywriter.',
      body.vertical === 'car_rental'
        ? 'Generate a single-file, production-ready HTML website for a car rental business owner.'
        : 'Generate a single-file, production-ready HTML landing page that sells products based on the brief.',
      'Requirements:',
      '- Return ONLY raw HTML (no code fences, no markdown).',
      '- Include <html>, <head> (meta charset, viewport, OG tags), and <body>.',
      '- Style with minimal inline CSS in a single <style> block (no external assets).',
      body.vertical === 'car_rental'
        ? '- Include: hero with quick quote CTA, fleet showcase with sample cars and daily rates, availability/search form (non-functional), benefits (insurance/roadside), testimonials, pricing plans, FAQ, contact/footer.'
        : '- Hero with headline, subcopy, primary CTA; features; product grid (sample products); social proof; pricing teaser; FAQ; footer.',
      '- Accessible contrast, semantic HTML5, mobile-first responsive layout.',
      '- Keep it fast and clean; avoid heavy animations.',
    ].join('\n');

    const user = [
      `Brief:\n${brief}`,
      body.tone ? `Desired Tone: ${body.tone}` : '',
      body.theme ? `Theme: ${body.theme}` : '',
      body.vertical === 'car_rental' ? 'Vertical: Car Rental (optimize copy for owner-operated rental service, emphasize trust, simplicity, and clear CTAs to book).' : '',
      'Output: Return ONLY the complete HTML document.'
    ].filter(Boolean).join('\n');

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', system],
      ['human', user],
    ]);
    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    // 120s timeout guard
    const html = await Promise.race([
      chain.invoke({}),
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Generation timeout (120s)')), 120000)),
    ]) as string;

    const cleaned = html.replace(/^```[a-z]*\n?|```$/gim, '').trim();

    return NextResponse.json({ success: true, html: cleaned });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}



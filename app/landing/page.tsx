"use client";

import { useState } from 'react';

export default function QuickLandingGenerator() {
  const [topic, setTopic] = useState<string>("");
  const [tone, setTone] = useState<string>("concise, professional");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      setHtml(null);
      if (!topic.trim()) {
        throw new Error('Please enter a topic');
      }

      const brief = [
        `Topic: ${topic.trim()}`,
        'Create a modern, colorful single-page business website (100–120 lines).',
        'Design: soft gradient background, coral & gold accents, rounded cards, subtle shadows.',
        'Layout: sticky header; hero with headline and two CTAs; grid of 3–4 featured items with prices if relevant; contact section; simple footer.',
        'Code: single HTML file; minimal mobile-first CSS inside <style>; minimal JS (dynamic year / smooth scrolling). generate very it fast'
      ].join('\n');

      const res = await fetch('/api/generate-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefOverride: brief, tone, vertical: 'generic' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Request failed: ${res.status}`);
      }
      setHtml(data.html as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">Instant Topic → Website</h1>
        <p className="text-muted-foreground mb-8">Enter a topic and generate a pretty single-file HTML+CSS landing page using Cohere.</p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Topic</label>
              <input
                className="w-full rounded-md border border-border bg-card p-2 text-sm"
                placeholder="e.g. Brew & Bite — Cozy Café"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tone</label>
              <input
                className="w-full rounded-md border border-border bg-card p-2 text-sm"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60"
              >
                {loading ? 'Generating…' : 'Generate Landing Page'}
              </button>
              {error && <span className="text-destructive text-sm">{error}</span>}
            </div>
          </div>

          <div className="border border-border rounded-md overflow-hidden bg-white">
            {html ? (
              <iframe
                title="Generated Landing"
                srcDoc={html}
                className="w-full h-[600px]"
                sandbox="allow-same-origin allow-popups allow-forms allow-scripts"
              />
            ) : (
              <div className="h-[600px] flex items-center justify-center text-sm text-muted-foreground">
                {loading ? 'Generating…' : 'Generated page will appear here'}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}



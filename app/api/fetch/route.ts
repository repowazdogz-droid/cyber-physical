import { NextRequest, NextResponse } from 'next/server';

const MAX_URL_LENGTH = 2048;
const MAX_OUTPUT_LENGTH = 10000;
const FETCH_TIMEOUT = 10000; // 10 seconds

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function removeBoilerplate(text: string): string {
  const lines = text.split('\n');
  const boilerplateKeywords = [
    'advert', 'sponsored', 'subscribe', 'newsletter', 'cookie', 'privacy',
    'sign up', 'sign-up', 'register', 'recommended', 'follow us', 'share on',
    'related articles', 'you may also like', 'trending now', 'breaking news'
  ];
  
  return lines
    .filter(line => {
      const lower = line.toLowerCase();
      // Remove lines with boilerplate keywords
      if (boilerplateKeywords.some(keyword => lower.includes(keyword))) {
        return false;
      }
      // Remove very short lines that are mostly non-letters
      if (line.length < 30) {
        const letterCount = (line.match(/[a-zA-Z]/g) || []).length;
        if (letterCount / line.length < 0.5) {
          return false;
        }
      }
      return true;
    })
    .join('\n');
}

function extractTextFromHtml(html: string): string {
  // Remove scripts, styles, noscript, svg
  html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  html = html.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');
  html = html.replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '');
  
  // Try to find best content in order: article > main > body
  let content = '';
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    content = articleMatch[1];
  } else {
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch) {
      content = mainMatch[1];
    } else {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        content = bodyMatch[1];
      } else {
        content = html;
      }
    }
  }
  
  // Remove all HTML tags
  content = content.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities (basic set)
  content = content
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
  
  // Collapse whitespace
  content = content.replace(/\s+/g, ' ').trim();
  
  // Remove boilerplate
  content = removeBoilerplate(content);
  
  return content;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'fetch',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'invalid_url' },
        { status: 400 }
      );
    }

    const trimmedUrl = url.trim();

    if (trimmedUrl.length > MAX_URL_LENGTH) {
      return NextResponse.json(
        { ok: false, error: 'invalid_url' },
        { status: 400 }
      );
    }

    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      return NextResponse.json(
        { ok: false, error: 'invalid_url' },
        { status: 400 }
      );
    }

    if (!isValidUrl(trimmedUrl)) {
      return NextResponse.json(
        { ok: false, error: 'invalid_url' },
        { status: 400 }
      );
    }

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
      const response = await fetch(trimmedUrl, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Omega/1.0)',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          { ok: false, error: 'fetch_failed' },
          { status: 500 }
        );
      }

      const html = await response.text();
      
      if (!html || html.length === 0) {
        return NextResponse.json(
          { ok: false, error: 'parse_failed' },
          { status: 500 }
        );
      }

      let text = extractTextFromHtml(html);
      
      // If extraction resulted in empty or very short text, try a simpler extraction
      if (!text || text.trim().length < 50) {
        // Fallback: simpler extraction without boilerplate removal
        let simpleText = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (simpleText.length > 50) {
          text = simpleText;
        }
      }
      
      if (!text || text.trim().length === 0) {
        return NextResponse.json(
          { ok: false, error: 'parse_failed' },
          { status: 500 }
        );
      }
      
      const truncated = text.length > MAX_OUTPUT_LENGTH;
      if (truncated) {
        text = text.substring(0, MAX_OUTPUT_LENGTH) + '...[truncated]';
      }

      return NextResponse.json({
        ok: true,
        text: text.trim(),
        truncated,
        charCount: text.trim().length,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { ok: false, error: 'timeout' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { ok: false, error: 'fetch_failed' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: 'parse_failed' },
      { status: 500 }
    );
  }
}

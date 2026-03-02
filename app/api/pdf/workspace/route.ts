export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';

const MAX_PDF_BYTES = 500 * 1024; // 500KB

function generatePDFHTML(workspace: any): string {
  const sourceText = workspace.source?.content || '';
  const summary = workspace.summary || '';
  const assumptions = (workspace.assumptions || []).map((item: any) => item.text).join('\n');
  const evidence = (workspace.evidence || []).map((item: any) => item.text).join('\n');
  const constraints = (workspace.constraints || []).map((item: any) => item.text).join('\n');
  const tradeoffs = (workspace.tradeoffs || []).map((item: any) => item.text).join('\n');
  const whatWouldChange = (workspace.whatWouldChangeAnalysis || []).map((item: any) => item.text).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Omega RC Analysis</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: ui-sans-serif, system-ui, sans-serif; font-size: 11pt; line-height: 1.5; color: #111; }
    h1 { font-size: 18pt; margin: 0 0 12pt 0; }
    h2 { font-size: 13pt; margin: 12pt 0 6pt 0; font-weight: 600; }
    p { margin: 0 0 6pt 0; }
    .section { margin-bottom: 12pt; }
    .source { background: #fafafa; padding: 8pt; border-radius: 4pt; border: 1px solid #e5e5e5; }
    ul { margin: 0; padding-left: 20pt; }
    li { margin-bottom: 4pt; }
  </style>
</head>
<body>
  <h1>Omega RC Analysis</h1>
  
  <div class="section">
    <h2>Source</h2>
    <div class="source">${sourceText.replace(/</g, '&lt;').replace(/>/g, '&gt;') || 'No source text'}</div>
  </div>

  <div class="section">
    <h2>What it claims</h2>
    <p>${summary.replace(/</g, '&lt;').replace(/>/g, '&gt;') || 'No claim summary'}</p>
  </div>

  <div class="section">
    <h2>What's actually shown</h2>
    ${evidence ? `<ul>${evidence.split('\n').map((e: string) => `<li>${e.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`).join('')}</ul>` : '<p style="color: #a3a3a3; font-style: italic;">Nothing drafted here yet.</p>'}
  </div>

  <div class="section">
    <h2>What it assumes</h2>
    ${assumptions ? `<ul>${assumptions.split('\n').map((a: string) => `<li>${a.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`).join('')}</ul>` : '<p style="color: #a3a3a3; font-style: italic;">Nothing drafted here yet.</p>'}
  </div>

  <div class="section">
    <h2>What's missing / unclear</h2>
    ${constraints ? `<ul>${constraints.split('\n').map((c: string) => `<li>${c.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`).join('')}</ul>` : '<p style="color: #a3a3a3; font-style: italic;">Nothing drafted here yet.</p>'}
  </div>

  <div class="section">
    <h2>Other framings</h2>
    ${tradeoffs ? `<ul>${tradeoffs.split('\n').map((t: string) => `<li>${t.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`).join('')}</ul>` : '<p style="color: #a3a3a3; font-style: italic;">Nothing drafted here yet.</p>'}
  </div>

  <div class="section">
    <h2>What would materially change this analysis</h2>
    <p style="font-style: italic; color: #737373; font-size: 10pt;">This section lists types of information that would affect interpretation. It does not recommend actions or next steps.</p>
    ${whatWouldChange ? `<ul>${whatWouldChange.split('\n').map((w: string) => `<li>${w.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`).join('')}</ul>` : '<p style="color: #a3a3a3; font-style: italic;">Nothing drafted here yet.</p>'}
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const workspace = await request.json();
    const workspaceJson = JSON.stringify(workspace);
    
    // Enforce size limit
    const sizeBytes = Buffer.byteLength(workspaceJson, 'utf-8');
    if (sizeBytes > MAX_PDF_BYTES) {
      return NextResponse.json(
        { ok: false, error: `Workspace too large for PDF (${Math.round(sizeBytes / 1024)}KB). Maximum size: ${MAX_PDF_BYTES / 1024}KB` },
        { status: 400 }
      );
    }

    const html = generatePDFHTML(workspace);
    
    // Launch browser and generate PDF
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      printBackground: true,
    });
    
    await browser.close();

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="omega-rc.pdf"',
      },
    });
  } catch (error: any) {
    console.error('Failed to generate PDF:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}


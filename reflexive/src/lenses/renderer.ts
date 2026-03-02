import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const templatesDir = join(__dirname, 'templates');

interface RenderResult {
  rendered_prompt: string;
  content_hash: string;
  lens_id: string;
  lens_version: number;
}

interface LensConfig {
  id: string;
  name: string;
  version: number;
  system_prompt_template: string;
}

function loadSharedBlock(name: string): string {
  const path = join(templatesDir, 'shared', `${name}.txt`);
  return readFileSync(path, 'utf-8').trim();
}

function escapeDelimiters(text: string, isStimulus: boolean): string {
  if (isStimulus) {
    // Escape closing tag first, then opening tag
    text = text.replace(/<\/STIMULUS>/g, '<\\/STIMULUS>');
    text = text.replace(/<STIMULUS>/g, '<\\/STIMULUS>');
  } else {
    // Escape closing tag first, then opening tag
    text = text.replace(/<\/CONTEXT>/g, '<\\/CONTEXT>');
    text = text.replace(/<CONTEXT>/g, '<\\/CONTEXT>');
  }
  return text;
}

function stripMarkdownFences(text: string): string {
  return text.replace(/```[\s\S]*?```/g, '');
}

export function renderPrompt(
  lens: LensConfig,
  stimulus_text: string,
  stimulus_type: string,
  context_items: { label: string; content_text: string }[],
  analysis_date: string
): RenderResult {
  // Load shared blocks
  const outputContract = loadSharedBlock('output_contract');
  const antiInjection = loadSharedBlock('anti_injection');
  const failurePosture = loadSharedBlock('failure_posture');

  // Start with lens template
  let template = lens.system_prompt_template;

  // Expand shared blocks
  template = template.replace('{{OUTPUT_CONTRACT_BLOCK}}', outputContract);
  template = template.replace('{{ANTI_INJECTION_GUARD_BLOCK}}', antiInjection);
  template = template.replace('{{FAILURE_POSTURE_BLOCK}}', failurePosture);

  // Escape user inputs
  let escapedStimulus = escapeDelimiters(stimulus_text, true);
  escapedStimulus = stripMarkdownFences(escapedStimulus);

  const escapedContextParts: string[] = [];
  for (const item of context_items) {
    let escapedContent = escapeDelimiters(item.content_text, false);
    escapedContent = stripMarkdownFences(escapedContent);
    escapedContextParts.push(`[${item.label}]: ${escapedContent}`);
  }
  const escapedContext = escapedContextParts.join('\n---\n');

  // Format analysis_date (ensure YYYY-MM-DD)
  let formattedDate = analysis_date;
  if (formattedDate.includes('T')) {
    formattedDate = formattedDate.substring(0, 10);
  }

  // Substitute variables
  template = template.replace('{{stimulus_text}}', escapedStimulus);
  template = template.replace('{{stimulus_type}}', stimulus_type);
  template = template.replace('{{analysis_date}}', formattedDate);
  template = template.replace('{{context_items}}', escapedContext);

  // Compute SHA-256 hash
  const hash = createHash('sha256');
  hash.update(template);
  const content_hash = hash.digest('hex');

  return {
    rendered_prompt: template,
    content_hash,
    lens_id: lens.id,
    lens_version: lens.version,
  };
}

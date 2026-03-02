import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';
import { join } from 'path';

const width = 1200;
const height = 630;

const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Background
ctx.fillStyle = '#fbfbfa';
ctx.fillRect(0, 0, width, height);

// Text color
ctx.fillStyle = '#111214';
ctx.textAlign = 'left';
ctx.textBaseline = 'top';

// OMEGA (large, bold)
ctx.font = 'bold 120px ui-sans-serif, system-ui, sans-serif';
ctx.fillText('OMEGA', 80, 150);

// Human-led cognitive infrastructure (smaller)
ctx.font = '36px ui-sans-serif, system-ui, sans-serif';
ctx.fillText('Human-led cognitive infrastructure', 80, 300);

// Human judgment remains sovereign. (small note)
ctx.font = '24px ui-sans-serif, system-ui, sans-serif';
ctx.fillStyle = '#4b5563'; // muted color
ctx.fillText('Human judgment remains sovereign.', 80, 380);

// Save as PNG
const buffer = canvas.toBuffer('image/png');
const outputPath = join(process.cwd(), 'public', 'og.png');
writeFileSync(outputPath, buffer);

console.log(`✅ OG image created: ${outputPath}`);
console.log(`   Size: ${width}x${height}px`);
console.log(`   File size: ${(buffer.length / 1024).toFixed(1)}KB`);






































// Sample render of the Will template for smoke-testing the template engine.
// Run: node scripts/render-sample.mjs > /tmp/will.html
import fs from 'node:fs';
import path from 'node:path';

// Tiny copy of template.ts render logic (duplicated here so this script doesn't
// need a TS build step; the real code is in src/template.ts and is unit-covered
// by the TypeScript build).
function escapeHtml(v){if(v==null)return '';return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function getPath(ctx,p){if(!p)return ctx;const parts=p.split('.');let cur=ctx;for(const x of parts){if(cur==null)return undefined;cur=cur[x];}return cur;}
const INNER_EACH='((?:(?!\\{\\{#each\\s|\\{\\{\\/each\\}\\})[\\s\\S])*?)';
const INNER_IF='((?:(?!\\{\\{#if\\s|\\{\\{\\/if\\}\\})[\\s\\S])*?)';
function expandEach(t,ctx){const re=new RegExp(`\\{\\{#each\\s+([\\w.]+)\\s*\\}\\}${INNER_EACH}\\{\\{\\/each\\}\\}`,'g');return t.replace(re,(_m,p,body)=>{const list=getPath(ctx,p);if(!Array.isArray(list)||!list.length)return '';return list.map((item,i)=>render(body,{...ctx,this:item,'@index':i,'@number':i+1})).join('');});}
function expandIf(t,ctx){const re=new RegExp(`\\{\\{#if\\s+([\\w.]+)\\s*\\}\\}${INNER_IF}(?:\\{\\{else\\}\\}${INNER_IF})?\\{\\{\\/if\\}\\}`,'g');return t.replace(re,(_m,p,truthy,falsy)=>{const v=getPath(ctx,p);const cond=Array.isArray(v)?v.length>0:!!v;return cond?truthy:(falsy||'');});}
function expandVars(t,ctx){t=t.replace(/\{\{\{\s*([\w.@]+)\s*\}\}\}/g,(_m,p)=>{const v=getPath(ctx,p);return v==null?'':String(v);});return t.replace(/\{\{\s*([\w.@]+)\s*\}\}/g,(_m,p)=>escapeHtml(getPath(ctx,p)));}
function render(t,ctx){let cur=t,safety=50;while(safety-->0){const a=expandEach(cur,ctx);const b=expandIf(a,ctx);if(b===cur)break;cur=b;}return expandVars(cur,ctx);}

const template = fs.readFileSync(path.join(process.cwd(), 'templates/will.html'), 'utf8');

const sample = {
  ref: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  renderDate: '20 April 2026',
  product: 'mirror',
  testator: {
    fullName: 'James Hargreaves',
    address: '5 Osidge Lane, London, N14 5JP',
    dob: '1962-05-12'
  },
  partner: {
    fullName: 'Elizabeth Hargreaves',
    address: '5 Osidge Lane, London, N14 5JP',
    dob: '1965-11-30'
  },
  executors: [
    { name: 'Sarah Hargreaves', relationship: 'Daughter', address: '12 Oak Rd, St Albans, AL1 3TY' },
    { name: 'Michael Thompson', relationship: 'Brother-in-law', address: '8 Elm Close, Watford, WD1 2ZZ' }
  ],
  guardians: [
    { name: 'Sarah Hargreaves', relationship: 'Daughter', address: '12 Oak Rd, St Albans, AL1 3TY' }
  ],
  specificGifts: [
    { gift: 'My father\'s gold pocket watch', name: 'Thomas Hargreaves', relationship: 'Grandson' },
    { gift: '£5,000', name: 'Cancer Research UK', relationship: 'Charity' }
  ],
  residuary: [
    { name: 'Elizabeth Hargreaves', relationship: 'Spouse', share: 'Residuary estate (or to children equally if partner predeceases)' }
  ],
  funeralWishes: 'Cremation, no flowers, donations to the British Heart Foundation in lieu. Bagpipes welcome.',
  notes: 'Please ensure Thomas has access to my workshop keys (kept by Sarah).'
};

const html = render(template, sample);
process.stdout.write(html);

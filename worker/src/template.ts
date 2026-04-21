/**
 * Tiny templating helper. We use {{placeholder}} and {{#if field}}...{{/if}} and
 * {{#each list}}...{{/each}} — just enough to render the Will template without pulling
 * a full dependency.
 *
 * NOTE: all values are HTML-escaped before insertion. This is not Mustache — see
 * README.md for supported tags.
 */

function escapeHtml(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getPath(ctx: any, path: string): any {
  if (!path) return ctx;
  const parts = path.split('.');
  let cur: any = ctx;
  for (const p of parts) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[p];
  }
  return cur;
}

/**
 * Body matchers: exclude only same-type nested tags so each block type can be
 * expanded independently. We then alternate passes in render() until stable
 * to handle arbitrary interleaving of `#if` and `#each`.
 */
const INNER_EACH = '((?:(?!\\{\\{#each\\s|\\{\\{\\/each\\}\\})[\\s\\S])*?)';
const INNER_IF = '((?:(?!\\{\\{#if\\s|\\{\\{\\/if\\}\\})[\\s\\S])*?)';

/**
 * Expand {{#each list}}...{{/each}} blocks.
 * Inside the block, `this` refers to the current item and `@index` to its 0-based index.
 * Matches only innermost each blocks per pass; loop externally until stable.
 */
function expandEach(template: string, ctx: any): string {
  const re = new RegExp(`\\{\\{#each\\s+([\\w.]+)\\s*\\}\\}${INNER_EACH}\\{\\{\\/each\\}\\}`, 'g');
  return template.replace(re, (_m, path: string, body: string) => {
    const list = getPath(ctx, path);
    if (!Array.isArray(list) || list.length === 0) return '';
    return list
      .map((item, i) => {
        const itemCtx = { ...ctx, this: item, '@index': i, '@number': i + 1 };
        // Recurse fully so the item's body is processed with the item context bound.
        return render(body, itemCtx);
      })
      .join('');
  });
}

/**
 * Expand {{#if path}}...{{else}}...{{/if}} blocks. Truthiness: non-empty strings,
 * non-empty arrays, non-zero numbers, objects, true.
 * Matches only innermost if blocks per pass; loop externally until stable.
 */
function expandIf(template: string, ctx: any): string {
  const re = new RegExp(`\\{\\{#if\\s+([\\w.]+)\\s*\\}\\}${INNER_IF}(?:\\{\\{else\\}\\}${INNER_IF})?\\{\\{\\/if\\}\\}`, 'g');
  return template.replace(re, (_m, path: string, truthy: string, falsy: string | undefined) => {
    const v = getPath(ctx, path);
    const isTruthy = Array.isArray(v) ? v.length > 0 : !!v;
    return isTruthy ? truthy : falsy || '';
  });
}

/**
 * Replace {{path}} placeholders. HTML-escaped by default.
 * Use {{{path}}} for raw (no escape) — currently not needed but supported.
 */
function expandVars(template: string, ctx: any): string {
  // Raw
  template = template.replace(/\{\{\{\s*([\w.@]+)\s*\}\}\}/g, (_m, path: string) => {
    const v = getPath(ctx, path);
    return v === null || v === undefined ? '' : String(v);
  });
  // Escaped
  template = template.replace(/\{\{\s*([\w.@]+)\s*\}\}/g, (_m, path: string) => {
    const v = getPath(ctx, path);
    return escapeHtml(v);
  });
  return template;
}

export function render(template: string, ctx: any): string {
  // Alternate #each and #if passes until both stabilize — this handles any
  // interleaved nesting (#if inside #each, #each inside #if, deeper, etc.).
  let cur = template;
  let safety = 50; // prevent pathological loops
  while (safety-- > 0) {
    const afterEach = expandEach(cur, ctx);
    const afterIf = expandIf(afterEach, ctx);
    if (afterIf === cur) break;
    cur = afterIf;
  }
  return expandVars(cur, ctx);
}

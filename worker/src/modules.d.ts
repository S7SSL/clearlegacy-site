// Wrangler text-module imports: `import tpl from './foo.html'` returns the file as a string.
declare module '*.html' {
  const content: string;
  export default content;
}

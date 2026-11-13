// package.json, server.json et la version servie par le MCP doivent coïncider.
import { readFileSync } from 'node:fs';
const lire = (f) => JSON.parse(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'));
const pkg = lire('package.json').version;
const srv = lire('server.json');
const erreurs = [];
if (pkg !== srv.version) erreurs.push(`package.json ${pkg} != server.json ${srv.version}`);
for (const [i, p] of (srv.packages ?? []).entries())
  if (p.version && p.version !== pkg) erreurs.push(`server.json packages[${i}].version ${p.version} != ${pkg}`);
const src = readFileSync(new URL('../api/mcp.ts', import.meta.url), 'utf8');
if (/SERVER_VERSION\s*(:\s*\w+\s*)?=\s*['"`]/.test(src)) erreurs.push('SERVER_VERSION écrite en dur dans api/mcp.ts');
if (!/SERVER_VERSION\s*(:\s*string\s*)?=\s*PKG_JSON\.version/.test(src)) erreurs.push('SERVER_VERSION ne lit pas package.json');
if (erreurs.length) { console.error('FAIL version:\n- ' + erreurs.join('\n- ')); process.exit(1); }
console.log(`OK version ${pkg} (package.json = server.json = api/mcp.ts)`);

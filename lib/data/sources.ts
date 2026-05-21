import type { RegulatoryVersion, RegulatoryRef, SourceLink } from '../types.js';
// Import attribute is REQUIRED: the Vercel runtime executes this as native ESM
// (Node >= 20.10), which rejects a JSON import without `with { type: 'json' }`
// (=> FUNCTION_INVOCATION_FAILED at cold start). The static import also ensures
// node-file-trace ships the JSON with the function. resolveJsonModule covers the
// build-time type-check.
import REG_JSON from '../../data/regulatory-version.json' with { type: 'json' };

// data/regulatory-version.json is the single source of truth for the regulatory
// dataset version + the exact official link of every text we cite (FIX 1 + 3).
export const REG_VERSION = REG_JSON as unknown as RegulatoryVersion;

const ALL_REFS: RegulatoryRef[] = [
  ...REG_VERSION.regulations,
  ...REG_VERSION.data_sources,
];

// id -> { titre, url } registry (FIX 1).
export const SRC: Record<string, SourceLink> = Object.fromEntries(
  ALL_REFS.map((r) => [r.id, { titre: r.reference, url: r.url }]),
);

// id -> full ref (with type + verified_at).
export const REF_BY_ID: Record<string, RegulatoryRef> = Object.fromEntries(
  ALL_REFS.map((r) => [r.id, r]),
);

// Build precise source links from one or more known source ids.
export function srcLinks(...ids: string[]): SourceLink[] {
  const seen = new Set<string>();
  const out: SourceLink[] = [];
  for (const id of ids) {
    const link = SRC[id];
    if (link && !seen.has(id)) {
      seen.add(id);
      out.push(link);
    }
  }
  return out;
}

// Resolve the free-text regulatory reference attached to a data entry
// (source_reglementaire / source / base_legale) into precise source links,
// using the resolver_patterns declared in regulatory-version.json (FIX 1).
// Substring match (case-insensitive); a composite reference resolves to several links.
export function resolveSources(text: string | undefined | null): SourceLink[] {
  if (!text) return srcLinks('gbph');
  const haystack = text.toLowerCase();
  const ids: string[] = [];
  for (const { match, source_id } of REG_VERSION.resolver_patterns) {
    if (haystack.includes(match.toLowerCase())) ids.push(source_id);
  }
  // Safety net: never return an empty sources array.
  if (ids.length === 0) ids.push('gbph');
  return srcLinks(...ids);
}

// Resolve an array of reference strings (e.g. sanctions base_legale) into a
// deduplicated, ordered list of source links.
export function resolveSourcesFromList(texts: string[]): SourceLink[] {
  const seen = new Set<string>();
  const out: SourceLink[] = [];
  for (const t of texts) {
    for (const link of resolveSources(t)) {
      if (!seen.has(link.url)) {
        seen.add(link.url);
        out.push(link);
      }
    }
  }
  return out;
}

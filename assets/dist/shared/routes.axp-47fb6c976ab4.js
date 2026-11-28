export const SLIDE_IDS = Object.freeze([
  's0',
  'sdhis',
  'sav',
  'sxc',
  'spg',
  'sref',
  'smv',
  'sbt',
  'sw6',
  'sctt',
  'stut',
  'sbcp',
  's3',
  'scv',
  's6',
  's7',
  's8',
]);

// Retired slide bookmarks (#s4 harness14, #s5 slash-commands) resolve to #sav via replaceState.
export const LEGACY_SLIDE_ALIASES = Object.freeze({
  s4: 'sav',
  s5: 'sav',
});

export const BOOTSTRAP_PARAM = '_axp';

export function parseSlideHash(rawHash = '', validIds = SLIDE_IDS) {
  const text = String(rawHash || '');
  const trimmed = text.startsWith('#') ? text.slice(1) : text;
  if (!trimmed) {
    return { id: validIds[0] || 's0', aliased: false, unknown: false, hadHash: text === '#' };
  }
  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    return { id: validIds[0] || 's0', aliased: false, unknown: true, hadHash: true };
  }
  if (Object.hasOwn(LEGACY_SLIDE_ALIASES, decoded)) {
    const target = LEGACY_SLIDE_ALIASES[decoded];
    if (validIds.includes(target)) {
      return { id: target, aliased: true, unknown: false, hadHash: true };
    }
  }
  if (validIds.includes(decoded)) {
    return { id: decoded, aliased: false, unknown: false, hadHash: true };
  }
  return { id: validIds[0] || 's0', aliased: false, unknown: true, hadHash: true };
}

export function cleanBootstrapUrl(currentHref, paramName = BOOTSTRAP_PARAM) {
  const url = new URL(currentHref);
  url.searchParams.delete(paramName);
  return url.href;
}

export function buildReloadUrl(targetHref, buildId, nonce = crypto.randomUUID(), paramName = BOOTSTRAP_PARAM) {
  const url = new URL(targetHref);
  url.searchParams.set(paramName, `${buildId}-${nonce}`);
  return url.href;
}

import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEGACY_SLIDE_ALIASES, SLIDE_IDS } from '../src/js/shared/routes.js';

export const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const DECK_STYLES = [
  'tokens.css', 'base.css', 'components.css', 'vault-diagram.css', 'reference-atlas-slide.css',
  'project-diagrams.css', 'verification-atlas-motion.css', 'maker-motion.css', 'tray-motion.css', 'motion.css',
];
const CV_STYLES = ['cv-tokens.css', 'cv-base.css', 'cv-components.css', 'cv-motion.css'];

const toLf = text => String(text).replace(/\r\n/g, '\n');
const sha256 = value => createHash('sha256').update(value).digest('hex');
const toPosix = p => p.replaceAll('\\', '/');

async function walkJsFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walkJsFiles(full)));
    } else if (entry.name.endsWith('.js')) {
      results.push(full);
    }
  }
  return results.sort();
}

export async function computeBuildArtifacts({ rootDir = APP_ROOT, tag = '' } = {}) {
  if (tag && !/^[a-z\d-]{1,20}$/i.test(tag)) {
    throw new Error('Invalid build tag');
  }
  const srcJsDir = path.join(rootDir, 'src', 'js');
  const srcCssDir = path.join(rootDir, 'src', 'css');
  const templatesDir = path.join(rootDir, 'src', 'templates');

  const jsPaths = await walkJsFiles(srcJsDir);
  const jsModules = await Promise.all(
    jsPaths.map(async fullPath => ({
      relName: toPosix(path.relative(srcJsDir, fullPath)),
      source: toLf(await readFile(fullPath, 'utf8')),
    })),
  );

  // The first paint and the module router use the same slide IDs and bookmarks.
  const entryRoutes = Object.fromEntries(SLIDE_IDS.map(id => [id, id]));
  const entrySelectors = SLIDE_IDS.map(id => `html[data-entry-slide="${id}"]:not(.js) #${id}`).join(',\n');
  const deckCss = (
    await Promise.all(DECK_STYLES.map(async name => toLf(await readFile(path.join(srcCssDir, name), 'utf8'))))
  ).join('\n').replace('__ENTRY_SLIDE_SELECTORS__', entrySelectors);

  const cvCss = (
    await Promise.all(CV_STYLES.map(async name => toLf(await readFile(path.join(srcCssDir, name), 'utf8'))))
  ).join('\n');

  const indexTemplate = toLf(await readFile(path.join(templatesDir, 'index.template.html'), 'utf8'))
    .replace('__ENTRY_ROUTES__', JSON.stringify({ ...entryRoutes, ...LEGACY_SLIDE_ALIASES }));
  const cvTemplate = toLf(await readFile(path.join(templatesDir, 'cv.template.html'), 'utf8'));

  const fingerprintInput = [
    indexTemplate,
    cvTemplate,
    deckCss,
    cvCss,
    ...jsModules.map(m => `${m.relName}\n${m.source}`),
  ].join('\n===AXP===\n');

  const buildId = `axp-${sha256(fingerprintInput).slice(0, 12)}${tag ? `-${tag}` : ''}`;

  const moduleMap = new Map(
    jsModules.map(m => [m.relName, m.relName.replace(/\.js$/, `.${buildId}.js`)]),
  );

  const distFiles = new Map();
  const cssRelPath = `assets/dist/portfolio.${buildId}.css`;
  distFiles.set(cssRelPath, deckCss);

  for (const mod of jsModules) {
    const hashedRel = moduleMap.get(mod.relName);
    const rewritten = mod.source.replace(
      /\b(from\s*|import\s*)(['"])(\.[^'"]+)\2/g,
      (whole, prefix, quote, specifier) => {
        const targetKey = path.posix.normalize(path.posix.join(path.posix.dirname(mod.relName), specifier));
        const mappedTarget = moduleMap.get(targetKey);
        if (!mappedTarget) {
          throw new Error(`Unresolved relative import "${specifier}" in src/js/${mod.relName}`);
        }
        let rel = path.posix.relative(path.posix.dirname(hashedRel), mappedTarget);
        if (!rel.startsWith('.')) rel = `./${rel}`;
        return `${prefix}${quote}${rel}${quote}`;
      },
    );
    distFiles.set(`assets/dist/${hashedRel}`, rewritten);
  }

  const indexHtml = indexTemplate
    .replaceAll('__BUILD_ID__', buildId)
    .replaceAll('__PORTFOLIO_CSS__', `./${cssRelPath}`)
    .replaceAll('__PORTFOLIO_JS__', `./assets/dist/${moduleMap.get('main.js')}`);

  const cvHtml = cvTemplate
    .replaceAll('__BUILD_ID__', buildId)
    .replaceAll('__CV_CSS__', cvCss.trimEnd())
    .replaceAll('__CV_JS__', `./assets/dist/${moduleMap.get('cv-main.js')}`);

  if (/__[A-Z_]+__/.test(indexHtml) || /__[A-Z_]+__/.test(cvHtml)) {
    throw new Error('Unresolved template placeholder in HTML output');
  }

  const versionJson = `${JSON.stringify({ schema: 1, buildId }, null, 2)}\n`;

  const manifestEntries = {
    'index.html': sha256(Buffer.from(indexHtml, 'utf8')),
    'cv.html': sha256(Buffer.from(cvHtml, 'utf8')),
    'version.json': sha256(Buffer.from(versionJson, 'utf8')),
  };
  for (const [relPath, content] of [...distFiles.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    manifestEntries[relPath] = sha256(Buffer.from(content, 'utf8'));
  }

  const manifestJson = `${JSON.stringify(
    {
      schema: 1,
      buildId,
      files: manifestEntries,
    },
    null,
    2,
  )}\n`;

  return {
    buildId,
    indexHtml,
    cvHtml,
    versionJson,
    manifestJson,
    distFiles,
  };
}

export async function build({ outDir = APP_ROOT, tag = '', cleanDist = true } = {}) {
  const outRoot = path.resolve(outDir);
  const artifacts = await computeBuildArtifacts({ rootDir: APP_ROOT, tag });
  const distRoot = path.join(outRoot, 'assets', 'dist');

  if (cleanDist) {
    await rm(distRoot, { recursive: true, force: true });
  }

  for (const [relPath, content] of artifacts.distFiles.entries()) {
    const dest = path.join(outRoot, relPath);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, content, 'utf8');
  }

  await writeFile(path.join(outRoot, 'index.html'), artifacts.indexHtml, 'utf8');
  await writeFile(path.join(outRoot, 'cv.html'), artifacts.cvHtml, 'utf8');
  await writeFile(path.join(outRoot, 'version.json'), artifacts.versionJson, 'utf8');
  await writeFile(path.join(outRoot, 'pages-manifest.json'), artifacts.manifestJson, 'utf8');

  const summary = {
    buildId: artifacts.buildId,
    outRoot,
    hashedAssets: artifacts.distFiles.size,
  };
  return summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const getArg = flag => {
    const idx = process.argv.indexOf(flag);
    return idx >= 0 ? process.argv[idx + 1] : undefined;
  };
  const result = await build({
    outDir: getArg('--out') ? path.resolve(APP_ROOT, getArg('--out')) : APP_ROOT,
    tag: getArg('--tag') || '',
    cleanDist: !process.argv.includes('--keep-dist'),
  });
  console.log(JSON.stringify(result));
}

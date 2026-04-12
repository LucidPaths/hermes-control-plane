import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import type { BrainEngine } from '../core/engine.ts';
import { serializeMarkdown } from '../core/markdown.ts';

export async function runExport(engine: BrainEngine, args: string[]) {
  const dirIdx = args.indexOf('--dir');
  const outDir = dirIdx !== -1 ? args[dirIdx + 1] : './export';

  const pages = await engine.listPages({ limit: 100000 });
  console.log(`Exporting ${pages.length} pages to ${outDir}/`);

  let exported = 0;

  for (const page of pages) {
    const tags = await engine.getTags(page.slug);
    const md = serializeMarkdown(
      page.frontmatter,
      page.compiled_truth,
      page.timeline,
      { type: page.type, title: page.title, tags },
    );

    const filePath = join(outDir, page.slug + '.md');
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, md);

    // Export raw data as sidecar JSON
    const rawData = await engine.getRawData(page.slug);
    if (rawData.length > 0) {
      const slugParts = page.slug.split('/');
      const rawDir = join(outDir, ...slugParts.slice(0, -1), '.raw');
      mkdirSync(rawDir, { recursive: true });
      const rawPath = join(rawDir, slugParts[slugParts.length - 1] + '.json');

      const rawObj: Record<string, unknown> = {};
      for (const rd of rawData) {
        rawObj[rd.source] = rd.data;
      }
      writeFileSync(rawPath, JSON.stringify(rawObj, null, 2) + '\n');
    }

    exported++;
    if (exported % 100 === 0) {
      process.stdout.write(`\r  ${exported}/${pages.length} exported`);
    }
  }

  console.log(`\nExported ${exported} pages to ${outDir}/`);
}

import { readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import type { StorageBackend } from '../storage.ts';

/**
 * Local filesystem storage — for testing and development.
 * Stores files in a local directory, mimicking S3/Supabase behavior.
 */
export class LocalStorage implements StorageBackend {
  constructor(private basePath: string) {
    mkdirSync(basePath, { recursive: true });
  }

  async upload(path: string, data: Buffer, _mime?: string): Promise<void> {
    const full = join(this.basePath, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, data);
  }

  async download(path: string): Promise<Buffer> {
    const full = join(this.basePath, path);
    if (!existsSync(full)) throw new Error(`File not found in storage: ${path}`);
    return readFileSync(full);
  }

  async delete(path: string): Promise<void> {
    const full = join(this.basePath, path);
    if (existsSync(full)) unlinkSync(full);
  }

  async exists(path: string): Promise<boolean> {
    return existsSync(join(this.basePath, path));
  }

  async list(prefix: string): Promise<string[]> {
    const dir = join(this.basePath, prefix);
    if (!existsSync(dir)) return [];
    const results: string[] = [];
    function walk(d: string, rel: string) {
      for (const entry of readdirSync(d, { withFileTypes: true })) {
        const entryRel = rel ? `${rel}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          walk(join(d, entry.name), entryRel);
        } else {
          results.push(`${prefix}/${entryRel}`);
        }
      }
    }
    walk(dir, '');
    return results;
  }

  async getUrl(path: string): Promise<string> {
    return `file://${join(this.basePath, path)}`;
  }
}

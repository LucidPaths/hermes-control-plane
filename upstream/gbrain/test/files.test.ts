import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { extname } from 'path';

const TMP = join(import.meta.dir, '.tmp-files-test');

// These functions are not exported from files.ts, so we reimplement and test
// the logic patterns to ensure correctness. If they ever get exported, switch
// to direct imports.

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.heic': 'image/heic',
  '.tiff': 'image/tiff', '.tif': 'image/tiff', '.dng': 'image/x-adobe-dng',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

function getMimeType(filePath: string): string | null {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || null;
}

function fileHash(content: Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

beforeAll(() => {
  mkdirSync(TMP, { recursive: true });
  mkdirSync(join(TMP, 'subdir'), { recursive: true });
  mkdirSync(join(TMP, '.hidden'), { recursive: true });
  writeFileSync(join(TMP, 'photo.jpg'), 'fake-jpg');
  writeFileSync(join(TMP, 'doc.pdf'), 'fake-pdf');
  writeFileSync(join(TMP, 'notes.md'), '# Markdown');
  writeFileSync(join(TMP, 'data.csv'), 'a,b,c');
  writeFileSync(join(TMP, 'subdir', 'nested.png'), 'fake-png');
  writeFileSync(join(TMP, '.hidden', 'secret.txt'), 'hidden');
});

afterAll(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('getMimeType', () => {
  test('returns correct MIME for .jpg', () => {
    expect(getMimeType('photo.jpg')).toBe('image/jpeg');
  });

  test('returns correct MIME for .jpeg', () => {
    expect(getMimeType('photo.jpeg')).toBe('image/jpeg');
  });

  test('returns correct MIME for .png', () => {
    expect(getMimeType('image.png')).toBe('image/png');
  });

  test('returns correct MIME for .pdf', () => {
    expect(getMimeType('doc.pdf')).toBe('application/pdf');
  });

  test('returns correct MIME for .mp4', () => {
    expect(getMimeType('video.mp4')).toBe('video/mp4');
  });

  test('returns correct MIME for .svg', () => {
    expect(getMimeType('icon.svg')).toBe('image/svg+xml');
  });

  test('handles uppercase extensions via toLowerCase', () => {
    expect(getMimeType('PHOTO.JPG')).toBe('image/jpeg');
    expect(getMimeType('doc.PDF')).toBe('application/pdf');
  });

  test('returns null for unknown extensions', () => {
    expect(getMimeType('data.csv')).toBeNull();
    expect(getMimeType('script.ts')).toBeNull();
    expect(getMimeType('readme.md')).toBeNull();
  });

  test('returns null for files without extension', () => {
    expect(getMimeType('Makefile')).toBeNull();
  });

  test('handles .docx and .xlsx', () => {
    expect(getMimeType('report.docx')).toContain('wordprocessingml');
    expect(getMimeType('sheet.xlsx')).toContain('spreadsheetml');
  });

  test('handles .heic (iPhone photos)', () => {
    expect(getMimeType('IMG_0001.heic')).toBe('image/heic');
  });

  test('handles .dng (raw photos)', () => {
    expect(getMimeType('RAW_001.dng')).toBe('image/x-adobe-dng');
  });
});

describe('fileHash', () => {
  test('produces consistent SHA-256 hash', () => {
    const content = Buffer.from('hello world');
    const hash1 = fileHash(content);
    const hash2 = fileHash(content);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex = 64 chars
  });

  test('different content produces different hash', () => {
    const hash1 = fileHash(Buffer.from('hello'));
    const hash2 = fileHash(Buffer.from('world'));
    expect(hash1).not.toBe(hash2);
  });

  test('empty content produces valid hash', () => {
    const hash = fileHash(Buffer.from(''));
    expect(hash).toHaveLength(64);
  });
});

describe('collectFiles pattern (non-markdown, skip hidden)', () => {
  // Reimplementing collectFiles logic to test the pattern
  const { readdirSync, statSync } = require('fs');

  function collectFiles(dir: string): string[] {
    const files: string[] = [];
    function walk(d: string) {
      for (const entry of readdirSync(d)) {
        if (entry.startsWith('.')) continue;
        const full = join(d, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) {
          walk(full);
        } else if (!entry.endsWith('.md')) {
          files.push(full);
        }
      }
    }
    walk(dir);
    return files.sort();
  }

  test('finds non-markdown files', () => {
    const files = collectFiles(TMP);
    const basenames = files.map(f => f.split('/').pop());
    expect(basenames).toContain('photo.jpg');
    expect(basenames).toContain('doc.pdf');
    expect(basenames).toContain('data.csv');
  });

  test('skips .md files', () => {
    const files = collectFiles(TMP);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    expect(mdFiles).toHaveLength(0);
  });

  test('skips hidden directories', () => {
    const files = collectFiles(TMP);
    const hiddenFiles = files.filter(f => f.includes('.hidden'));
    expect(hiddenFiles).toHaveLength(0);
  });

  test('recurses into subdirectories', () => {
    const files = collectFiles(TMP);
    const nested = files.filter(f => f.includes('subdir'));
    expect(nested.length).toBeGreaterThan(0);
  });

  test('returns sorted paths', () => {
    const files = collectFiles(TMP);
    const sorted = [...files].sort();
    expect(files).toEqual(sorted);
  });
});

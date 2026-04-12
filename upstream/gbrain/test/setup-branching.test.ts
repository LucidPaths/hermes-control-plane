import { describe, test, expect } from 'bun:test';
import { extractProjectRef } from '../src/core/supabase-admin.ts';
import { cpus, totalmem } from 'os';

// IPv6 detection (mirrors logic in init.ts)
function isSupabaseDirectUrl(url: string): boolean {
  return /db\.[a-z]+\.supabase\.co/.test(url) || url.includes('.supabase.co:5432');
}

describe('IPv6 detection', () => {
  test('detects db.xxx.supabase.co as direct (IPv6)', () => {
    expect(isSupabaseDirectUrl('postgresql://postgres:pw@db.rqfedtbs.supabase.co:5432/postgres')).toBe(true);
  });

  test('detects .supabase.co:5432 as direct (IPv6)', () => {
    expect(isSupabaseDirectUrl('postgresql://postgres:pw@something.supabase.co:5432/postgres')).toBe(true);
  });

  test('does NOT flag pooler URL as direct', () => {
    expect(isSupabaseDirectUrl('postgresql://postgres.ref:pw@aws-0-us-east-1.pooler.supabase.com:6543/postgres')).toBe(false);
  });

  test('does NOT flag non-supabase URL', () => {
    expect(isSupabaseDirectUrl('postgresql://user:pw@localhost:5432/mydb')).toBe(false);
  });
});

describe('defaultWorkers auto-tuning', () => {
  // Mirrors logic from import.ts
  function defaultWorkers(cpuCount: number, memGB: number): number {
    const byPool = 8;
    const byCpu = Math.max(2, cpuCount);
    const byMem = Math.floor(memGB * 2);
    return Math.min(byPool, byCpu, byMem);
  }

  test('returns 2 for 1-core 1GB machine', () => {
    expect(defaultWorkers(1, 1)).toBe(2);
  });

  test('returns 4 for 4-core 4GB machine', () => {
    expect(defaultWorkers(4, 4)).toBe(4);
  });

  test('returns 8 for 16-core 32GB machine', () => {
    expect(defaultWorkers(16, 32)).toBe(8); // capped by pool
  });

  test('caps at 8 regardless of hardware', () => {
    expect(defaultWorkers(64, 128)).toBe(8);
  });

  test('memory-limited: 0.5GB machine → 1 (floored from 0.5*2)', () => {
    expect(defaultWorkers(8, 0.5)).toBe(1);
  });

  test('returns at least 2 for any CPU count', () => {
    const result = defaultWorkers(1, 8);
    expect(result).toBeGreaterThanOrEqual(2);
  });
});

describe('smart URL parsing covers all Supabase formats', () => {
  test('dashboard URL with settings path', () => {
    expect(extractProjectRef('https://supabase.com/dashboard/project/abcdefghijklmnop/settings/database'))
      .toBe('abcdefghijklmnop');
  });

  test('dashboard URL with just project', () => {
    expect(extractProjectRef('https://supabase.com/dashboard/project/abcdefghijklmnop'))
      .toBe('abcdefghijklmnop');
  });

  test('pooler URL with region', () => {
    expect(extractProjectRef('postgresql://postgres.abcdefghijklmnop:mypassword@aws-1-us-east-1.pooler.supabase.com:6543/postgres'))
      .toBe('abcdefghijklmnop');
  });

  test('direct URL with port', () => {
    expect(extractProjectRef('postgresql://postgres:mypassword@db.abcdefghijklmnop.supabase.co:5432/postgres'))
      .toBe('abcdefghijklmnop');
  });

  test('project URL with path', () => {
    expect(extractProjectRef('https://abcdefghijklmnop.supabase.co/rest/v1/'))
      .toBe('abcdefghijklmnop');
  });

  test('non-supabase postgres URL returns null', () => {
    expect(extractProjectRef('postgresql://user:pass@my-rds-instance.amazonaws.com:5432/mydb')).toBeNull();
  });
});

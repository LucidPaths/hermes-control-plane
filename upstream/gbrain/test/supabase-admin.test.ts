import { describe, test, expect } from 'bun:test';
import { extractProjectRef } from '../src/core/supabase-admin.ts';

describe('extractProjectRef', () => {
  test('extracts from dashboard URL', () => {
    expect(extractProjectRef('https://supabase.com/dashboard/project/rqfedtbsqoxrobdwfrsk/settings/database'))
      .toBe('rqfedtbsqoxrobdwfrsk');
  });

  test('extracts from direct connection URL', () => {
    expect(extractProjectRef('postgresql://postgres:password@db.rqfedtbsqoxrobdwfrsk.supabase.co:5432/postgres'))
      .toBe('rqfedtbsqoxrobdwfrsk');
  });

  test('extracts from pooler URL', () => {
    expect(extractProjectRef('postgresql://postgres.rqfedtbsqoxrobdwfrsk:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres'))
      .toBe('rqfedtbsqoxrobdwfrsk');
  });

  test('extracts from project URL', () => {
    expect(extractProjectRef('https://rqfedtbsqoxrobdwfrsk.supabase.co'))
      .toBe('rqfedtbsqoxrobdwfrsk');
  });

  test('returns null for non-supabase URL', () => {
    expect(extractProjectRef('postgresql://user:pass@localhost:5432/mydb')).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(extractProjectRef('')).toBeNull();
  });

  test('returns null for random text', () => {
    expect(extractProjectRef('hello world')).toBeNull();
  });
});

import { describe, test, expect } from 'bun:test';
import { parse, stringify } from '../src/core/yaml-lite.ts';

describe('yaml-lite parse', () => {
  test('parses simple key-value pairs', () => {
    const result = parse('name: hello\nvalue: world\n');
    expect(result.name).toBe('hello');
    expect(result.value).toBe('world');
  });

  test('ignores comments', () => {
    const result = parse('# comment\nkey: value\n');
    expect(result.key).toBe('value');
    expect(result['# comment']).toBeUndefined();
  });

  test('ignores blank lines', () => {
    const result = parse('key1: val1\n\n\nkey2: val2\n');
    expect(result.key1).toBe('val1');
    expect(result.key2).toBe('val2');
  });

  test('handles values with colons', () => {
    const result = parse('url: https://example.com:8080/path\n');
    expect(result.url).toBe('https://example.com:8080/path');
  });

  test('trims whitespace', () => {
    const result = parse('  key  :  value  \n');
    expect(result.key).toBe('value');
  });

  test('parses .supabase marker format', () => {
    const marker = `synced_at: 2026-04-09T14:58:00Z
bucket: brain-files
prefix: people/.raw/
file_count: 484
`;
    const result = parse(marker);
    expect(result.synced_at).toBe('2026-04-09T14:58:00Z');
    expect(result.bucket).toBe('brain-files');
    expect(result.prefix).toBe('people/.raw/');
    expect(result.file_count).toBe('484');
  });

  test('parses .redirect breadcrumb format', () => {
    const redirect = `moved_to: supabase
bucket: brain-files
path: pedro-franceschi/pedro-franceschi.json
moved_at: 2026-04-09
original_hash: sha256:abc123
`;
    const result = parse(redirect);
    expect(result.moved_to).toBe('supabase');
    expect(result.bucket).toBe('brain-files');
    expect(result.path).toBe('pedro-franceschi/pedro-franceschi.json');
    expect(result.original_hash).toBe('sha256:abc123');
  });
});

describe('yaml-lite stringify', () => {
  test('produces key: value lines', () => {
    const result = stringify({ name: 'hello', count: 42 });
    expect(result).toBe('name: hello\ncount: 42\n');
  });

  test('round-trips through parse', () => {
    const original = { key: 'value', num: 123 };
    const serialized = stringify(original);
    const parsed = parse(serialized);
    expect(parsed.key).toBe('value');
    expect(parsed.num).toBe('123'); // parse returns strings
  });
});

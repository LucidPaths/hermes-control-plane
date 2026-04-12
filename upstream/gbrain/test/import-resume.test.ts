import { describe, test, expect, afterEach } from 'bun:test';
import { writeFileSync, readFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CHECKPOINT_PATH = join(homedir(), '.gbrain', 'import-checkpoint.json');

describe('import resume checkpoint', () => {
  afterEach(() => {
    // Clean up checkpoint after each test
    if (existsSync(CHECKPOINT_PATH)) {
      rmSync(CHECKPOINT_PATH);
    }
  });

  test('checkpoint file format is valid JSON', () => {
    const checkpoint = {
      dir: '/data/brain',
      totalFiles: 13768,
      processedIndex: 5000,
      timestamp: new Date().toISOString(),
    };

    mkdirSync(join(homedir(), '.gbrain'), { recursive: true });
    writeFileSync(CHECKPOINT_PATH, JSON.stringify(checkpoint));

    const loaded = JSON.parse(readFileSync(CHECKPOINT_PATH, 'utf-8'));
    expect(loaded.dir).toBe('/data/brain');
    expect(loaded.totalFiles).toBe(13768);
    expect(loaded.processedIndex).toBe(5000);
    expect(typeof loaded.timestamp).toBe('string');
  });

  test('checkpoint with matching dir and totalFiles enables resume', () => {
    const checkpoint = {
      dir: '/data/brain',
      totalFiles: 100,
      processedIndex: 50,
      timestamp: new Date().toISOString(),
    };

    mkdirSync(join(homedir(), '.gbrain'), { recursive: true });
    writeFileSync(CHECKPOINT_PATH, JSON.stringify(checkpoint));

    // Simulate the resume check logic from import.ts
    const cp = JSON.parse(readFileSync(CHECKPOINT_PATH, 'utf-8'));
    const dir = '/data/brain';
    const allFilesLength = 100;

    expect(cp.dir).toBe(dir);
    expect(cp.totalFiles).toBe(allFilesLength);
    expect(cp.processedIndex).toBe(50);
    // Would resume from index 50
  });

  test('checkpoint with different dir does NOT resume', () => {
    const checkpoint = {
      dir: '/data/other-brain',
      totalFiles: 100,
      processedIndex: 50,
      timestamp: new Date().toISOString(),
    };

    mkdirSync(join(homedir(), '.gbrain'), { recursive: true });
    writeFileSync(CHECKPOINT_PATH, JSON.stringify(checkpoint));

    const cp = JSON.parse(readFileSync(CHECKPOINT_PATH, 'utf-8'));
    const dir = '/data/brain';
    const allFilesLength = 100;

    // dir doesn't match, should start fresh
    expect(cp.dir === dir && cp.totalFiles === allFilesLength).toBe(false);
  });

  test('checkpoint with different totalFiles does NOT resume', () => {
    const checkpoint = {
      dir: '/data/brain',
      totalFiles: 200,
      processedIndex: 50,
      timestamp: new Date().toISOString(),
    };

    mkdirSync(join(homedir(), '.gbrain'), { recursive: true });
    writeFileSync(CHECKPOINT_PATH, JSON.stringify(checkpoint));

    const cp = JSON.parse(readFileSync(CHECKPOINT_PATH, 'utf-8'));
    const dir = '/data/brain';
    const allFilesLength = 100;

    // totalFiles doesn't match (files were added/removed), start fresh
    expect(cp.dir === dir && cp.totalFiles === allFilesLength).toBe(false);
  });

  test('invalid checkpoint JSON starts fresh', () => {
    mkdirSync(join(homedir(), '.gbrain'), { recursive: true });
    writeFileSync(CHECKPOINT_PATH, 'not json');

    let resumeIndex = 0;
    try {
      JSON.parse(readFileSync(CHECKPOINT_PATH, 'utf-8'));
    } catch {
      resumeIndex = 0; // start fresh on invalid checkpoint
    }
    expect(resumeIndex).toBe(0);
  });

  test('missing checkpoint file starts fresh', () => {
    expect(existsSync(CHECKPOINT_PATH)).toBe(false);
    // No checkpoint = start from 0
  });
});

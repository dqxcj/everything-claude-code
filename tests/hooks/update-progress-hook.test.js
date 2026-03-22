/**
 * Tests for scripts/hooks/update-progress-hook.js
 *
 * Tests the stop hook that updates requirement progress on session end.
 *
 * Run with: node tests/hooks/update-progress-hook.test.js
 */

const assert = require('assert');
const path = require('path');
const { spawnSync } = require('child_process');

const script = path.join(__dirname, '..', '..', 'scripts', 'hooks', 'update-progress-hook.js');

function test(name, fn) {
  try {
    fn();
    console.log(`  \u2713 ${name}`);
    return true;
  } catch (err) {
    console.log(`  \u2717 ${name}`);
    console.log(`    Error: ${err.message}`);
    return false;
  }
}

function runScript(envOverrides = {}, stdinInput = '') {
  const env = { ...process.env, ...envOverrides };
  const result = spawnSync('node', [script], {
    encoding: 'utf8',
    timeout: 10000,
    env,
    input: stdinInput,
  });
  const stdout = result.stdout ? String(result.stdout) : '';
  const stderr = result.stderr ? String(result.stderr) : '';
  return {
    code: result.status || 0,
    stdout,
    stderr,
    combined: stdout + stderr
  };
}

function runTests() {
  console.log('\n=== Testing update-progress-hook.js ===\n');

  let passed = 0;
  let failed = 0;

  console.log('No requirement ID:');

  if (test('skips update when CLAUDE_CURRENT_REQUIREMENT_ID is not set', () => {
    const result = runScript({});
    assert.ok(result.combined.includes('[Progress] No active requirement'));
    assert.strictEqual(result.code, 0);
  })) passed++; else failed++;

  console.log('\nWith requirement ID:');

  if (test('exits successfully when requirement ID is set but no stdin', () => {
    const result = runScript({ CLAUDE_CURRENT_REQUIREMENT_ID: 'req-test-001' }, '');
    assert.strictEqual(result.code, 0);
    // Output goes to stderr when requirement not found
    assert.ok(result.combined.includes('[Progress]'));
  })) passed++; else failed++;

  if (test('exits successfully with requirement ID and phase', () => {
    const result = runScript({
      CLAUDE_CURRENT_REQUIREMENT_ID: 'req-test-001',
      CLAUDE_CURRENT_PHASE: 'planning'
    }, '');
    assert.strictEqual(result.code, 0);
  })) passed++; else failed++;

  if (test('reads session summary from stdin', () => {
    const result = runScript({
      CLAUDE_CURRENT_REQUIREMENT_ID: 'req-test-001',
      CLAUDE_CURRENT_PHASE: 'planning'
    }, 'Test session summary');
    assert.strictEqual(result.code, 0);
    // Output goes to stderr when requirement not found
    assert.ok(result.combined.includes('[Progress]'));
  })) passed++; else failed++;

  if (test('handles long session summary gracefully', () => {
    const longSummary = 'A'.repeat(1000);
    const result = runScript({
      CLAUDE_CURRENT_REQUIREMENT_ID: 'req-test-001',
      CLAUDE_CURRENT_PHASE: 'planning'
    }, longSummary);
    assert.strictEqual(result.code, 0);
  })) passed++; else failed++;

  console.log('\nError handling:');

  if (test('does not crash on invalid requirement ID', () => {
    const result = runScript({
      CLAUDE_CURRENT_REQUIREMENT_ID: 'req-nonexistent-999',
      CLAUDE_CURRENT_PHASE: 'planning'
    }, 'summary');
    // Should exit cleanly even if requirement not found
    assert.strictEqual(result.code, 0);
  })) passed++; else failed++;

  console.log(`\nResults: Passed: ${passed}, Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();

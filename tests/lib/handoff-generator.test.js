/**
 * Tests for scripts/lib/handoff-generator.js
 *
 * Run with: node tests/lib/handoff-generator.test.js
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Import the module
const {
  generateHandoff,
  saveHandoff,
  loadHandoff,
  listHandoffs
} = require('../../scripts/lib/handoff-generator');

const testDir = path.join(os.tmpdir(), 'handoff-test-' + Date.now());

// Test helper
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    return true;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${err.message}`);
    return false;
  }
}

// Cleanup function
function cleanup() {
  try {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  } catch (_e) {
    // Ignore
  }
}

// Test suite
function runTests() {
  console.log('\n=== Testing handoff-generator.js ===\n');

  // Cleanup before tests
  cleanup();

  let passed = 0;
  let failed = 0;

  // generateHandoff tests
  console.log('generateHandoff:');

  if (test('should generate valid markdown handoff', () => {
    const result = generateHandoff({
      requirementId: 'req-test-001',
      requirementName: 'Test Requirement',
      fromPhase: 'plan',
      toPhase: 'design',
      phaseResult: {
        summary: 'Completed planning phase',
        decisions: ['Decision 1', 'Decision 2'],
        artifacts: [{ name: 'plan.md', path: '/docs/plan.md', status: 'created' }],
        openQuestions: ['Question 1'],
        nextSteps: ['Step 1', 'Step 2'],
        metrics: { linesAdded: 100, linesRemoved: 10, testsAdded: 5, coverage: '80%' }
      },
      nextAgent: 'architect',
      nextAgentReason: 'Design phase needs architecture review'
    });

    assert.ok(result.includes('# HANDOFF: plan → design'));
    assert.ok(result.includes('**Requirement**: Test Requirement (req-test-001)'));
    assert.ok(result.includes('Completed planning phase'));
    assert.ok(result.includes('- Decision 1'));
    assert.ok(result.includes('| plan.md | /docs/plan.md | created |'));
    assert.ok(result.includes('**Next Agent**: architect'));
  })) passed++; else failed++;

  if (test('should handle minimal phase result', () => {
    const result = generateHandoff({
      requirementId: 'req-test-002',
      requirementName: 'Minimal Test',
      fromPhase: 'implement',
      toPhase: 'test',
      phaseResult: {}
    });

    assert.ok(result.includes('# HANDOFF: implement → test'));
    assert.ok(result.includes('(No summary provided)'));
    assert.ok(result.includes('(No major decisions)'));
  })) passed++; else failed++;

  if (test('should handle empty artifacts', () => {
    const result = generateHandoff({
      requirementId: 'req-test-003',
      requirementName: 'No Artifacts Test',
      fromPhase: 'design',
      toPhase: 'implement',
      phaseResult: {
        summary: 'Design completed',
        decisions: [],
        artifacts: [],
        openQuestions: [],
        nextSteps: []
      }
    });

    assert.ok(result.includes('| - | - | - |'));
  })) passed++; else failed++;

  if (test('should include metrics when provided', () => {
    const result = generateHandoff({
      requirementId: 'req-test-004',
      requirementName: 'Metrics Test',
      fromPhase: 'test',
      toPhase: 'review',
      phaseResult: {
        summary: 'Tests passed',
        decisions: [],
        artifacts: [],
        metrics: { linesAdded: 200, linesRemoved: 50, testsAdded: 10, coverage: '85%' }
      }
    });

    assert.ok(result.includes('| Lines Added | 200 |'));
    assert.ok(result.includes('| Coverage | 85% |'));
  })) passed++; else failed++;

  if (test('should handle null nextAgent', () => {
    const result = generateHandoff({
      requirementId: 'req-test-005',
      requirementName: 'No Agent Test',
      fromPhase: 'commit',
      toPhase: 'done',
      phaseResult: { summary: 'Complete' },
      nextAgent: null
    });

    assert.ok(result.includes('No specific Agent recommended'));
  })) passed++; else failed++;

  if (test('should include timestamp in ISO format', () => {
    const result = generateHandoff({
      requirementId: 'req-test-006',
      requirementName: 'Timestamp Test',
      fromPhase: 'plan',
      toPhase: 'design',
      phaseResult: { summary: 'Test' }
    });

    // ISO timestamp format: 2026-03-29T...
    assert.ok(result.match(/\d{4}-\d{2}-\d{2}T/));
  })) passed++; else failed++;

  // saveHandoff tests
  console.log('\nsaveHandoff:');

  if (test('should save handoff to file', async () => {
    const content = '# TEST HANDOFF';
    const filepath = await saveHandoff(content, 'req-save-test', 'plan', 'design', testDir);

    assert.ok(filepath.includes('req-save-test'));
    assert.ok(filepath.includes('plan_to_design.md'));
    assert.ok(fs.existsSync(filepath));

    const saved = fs.readFileSync(filepath, 'utf-8');
    assert.strictEqual(saved, content);
  })) passed++; else failed++;

  if (test('should create nested directories', async () => {
    const content = '# NESTED TEST';
    await saveHandoff(content, 'req-nested-test', 'design', 'implement', testDir);

    const expectedPath = path.join(testDir, '.requirements', 'handoffs', 'req-nested-test', 'design_to_implement.md');
    assert.ok(fs.existsSync(expectedPath));
  })) passed++; else failed++;

  // loadHandoff tests
  console.log('\nloadHandoff:');

  if (test('should load saved handoff', async () => {
    const content = '# LOAD TEST CONTENT';
    await saveHandoff(content, 'req-load-test', 'plan', 'design', testDir);

    const loaded = await loadHandoff('req-load-test', 'plan', 'design', testDir);
    assert.strictEqual(loaded, content);
  })) passed++; else failed++;

  if (test('should return null for non-existent handoff', async () => {
    const loaded = await loadHandoff('req-does-not-exist', 'plan', 'design', testDir);
    assert.strictEqual(loaded, null);
  })) passed++; else failed++;

  // listHandoffs tests
  console.log('\nlistHandoffs:');

  if (test('should list all handoffs for a requirement', async () => {
    await saveHandoff('# Handoff 1', 'req-list-test', 'plan', 'design', testDir);
    await saveHandoff('# Handoff 2', 'req-list-test', 'design', 'implement', testDir);

    const handoffs = await listHandoffs('req-list-test', testDir);

    assert.strictEqual(handoffs.length, 2);
    assert.ok(handoffs[0].filename.includes('.md'));
    assert.ok(handoffs[0].filepath);
  })) passed++; else failed++;

  if (test('should return empty array for non-existent requirement', async () => {
    const handoffs = await listHandoffs('req-no-such-req', testDir);
    assert.deepStrictEqual(handoffs, []);
  })) passed++; else failed++;

  console.log(`\nResults: ${passed} passed, ${failed} failed`);

  // Cleanup after tests
  cleanup();

  return { passed, failed };
}

// Run tests
const results = runTests();
console.log('');

if (require.main === module) {
  process.exitCode = results.failed > 0 ? 1 : 0;
}

module.exports = runTests;

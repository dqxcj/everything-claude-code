/**
 * Tests for scripts/lib/phase-agent-mapper.js
 *
 * Run with: node tests/lib/phase-agent-mapper.test.js
 */

const assert = require('assert');

// Import the module
const {
  PHASE_AGENT_MAP,
  getAgentForPhase,
  getAgentNameForPhase,
  phaseHasAgent,
  getRegisteredPhases,
  getPhasesForAgent
} = require('../../scripts/lib/phase-agent-mapper');

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

// Test suite
function runTests() {
  console.log('\n=== Testing phase-agent-mapper.js ===\n');

  let passed = 0;
  let failed = 0;

  // PHASE_AGENT_MAP tests
  console.log('PHASE_AGENT_MAP:');

  if (test('should map plan phase to planner agent', () => {
    assert.strictEqual(PHASE_AGENT_MAP['plan'], 'agents/planner.md');
  })) passed++; else failed++;

  if (test('should map implement phase to tdd-guide agent', () => {
    assert.strictEqual(PHASE_AGENT_MAP['implement'], 'agents/tdd-guide.md');
  })) passed++; else failed++;

  if (test('should map review phase to code-reviewer agent', () => {
    assert.strictEqual(PHASE_AGENT_MAP['review'], 'agents/code-reviewer.md');
  })) passed++; else failed++;

  if (test('should map brainstorm phase to planner agent', () => {
    assert.strictEqual(PHASE_AGENT_MAP['brainstorm'], 'agents/planner.md');
  })) passed++; else failed++;

  if (test('should have 13 phase mappings', () => {
    assert.strictEqual(Object.keys(PHASE_AGENT_MAP).length, 13);
  })) passed++; else failed++;

  // getAgentForPhase tests
  console.log('\ngetAgentForPhase:');

  if (test('should return agent path for known phases', () => {
    assert.strictEqual(getAgentForPhase('plan'), 'agents/planner.md');
    assert.strictEqual(getAgentForPhase('implement'), 'agents/tdd-guide.md');
    assert.strictEqual(getAgentForPhase('review'), 'agents/code-reviewer.md');
  })) passed++; else failed++;

  if (test('should return null for unknown phases', () => {
    assert.strictEqual(getAgentForPhase('unknown-phase'), null);
    assert.strictEqual(getAgentForPhase(''), null);
  })) passed++; else failed++;

  // getAgentNameForPhase tests
  console.log('\ngetAgentNameForPhase:');

  if (test('should extract agent name from path', () => {
    assert.strictEqual(getAgentNameForPhase('plan'), 'planner');
    assert.strictEqual(getAgentNameForPhase('implement'), 'tdd-guide');
    assert.strictEqual(getAgentNameForPhase('review'), 'code-reviewer');
  })) passed++; else failed++;

  if (test('should return null for unknown phases', () => {
    assert.strictEqual(getAgentNameForPhase('unknown'), null);
  })) passed++; else failed++;

  // phaseHasAgent tests
  console.log('\nphaseHasAgent:');

  if (test('should return true for phases with agents', () => {
    assert.strictEqual(phaseHasAgent('plan'), true);
    assert.strictEqual(phaseHasAgent('implement'), true);
    assert.strictEqual(phaseHasAgent('review'), true);
    assert.strictEqual(phaseHasAgent('test'), true);
  })) passed++; else failed++;

  if (test('should return false for phases without agents', () => {
    assert.strictEqual(phaseHasAgent('unknown-phase'), false);
    assert.strictEqual(phaseHasAgent(''), false);
  })) passed++; else failed++;

  // getRegisteredPhases tests
  console.log('\ngetRegisteredPhases:');

  if (test('should return array of phase names', () => {
    const phases = getRegisteredPhases();
    assert.ok(Array.isArray(phases));
    assert.ok(phases.includes('plan'));
    assert.ok(phases.includes('implement'));
  })) passed++; else failed++;

  if (test('should return 13 registered phases', () => {
    assert.strictEqual(getRegisteredPhases().length, 13);
  })) passed++; else failed++;

  // getPhasesForAgent tests
  console.log('\ngetPhasesForAgent:');

  if (test('should return phases mapped to tdd-guide agent', () => {
    const tddPhases = getPhasesForAgent('tdd-guide');
    assert.ok(tddPhases.includes('implement'));
    assert.ok(tddPhases.includes('test-first'));
    assert.ok(tddPhases.includes('test'));
  })) passed++; else failed++;

  if (test('should return empty array for unknown agent', () => {
    const unknownPhases = getPhasesForAgent('unknown-agent');
    assert.strictEqual(unknownPhases.length, 0);
  })) passed++; else failed++;

  if (test('should return phases for code-reviewer agent', () => {
    const reviewPhases = getPhasesForAgent('code-reviewer');
    assert.ok(reviewPhases.includes('review'));
    assert.ok(reviewPhases.includes('verify'));
  })) passed++; else failed++;

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// Run tests
const results = runTests();
console.log('');

if (require.main === module) {
  process.exitCode = results.failed > 0 ? 1 : 0;
}

module.exports = runTests;

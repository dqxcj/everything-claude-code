/**
 * Tests for scripts/lib/ecc-workflow-orchestrator.js
 *
 * Run with: node tests/lib/ecc-workflow-orchestrator.test.js
 */

const assert = require('assert');

// Import the module
const {
  getNextPhase,
  needsManualConfirmation,
  executePhase,
  buildHandoffContext,
  getWorkflowStatus,
  getAgentForPhase,
  getAgentNameForPhase,
  phaseHasAgent
} = require('../../scripts/lib/ecc-workflow-orchestrator');

const mockRequirement = {
  id: 'req-test-001',
  name: 'Test Requirement',
  description: 'A test requirement',
  type: 'medium',
  status: 'in_progress',
  currentPhase: 'implement',
  storageLocation: 'project',
  acceptanceCriteria: ['First criteria', 'Second criteria'],
  progress: {
    phases: [
      { name: 'plan', mode: 'auto', status: 'completed' },
      { name: 'design', mode: 'auto', status: 'completed' },
      { name: 'implement', mode: 'auto', status: 'in_progress' },
      { name: 'test', mode: 'auto', status: 'pending' },
      { name: 'review', mode: 'manual', status: 'pending' },
      { name: 'verify', mode: 'manual', status: 'pending' },
      { name: 'commit', mode: 'auto', status: 'pending' }
    ]
  }
};

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
  console.log('\n=== Testing ecc-workflow-orchestrator.js ===\n');

  let passed = 0;
  let failed = 0;

  // getNextPhase tests
  console.log('getNextPhase:');

  if (test('should return next phase when available', () => {
    const phases = mockRequirement.progress.phases;
    const next = getNextPhase(phases, 'implement');
    assert.strictEqual(next.name, 'test');
  })) passed++; else failed++;

  if (test('should return null when at last phase', () => {
    const phases = mockRequirement.progress.phases;
    const next = getNextPhase(phases, 'commit');
    assert.strictEqual(next, null);
  })) passed++; else failed++;

  if (test('should return null when phase not found', () => {
    const phases = mockRequirement.progress.phases;
    const next = getNextPhase(phases, 'non-existent');
    assert.strictEqual(next, null);
  })) passed++; else failed++;

  // needsManualConfirmation tests
  console.log('\nneedsManualConfirmation:');

  if (test('should return true for manual mode phases', () => {
    const reviewPhase = { name: 'review', mode: 'manual' };
    const verifyPhase = { name: 'verify', mode: 'manual' };
    assert.strictEqual(needsManualConfirmation(reviewPhase), true);
    assert.strictEqual(needsManualConfirmation(verifyPhase), true);
  })) passed++; else failed++;

  if (test('should return false for auto mode phases', () => {
    const planPhase = { name: 'plan', mode: 'auto' };
    const implementPhase = { name: 'implement', mode: 'auto' };
    assert.strictEqual(needsManualConfirmation(planPhase), false);
    assert.strictEqual(needsManualConfirmation(implementPhase), false);
  })) passed++; else failed++;

  if (test('should return false for null/undefined phase', () => {
    assert.strictEqual(needsManualConfirmation(null), false);
    assert.strictEqual(needsManualConfirmation(undefined), false);
  })) passed++; else failed++;

  // executePhase tests
  console.log('\nexecutePhase:');

  if (test('should return execution plan for phase with agent', () => {
    const result = executePhase(mockRequirement, 'implement');
    assert.strictEqual(result.phaseName, 'implement');
    assert.strictEqual(result.agentPath, 'agents/tdd-guide.md');
    assert.strictEqual(result.agentName, 'tdd-guide');
    assert.strictEqual(result.hasAgent, true);
  })) passed++; else failed++;

  if (test('should return hasAgent false for phase without agent', () => {
    const result = executePhase(mockRequirement, 'commit');
    assert.strictEqual(result.hasAgent, false);
    assert.strictEqual(result.agentPath, null);
  })) passed++; else failed++;

  if (test('should include context information', () => {
    const result = executePhase(mockRequirement, 'plan');
    assert.strictEqual(result.context.currentPhase, 'plan');
    assert.strictEqual(result.context.workflowType, 'medium');
    assert.strictEqual(result.context.storageLocation, 'project');
  })) passed++; else failed++;

  // buildHandoffContext tests
  console.log('\nbuildHandoffContext:');

  if (test('should build correct handoff context', () => {
    const result = buildHandoffContext(
      mockRequirement,
      'implement',
      'test',
      {
        summary: 'Implementation complete',
        decisions: ['Used TDD approach'],
        artifacts: [{ name: 'feature.js', path: '/src/feature.js', status: 'created' }],
        nextSteps: ['Run tests'],
        metrics: { linesAdded: 100 }
      }
    );

    assert.strictEqual(result.requirementId, 'req-test-001');
    assert.strictEqual(result.fromPhase, 'implement');
    assert.strictEqual(result.toPhase, 'test');
    assert.strictEqual(result.phaseResult.summary, 'Implementation complete');
    assert.strictEqual(result.nextAgent, 'tdd-guide');
  })) passed++; else failed++;

  if (test('should handle minimal phase data', () => {
    const result = buildHandoffContext(mockRequirement, 'plan', 'design', {});
    assert.strictEqual(result.fromPhase, 'plan');
    assert.strictEqual(result.toPhase, 'design');
    assert.strictEqual(result.phaseResult.summary, 'Completed plan phase');
  })) passed++; else failed++;

  // getWorkflowStatus tests
  console.log('\ngetWorkflowStatus:');

  if (test('should return complete workflow status', () => {
    const result = getWorkflowStatus(mockRequirement);
    assert.strictEqual(result.requirementId, 'req-test-001');
    assert.strictEqual(result.currentPhase, 'implement');
    assert.strictEqual(result.currentPhaseMode, 'auto');
    assert.strictEqual(result.currentPhaseNeedsConfirmation, false);
    assert.strictEqual(result.completedCount, 2);
    assert.strictEqual(result.totalPhases, 7);
  })) passed++; else failed++;

  if (test('should detect next phase with agent', () => {
    const result = getWorkflowStatus(mockRequirement);
    assert.strictEqual(result.nextPhase.name, 'test');
    assert.strictEqual(result.nextPhaseHasAgent, true);
  })) passed++; else failed++;

  if (test('should handle requirement with no phases', () => {
    const emptyReq = { id: 'req-empty', progress: { phases: [] } };
    const result = getWorkflowStatus(emptyReq);
    assert.strictEqual(result.completedCount, 0);
    assert.strictEqual(result.totalPhases, 0);
    assert.strictEqual(result.progressPercent, 0);
  })) passed++; else failed++;

  // agent mapping integration tests
  console.log('\nagent mapping integration:');

  if (test('should correctly identify planner for plan phase', () => {
    assert.strictEqual(getAgentForPhase('plan'), 'agents/planner.md');
    assert.strictEqual(getAgentNameForPhase('plan'), 'planner');
    assert.strictEqual(phaseHasAgent('plan'), true);
  })) passed++; else failed++;

  if (test('should correctly identify tdd-guide for implement phase', () => {
    assert.strictEqual(getAgentForPhase('implement'), 'agents/tdd-guide.md');
    assert.strictEqual(getAgentNameForPhase('implement'), 'tdd-guide');
  })) passed++; else failed++;

  if (test('should correctly identify code-reviewer for review phase', () => {
    assert.strictEqual(getAgentForPhase('review'), 'agents/code-reviewer.md');
    assert.strictEqual(getAgentNameForPhase('review'), 'code-reviewer');
  })) passed++; else failed++;

  if (test('should correctly identify e2e-runner for e2e phase', () => {
    assert.strictEqual(getAgentForPhase('e2e'), 'agents/e2e-runner.md');
    assert.strictEqual(getAgentNameForPhase('e2e'), 'e2e-runner');
  })) passed++; else failed++;

  if (test('should return null for unknown phases', () => {
    assert.strictEqual(getAgentForPhase('unknown'), null);
    assert.strictEqual(getAgentNameForPhase('unknown'), null);
    assert.strictEqual(phaseHasAgent('unknown'), false);
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

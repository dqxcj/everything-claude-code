/**
 * Tests for scripts/lib/acceptance-criteria-tracker.js
 *
 * Run with: node tests/lib/acceptance-criteria-tracker.test.js
 */

const assert = require('assert');

// Import the module
const {
  structureAcceptanceCriteria,
  getCriteriaSummary,
  formatCriteriaChecklist,
  isAllCriteriaMet,
  getCriteriaByStatus
} = require('../../scripts/lib/acceptance-criteria-tracker');

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
  console.log('\n=== Testing acceptance-criteria-tracker.js ===\n');

  let passed = 0;
  let failed = 0;

  // structureAcceptanceCriteria tests
  console.log('structureAcceptanceCriteria:');

  if (test('should transform string array to structured format', () => {
    const input = ['First criteria', 'Second criteria', 'Third criteria'];
    const result = structureAcceptanceCriteria(input);
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].id, 'AC-1');
    assert.strictEqual(result[0].description, 'First criteria');
    assert.strictEqual(result[0].status, 'unchecked');
    assert.strictEqual(result[1].id, 'AC-2');
    assert.strictEqual(result[2].id, 'AC-3');
  })) passed++; else failed++;

  if (test('should preserve already structured criteria', () => {
    const input = [{ id: 'AC-1', description: 'Test', status: 'checked', verifiedAt: '2026-01-01' }];
    const result = structureAcceptanceCriteria(input);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].status, 'checked');
  })) passed++; else failed++;

  if (test('should return empty array for null input', () => {
    assert.deepStrictEqual(structureAcceptanceCriteria(null), []);
  })) passed++; else failed++;

  if (test('should return empty array for non-array input', () => {
    assert.deepStrictEqual(structureAcceptanceCriteria('string'), []);
    assert.deepStrictEqual(structureAcceptanceCriteria(123), []);
  })) passed++; else failed++;

  // getCriteriaSummary tests
  console.log('\ngetCriteriaSummary:');

  if (test('should return correct summary for mixed status', () => {
    const input = [
      { id: 'AC-1', status: 'checked' },
      { id: 'AC-2', status: 'checked' },
      { id: 'AC-3', status: 'unchecked' },
      { id: 'AC-4', status: 'partial' }
    ];
    const result = getCriteriaSummary(input);
    assert.strictEqual(result.total, 4);
    assert.strictEqual(result.checked, 2);
    assert.strictEqual(result.unchecked, 1);
    assert.strictEqual(result.partial, 1);
    assert.strictEqual(result.percentComplete, 50);
  })) passed++; else failed++;

  if (test('should return zero values for empty array', () => {
    const result = getCriteriaSummary([]);
    assert.strictEqual(result.total, 0);
    assert.strictEqual(result.percentComplete, 0);
  })) passed++; else failed++;

  if (test('should calculate 100% when all checked', () => {
    const input = [{ id: 'AC-1', status: 'checked' }, { id: 'AC-2', status: 'checked' }];
    const result = getCriteriaSummary(input);
    assert.strictEqual(result.percentComplete, 100);
  })) passed++; else failed++;

  // formatCriteriaChecklist tests
  console.log('\nformatCriteriaChecklist:');

  if (test('should format criteria as checklist', () => {
    const input = [
      { id: 'AC-1', description: 'First', status: 'checked' },
      { id: 'AC-2', description: 'Second', status: 'unchecked' }
    ];
    const result = formatCriteriaChecklist(input);
    assert.ok(result.includes('[x]'));
    assert.ok(result.includes('[ ]'));
    assert.ok(result.includes('AC-1'));
    assert.ok(result.includes('First'));
  })) passed++; else failed++;

  if (test('should show status by default', () => {
    const input = [{ id: 'AC-1', description: 'Test', status: 'checked' }];
    const result = formatCriteriaChecklist(input);
    assert.ok(result.includes('(checked)'));
  })) passed++; else failed++;

  if (test('should hide status when showStatus is false', () => {
    const input = [{ id: 'AC-1', description: 'Test', status: 'checked' }];
    const result = formatCriteriaChecklist(input, { showStatus: false });
    assert.ok(!result.includes('(checked)'));
  })) passed++; else failed++;

  if (test('should handle partial status', () => {
    const input = [{ id: 'AC-1', description: 'Partial', status: 'partial' }];
    const result = formatCriteriaChecklist(input);
    assert.ok(result.includes('[~]'));
    assert.ok(result.includes('(partial)'));
  })) passed++; else failed++;

  if (test('should return placeholder for empty criteria', () => {
    const result = formatCriteriaChecklist([]);
    assert.ok(result.includes('No acceptance criteria'));
  })) passed++; else failed++;

  // isAllCriteriaMet tests
  console.log('\nisAllCriteriaMet:');

  if (test('should return true when all criteria are checked', () => {
    const input = [{ id: 'AC-1', status: 'checked' }, { id: 'AC-2', status: 'checked' }];
    assert.strictEqual(isAllCriteriaMet(input), true);
  })) passed++; else failed++;

  if (test('should return false when any criteria is unchecked', () => {
    const input = [{ id: 'AC-1', status: 'checked' }, { id: 'AC-2', status: 'unchecked' }];
    assert.strictEqual(isAllCriteriaMet(input), false);
  })) passed++; else failed++;

  if (test('should return false for empty array', () => {
    assert.strictEqual(isAllCriteriaMet([]), false);
  })) passed++; else failed++;

  // getCriteriaByStatus tests
  console.log('\ngetCriteriaByStatus:');

  if (test('should filter criteria by status', () => {
    const input = [
      { id: 'AC-1', status: 'checked' },
      { id: 'AC-2', status: 'unchecked' },
      { id: 'AC-3', status: 'checked' },
      { id: 'AC-4', status: 'partial' }
    ];
    const checked = getCriteriaByStatus(input, 'checked');
    const unchecked = getCriteriaByStatus(input, 'unchecked');
    assert.strictEqual(checked.length, 2);
    assert.strictEqual(unchecked.length, 1);
    assert.strictEqual(unchecked[0].id, 'AC-2');
  })) passed++; else failed++;

  if (test('should return empty array for no matches', () => {
    const input = [{ id: 'AC-1', status: 'checked' }];
    const unchecked = getCriteriaByStatus(input, 'unchecked');
    assert.strictEqual(unchecked.length, 0);
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

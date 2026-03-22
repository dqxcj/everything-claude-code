/**
 * Tests for requirements/config.json5
 *
 * Run with: node tests/lib/requirement-config.test.js
 */

const fs = require('fs');
const path = require('path');
const JSON5 = require('json5');

const assert = require('assert');

// Test helper
function test(name, fn) {
  try {
    fn();
    console.log(` ✓ ${name}`);
    return true;
  } catch (_err) {
    console.log(` ✗ ${name}`);
    console.log(` Error: ${_err.message}`);
    return false;
  }
}

function runTests() {
  console.log('\n=== Testing Requirement Config ===\n');

  let passed = 0;
  let failed = 0;

  const configPath = path.join(__dirname, '../../requirements/config.json5');

  if (test('config.json5 exists', () => {
    assert.strictEqual(fs.existsSync(configPath), true, 'config.json5 should exist');
  })) passed++;
  else failed++;

  if (test('config contains all workflow definitions', () => {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON5.parse(content);
    assert.ok(config.workflows, 'should have workflows');
    assert.ok(config.workflows.micro, 'should have micro workflow');
    assert.ok(config.workflows.small, 'should have small workflow');
    assert.ok(config.workflows.medium, 'should have medium workflow');
    assert.ok(config.workflows.large, 'should have large workflow');
    assert.ok(config.workflows['extra-large'], 'should have extra-large workflow');
    assert.ok(config.workflows.continuous, 'should have continuous workflow');
  })) passed++;
  else failed++;

  if (test('extra-large workflow contains optimize phase', () => {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON5.parse(content);
    assert.ok(config.workflows['extra-large'].phases.includes('optimize'), 'extra-large should contain optimize phase');
  })) passed++;
  else failed++;

  if (test('config has version', () => {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON5.parse(content);
    assert.ok(config.version, 'should have version');
    assert.strictEqual(config.version, '1.0', 'version should be 1.0');
  })) passed++;
  else failed++;

  if (test('config has requirementsRoot', () => {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON5.parse(content);
    assert.ok(config.requirementsRoot, 'should have requirementsRoot');
  })) passed++;
  else failed++;

  if (test('config has autoPhases for all workflows', () => {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON5.parse(content);
    assert.ok(config.autoPhases, 'should have autoPhases');
    assert.ok(config.autoPhases.micro, 'should have micro autoPhases');
    assert.ok(config.autoPhases.small, 'should have small autoPhases');
    assert.ok(config.autoPhases.medium, 'should have medium autoPhases');
    assert.ok(config.autoPhases.large, 'should have large autoPhases');
    assert.ok(config.autoPhases['extra-large'], 'should have extra-large autoPhases');
    assert.ok(config.autoPhases.continuous, 'should have continuous autoPhases');
  })) passed++;
  else failed++;

  if (test('config has manualPhases for all workflows', () => {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON5.parse(content);
    assert.ok(config.manualPhases, 'should have manualPhases');
    assert.ok(config.manualPhases.micro, 'should have micro manualPhases');
    assert.ok(config.manualPhases.small, 'should have small manualPhases');
    assert.ok(config.manualPhases.medium, 'should have medium manualPhases');
    assert.ok(config.manualPhases.large, 'should have large manualPhases');
    assert.ok(config.manualPhases['extra-large'], 'should have extra-large manualPhases');
    assert.ok(config.manualPhases.continuous, 'should have continuous manualPhases');
  })) passed++;
  else failed++;

  if (test('config has logEventTypes', () => {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON5.parse(content);
    assert.ok(Array.isArray(config.logEventTypes), 'logEventTypes should be array');
    assert.ok(config.logEventTypes.length > 0, 'logEventTypes should not be empty');
    assert.ok(config.logEventTypes.includes('created'), 'should include created');
    assert.ok(config.logEventTypes.includes('phase_entered'), 'should include phase_entered');
    assert.ok(config.logEventTypes.includes('phase_completed'), 'should include phase_completed');
  })) passed++;
  else failed++;

  if (test('config has statuses', () => {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON5.parse(content);
    assert.ok(Array.isArray(config.statuses), 'statuses should be array');
    assert.ok(config.statuses.includes('pending'), 'should include pending');
    assert.ok(config.statuses.includes('in_progress'), 'should include in_progress');
    assert.ok(config.statuses.includes('completed'), 'should include completed');
    assert.ok(config.statuses.includes('blocked'), 'should include blocked');
    assert.ok(config.statuses.includes('cancelled'), 'should include cancelled');
  })) passed++;
  else failed++;

  if (test('config has phaseStatuses', () => {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON5.parse(content);
    assert.ok(Array.isArray(config.phaseStatuses), 'phaseStatuses should be array');
    assert.ok(config.phaseStatuses.includes('pending'), 'should include pending');
    assert.ok(config.phaseStatuses.includes('in_progress'), 'should include in_progress');
    assert.ok(config.phaseStatuses.includes('completed'), 'should include completed');
    assert.ok(config.phaseStatuses.includes('blocked'), 'should include blocked');
  })) passed++;
  else failed++;

  // Summary
  console.log('\n=== Test Results ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();

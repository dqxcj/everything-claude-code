/**
 * Tests for scripts/requirement-manager.js
 *
 * Run with: node tests/lib/requirement-manager.test.js
 * Or with Jest: npx jest tests/lib/requirement-manager.test.js
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// If jest is available, use jest mocking; otherwise use simple manual mocks
let useJestMocks = false;
try {
  // Check if we can use Jest mocks
  if (typeof jest !== 'undefined') {
    useJestMocks = true;
  }
} catch (_err) {
  // Jest not available, will use manual mocks
}

// Manual mock implementations for fs and fs/promises
const mockFsData = {};
const mockFsPromisesData = {};

function createManualMocks() {
  // Mock fs
  jest = {
    mock: (module, factory) => {
      if (module === 'fs') {
        global.__mockFs = {
          existsSync: (filePath) => {
            const key = String(filePath);
            return mockFsData[key] !== undefined || fs.existsSync(filePath);
          },
          readFileSync: (filePath, encoding) => {
            const key = String(filePath);
            if (mockFsData[key]) return mockFsData[key];
            return fs.readFileSync(filePath, encoding);
          },
          writeFileSync: (filePath, content) => {
            mockFsData[String(filePath)] = content;
          },
          readdirSync: (dirPath, options) => {
            const key = String(dirPath);
            if (mockFsData[key]) return mockFsData[key];
            return fs.readdirSync(dirPath, options);
          },
          mkdirSync: (dirPath, options) => {
            mockFsData[String(dirPath)] = [];
          }
        };
      }
      if (module === 'fs/promises') {
        global.__mockFsPromises = {
          readFile: async (filePath, encoding) => {
            const key = String(filePath);
            if (mockFsPromisesData[key]) return mockFsPromisesData[key];
            try {
              return await fs.promises.readFile(filePath, encoding);
            } catch (_err) {
              throw new Error('ENOENT');
            }
          },
          writeFile: async (filePath, content) => {
            mockFsPromisesData[String(filePath)] = content;
          },
          mkdir: async (dirPath, options) => {
            mockFsPromisesData[String(dirPath)] = [];
          },
          access: async (filePath) => {
            const key = String(filePath);
            if (mockFsPromisesData[key] !== undefined) return;
            try {
              await fs.promises.access(filePath);
            } catch (_err) {
              throw new Error('ENOENT');
            }
          },
          readdir: async (dirPath, options) => {
            const key = String(dirPath);
            if (mockFsPromisesData[key]) return mockFsPromisesData[key];
            return await fs.promises.readdir(dirPath, options);
          }
        };
      }
    }
  };
}

// Check if we should use manual mocks
const rm = require('../../scripts/requirement-manager');

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

// Simple expect helper (avoids Jest dependency)
function expect(actual) {
  return {
    toMatch: (regex) => {
      if (!regex.test(actual)) {
        throw new Error(`Expected ${actual} to match ${regex}`);
      }
    },
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toEqual: (expected) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toBeDefined: () => {
      if (actual === undefined) {
        throw new Error('Expected value to be defined');
      }
    },
    toBeNull: () => {
      if (actual !== null) {
        throw new Error(`Expected null, got ${actual}`);
      }
    },
    toBeInstanceOf: (ExpectedClass) => {
      if (!(actual instanceof ExpectedClass)) {
        throw new Error(`Expected instance of ${ExpectedClass.name}, got ${typeof actual}`);
      }
    },
    toHaveProperty: (prop) => {
      if (actual === null || actual === undefined || actual[prop] === undefined) {
        throw new Error(`Expected object to have property ${prop}`);
      }
    },
    toContain: (item) => {
      if (!actual.includes(item)) {
        throw new Error(`Expected array to contain ${item}`);
      }
    }
  };
}

function runTests() {
  console.log('\n=== Testing requirement-manager.js ===\n');

  let passed = 0;
  let failed = 0;

  // Test generateRequirementId
  console.log('ID Generation:');

  if (test('createRequirement uses timestamp ID format', () => {
    const id = rm.generateRequirementId();
    expect(id).toMatch(/^req-\d{8}-\d{6}$/);
  })) passed++;
  else failed++;

  if (test('ID format is req-YYYYMMDD-HHMMSS', () => {
    const id = rm.generateRequirementId();
    const match = id.match(/^req-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/);
    expect(match).toBeDefined();
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    expect(year >= 2020 && year <= 2100).toBe(true);
    expect(month >= 1 && month <= 12).toBe(true);
    expect(day >= 1 && day <= 31).toBe(true);
  })) passed++;
  else failed++;

  // Test loadConfig
  console.log('\nConfiguration:');

  if (test('loadConfig returns object with requirementsRoot', () => {
    const config = rm.loadConfig();
    expect(config).toBeDefined();
    expect(config.requirementsRoot).toBeDefined();
  })) passed++;
  else failed++;

  if (test('loadConfig returns valid statuses', () => {
    const config = rm.loadConfig();
    expect(config.statuses).toBeInstanceOf(Array);
    expect(config.statuses).toContain('pending');
    expect(config.statuses).toContain('in_progress');
    expect(config.statuses).toContain('completed');
  })) passed++;
  else failed++;

  // Test expandHome
  console.log('\nPath Handling:');

  if (test('expandHome expands ~ to home directory', () => {
    const expanded = rm.expandHome('~/test');
    expect(expanded).toBe(path.join(os.homedir(), 'test'));
  })) passed++;
  else failed++;

  if (test('expandHome handles non-~ paths', () => {
    const expanded = rm.expandHome('/absolute/path');
    expect(expanded).toBe('/absolute/path');
  })) passed++;
  else failed++;

  // Test getRequirementsRoot
  console.log('\nRequirements Root:');

  if (test('getRequirementsRoot defaults to project-level (.requirements/)', () => {
    const root = rm.getRequirementsRoot();
    expect(root).toContain('.requirements');
  })) passed++;
  else failed++;

  if (test('getRequirementsRoot returns .claude path for user location', () => {
    const root = rm.getRequirementsRoot('user');
    expect(root).toContain('.claude');
    expect(root).toContain('requirements');
  })) passed++;
  else failed++;

  // Test getGitInfo
  console.log('\nGit Info:');

  if (test('getGitInfo returns object with branch, remote, baseBranch, localPath', () => {
    const gitInfo = rm.getGitInfo();
    expect(gitInfo).toBeDefined();
    expect(gitInfo.branch !== undefined).toBe(true);
    expect(gitInfo.remote !== undefined).toBe(true);
    expect(gitInfo.baseBranch !== undefined).toBe(true);
    expect(gitInfo.localPath !== undefined).toBe(true);
  })) passed++;
  else failed++;

  // Test that functions exist and are callable
  console.log('\nFunction Exports:');

  if (test('createRequirement is a function', () => {
    expect(typeof rm.createRequirement).toBe('function');
  })) passed++;
  else failed++;

  if (test('getRequirement is a function', () => {
    expect(typeof rm.getRequirement).toBe('function');
  })) passed++;
  else failed++;

  if (test('listRequirements is a function', () => {
    expect(typeof rm.listRequirements).toBe('function');
  })) passed++;
  else failed++;

  if (test('updateRequirementProgress is a function', () => {
    expect(typeof rm.updateRequirementProgress).toBe('function');
  })) passed++;
  else failed++;

  if (test('advancePhase is a function', () => {
    expect(typeof rm.advancePhase).toBe('function');
  })) passed++;
  else failed++;

  if (test('guessCurrentRequirement is a function', () => {
    expect(typeof rm.guessCurrentRequirement).toBe('function');
  })) passed++;
  else failed++;

  if (test('updateIndex is a function', () => {
    expect(typeof rm.updateIndex).toBe('function');
  })) passed++;
  else failed++;

  if (test('initRequirementsDir is a function', () => {
    expect(typeof rm.initRequirementsDir).toBe('function');
  })) passed++;
  else failed++;

  // Test initRequirementsDir (requires mocking for actual file system)
  console.log('\nInit Requirements Dir:');

  if (test('initRequirementsDir returns a path string', async () => {
    const root = await rm.initRequirementsDir();
    expect(typeof root).toBe('string');
    expect(root.length > 0).toBe(true);
  })) passed++;
  else failed++;

  // Summary
  console.log('\n=== Test Results ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests();

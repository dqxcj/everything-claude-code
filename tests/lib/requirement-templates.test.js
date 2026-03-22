/**
 * Tests for requirement templates (requirements/templates/*.json5)
 *
 * Run with: node tests/lib/requirement-templates.test.js
 */

const fs = require('fs');
const path = require('path');

/**
 * Simple JSON5 parser - strips comments and handles unquoted keys
 * then parses as JSON.
 */
function parseJSON5(content) {
  // Remove single-line comments (// ...)
  let cleaned = content.replace(/\/\/.*$/gm, '');
  // Remove multi-line comments (/* ... */)
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove blank lines
  cleaned = cleaned.split('\n').filter(line => line.trim() !== '').join('\n');
  // Quote unquoted property names (word followed by colon)
  cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*):/g, '$1"$2":');
  return JSON.parse(cleaned);
}

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

const templatesDir = path.join(__dirname, '../../requirements/templates');

const expectedTypes = ['micro', 'small', 'medium', 'large', 'extra-large', 'continuous'];

let passed = 0;
let failed = 0;

console.log('\n━━━ Requirement Templates ━━━\n');

// Test index.json5
if (
  test('index.json5 template exists', () => {
    const templatePath = path.join(templatesDir, 'index.json5');
    expect(fs.existsSync(templatePath)).toBe(true);
  })
)
  passed++;
else failed++;

if (
  test('index.json5 structure valid', () => {
    const templatePath = path.join(templatesDir, 'index.json5');
    const content = fs.readFileSync(templatePath, 'utf-8');
    const template = parseJSON5(content);
    expect(template.version).toBe("1.0");
    expect(template.requirements).toBeInstanceOf(Array);
  })
)
  passed++;
else failed++;

// Test each type template
expectedTypes.forEach(type => {
  if (
    test(`${type}.json5 template exists`, () => {
      const templatePath = path.join(templatesDir, `${type}.json5`);
      expect(fs.existsSync(templatePath)).toBe(true);
    })
  )
    passed++;
  else failed++;

  if (
    test(`${type}.json5 structure valid`, () => {
      const templatePath = path.join(templatesDir, `${type}.json5`);
      const content = fs.readFileSync(templatePath, 'utf-8');
      const template = parseJSON5(content);
      expect(template.id).toBe("{{id}}");
      expect(template.type).toBe(type);
      expect(template.status).toBe("pending");
      expect(template.progress).toBeDefined();
      expect(template.progress.phases).toBeInstanceOf(Array);
    })
  )
    passed++;
  else failed++;
});

// Simple expect helper (avoids Jest dependency)
function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toBeInstanceOf: (ExpectedClass) => {
      if (!(actual instanceof ExpectedClass)) {
        throw new Error(`Expected instance of ${ExpectedClass.name}, got ${typeof actual}`);
      }
    },
    toBeDefined: () => {
      if (actual === undefined) {
        throw new Error('Expected value to be defined');
      }
    }
  };
}

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);

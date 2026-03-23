/**
 * Requirement Manager - Core script for managing requirements
 *
 * Provides functions to create, track, and manage requirement progress
 * across different workflow phases.
 *
 * Usage:
 *   const rm = require('./scripts/requirement-manager');
 */

const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Try to load JSON5, fallback to regular JSON
let JSON5;
try {
  JSON5 = require('json5');
} catch (_err) {
  JSON5 = null;
}

// Configuration paths
const CONFIG_PATH = path.join(__dirname, '../requirements/config.json5');
const TEMPLATES_DIR = path.join(__dirname, '../requirements/templates');

/**
 * Expand ~ to home directory
 */
function expandHome(filePath) {
  if (filePath && filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

/**
 * Load configuration
 */
function loadConfig() {
  try {
    const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
    if (JSON5) {
      return JSON5.parse(content);
    }
    // Fallback: strip comments manually
    const cleaned = content
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    return JSON.parse(cleaned);
  } catch (_err) {
    return {
      requirementsRoot: '~/.claude/requirements',
      workflows: {},
      statuses: ['pending', 'in_progress', 'completed', 'blocked', 'cancelled'],
      phaseStatuses: ['pending', 'in_progress', 'completed', 'blocked']
    };
  }
}

/**
 * Load requirement template by type
 */
function loadTemplate(type) {
  const templatePath = path.join(TEMPLATES_DIR, `${type}.json5`);
  try {
    const content = fs.readFileSync(templatePath, 'utf-8');
    if (JSON5) {
      return JSON5.parse(content);
    }
    const cleaned = content
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    return JSON.parse(cleaned);
  } catch (_err) {
    return null;
  }
}

/**
 * Generate requirement ID in format: req-{YYYYMMDD}-{HHMMSS}
 */
function generateRequirementId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `req-${year}${month}${day}-${hours}${minutes}${seconds}`;
}

/**
 * Get Git information for the current repository
 */
function getGitInfo() {
  try {
    const cwd = process.cwd();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd, encoding: 'utf-8' }).trim();
    let remote = '';
    try {
      remote = execSync('git remote get-url origin', { cwd, encoding: 'utf-8' }).trim();
    } catch (_err) {
      // No remote
    }
    let baseBranch = 'main';
    try {
      // Try to find the default branch
      baseBranch = execSync('git rev-parse --abbrev-ref origin/HEAD', { cwd, encoding: 'utf-8' }).trim().replace('origin/', '');
    } catch (_err) {
      // Fallback to main or try master
      try {
        execSync('git show-branch origin/main', { cwd, encoding: 'utf-8', stdio: 'ignore' });
        baseBranch = 'main';
      } catch (_err2) {
        try {
          execSync('git show-branch origin/master', { cwd, encoding: 'utf-8', stdio: 'ignore' });
          baseBranch = 'master';
        } catch (_err3) {
          // Keep default
        }
      }
    }
    return { branch, remote, baseBranch, localPath: cwd };
  } catch (_err) {
    return { branch: '', remote: '', baseBranch: '', localPath: process.cwd() };
  }
}

/**
 * Get requirements root directory
 */
function getRequirementsRoot() {
  const config = loadConfig();
  return expandHome(config.requirementsRoot || '~/.claude/requirements');
}

/**
 * Ensure directory exists
 */
async function ensureDir(dirPath) {
  try {
    await fsPromises.mkdir(dirPath, { recursive: true });
  } catch (_err) {
    // Directory may already exist
  }
}

/**
 * Initialize requirements directory structure
 */
async function initRequirementsDir() {
  const root = getRequirementsRoot();
  await ensureDir(root);
  await ensureDir(path.join(root, 'requirements'));
  await ensureDir(path.join(root, 'templates'));

  // Initialize index.json if it doesn't exist
  const indexPath = path.join(root, 'index.json');
  try {
    await fsPromises.access(indexPath);
  } catch (_err) {
    await fsPromises.writeFile(indexPath, JSON.stringify({ version: '1.0', requirements: [] }, null, 2));
  }

  return root;
}

/**
 * Create a new requirement
 */
async function createRequirement(name, type, description = '', acceptanceCriteria = []) {
  const config = loadConfig();
  const root = getRequirementsRoot();
  const template = loadTemplate(type);

  // Validate type against config
  const validTypes = Object.keys(config.workflows || {});
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid type "${type}". Valid types: ${validTypes.join(', ')}`);
  }

  // Generate ID and timestamps
  const id = generateRequirementId();
  const now = new Date().toISOString();
  const gitInfo = getGitInfo();

  // Build requirement from template
  const requirement = {
    id,
    name,
    type,
    status: 'pending',
    currentPhase: null,
    createdAt: now,
    updatedAt: now,
    git: gitInfo,
    description,
    acceptanceCriteria,
    progressLog: [
      { event: 'created', timestamp: now, details: { name, type } }
    ],
    progress: template ? { ...template.progress } : { phases: [] }
  };

  // If workflow has phases, set first phase as current
  if (requirement.progress.phases && requirement.progress.phases.length > 0) {
    const firstPhase = requirement.progress.phases[0];
    firstPhase.status = 'in_progress';
    requirement.currentPhase = firstPhase.name;
    requirement.progressLog.push({
      event: 'phase_entered',
      timestamp: now,
      details: { phase: firstPhase.name }
    });
  }

  // Write requirement file
  const reqDir = path.join(root, 'requirements');
  await ensureDir(reqDir);
  const reqPath = path.join(reqDir, `${id}.json`);
  await fsPromises.writeFile(reqPath, JSON.stringify(requirement, null, 2));

  // Update index
  await updateIndex();

  return requirement;
}

/**
 * Get requirement by ID
 */
async function getRequirement(id) {
  const root = getRequirementsRoot();
  const reqPath = path.join(root, 'requirements', `${id}.json`);

  try {
    const content = await fsPromises.readFile(reqPath, 'utf-8');
    return JSON.parse(content);
  } catch (_err) {
    return null;
  }
}

/**
 * List requirements with optional filter
 */
async function listRequirements(filter = {}) {
  const root = getRequirementsRoot();
  const reqDir = path.join(root, 'requirements');
  const indexPath = path.join(root, 'index.json');

  // Try to read from index first
  try {
    const indexContent = await fsPromises.readFile(indexPath, 'utf-8');
    const index = JSON.parse(indexContent);

    let requirements = index.requirements || [];

    // Apply filters
    if (filter.type) {
      requirements = requirements.filter(r => r.type === filter.type);
    }
    if (filter.status) {
      requirements = requirements.filter(r => r.status === filter.status);
    }
    if (filter.branch) {
      requirements = requirements.filter(r => r.git && r.git.branch === filter.branch);
    }

    return requirements;
  } catch (_err) {
    // Index doesn't exist, scan directory
  }

  // Fallback: scan directory
  try {
    const files = await fsPromises.readdir(reqDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    let requirements = [];
    for (const file of jsonFiles) {
      const content = await fsPromises.readFile(path.join(reqDir, file), 'utf-8');
      const req = JSON.parse(content);

      // Apply filters
      if (filter.type && req.type !== filter.type) continue;
      if (filter.status && req.status !== filter.status) continue;
      if (filter.branch && req.git && req.git.branch !== filter.branch) continue;

      requirements.push(req);
    }

    return requirements;
  } catch (_err) {
    return [];
  }
}

/**
 * Update requirement progress with enhanced logging
 * @param {string} id - Requirement ID
 * @param {string} phase - Phase name
 * @param {string} event - Event type (phase_entered, phase_completed, phase_blocked, user_message, decision, artifact_created)
 * @param {Object} details - Additional details including:
 *   - summary: Brief description of what happened (for all events)
 *   - decisions: Array of key decisions made
 *   - artifacts: Array of artifacts created/modified
 *   - nextSteps: Description of next steps
 *   - messages: Array of user message summaries (for user_message events)
 */
async function updateRequirementProgress(id, phase, event, details = {}) {
  const requirement = await getRequirement(id);
  if (!requirement) {
    throw new Error(`Requirement ${id} not found`);
  }

  const now = new Date().toISOString();

  // Build enhanced log entry
  const logEntry = {
    event,
    timestamp: now,
    phase,
    summary: details.summary || '',
    details: {}
  };

  // Add optional fields if present
  if (details.decisions && details.decisions.length > 0) {
    logEntry.details.decisions = details.decisions;
  }
  if (details.artifacts && details.artifacts.length > 0) {
    logEntry.details.artifacts = details.artifacts;
  }
  if (details.nextSteps) {
    logEntry.details.nextSteps = details.nextSteps;
  }
  if (details.messages && details.messages.length > 0) {
    logEntry.details.messages = details.messages;
  }
  if (details.error) {
    logEntry.details.error = details.error;
  }

  requirement.progressLog.push(logEntry);
  requirement.updatedAt = now;

  // Update phase status if specified
  if (phase && requirement.progress && requirement.progress.phases) {
    const phaseObj = requirement.progress.phases.find(p => p.name === phase);
    if (phaseObj) {
      if (event === 'phase_entered') {
        phaseObj.status = 'in_progress';
        requirement.currentPhase = phase;
      } else if (event === 'phase_completed') {
        phaseObj.status = 'completed';
      } else if (event === 'phase_blocked') {
        phaseObj.status = 'blocked';
      }
    }
  }

  // Save updated requirement
  const root = getRequirementsRoot();
  const reqPath = path.join(root, 'requirements', `${id}.json`);
  await fsPromises.writeFile(reqPath, JSON.stringify(requirement, null, 2));

  // Update index with progress info
  await updateIndex();

  return requirement;
}

/**
 * Advance to the next phase
 * @param {string} id - Requirement ID
 * @param {boolean} forceAdvance - If true, ignore manual mode and advance anyway
 * @returns {Object} - { requirement, needsManualConfirmation, nextPhase }
 */
async function advancePhase(id, forceAdvance = false) {
  const requirement = await getRequirement(id);
  if (!requirement) {
    throw new Error(`Requirement ${id} not found`);
  }

  const now = new Date().toISOString();
  const phases = requirement.progress?.phases || [];
  const currentPhaseName = requirement.currentPhase;

  // Find current phase index
  const currentIndex = phases.findIndex(p => p.name === currentPhaseName);

  if (currentIndex === -1) {
    throw new Error(`Current phase ${currentPhaseName} not found`);
  }

  // Mark current phase as completed
  const currentPhase = phases[currentIndex];
  currentPhase.status = 'completed';

  requirement.progressLog.push({
    event: 'phase_completed',
    timestamp: now,
    details: { phase: currentPhaseName }
  });

  // Create instinct from phase completion (async, non-blocking)
  createInstinctsFromPhase(requirement, currentPhaseName).catch(() => {});

  // Check if this phase requires manual confirmation before advancing
  const nextIndex = currentIndex + 1;
  const needsManualConfirmation = !forceAdvance &&
    currentPhase.mode === 'manual' &&
    nextIndex < phases.length;

  if (needsManualConfirmation) {
    // For manual mode phases, do NOT auto-advance - user must confirm
    requirement.updatedAt = now;

    // Save updated requirement (current phase completed)
    const root = getRequirementsRoot();
    const reqPath = path.join(root, 'requirements', `${id}.json`);
    await fsPromises.writeFile(reqPath, JSON.stringify(requirement, null, 2));

    // Update index to reflect latest status and progress
    await updateIndex();

    return {
      requirement,
      needsManualConfirmation: true,
      nextPhase: phases[nextIndex]?.name || null
    };
  }

  // Move to next phase (auto mode or force advance)
  if (nextIndex < phases.length) {
    const nextPhase = phases[nextIndex];
    nextPhase.status = 'in_progress';
    requirement.currentPhase = nextPhase.name;

    requirement.progressLog.push({
      event: 'phase_entered',
      timestamp: now,
      details: { phase: nextPhase.name }
    });
  } else {
    // All phases completed
    requirement.currentPhase = null;
    requirement.status = 'completed';
    // Create instinct from completed requirement (async, non-blocking)
    createInstinctsFromRequirement(requirement).catch(() => {});
  }

  requirement.updatedAt = now;

  // Save updated requirement
  const root = getRequirementsRoot();
  const reqPath = path.join(root, 'requirements', `${id}.json`);
  await fsPromises.writeFile(reqPath, JSON.stringify(requirement, null, 2));

  // Update index to reflect latest status and progress
  await updateIndex();

  return {
    requirement,
    needsManualConfirmation: false,
    nextPhase: nextIndex < phases.length ? phases[nextIndex].name : null
  };
}

/**
 * Guess the current requirement based on git info and pwd
 * Priority: git branch > remote URL > localPath > recent activity
 */
async function guessCurrentRequirement() {
  const gitInfo = getGitInfo();
  const cwd = process.cwd();

  // Try to find matching requirement
  const requirements = await listRequirements();

  // Priority 1: Match by git branch
  if (gitInfo.branch) {
    const match = requirements.find(r =>
      r.git && r.git.branch === gitInfo.branch && r.status !== 'completed'
    );
    if (match) return match;
  }

  // Priority 2: Match by remote URL
  if (gitInfo.remote) {
    const match = requirements.find(r =>
      r.git && r.git.remote === gitInfo.remote && r.status !== 'completed'
    );
    if (match) return match;
  }

  // Priority 3: Match by local path
  const match = requirements.find(r =>
    r.git && r.git.localPath === cwd && r.status !== 'completed'
  );
  if (match) return match;

  // Priority 4: Most recently updated in_progress requirement
  const inProgress = requirements.filter(r => r.status === 'in_progress');
  if (inProgress.length > 0) {
    inProgress.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    return inProgress[0];
  }

  return null;
}

/**
 * Update index from all requirement files
 */
async function updateIndex() {
  const root = getRequirementsRoot();
  const reqDir = path.join(root, 'requirements');
  const indexPath = path.join(root, 'index.json');

  try {
    const files = await fsPromises.readdir(reqDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const requirements = [];
    for (const file of jsonFiles) {
      try {
        const content = await fsPromises.readFile(path.join(reqDir, file), 'utf-8');
        const req = JSON.parse(content);
        // Include summary for index
        requirements.push({
          id: req.id,
          name: req.name,
          type: req.type,
          status: req.status,
          currentPhase: req.currentPhase,
          createdAt: req.createdAt,
          updatedAt: req.updatedAt,
          git: req.git
        });
      } catch (_err) {
        // Skip invalid files
      }
    }

    // Sort by updatedAt descending
    requirements.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    const index = {
      version: '1.0',
      updatedAt: new Date().toISOString(),
      requirements
    };

    await fsPromises.writeFile(indexPath, JSON.stringify(index, null, 2));

    return index;
  } catch (_err) {
    return { version: '1.0', requirements: [] };
  }
}

/**
 * Get project ID for instincts based on git remote URL
 */
function getProjectId() {
  const gitInfo = getGitInfo();
  if (gitInfo.remote) {
    // Create a simple hash from remote URL for project identification
    const crypto = require('crypto');
    return crypto.createHash('md5').update(gitInfo.remote).digest('hex').substring(0, 12);
  }
  return 'global';
}

/**
 * Create an instinct file for requirement development patterns
 * @param {Object} instinctData - The instinct data
 */
async function createInstinct(instinctData) {
  const os = require('os');
  const homunculusDir = path.join(os.homedir(), '.claude', 'homunculus');
  const projectId = getProjectId();
  const instinctsDir = path.join(homunculusDir, 'projects', projectId, 'instincts');

  try {
    await ensureDir(instinctsDir);

    const instinctId = instinctData.id || `rpt-${Date.now()}`;
    const instinctPath = path.join(instinctsDir, `${instinctId}.md`);

    const content = `---
id: ${instinctId}
trigger: "${instinctData.trigger || ''}"
confidence: ${instinctData.confidence || 0.6}
domain: "${instinctData.domain || 'workflow'}"
source: "requirement-progress-tracker"
scope: project
project_id: "${projectId}"
project_name: "${path.basename(getGitInfo().localPath || 'unknown')}"
---

# ${instinctData.title || 'RPT Pattern'}

## Action
${instinctData.action || ''}

## Evidence
${instinctData.evidence || ''}

## Lessons
${instinctData.lessons || ''}
`;

    await fsPromises.writeFile(instinctPath, content);
    console.log(`[Progress] Created instinct: ${instinctId}`);
    return instinctId;
  } catch (err) {
    console.error(`[Progress] Failed to create instinct: ${err.message}`);
    return null;
  }
}

/**
 * Extract insights from a completed requirement and create instincts
 * @param {Object} requirement - The completed requirement
 */
async function createInstinctsFromRequirement(requirement) {
  if (requirement.status !== 'completed') return;

  const phases = requirement.progress?.phases || [];
  const completedCount = phases.filter(p => p.status === 'completed').length;

  // Create instinct for overall requirement workflow
  await createInstinct({
    id: `rpt-${requirement.type}-workflow-${Date.now()}`,
    trigger: `when completing a ${requirement.type} type requirement`,
    confidence: 0.7,
    domain: 'workflow',
    title: `RPT ${requirement.type} workflow pattern`,
    action: `Follow the ${requirement.type} workflow with ${phases.length} phases: ${phases.map(p => p.name).join(' -> ')}`,
    evidence: `Completed ${completedCount} phases for requirement: ${requirement.name}`,
    lessons: phases.map(p => `- ${p.name} (${p.mode}): ${p.status}`).join('\n')
  });

  // Create instinct for manual phase handling
  const manualPhases = phases.filter(p => p.mode === 'manual');
  if (manualPhases.length > 0) {
    await createInstinct({
      id: `rpt-manual-phase-handling-${Date.now()}`,
      trigger: 'when encountering a manual phase in requirement workflow',
      confidence: 0.8,
      domain: 'workflow',
      title: 'Manual phase confirmation pattern',
      action: 'Manual phases require explicit user confirmation before advancing. Do not auto-advance.',
      evidence: `Manual phases in ${requirement.name}: ${manualPhases.map(p => p.name).join(', ')}`,
      lessons: 'Always wait for user "继续" confirmation at manual phases like review and verify.'
    });
  }
}

/**
 * Extract insights from a completed phase and create instincts
 * @param {Object} requirement - The requirement
 * @param {string} phaseName - The completed phase name
 * @param {Object} context - Additional context (decisions, artifacts, etc.)
 */
async function createInstinctsFromPhase(requirement, phaseName, context = {}) {
  const phaseInsights = {
    plan: {
      trigger: 'when starting a new requirement planning phase',
      title: 'Planning phase best practices',
      action: 'Define clear acceptance criteria, identify dependencies, break into phases.',
      lessons: context.summary || 'Planning creates foundation for implementation.'
    },
    design: {
      trigger: 'when entering design phase',
      title: 'Design phase best practices',
      action: 'Create architecture diagrams, define interfaces, document decisions.',
      lessons: context.summary || 'Design should be reviewed before implementation.'
    },
    implement: {
      trigger: 'when implementing a requirement',
      title: 'Implementation best practices',
      action: 'Follow TDD, write tests first, keep functions small.',
      lessons: context.summary || 'Implementation follows the plan and design.'
    },
    test: {
      trigger: 'when testing implemented code',
      title: 'Testing phase best practices',
      action: 'Verify all acceptance criteria, run existing tests, add new tests.',
      lessons: context.summary || 'Testing validates implementation correctness.'
    },
    review: {
      trigger: 'when entering code review phase',
      title: 'Review phase pattern',
      action: 'Review code quality, security, performance. Wait for explicit confirmation.',
      lessons: context.summary || 'Review requires manual confirmation before proceeding.'
    },
    verify: {
      trigger: 'when verifying acceptance criteria',
      title: 'Verification phase pattern',
      action: 'Check each acceptance criterion, document verification results.',
      lessons: context.summary || 'Verification confirms all acceptance criteria are met.'
    },
    commit: {
      trigger: 'when committing completed work',
      title: 'Commit phase best practices',
      action: 'Use conventional commits, include test plan in PR description.',
      lessons: context.summary || 'Commit should be atomic and well-documented.'
    }
  };

  const insight = phaseInsights[phaseName];
  if (insight) {
    await createInstinct({
      id: `rpt-${phaseName}-pattern-${Date.now()}`,
      trigger: insight.trigger,
      confidence: 0.7,
      domain: 'workflow',
      title: insight.title,
      action: insight.action,
      evidence: `Phase ${phaseName} completed for ${requirement.name}`,
      lessons: insight.lessons + (context.decisions ? '\n\nDecisions:\n' + context.decisions.map(d => `- ${d}`).join('\n') : '')
    });
  }
}

/**
 * Extract lessons from session progress and create instincts
 * @param {Object} requirement - The current requirement
 * @param {string} sessionSummary - Summary of session work
 */
async function createInstinctsFromSession(requirement, sessionSummary) {
  if (!sessionSummary || sessionSummary.length < 10) return;

  // Create instinct from session lessons
  await createInstinct({
    id: `rpt-session-${Date.now()}`,
    trigger: 'when continuing a requirement development session',
    confidence: 0.5,
    domain: 'workflow',
    title: `Session lesson from ${requirement.name}`,
    action: 'Review progressLog to understand completed phases and next steps.',
    evidence: `Session summary: ${sessionSummary.substring(0, 200)}`,
    lessons: sessionSummary
  });
}

// Export functions
module.exports = {
  generateRequirementId,
  createRequirement,
  getRequirement,
  listRequirements,
  updateRequirementProgress,
  advancePhase,
  guessCurrentRequirement,
  updateIndex,
  initRequirementsDir,
  getRequirementsRoot,
  getGitInfo,
  loadConfig,
  expandHome,
  createInstinct,
  createInstinctsFromRequirement,
  createInstinctsFromPhase,
  createInstinctsFromSession
};

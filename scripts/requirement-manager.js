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
 * @param {string} location - 'project' or 'user', default 'project'
 */
function getRequirementsRoot(location = 'project') {
  const config = loadConfig();
  if (location === 'project') {
    // Project-level: use {cwd}/.requirements/
    return path.join(process.cwd(), '.requirements');
  }
  // User-level: use configured path
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
 * @param {string} location - 'project' or 'user'
 */
async function initRequirementsDir(location = 'project') {
  const root = getRequirementsRoot(location);
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
 * @param {string} name - Requirement name
 * @param {string} type - Workflow type (micro/small/medium/large/extra-large/continuous)
 * @param {string} description - Requirement description
 * @param {string[]} acceptanceCriteria - Acceptance criteria list
 * @param {string} location - Storage location: 'project' (default) or 'user'
 */
async function createRequirement(name, type, description = '', acceptanceCriteria = [], location = 'project') {
  const config = loadConfig();
  const root = getRequirementsRoot(location);
  const template = loadTemplate(type);

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
    storageLocation: location,
    description,
    acceptanceCriteria,
    progressLog: [
      { event: 'created', timestamp: now, details: { name, type, location } }
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
 * Get requirement by ID (searches in both project and user locations)
 */
async function getRequirement(id) {
  // Try project-level first, then user-level
  const locations = ['project', 'user'];
  for (const loc of locations) {
    const root = getRequirementsRoot(loc);
    const reqPath = path.join(root, 'requirements', `${id}.json`);
    try {
      const content = await fsPromises.readFile(reqPath, 'utf-8');
      return JSON.parse(content);
    } catch (_err) {
      // Not found in this location, try next
    }
  }
  return null;
}

/**
 * List requirements with optional filter (searches in both project and user locations)
 */
async function listRequirements(filter = {}) {
  const locations = ['project', 'user'];
  let allRequirements = [];

  for (const loc of locations) {
    const root = getRequirementsRoot(loc);
    const reqDir = path.join(root, 'requirements');
    const indexPath = path.join(root, 'index.json');

    // Try to read from index first
    try {
      const indexContent = await fsPromises.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexContent);
      let requirements = index.requirements || [];

      // Add storage location to each
      requirements = requirements.map(r => ({ ...r, storageLocation: loc }));

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
      if (filter.location) {
        requirements = requirements.filter(r => r.storageLocation === filter.location);
      }

      allRequirements = allRequirements.concat(requirements);
      continue;
    } catch (_err) {
      // Index doesn't exist, scan directory
    }

    // Fallback: scan directory
    try {
      const files = await fsPromises.readdir(reqDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      for (const file of jsonFiles) {
        const content = await fsPromises.readFile(path.join(reqDir, file), 'utf-8');
        const req = JSON.parse(content);
        req.storageLocation = loc;

        // Apply filters
        if (filter.type && req.type !== filter.type) continue;
        if (filter.status && req.status !== filter.status) continue;
        if (filter.branch && req.git && req.git.branch !== filter.branch) continue;
        if (filter.location && req.storageLocation !== filter.location) continue;

        allRequirements.push(req);
      }
    } catch (_err) {
      // Directory may not exist
    }
  }

  // Sort by updatedAt descending
  allRequirements.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  return allRequirements;
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

  // Save updated requirement (use the requirement's stored location)
  const root = getRequirementsRoot(requirement.storageLocation || 'project');
  const reqPath = path.join(root, 'requirements', `${id}.json`);
  await fsPromises.writeFile(reqPath, JSON.stringify(requirement, null, 2));

  // Update index with progress info
  await updateIndex(requirement.storageLocation || 'project');

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

  // Check if this phase requires manual confirmation before advancing
  const nextIndex = currentIndex + 1;
  const needsManualConfirmation = !forceAdvance &&
    currentPhase.mode === 'manual' &&
    nextIndex < phases.length;

  if (needsManualConfirmation) {
    // For manual mode phases, do NOT auto-advance - user must confirm
    requirement.updatedAt = now;

    // Save updated requirement (current phase completed)
    const loc = requirement.storageLocation || 'project';
    const root = getRequirementsRoot(loc);
    const reqPath = path.join(root, 'requirements', `${id}.json`);
    await fsPromises.writeFile(reqPath, JSON.stringify(requirement, null, 2));

    // Update index to reflect latest status and progress
    await updateIndex(loc);

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
  }

  requirement.updatedAt = now;

  // Save updated requirement
  const loc = requirement.storageLocation || 'project';
  const root = getRequirementsRoot(loc);
  const reqPath = path.join(root, 'requirements', `${id}.json`);
  await fsPromises.writeFile(reqPath, JSON.stringify(requirement, null, 2));

  // Update index to reflect latest status and progress
  await updateIndex(loc);

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
 * Update index from all requirement files in the specified location
 * @param {string} location - 'project' or 'user'
 */
async function updateIndex(location = 'project') {
  const root = getRequirementsRoot(location);
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

// Import workflow orchestrator functions
const {
  getAgentForPhase,
  getAgentNameForPhase,
  phaseHasAgent,
  getNextPhase,
  needsManualConfirmation,
  executePhase,
  generatePhaseHandoff: orchestratorGenerateHandoff,
  getWorkflowStatus: getOrchestratorStatus
} = require('./lib/ecc-workflow-orchestrator');

/**
 * Get Agent information for a specific phase
 * @param {string} id - Requirement ID
 * @param {string} phaseName - Phase name to get Agent for
 * @returns {Object} - { agentPath, agentName, hasAgent }
 */
async function invokePhaseAgent(id, phaseName) {
  const requirement = await getRequirement(id);
  if (!requirement) {
    throw new Error(`Requirement ${id} not found`);
  }

  return {
    agentPath: getAgentForPhase(phaseName),
    agentName: getAgentNameForPhase(phaseName),
    hasAgent: phaseHasAgent(phaseName)
  };
}

/**
 * Get the next Agent that will be invoked based on current phase
 * @param {string} id - Requirement ID
 * @returns {Object} - { nextPhase, nextAgent, nextAgentPath, hasAgent }
 */
async function getNextPhaseAgent(id) {
  const requirement = await getRequirement(id);
  if (!requirement) {
    throw new Error(`Requirement ${id} not found`);
  }

  const currentPhase = requirement.currentPhase;
  const phases = requirement.progress?.phases || [];

  if (!currentPhase) {
    return { nextPhase: null, nextAgent: null, nextAgentPath: null, hasAgent: false };
  }

  const nextPhase = getNextPhase(phases, currentPhase);

  if (!nextPhase) {
    return { nextPhase: null, nextAgent: null, nextAgentPath: null, hasAgent: false };
  }

  return {
    nextPhase: nextPhase.name,
    nextAgent: getAgentNameForPhase(nextPhase.name),
    nextAgentPath: getAgentForPhase(nextPhase.name),
    hasAgent: phaseHasAgent(nextPhase.name)
  };
}

/**
 * Check if a specific phase needs manual confirmation
 * @param {string} id - Requirement ID
 * @param {string} phaseName - Phase name to check
 * @returns {boolean} - True if manual confirmation is needed
 */
async function checkPhaseNeedsConfirmation(id, phaseName) {
  const requirement = await getRequirement(id);
  if (!requirement) {
    throw new Error(`Requirement ${id} not found`);
  }

  const phases = requirement.progress?.phases || [];
  const phase = phases.find(p => p.name === phaseName);

  return needsManualConfirmation(phase);
}

/**
 * Generate a handoff document for a phase transition
 * @param {string} id - Requirement ID
 * @param {string} fromPhase - Completed phase name
 * @param {string} toPhase - Next phase name
 * @param {Object} phaseData - Optional phase execution data
 * @returns {Promise<string>} - Path to saved handoff file
 */
async function generatePhaseHandoff(id, fromPhase, toPhase, phaseData = {}) {
  const requirement = await getRequirement(id);
  if (!requirement) {
    throw new Error(`Requirement ${id} not found`);
  }

  return orchestratorGenerateHandoff(requirement, fromPhase, toPhase, phaseData);
}

/**
 * Get detailed workflow status for a requirement
 * @param {string} id - Requirement ID
 * @returns {Promise<Object>} - Workflow status details
 */
async function getWorkflowStatus(id) {
  const requirement = await getRequirement(id);
  if (!requirement) {
    throw new Error(`Requirement ${id} not found`);
  }

  const status = getOrchestratorStatus(requirement);

  // Add requirement details
  return {
    ...status,
    requirementName: requirement.name,
    description: requirement.description,
    acceptanceCriteria: requirement.acceptanceCriteria,
    progressLog: requirement.progressLog.slice(-5), // Last 5 entries
    storageLocation: requirement.storageLocation
  };
}

/**
 * Transform acceptance criteria to structured format with IDs
 * @param {string} id - Requirement ID
 * @returns {Promise<Object>} - Updated requirement with structured AC
 */
async function structureAcceptanceCriteria(id) {
  const requirement = await getRequirement(id);
  if (!requirement) {
    throw new Error(`Requirement ${id} not found`);
  }

  // If already structured, return as-is
  if (requirement.acceptanceCriteria && requirement.acceptanceCriteria.length > 0 &&
      typeof requirement.acceptanceCriteria[0] === 'object') {
    return requirement;
  }

  // Transform string array to structured format
  const structured = requirement.acceptanceCriteria.map((ac, index) => ({
    id: `AC-${index + 1}`,
    description: ac,
    status: 'unchecked',
    verifiedAt: null,
    verifiedBy: null,
    notes: ''
  }));

  requirement.acceptanceCriteria = structured;
  requirement.updatedAt = new Date().toISOString();

  // Save
  const root = getRequirementsRoot(requirement.storageLocation || 'project');
  const reqPath = path.join(root, 'requirements', `${id}.json`);
  await fsPromises.writeFile(reqPath, JSON.stringify(requirement, null, 2));

  return requirement;
}

/**
 * Update acceptance criteria status
 * @param {string} id - Requirement ID
 * @param {string} acId - Acceptance criteria ID (e.g., 'AC-1')
 * @param {string} status - New status ('checked', 'unchecked', 'partial')
 * @param {string} notes - Optional notes
 * @returns {Promise<Object>} - Updated acceptance criteria
 */
async function updateAcceptanceCriteriaStatus(id, acId, status, notes = '') {
  const requirement = await getRequirement(id);
  if (!requirement) {
    throw new Error(`Requirement ${id} not found`);
  }

  if (!requirement.acceptanceCriteria || typeof requirement.acceptanceCriteria[0] !== 'object') {
    throw new Error('Acceptance criteria not structured. Call structureAcceptanceCriteria first.');
  }

  const ac = requirement.acceptanceCriteria.find(a => a.id === acId);
  if (!ac) {
    throw new Error(`Acceptance criteria ${acId} not found`);
  }

  ac.status = status;
  ac.verifiedAt = new Date().toISOString();
  ac.verifiedBy = os.userInfo().username || process.env.USER || 'unknown';
  if (notes) {
    ac.notes = notes;
  }

  requirement.updatedAt = new Date().toISOString();

  // Save
  const root = getRequirementsRoot(requirement.storageLocation || 'project');
  const reqPath = path.join(root, 'requirements', `${id}.json`);
  await fsPromises.writeFile(reqPath, JSON.stringify(requirement, null, 2));

  return requirement;
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
  // New workflow integration functions
  invokePhaseAgent,
  getNextPhaseAgent,
  checkPhaseNeedsConfirmation,
  generatePhaseHandoff,
  getWorkflowStatus,
  structureAcceptanceCriteria,
  updateAcceptanceCriteriaStatus
};

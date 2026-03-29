/**
 * Phase Agent Mapper
 *
 * Maps workflow phase names to corresponding ECC Agent files.
 * Used by the workflow orchestrator to determine which Agent to invoke for each phase.
 */

const path = require('path');

// Phase to Agent file mapping
const PHASE_AGENT_MAP = {
  'brainstorm': 'agents/requirement-workflow.md',
  'plan': 'agents/planner.md',
  'design': 'agents/design-workflow.md',
  'ideation': 'agents/planner.md',
  'research': 'agents/planner.md',
  'implement': 'agents/tdd-guide.md',
  'test-first': 'agents/tdd-guide.md',
  'test': 'agents/tdd-guide.md',
  'review': 'agents/code-reviewer.md',
  'security': 'agents/security-reviewer.md',
  'e2e': 'agents/e2e-runner.md',
  'optimize': 'agents/planner.md',
  'verify': 'agents/code-reviewer.md'
};

/**
 * Get the Agent file path for a given phase name
 * @param {string} phaseName - The phase name (e.g., 'plan', 'implement', 'review')
 * @returns {string|null} - The relative path to the Agent file, or null if not found
 */
function getAgentForPhase(phaseName) {
  return PHASE_AGENT_MAP[phaseName] || null;
}

/**
 * Get the Agent name for a given phase name
 * @param {string} phaseName - The phase name
 * @returns {string|null} - The Agent name (e.g., 'planner', 'tdd-guide'), or null if not found
 */
function getAgentNameForPhase(phaseName) {
  const agentPath = getAgentForPhase(phaseName);
  if (!agentPath) return null;

  // Extract agent name from path
  // e.g., 'agents/planner.md' -> 'planner'
  // e.g., 'agents/tdd-guide.md' -> 'tdd-guide'
  const filename = path.basename(agentPath, path.extname(agentPath));
  return filename;
}

/**
 * Check if a phase has an associated Agent
 * @param {string} phaseName - The phase name
 * @returns {boolean} - True if the phase has an associated Agent
 */
function phaseHasAgent(phaseName) {
  return getAgentForPhase(phaseName) !== null;
}

/**
 * Get all registered phase names
 * @returns {string[]} - Array of phase names that have Agent mappings
 */
function getRegisteredPhases() {
  return Object.keys(PHASE_AGENT_MAP);
}

/**
 * Get all phases that map to a specific Agent
 * @param {string} agentName - The Agent name (e.g., 'planner', 'tdd-guide')
 * @returns {string[]} - Array of phase names that map to this Agent
 */
function getPhasesForAgent(agentName) {
  return Object.entries(PHASE_AGENT_MAP)
    .filter(([_, agentPath]) => {
      const filename = path.basename(agentPath, path.extname(agentPath));
      return filename === agentName;
    })
    .map(([phaseName]) => phaseName);
}

module.exports = {
  PHASE_AGENT_MAP,
  getAgentForPhase,
  getAgentNameForPhase,
  phaseHasAgent,
  getRegisteredPhases,
  getPhasesForAgent
};

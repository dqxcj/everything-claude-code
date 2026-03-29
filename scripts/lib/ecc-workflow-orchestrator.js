/**
 * ECC Workflow Orchestrator
 *
 * Core engine that coordinates phase execution, Agent invocation,
 * and handoff generation for the requirement progress tracker.
 */

const path = require('path');
const { getAgentForPhase, getAgentNameForPhase, phaseHasAgent } = require('./phase-agent-mapper');
const { generateHandoff, saveHandoff, loadHandoff, listHandoffs } = require('./handoff-generator');

/**
 * Get the next phase in the workflow
 * @param {Array} phases - Array of phase objects with name and status
 * @param {string} currentPhaseName - Current phase name
 * @returns {Object|null} - Next phase object or null if at end
 */
function getNextPhase(phases, currentPhaseName) {
  const currentIndex = phases.findIndex(p => p.name === currentPhaseName);
  if (currentIndex === -1 || currentIndex >= phases.length - 1) {
    return null;
  }
  return phases[currentIndex + 1];
}

/**
 * Check if a phase needs manual confirmation
 * @param {Object} phase - Phase object with mode property
 * @returns {boolean} - True if the phase requires manual confirmation
 */
function needsManualConfirmation(phase) {
  return phase !== null && phase !== undefined && phase.mode === 'manual';
}

/**
 * Execute a phase with its associated Agent
 * Returns instructions for how to invoke the Agent
 * @param {Object} requirement - The requirement object
 * @param {string} phaseName - Name of the phase to execute
 * @returns {Object} - Execution plan with Agent info and context
 */
function executePhase(requirement, phaseName) {
  const agentPath = getAgentForPhase(phaseName);
  const agentName = getAgentNameForPhase(phaseName);

  return {
    phaseName,
    agentPath,
    agentName,
    hasAgent: agentPath !== null,
    requirement: {
      id: requirement.id,
      name: requirement.name,
      description: requirement.description,
      acceptanceCriteria: requirement.acceptanceCriteria
    },
    context: {
      currentPhase: phaseName,
      workflowType: requirement.type,
      storageLocation: requirement.storageLocation
    }
  };
}

/**
 * Build handoff context from phase execution result
 * @param {Object} requirement - The requirement object
 * @param {string} fromPhase - Completed phase name
 * @param {string} toPhase - Next phase name
 * @param {Object} phaseData - Optional data from phase execution
 * @returns {Object} - Context for handoff generation
 */
function buildHandoffContext(requirement, fromPhase, toPhase, phaseData = {}) {
  const nextAgent = getAgentForPhase(toPhase) ? getAgentNameForPhase(toPhase) : null;

  return {
    requirementId: requirement.id,
    requirementName: requirement.name,
    fromPhase,
    toPhase,
    phaseResult: {
      summary: phaseData.summary || `Completed ${fromPhase} phase`,
      decisions: phaseData.decisions || [],
      artifacts: phaseData.artifacts || [],
      openQuestions: phaseData.openQuestions || [],
      nextSteps: phaseData.nextSteps || [],
      metrics: phaseData.metrics || {}
    },
    nextAgent,
    nextAgentReason: nextAgent
      ? `Phase '${toPhase}' is mapped to the ${nextAgent} agent`
      : null
  };
}

/**
 * Generate and save a handoff document
 * @param {Object} requirement - The requirement object
 * @param {string} fromPhase - Completed phase name
 * @param {string} toPhase - Next phase name
 * @param {Object} phaseData - Optional data from phase execution
 * @returns {Promise<string>} - Path to saved handoff file
 */
async function generatePhaseHandoff(requirement, fromPhase, toPhase, phaseData = {}) {
  const context = buildHandoffContext(requirement, fromPhase, toPhase, phaseData);
  const content = generateHandoff(context);
  const filepath = await saveHandoff(content, requirement.id, fromPhase, toPhase);
  return filepath;
}

/**
 * Get workflow status summary
 * @param {Object} requirement - The requirement object
 * @returns {Object} - Status summary
 */
function getWorkflowStatus(requirement) {
  const phases = requirement.progress?.phases || [];
  const completedPhases = phases.filter(p => p.status === 'completed');
  const currentPhase = phases.find(p => p.status === 'in_progress');
  const pendingPhases = phases.filter(p => p.status === 'pending');

  return {
    requirementId: requirement.id,
    requirementName: requirement.name,
    status: requirement.status,
    currentPhase: currentPhase?.name || null,
    currentPhaseMode: currentPhase?.mode || null,
    currentPhaseNeedsConfirmation: currentPhase ? needsManualConfirmation(currentPhase) : false,
    completedCount: completedPhases.length,
    totalPhases: phases.length,
    progressPercent: phases.length > 0 ? Math.round((completedPhases.length / phases.length) * 100) : 0,
    nextPhase: currentPhase ? getNextPhase(phases, currentPhase.name) : null,
    nextPhaseHasAgent: currentPhase ? phaseHasAgent(getNextPhase(phases, currentPhase.name)?.name) : false
  };
}

module.exports = {
  getNextPhase,
  needsManualConfirmation,
  executePhase,
  buildHandoffContext,
  generatePhaseHandoff,
  getWorkflowStatus,
  loadHandoff,
  listHandoffs,
  getAgentForPhase,
  getAgentNameForPhase,
  phaseHasAgent
};

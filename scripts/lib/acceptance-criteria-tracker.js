/**
 * Acceptance Criteria Tracker
 *
 * Provides structured tracking for acceptance criteria with
 * status management and verification logging.
 */

/**
 * Transform string array acceptance criteria to structured format
 * @param {string[]} acceptanceCriteria - Array of string criteria
 * @returns {Array} - Structured acceptance criteria with IDs and status
 */
function structureAcceptanceCriteria(acceptanceCriteria) {
  if (!acceptanceCriteria || !Array.isArray(acceptanceCriteria)) {
    return [];
  }

  // If already structured, return as-is
  if (acceptanceCriteria.length > 0 && typeof acceptanceCriteria[0] === 'object') {
    return acceptanceCriteria;
  }

  return acceptanceCriteria.map((criteria, index) => ({
    id: `AC-${index + 1}`,
    description: criteria,
    status: 'unchecked',
    verifiedAt: null,
    verifiedBy: null,
    notes: ''
  }));
}

/**
 * Get summary statistics for acceptance criteria
 * @param {Array} acceptanceCriteria - Structured acceptance criteria
 * @returns {Object} - Summary stats
 */
function getCriteriaSummary(acceptanceCriteria) {
  if (!acceptanceCriteria || !Array.isArray(acceptanceCriteria) || acceptanceCriteria.length === 0) {
    return {
      total: 0,
      checked: 0,
      unchecked: 0,
      partial: 0,
      percentComplete: 0
    };
  }

  const total = acceptanceCriteria.length;
  const checked = acceptanceCriteria.filter(ac => ac.status === 'checked').length;
  const unchecked = acceptanceCriteria.filter(ac => ac.status === 'unchecked').length;
  const partial = acceptanceCriteria.filter(ac => ac.status === 'partial').length;

  return {
    total,
    checked,
    unchecked,
    partial,
    percentComplete: Math.round((checked / total) * 100)
  };
}

/**
 * Format acceptance criteria as a checklist markdown
 * @param {Array} acceptanceCriteria - Structured acceptance criteria
 * @param {Object} options - Display options
 * @returns {string} - Markdown checklist
 */
function formatCriteriaChecklist(acceptanceCriteria, options = {}) {
  const { showId = true, showStatus = true } = options;

  if (!acceptanceCriteria || acceptanceCriteria.length === 0) {
    return '_No acceptance criteria defined_';
  }

  const lines = acceptanceCriteria.map(ac => {
    const checkbox = ac.status === 'checked' ? '[x]' : ac.status === 'partial' ? '[~]' : '[ ]';
    const id = showId ? `**${ac.id}**: ` : '';
    const status = showStatus ? ` _(${ac.status})_` : '';
    return `${checkbox} ${id}${ac.description}${status}`;
  });

  return lines.join('\n');
}

/**
 * Check if all acceptance criteria are met
 * @param {Array} acceptanceCriteria - Structured acceptance criteria
 * @returns {boolean} - True if all criteria are checked
 */
function isAllCriteriaMet(acceptanceCriteria) {
  if (!acceptanceCriteria || !Array.isArray(acceptanceCriteria) || acceptanceCriteria.length === 0) {
    return false;
  }

  return acceptanceCriteria.every(ac => ac.status === 'checked');
}

/**
 * Get criteria by status
 * @param {Array} acceptanceCriteria - Structured acceptance criteria
 * @param {string} status - Status to filter by ('checked', 'unchecked', 'partial')
 * @returns {Array} - Filtered criteria
 */
function getCriteriaByStatus(acceptanceCriteria, status) {
  if (!acceptanceCriteria || !Array.isArray(acceptanceCriteria)) {
    return [];
  }

  return acceptanceCriteria.filter(ac => ac.status === status);
}

module.exports = {
  structureAcceptanceCriteria,
  getCriteriaSummary,
  formatCriteriaChecklist,
  isAllCriteriaMet,
  getCriteriaByStatus
};

#!/usr/bin/env node

/**
 * Stop Hook: Update requirement progress on session end
 *
 * Reads CLAUDE_CURRENT_REQUIREMENT_ID and CLAUDE_CURRENT_PHASE from environment
 * and session summary from stdin, then updates the requirement progress.
 *
 * Usage:
 *   CLAUDE_CURRENT_REQUIREMENT_ID=req-20260322-120000
 *   CLAUDE_CURRENT_PHASE=planning
 *   node update-progress-hook.js < session_summary.txt
 */

const { updateRequirementProgress } = require('../requirement-manager');

const MAX_STDIN = 1024 * 1024; // 1MB limit

async function main() {
  // Get requirement ID from environment variable
  const requirementId = process.env.CLAUDE_CURRENT_REQUIREMENT_ID;
  if (!requirementId) {
    console.log('[Progress] No active requirement, skipping update');
    return;
  }

  // Get current phase from environment variable
  const currentPhase = process.env.CLAUDE_CURRENT_PHASE || 'unknown';

  // Read session summary from stdin
  let sessionSummary = '';
  if (process.stdin.isTTY) {
    // No stdin data available
    sessionSummary = '';
  } else {
    sessionSummary = await new Promise(resolve => {
      let data = '';
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', chunk => {
        const remaining = MAX_STDIN - data.length;
        if (remaining > 0) {
          data += chunk.substring(0, remaining);
        }
      });
      process.stdin.on('end', () => resolve(data));
    });
  }

  try {
    await updateRequirementProgress(
      requirementId,
      currentPhase,
      'note',
      { summary: sessionSummary.slice(0, 500) }
    );
    console.log(`[Progress] Updated requirement ${requirementId}`);
  } catch (err) {
    // Don't fail the hook if requirement update fails
    console.error(`[Progress] Failed to update requirement ${requirementId}: ${err.message}`);
  }
}

main().catch(err => {
  console.error(`[Progress] Hook error: ${err.message}`);
  // Don't exit with error code to avoid blocking session end
  process.exit(0);
});

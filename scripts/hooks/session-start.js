#!/usr/bin/env node
/**
 * SessionStart Hook - Load previous context on new session
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs when a new Claude session starts. Loads the most recent session
 * summary into Claude's context via stdout, and reports available
 * sessions and learned skills.
 */

const {
  getSessionsDir,
  getLearnedSkillsDir,
  findFiles,
  ensureDir,
  readFile,
  stripAnsi,
  log,
  output
} = require('../lib/utils');
const { getPackageManager, getSelectionPrompt } = require('../lib/package-manager');
const { listAliases } = require('../lib/session-aliases');
const { detectProjectType } = require('../lib/project-detect');
const path = require('path');
const os = require('os');
const fs = require('fs');

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
 * Get requirements root directory
 */
function getRequirementsRoot() {
  // Try to load from config first
  const configPath = path.join(__dirname, '../../requirements/config.json5');
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      // Simple comment stripping
      const cleaned = content
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');
      const config = JSON.parse(cleaned);
      if (config.requirementsRoot) {
        return expandHome(config.requirementsRoot);
      }
    }
  } catch (_err) {
    // Fall through to default
  }
  return path.join(os.homedir(), '.claude/requirements');
}

/**
 * Load requirements index
 */
function loadRequirementsIndex() {
  const root = getRequirementsRoot();
  const indexPath = path.join(root, 'index.json');

  try {
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (_err) {
    // No index or parse error
  }
  return { version: '1.0', requirements: [] };
}

/**
 * Get current git info
 */
function getGitInfo() {
  const { execSync } = require('child_process');
  try {
    const cwd = process.cwd();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd, encoding: 'utf-8' }).trim();
    return { branch, localPath: cwd };
  } catch (_err) {
    return { branch: '', localPath: process.cwd() };
  }
}

/**
 * Load requirements and output context
 */
function loadRequirementsContext() {
  try {
    const index = loadRequirementsIndex();
    const gitInfo = getGitInfo();

    if (index.requirements.length === 0) {
      return null;
    }

    // Find requirements matching current git context
    const activeRequirements = index.requirements.filter(req => {
      if (req.git) {
        if (req.git.branch === gitInfo.branch) return true;
        if (req.git.localPath === gitInfo.localPath) return true;
      }
      return false;
    });

    // If no match, show all in_progress requirements
    const inProgressReqs = index.requirements.filter(req => req.status === 'in_progress');

    if (activeRequirements.length > 0) {
      let context = '\n\n📋 Active Requirements (matched by git context):\n';
      for (const req of activeRequirements) {
        context += `  - ${req.id}: ${req.name} (${req.type}) - ${req.status}\n`;
        if (req.currentPhase) {
          context += `    Current phase: ${req.currentPhase}\n`;
        }
      }
      return context;
    } else if (inProgressReqs.length > 0) {
      let context = '\n\n📋 In-Progress Requirements:\n';
      for (const req of inProgressReqs.slice(0, 5)) {
        context += `  - ${req.id}: ${req.name} (${req.type})\n`;
        if (req.git && req.git.branch) {
          context += `    Branch: ${req.git.branch}\n`;
        }
      }
      context += '\nUse /continue <id> to continue a specific requirement';
      return context;
    }

    return null;
  } catch (err) {
    return null;
  }
}

async function main() {
  const sessionsDir = getSessionsDir();
  const learnedDir = getLearnedSkillsDir();

  // Ensure directories exist
  ensureDir(sessionsDir);
  ensureDir(learnedDir);

  // Check for recent session files (last 7 days)
  const recentSessions = findFiles(sessionsDir, '*-session.tmp', { maxAge: 7 });

  if (recentSessions.length > 0) {
    const latest = recentSessions[0];
    log(`[SessionStart] Found ${recentSessions.length} recent session(s)`);
    log(`[SessionStart] Latest: ${latest.path}`);

    // Read and inject the latest session content into Claude's context
    const content = stripAnsi(readFile(latest.path));
    if (content && !content.includes('[Session context goes here]')) {
      // Only inject if the session has actual content (not the blank template)
      output(`Previous session summary:\n${content}`);
    }
  }

  // Check for learned skills
  const learnedSkills = findFiles(learnedDir, '*.md');

  if (learnedSkills.length > 0) {
    log(`[SessionStart] ${learnedSkills.length} learned skill(s) available in ${learnedDir}`);
  }

  // Check for available session aliases
  const aliases = listAliases({ limit: 5 });

  if (aliases.length > 0) {
    const aliasNames = aliases.map(a => a.name).join(', ');
    log(`[SessionStart] ${aliases.length} session alias(es) available: ${aliasNames}`);
    log(`[SessionStart] Use /sessions load <alias> to continue a previous session`);
  }

  // Detect and report package manager
  const pm = getPackageManager();
  log(`[SessionStart] Package manager: ${pm.name} (${pm.source})`);

  // If no explicit package manager config was found, show selection prompt
  if (pm.source === 'default') {
    log('[SessionStart] No package manager preference found.');
    log(getSelectionPrompt());
  }

  // Detect project type and frameworks (#293)
  const projectInfo = detectProjectType();
  if (projectInfo.languages.length > 0 || projectInfo.frameworks.length > 0) {
    const parts = [];
    if (projectInfo.languages.length > 0) {
      parts.push(`languages: ${projectInfo.languages.join(', ')}`);
    }
    if (projectInfo.frameworks.length > 0) {
      parts.push(`frameworks: ${projectInfo.frameworks.join(', ')}`);
    }
    log(`[SessionStart] Project detected — ${parts.join('; ')}`);
    output(`Project type: ${JSON.stringify(projectInfo)}`);
  } else {
    log('[SessionStart] No specific project type detected');
  }

  // Load and output requirements context
  const requirementsContext = loadRequirementsContext();
  if (requirementsContext) {
    output(requirementsContext);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('[SessionStart] Error:', err.message);
  process.exit(0); // Don't block on errors
});

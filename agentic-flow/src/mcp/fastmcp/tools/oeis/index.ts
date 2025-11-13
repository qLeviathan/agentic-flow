// OEIS tools index - exports all OEIS MCP tools
export { validateSequenceTool } from './validate-sequence.js';
export { matchPatternTool } from './match-pattern.js';
export { linkSkillTool } from './link-skill.js';
export { searchSequencesTool } from './search-sequences.js';

// Export all tools as an array for easy registration
import { validateSequenceTool } from './validate-sequence.js';
import { matchPatternTool } from './match-pattern.js';
import { linkSkillTool } from './link-skill.js';
import { searchSequencesTool } from './search-sequences.js';

export const oeisTools = [
  validateSequenceTool,
  matchPatternTool,
  linkSkillTool,
  searchSequencesTool
];

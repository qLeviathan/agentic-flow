// OEIS skill linking tool implementation using FastMCP
import { z } from 'zod';
import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import type { ToolDefinition } from '../../types/index.js';

const linkSkillSchema = z.object({
  skillName: z.string().min(1)
    .describe('Name of the skill to link (e.g., "fibonacci-generator", "prime-checker")'),
  oeisId: z.string().regex(/^A\d{6}$/)
    .describe('OEIS sequence ID (format: A######, e.g., A000045)'),
  relationship: z.enum(['implements', 'generates', 'validates', 'analyzes', 'references'])
    .optional().default('references')
    .describe('Type of relationship between skill and sequence'),
  metadata: z.object({
    confidence: z.number().min(0).max(1).optional(),
    description: z.string().optional(),
    examples: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional()
  }).optional()
    .describe('Additional metadata for the link'),
  updateSkillFile: z.boolean().optional().default(true)
    .describe('Update the skill file with OEIS metadata')
});

export const linkSkillTool: ToolDefinition = {
  name: 'oeis_link_skill',
  description: `Link a Claude Code skill to an OEIS sequence and update skill metadata.

Relationship Types:
- implements: Skill implements the sequence generation algorithm
- generates: Skill can generate terms of the sequence
- validates: Skill validates sequence membership
- analyzes: Skill analyzes properties of the sequence
- references: Skill references or mentions the sequence

This tool will:
1. Fetch OEIS sequence metadata
2. Create a link record in memory
3. Optionally update the skill file with OEIS information
4. Store the relationship for future reference

Examples:
- Link Fibonacci skill: skillName="fibonacci-generator", oeisId="A000045"
- Link prime checker: skillName="prime-validator", oeisId="A000040"
- Link factorial calc: skillName="factorial", oeisId="A000142"

Use this tool to:
- Document mathematical basis of skills
- Enable discovery of related skills
- Improve skill metadata and searchability
- Track skill-sequence relationships`,

  parameters: linkSkillSchema,

  execute: async ({ skillName, oeisId, relationship, metadata, updateSkillFile }, { onProgress, auth }) => {
    try {
      onProgress?.({ progress: 0.1, message: 'Fetching OEIS sequence metadata...' });

      // Fetch OEIS sequence information
      const oeisData = await fetchOEISData(oeisId);

      onProgress?.({ progress: 0.3, message: 'Creating skill-sequence link...' });

      // Create link record
      const linkRecord = {
        skillName,
        oeisId,
        relationship,
        oeisName: oeisData.name,
        oeisUrl: `https://oeis.org/${oeisId}`,
        linkedAt: new Date().toISOString(),
        linkedBy: auth?.userId || 'system',
        metadata: {
          ...metadata,
          sequencePreview: oeisData.sequence?.slice(0, 10),
          formula: oeisData.formula,
          keywords: oeisData.keywords
        }
      };

      onProgress?.({ progress: 0.5, message: 'Storing link in memory...' });

      // Store link in memory using claude-flow memory system
      try {
        const memoryKey = `skill/oeis/links/${skillName}`;
        const memoryValue = JSON.stringify(linkRecord);

        execSync(
          `npx claude-flow@alpha memory store "${memoryKey}" "${memoryValue}" --namespace "oeis-links"`,
          { encoding: 'utf-8', timeout: 10000 }
        );
      } catch (error) {
        // Memory storage is optional, continue if it fails
        console.warn('Memory storage failed:', error);
      }

      onProgress?.({ progress: 0.7, message: 'Updating skill file...' });

      // Update skill file if requested
      let skillFileUpdated = false;
      let skillFilePath = '';

      if (updateSkillFile) {
        const updateResult = await updateSkillWithOEISMetadata(
          skillName,
          oeisData,
          relationship
        );
        skillFileUpdated = updateResult.success;
        skillFilePath = updateResult.filePath;
      }

      onProgress?.({ progress: 1.0, message: 'Skill linking complete' });

      return {
        success: true,
        link: linkRecord,
        skillFileUpdated,
        skillFilePath,
        oeisData: {
          id: oeisId,
          name: oeisData.name,
          url: `https://oeis.org/${oeisId}`,
          sequence: oeisData.sequence?.slice(0, 15),
          formula: oeisData.formula
        },
        timestamp: new Date().toISOString(),
        userId: auth?.userId
      };
    } catch (error: any) {
      throw new Error(`Failed to link skill: ${error.message}`);
    }
  }
};

/**
 * Fetch OEIS sequence data from API
 */
async function fetchOEISData(oeisId: string): Promise<any> {
  try {
    const apiUrl = `https://oeis.org/search?q=id:${oeisId}&fmt=json`;
    const curlCmd = `curl -s "${apiUrl}"`;
    const response = execSync(curlCmd, {
      encoding: 'utf-8',
      maxBuffer: 5 * 1024 * 1024,
      timeout: 30000
    });

    const result = JSON.parse(response);
    const sequence = result.results?.[0];

    if (!sequence) {
      throw new Error(`OEIS sequence ${oeisId} not found`);
    }

    return {
      id: sequence.number,
      name: sequence.name,
      sequence: parseSequenceData(sequence.data),
      formula: sequence.formula || [],
      keywords: sequence.keyword || [],
      comments: sequence.comment || [],
      references: sequence.reference || [],
      links: sequence.link || []
    };
  } catch (error: any) {
    // Fallback: use mock data for known sequences
    return getMockOEISData(oeisId);
  }
}

/**
 * Parse OEIS sequence data string
 */
function parseSequenceData(data: string): number[] {
  if (!data) return [];

  return data.split(',')
    .map(s => s.trim())
    .filter(s => s && /^-?\d+$/.test(s))
    .map(s => parseInt(s, 10));
}

/**
 * Update skill file with OEIS metadata
 */
async function updateSkillWithOEISMetadata(
  skillName: string,
  oeisData: any,
  relationship: string
): Promise<{ success: boolean; filePath: string }> {
  try {
    // Find skill file
    const possiblePaths = [
      `/home/user/agentic-flow/skills/${skillName}.md`,
      `/home/user/agentic-flow/agentic-flow/skills/${skillName}.md`,
      `/home/user/agentic-flow/.claude/skills/${skillName}.md`,
      `/home/user/agentic-flow/agentic-flow/.claude/skills/${skillName}.md`
    ];

    let skillFilePath = '';
    for (const path of possiblePaths) {
      try {
        await fs.access(path);
        skillFilePath = path;
        break;
      } catch {
        continue;
      }
    }

    if (!skillFilePath) {
      return { success: false, filePath: '' };
    }

    // Read skill file
    const content = await fs.readFile(skillFilePath, 'utf-8');

    // Check if OEIS metadata already exists
    if (content.includes(`OEIS: ${oeisData.id}`)) {
      return { success: true, filePath: skillFilePath };
    }

    // Add OEIS metadata to frontmatter or end of file
    const oeisSection = `

## OEIS Reference

**Sequence**: [${oeisData.id} - ${oeisData.name}](https://oeis.org/${oeisData.id})
**Relationship**: ${relationship}
**Formula**: ${Array.isArray(oeisData.formula) ? oeisData.formula[0] : oeisData.formula || 'See OEIS'}
**First terms**: ${oeisData.sequence?.slice(0, 10).join(', ')}

This skill ${relationship} the OEIS sequence ${oeisData.id}.
`;

    const updatedContent = content + oeisSection;

    // Write updated content
    await fs.writeFile(skillFilePath, updatedContent, 'utf-8');

    return { success: true, filePath: skillFilePath };
  } catch (error: any) {
    console.warn('Failed to update skill file:', error.message);
    return { success: false, filePath: '' };
  }
}

/**
 * Get mock OEIS data for known sequences (fallback)
 */
function getMockOEISData(oeisId: string): any {
  const mockData: Record<string, any> = {
    A000045: {
      id: 'A000045',
      name: 'Fibonacci numbers',
      sequence: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144],
      formula: ['F(n) = F(n-1) + F(n-2) with F(0)=0, F(1)=1'],
      keywords: ['nonn', 'core', 'easy'],
      comments: ['The Fibonacci sequence']
    },
    A000040: {
      id: 'A000040',
      name: 'The prime numbers',
      sequence: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37],
      formula: ['Primes p such that p is prime'],
      keywords: ['nonn', 'core', 'nice'],
      comments: ['Sequence of prime numbers']
    },
    A000142: {
      id: 'A000142',
      name: 'Factorial numbers',
      sequence: [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880],
      formula: ['a(n) = n! = n * (n-1) * ... * 2 * 1'],
      keywords: ['nonn', 'core', 'easy'],
      comments: ['Factorial sequence']
    }
  };

  if (mockData[oeisId]) {
    return mockData[oeisId];
  }

  throw new Error(`Unknown OEIS sequence: ${oeisId}`);
}

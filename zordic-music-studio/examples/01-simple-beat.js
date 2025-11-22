/**
 * Example 1: Creating a Simple Beat
 *
 * This example demonstrates how to:
 * - Initialize the music API client
 * - Create a basic 4/4 drum pattern
 * - Get AI-powered beat suggestions
 * - Save and export your beat
 */

import { ZordicMusicClient } from '../src/api/client.js';

async function createSimpleBeat() {
  console.log('🎵 Example 1: Creating a Simple Beat\n');

  // Initialize the client
  const client = new ZordicMusicClient({
    apiUrl: 'http://localhost:3000',
    userId: 'student_001'
  });

  // Step 1: Create a new project
  console.log('Step 1: Creating new project...');
  const project = await client.createProject({
    name: 'My First Beat',
    type: 'beat',
    tempo: 120,
    timeSignature: '4/4'
  });
  console.log(`✓ Project created: ${project.id}\n`);

  // Step 2: Ask the Beat Agent for suggestions
  console.log('Step 2: Getting AI beat suggestions...');
  const beatSuggestion = await client.beats.suggest({
    genre: 'hip-hop',
    tempo: 120,
    complexity: 3  // Scale of 1-10
  });
  console.log('✓ Beat suggestion received:');
  console.log(JSON.stringify(beatSuggestion, null, 2));
  console.log();

  // Step 3: Create the beat pattern
  console.log('Step 3: Creating beat pattern...');
  const beatPattern = {
    // Kick drum (every quarter note)
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],

    // Snare (on beats 2 and 4)
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],

    // Hi-hat (eighth notes)
    hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],

    // Clap (accent on beat 4)
    clap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]
  };

  const savedPattern = await client.beats.save({
    projectId: project.id,
    pattern: beatPattern,
    tempo: 120
  });
  console.log(`✓ Beat pattern saved: ${savedPattern.id}\n`);

  // Step 4: Get AI-powered variations
  console.log('Step 4: Generating beat variations...');
  const variations = await client.beats.variation({
    patternId: savedPattern.id,
    variationType: 'fill',
    count: 2
  });
  console.log(`✓ Generated ${variations.length} variations:`);
  variations.forEach((v, i) => {
    console.log(`  ${i + 1}. ${v.description}`);
  });
  console.log();

  // Step 5: Analyze complexity
  console.log('Step 5: Analyzing beat complexity...');
  const analysis = await client.beats.analyze({
    patternId: savedPattern.id
  });
  console.log('✓ Complexity analysis:');
  console.log(`  - Overall complexity: ${analysis.complexity}/10`);
  console.log(`  - Rhythm density: ${analysis.density}`);
  console.log(`  - Syncopation level: ${analysis.syncopation}`);
  console.log();

  // Step 6: Export the beat
  console.log('Step 6: Exporting beat...');
  const exportResult = await client.export({
    projectId: project.id,
    format: 'wav',
    quality: 'high'
  });
  console.log(`✓ Beat exported: ${exportResult.url}\n`);

  console.log('🎉 Simple beat created successfully!');
  console.log(`Project ID: ${project.id}`);
  console.log(`Listen at: ${exportResult.url}`);
}

// Run the example
createSimpleBeat().catch(console.error);

/**
 * Expected Output:
 *
 * 🎵 Example 1: Creating a Simple Beat
 *
 * Step 1: Creating new project...
 * ✓ Project created: proj_abc123
 *
 * Step 2: Getting AI beat suggestions...
 * ✓ Beat suggestion received:
 * {
 *   "genre": "hip-hop",
 *   "tempo": 120,
 *   "pattern": {...},
 *   "confidence": 0.89
 * }
 *
 * Step 3: Creating beat pattern...
 * ✓ Beat pattern saved: pattern_xyz789
 *
 * Step 4: Generating beat variations...
 * ✓ Generated 2 variations:
 *   1. Snare fill with triplets
 *   2. Hi-hat variation with offbeat accents
 *
 * Step 5: Analyzing beat complexity...
 * ✓ Complexity analysis:
 *   - Overall complexity: 3/10
 *   - Rhythm density: 0.375
 *   - Syncopation level: low
 *
 * Step 6: Exporting beat...
 * ✓ Beat exported: http://localhost:3000/exports/beat_abc123.wav
 *
 * 🎉 Simple beat created successfully!
 * Project ID: proj_abc123
 * Listen at: http://localhost:3000/exports/beat_abc123.wav
 */

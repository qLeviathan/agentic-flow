/**
 * Example 2: Melody Composition with AI
 *
 * This example demonstrates how to:
 * - Generate melodies using the Melody Agent
 * - Work with music theory (scales, keys)
 * - Create harmonies and chord progressions
 * - Combine melody with beats
 */

import { ZordicMusicClient } from '../src/api/client.js';

async function composeMelody() {
  console.log('🎹 Example 2: Melody Composition with AI\n');

  const client = new ZordicMusicClient({
    apiUrl: 'http://localhost:3000',
    userId: 'student_002'
  });

  // Step 1: Create a melody project
  console.log('Step 1: Creating melody project...');
  const project = await client.createProject({
    name: 'Summer Vibes Melody',
    type: 'composition',
    tempo: 110,
    key: 'C',
    scale: 'major'
  });
  console.log(`✓ Project created in ${project.key} ${project.scale}\n`);

  // Step 2: Get melody suggestions from AI
  console.log('Step 2: Generating melody suggestions...');
  const melodySuggestion = await client.melody.generate({
    key: 'C',
    scale: 'major',
    length: 16,  // 16 bars
    style: 'uplifting',
    complexity: 5
  });
  console.log('✓ Melody generated:');
  console.log(`  - Key: ${melodySuggestion.key}`);
  console.log(`  - Notes: ${melodySuggestion.notes.slice(0, 8).join(', ')}...`);
  console.log(`  - Contour: ${melodySuggestion.contour}`);
  console.log();

  // Step 3: Harmonize the melody
  console.log('Step 3: Creating harmony...');
  const harmony = await client.melody.harmonize({
    melody: melodySuggestion.notes,
    key: 'C',
    harmonizationType: 'thirds'  // Also: 'fourths', 'fifths', 'counterpoint'
  });
  console.log('✓ Harmony created:');
  console.log(`  - Intervals: ${harmony.intervals.join(', ')}`);
  console.log(`  - Consonance score: ${harmony.consonance}/10`);
  console.log();

  // Step 4: Get chord progression suggestions
  console.log('Step 4: Generating chord progression...');
  const chordProgression = await client.harmony.suggest({
    key: 'C',
    style: 'pop',
    length: 8,
    complexity: 4
  });
  console.log('✓ Chord progression:');
  chordProgression.chords.forEach((chord, i) => {
    console.log(`  ${i + 1}. ${chord.name} (${chord.notes.join('-')})`);
  });
  console.log();

  // Step 5: Analyze melody
  console.log('Step 5: Analyzing melody...');
  const analysis = await client.melody.analyze({
    notes: melodySuggestion.notes,
    key: 'C'
  });
  console.log('✓ Melody analysis:');
  console.log(`  - Range: ${analysis.range.lowest} to ${analysis.range.highest}`);
  console.log(`  - Intervals used: ${analysis.intervals.join(', ')}`);
  console.log(`  - Melodic motion: ${analysis.motion}`);
  console.log(`  - Catchiness score: ${analysis.catchiness}/10`);
  console.log();

  // Step 6: Create a variation
  console.log('Step 6: Creating melodic variation...');
  const variation = await client.melody.variation({
    originalMelody: melodySuggestion.notes,
    variationType: 'rhythmic',  // Also: 'embellishment', 'transposition'
    intensity: 0.5
  });
  console.log('✓ Variation created:');
  console.log(`  - Type: ${variation.type}`);
  console.log(`  - Description: ${variation.description}`);
  console.log();

  // Step 7: Combine with beat
  console.log('Step 7: Adding rhythm section...');
  const beatPattern = await client.beats.suggest({
    genre: 'pop',
    tempo: 110,
    complexity: 4
  });

  const composition = await client.compose({
    projectId: project.id,
    tracks: [
      {
        type: 'melody',
        instrument: 'synth-lead',
        notes: melodySuggestion.notes
      },
      {
        type: 'harmony',
        instrument: 'synth-pad',
        notes: harmony.notes
      },
      {
        type: 'chords',
        instrument: 'piano',
        progression: chordProgression.chords
      },
      {
        type: 'drums',
        pattern: beatPattern.pattern
      }
    ]
  });
  console.log(`✓ Composition created with ${composition.tracks.length} tracks\n`);

  // Step 8: Export the composition
  console.log('Step 8: Exporting composition...');
  const exportResult = await client.export({
    projectId: project.id,
    format: 'mp3',
    quality: 'high',
    includeVideo: false
  });
  console.log(`✓ Composition exported: ${exportResult.url}\n`);

  console.log('🎉 Melody composition completed!');
  console.log(`Project: ${project.name}`);
  console.log(`Key: ${project.key} ${project.scale}`);
  console.log(`Tracks: ${composition.tracks.length}`);
  console.log(`Download: ${exportResult.url}`);
}

// Run the example
composeMelody().catch(console.error);

/**
 * Music Theory Reference
 *
 * Scales:
 * - Major: Happy, bright (C D E F G A B)
 * - Minor: Sad, dark (A B C D E F G)
 * - Pentatonic: Simple, versatile (C D E G A)
 * - Blues: Soulful (C Eb F F# G Bb)
 *
 * Chord Progressions:
 * - Pop: I-V-vi-IV (C-G-Am-F)
 * - Blues: I-IV-V (C-F-G)
 * - Jazz: ii-V-I (Dm-G-C)
 *
 * Intervals:
 * - Unison: 0 semitones
 * - Minor 3rd: 3 semitones (sad)
 * - Major 3rd: 4 semitones (happy)
 * - Perfect 5th: 7 semitones (powerful)
 * - Octave: 12 semitones
 */

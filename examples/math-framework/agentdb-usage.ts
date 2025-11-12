/**
 * AgentDB Integration Usage Examples
 * Demonstrates all features of the Math Framework Memory system
 */

import {
  createMathFrameworkMemory,
  MathFrameworkMemory,
  ComputedValues,
  NashEquilibrium,
  OptimizationSkill,
  ReflexionEntry
} from '../../src/math-framework/memory/agentdb-integration';

/**
 * Example 1: Basic Usage - Compute and Store Values
 */
async function example1_basicUsage() {
  console.log('\n=== Example 1: Basic Usage ===\n');

  const memory = createMathFrameworkMemory({
    database_path: './math-framework.db',
    enable_learning: true,
    enable_hnsw: true  // Fast vector search
  });

  // Compute and store values for n=10
  const values = await memory.computeAndStore(10);

  console.log('Computed values for n=10:');
  console.log(`  F(10) = ${values.F}`);
  console.log(`  L(10) = ${values.L}`);
  console.log(`  Z(10) = ${values.Z}`);
  console.log(`  S(10) = ${values.S}`);
  console.log(`  Is Nash point: ${values.is_nash_point}`);
  console.log(`  Phase: φ^10 = ${values.phase.phi.toFixed(4)}, ψ^10 = ${values.phase.psi.toFixed(4)}`);

  await memory.close();
}

/**
 * Example 2: Finding Nash Equilibria
 */
async function example2_nashEquilibria() {
  console.log('\n=== Example 2: Finding Nash Equilibria ===\n');

  const memory = createMathFrameworkMemory();

  // Compute a range and detect Nash points
  console.log('Computing values from n=0 to n=20...');
  const results = await memory.batchCompute(0, 20);

  const nashPoints = results.filter(r => r.is_nash_point);

  console.log(`\nFound ${nashPoints.length} Nash equilibrium points:`);
  nashPoints.forEach(point => {
    console.log(`  n=${point.n}: S(${point.n}) = ${point.S}`);
  });

  // Get all stored Nash points
  const allNashPoints = await memory.getAllNashPoints();
  console.log(`\nTotal Nash points in memory: ${allNashPoints.length}`);

  await memory.close();
}

/**
 * Example 3: Pattern Recognition
 */
async function example3_patternRecognition() {
  console.log('\n=== Example 3: Pattern Recognition ===\n');

  const memory = createMathFrameworkMemory();

  // Analyze patterns in a range
  console.log('Analyzing patterns from n=1 to n=50...');
  const patterns = await memory.analyzeAndStorePatterns(1, 50);

  console.log(`\nDetected ${patterns.length} patterns:`);
  patterns.forEach(pattern => {
    console.log(`\n  Pattern: ${pattern.pattern_type}`);
    console.log(`  Confidence: ${(pattern.confidence * 100).toFixed(1)}%`);
    console.log(`  Description: ${pattern.description}`);
    console.log(`  Related indices: ${pattern.related_indices.slice(0, 5).join(', ')}${pattern.related_indices.length > 5 ? '...' : ''}`);
  });

  await memory.close();
}

/**
 * Example 4: Similarity Search
 */
async function example4_similaritySearch() {
  console.log('\n=== Example 4: Similarity Search ===\n');

  const memory = createMathFrameworkMemory({
    enable_hnsw: true  // 150x faster search
  });

  // Compute some values
  await memory.batchCompute(5, 15);

  // Find Nash points similar to n=10
  console.log('Finding Nash points similar to n=10...');
  const similar = await memory.findSimilarNashPoints(10, 5);

  console.log(`\nFound ${similar.length} similar Nash points:`);
  similar.forEach(result => {
    console.log(`  n=${result.data.n}: similarity=${(result.similarity * 100).toFixed(2)}%`);
  });

  await memory.close();
}

/**
 * Example 5: Causal Memory - "S(n)=0 causes Nash"
 */
async function example5_causalMemory() {
  console.log('\n=== Example 5: Causal Memory ===\n');

  const memory = createMathFrameworkMemory();

  // Store a causal relation
  await memory.storeCausalRelation({
    cause: 'S(n)=0',
    effect: 'Nash equilibrium',
    n_values: [10, 20, 30],
    confidence: 0.95,
    evidence_count: 3,
    created_at: Date.now(),
    last_verified: Date.now()
  });

  // Retrieve causal relations
  const relations = await memory.getCausalRelations('S(n)=0');

  console.log('Causal relations for "S(n)=0":');
  relations.forEach(rel => {
    console.log(`  ${rel.cause} → ${rel.effect}`);
    console.log(`    Confidence: ${(rel.confidence * 100).toFixed(1)}%`);
    console.log(`    Evidence count: ${rel.evidence_count}`);
    console.log(`    Observed at n: ${rel.n_values.join(', ')}`);
  });

  await memory.close();
}

/**
 * Example 6: Skill Library - Successful Optimization Paths
 */
async function example6_skillLibrary() {
  console.log('\n=== Example 6: Skill Library ===\n');

  const memory = createMathFrameworkMemory();

  // Store a successful optimization skill
  const skill: OptimizationSkill = {
    skill_id: 'nash-binary-search-v1',
    name: 'Binary Search Nash Finder',
    description: 'Uses binary search to quickly find Nash equilibrium points',
    success_rate: 0.92,
    avg_convergence_steps: 8,
    learned_from: ['task-1', 'task-2', 'task-3'],
    parameters: {
      tolerance: 1e-10,
      max_iterations: 100,
      search_strategy: 'binary'
    },
    usage_count: 15,
    last_used: Date.now()
  };

  await memory.storeSkill(skill);

  // Get best skills
  const bestSkills = await memory.getBestSkills('nash-finding', 5);

  console.log('Best optimization skills:');
  bestSkills.forEach((skill, i) => {
    console.log(`\n${i + 1}. ${skill.name} (${skill.skill_id})`);
    console.log(`   Success rate: ${(skill.success_rate * 100).toFixed(1)}%`);
    console.log(`   Avg steps: ${skill.avg_convergence_steps}`);
    console.log(`   Used: ${skill.usage_count} times`);
  });

  await memory.close();
}

/**
 * Example 7: Reflexion Memory - Learning from Attempts
 */
async function example7_reflexionMemory() {
  console.log('\n=== Example 7: Reflexion Memory ===\n');

  const memory = createMathFrameworkMemory({
    enable_learning: true,
    learning_config: {
      min_attempts: 3,
      learning_rate: 0.01,
      algorithm: 'DecisionTransformer'
    }
  });

  // Store a reflexion entry
  const initialState = await memory.computeAndStore(5);
  const finalState = await memory.computeAndStore(10);

  const reflexion: ReflexionEntry = {
    attempt_id: 'attempt-001',
    task_description: 'Find Nash equilibrium near n=10',
    initial_state: initialState,
    steps_taken: [
      'Started at n=5',
      'Computed S(5) = ' + initialState.S,
      'Detected negative S value',
      'Used binary search strategy',
      'Jumped to n=10',
      'Found S(10) ≈ 0'
    ],
    final_state: finalState,
    success: true,
    insights: [
      'Binary search converged in 5 steps',
      'S values decrease near Nash points',
      'Golden ratio properties help predict locations'
    ],
    improvement_suggestions: [
      'Cache intermediate computations',
      'Use gradient descent for fine-tuning',
      'Consider parallel search strategies'
    ],
    created_at: Date.now()
  };

  await memory.storeReflexion(reflexion);

  console.log('Stored reflexion entry:');
  console.log(`  Attempt: ${reflexion.attempt_id}`);
  console.log(`  Task: ${reflexion.task_description}`);
  console.log(`  Success: ${reflexion.success}`);
  console.log(`  Steps: ${reflexion.steps_taken.length}`);
  console.log(`\nInsights:`);
  reflexion.insights.forEach(insight => console.log(`  - ${insight}`));

  // Learn from reflexions (requires multiple attempts)
  console.log('\nLearning from reflexion entries...');
  await memory.learnFromReflexions(1);

  await memory.close();
}

/**
 * Example 8: Predict Next Nash Points
 */
async function example8_predictNashPoints() {
  console.log('\n=== Example 8: Predict Next Nash Points ===\n');

  const memory = createMathFrameworkMemory();

  // Store some known Nash points
  await memory.batchCompute(0, 30);

  // Predict next Nash points in range [30, 100]
  console.log('Predicting Nash points in range [30, 100]...');
  const predictions = await memory.predictNextNashPoints([30, 100]);

  console.log(`\nPredicted ${predictions.length} potential Nash points:`);
  predictions.slice(0, 10).forEach(n => {
    console.log(`  n = ${n}`);
  });

  await memory.close();
}

/**
 * Example 9: Statistics and Monitoring
 */
async function example9_statistics() {
  console.log('\n=== Example 9: Statistics and Monitoring ===\n');

  const memory = createMathFrameworkMemory();

  // Compute some data
  await memory.batchCompute(1, 50);
  await memory.analyzeAndStorePatterns(1, 50);

  // Get statistics
  const stats = await memory.getStats();

  console.log('Memory Statistics:');
  console.log(`  Total computations: ${stats.total_computations}`);
  console.log(`  Nash points found: ${stats.nash_points_found}`);
  console.log(`  Patterns recognized: ${stats.patterns_recognized}`);
  console.log(`  Skills learned: ${stats.skills_learned}`);
  console.log(`  Memory size: ${stats.memory_size_mb.toFixed(2)} MB`);
  console.log(`  Last updated: ${new Date(stats.last_updated).toISOString()}`);

  await memory.close();
}

/**
 * Example 10: Complete Workflow
 */
async function example10_completeWorkflow() {
  console.log('\n=== Example 10: Complete Workflow ===\n');

  const memory = createMathFrameworkMemory({
    database_path: './math-framework-complete.db',
    enable_learning: true,
    enable_hnsw: true,
    enable_quantization: true,
    learning_config: {
      min_attempts: 3,
      learning_rate: 0.01,
      algorithm: 'DecisionTransformer'
    }
  });

  console.log('Step 1: Batch compute range...');
  await memory.batchCompute(1, 100);

  console.log('Step 2: Analyze patterns...');
  const patterns = await memory.analyzeAndStorePatterns(1, 100);

  console.log('Step 3: Find Nash equilibria...');
  const nashPoints = await memory.getAllNashPoints();

  console.log('Step 4: Store optimization skills...');
  await memory.storeSkill({
    skill_id: 'comprehensive-search-v1',
    name: 'Comprehensive Search',
    description: 'Full range search with pattern recognition',
    success_rate: 0.88,
    avg_convergence_steps: 15,
    learned_from: ['workflow-1'],
    parameters: { range: [1, 100] },
    usage_count: 1,
    last_used: Date.now()
  });

  console.log('Step 5: Get statistics...');
  const stats = await memory.getStats();

  console.log('\n=== Workflow Results ===');
  console.log(`Computations: ${stats.total_computations}`);
  console.log(`Nash points: ${nashPoints.length}`);
  console.log(`Patterns: ${patterns.length}`);

  console.log('\nWorkflow completed successfully! ✓');

  await memory.close();
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    await example1_basicUsage();
    await example2_nashEquilibria();
    await example3_patternRecognition();
    await example4_similaritySearch();
    await example5_causalMemory();
    await example6_skillLibrary();
    await example7_reflexionMemory();
    await example8_predictNashPoints();
    await example9_statistics();
    await example10_completeWorkflow();

    console.log('\n✓ All examples completed successfully!\n');
  } catch (error) {
    console.error('Error running examples:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export {
  example1_basicUsage,
  example2_nashEquilibria,
  example3_patternRecognition,
  example4_similaritySearch,
  example5_causalMemory,
  example6_skillLibrary,
  example7_reflexionMemory,
  example8_predictNashPoints,
  example9_statistics,
  example10_completeWorkflow
};

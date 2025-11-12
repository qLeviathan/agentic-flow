/**
 * Pattern recognition for Nash equilibria and convergence patterns
 * Uses feature extraction and pattern matching
 */

import {
  PatternRecognition,
  ComputedValues,
  NashEquilibrium
} from '../memory/types';

/**
 * Extract features from computed values for pattern recognition
 */
export function extractFeatures(values: ComputedValues): number[] {
  return [
    values.n / 100,                           // Normalized index
    values.F / 1000,                          // Normalized Fibonacci
    values.L / 1000,                          // Normalized Lucas
    values.S,                                 // S value (key indicator)
    values.Z / 1000,                          // Normalized Z
    values.phase.phi,                         // φ^n
    values.phase.psi,                         // ψ^n
    Math.log(Math.abs(values.F) + 1),        // Log-scale features
    Math.log(Math.abs(values.L) + 1),
    Math.abs(values.S),                       // Absolute S
    values.F / values.L,                      // F/L ratio
    (2 * values.F - values.L),                // S computation
    Math.sin(values.n * Math.PI / 10),        // Periodic features
    Math.cos(values.n * Math.PI / 10)
  ];
}

/**
 * Recognize Nash equilibrium pattern
 */
export function recognizeNashPattern(
  values: ComputedValues[],
  threshold: number = 1e-10
): PatternRecognition {
  const nashIndices: number[] = [];
  let totalConfidence = 0;

  for (const v of values) {
    if (Math.abs(v.S) < threshold) {
      nashIndices.push(v.n);
      totalConfidence += 1 - Math.abs(v.S);
    }
  }

  const confidence = nashIndices.length > 0
    ? totalConfidence / nashIndices.length
    : 0;

  // Extract combined features from all Nash points
  const features = nashIndices.length > 0
    ? extractFeatures(values.find(v => v.n === nashIndices[0])!)
    : [];

  return {
    pattern_type: 'nash-equilibrium',
    confidence,
    detected_at: Date.now(),
    features,
    description: `Found ${nashIndices.length} Nash equilibrium points where S(n)≈0`,
    related_indices: nashIndices
  };
}

/**
 * Recognize convergence pattern
 */
export function recognizeConvergencePattern(
  values: ComputedValues[]
): PatternRecognition {
  if (values.length < 3) {
    return {
      pattern_type: 'convergence',
      confidence: 0,
      detected_at: Date.now(),
      features: [],
      description: 'Insufficient data for convergence detection',
      related_indices: []
    };
  }

  const sValues = values.map(v => Math.abs(v.S));
  let convergingCount = 0;

  // Check if S values are decreasing
  for (let i = 1; i < sValues.length; i++) {
    if (sValues[i] < sValues[i - 1]) {
      convergingCount++;
    }
  }

  const confidence = convergingCount / (sValues.length - 1);
  const features = extractFeatures(values[values.length - 1]);

  return {
    pattern_type: 'convergence',
    confidence,
    detected_at: Date.now(),
    features,
    description: `Convergence detected with ${(confidence * 100).toFixed(1)}% confidence`,
    related_indices: values.map(v => v.n)
  };
}

/**
 * Recognize oscillation pattern
 */
export function recognizeOscillationPattern(
  values: ComputedValues[]
): PatternRecognition {
  if (values.length < 4) {
    return {
      pattern_type: 'oscillation',
      confidence: 0,
      detected_at: Date.now(),
      features: [],
      description: 'Insufficient data for oscillation detection',
      related_indices: []
    };
  }

  const sValues = values.map(v => v.S);
  let signChanges = 0;

  // Count sign changes in S values
  for (let i = 1; i < sValues.length; i++) {
    if (Math.sign(sValues[i]) !== Math.sign(sValues[i - 1])) {
      signChanges++;
    }
  }

  const confidence = signChanges / (sValues.length - 1);
  const features = extractFeatures(values[values.length - 1]);

  return {
    pattern_type: 'oscillation',
    confidence,
    detected_at: Date.now(),
    features,
    description: `Oscillation pattern with ${signChanges} sign changes`,
    related_indices: values.map(v => v.n)
  };
}

/**
 * Comprehensive pattern analysis
 */
export function analyzePatterns(
  values: ComputedValues[]
): PatternRecognition[] {
  const patterns: PatternRecognition[] = [];

  // Check for Nash equilibrium
  const nashPattern = recognizeNashPattern(values);
  if (nashPattern.confidence > 0.5) {
    patterns.push(nashPattern);
  }

  // Check for convergence
  const convergencePattern = recognizeConvergencePattern(values);
  if (convergencePattern.confidence > 0.6) {
    patterns.push(convergencePattern);
  }

  // Check for oscillation
  const oscillationPattern = recognizeOscillationPattern(values);
  if (oscillationPattern.confidence > 0.5) {
    patterns.push(oscillationPattern);
  }

  return patterns;
}

/**
 * Calculate similarity between two patterns
 */
export function patternSimilarity(
  pattern1: PatternRecognition,
  pattern2: PatternRecognition
): number {
  if (pattern1.pattern_type !== pattern2.pattern_type) {
    return 0;
  }

  if (pattern1.features.length === 0 || pattern2.features.length === 0) {
    return 0;
  }

  // Cosine similarity
  const minLen = Math.min(pattern1.features.length, pattern2.features.length);
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (let i = 0; i < minLen; i++) {
    dotProduct += pattern1.features[i] * pattern2.features[i];
    mag1 += pattern1.features[i] * pattern1.features[i];
    mag2 += pattern2.features[i] * pattern2.features[i];
  }

  const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
  return magnitude > 0 ? dotProduct / magnitude : 0;
}

/**
 * Predict Nash points using pattern recognition
 */
export function predictNashPoints(
  knownNashPoints: NashEquilibrium[],
  searchRange: [number, number]
): number[] {
  if (knownNashPoints.length < 2) {
    return [];
  }

  // Find pattern in known Nash points
  const indices = knownNashPoints.map(p => p.n).sort((a, b) => a - b);
  const differences: number[] = [];

  for (let i = 1; i < indices.length; i++) {
    differences.push(indices[i] - indices[i - 1]);
  }

  // Calculate average difference
  const avgDiff = differences.reduce((a, b) => a + b, 0) / differences.length;

  // Predict next points
  const predictions: number[] = [];
  let nextN = indices[indices.length - 1] + Math.round(avgDiff);

  while (nextN <= searchRange[1]) {
    if (nextN >= searchRange[0]) {
      predictions.push(nextN);
    }
    nextN += Math.round(avgDiff);
  }

  return predictions;
}

/**
 * AURELIA Learning System - Public API
 *
 * Export all learning and validation components for AURELIA.
 */

// Knowledge Validator
export {
  KnowledgeValidator,
  ConceptCategory,
  type KnowledgeQuery,
  type ValidationResult,
  type LearningProgress,
  type RemedialTraining,
  type ValidatorConfig
} from './knowledge-validator';

// Response Evaluator
export {
  ResponseEvaluator,
  type ExpertDecision,
  type AureliaRecommendation,
  type EvaluationMetrics,
  type BacktestResult,
  type EvaluatorConfig
} from './response-evaluator';

// Training Curriculum
export {
  TrainingCurriculum,
  DifficultyLevel,
  ScenarioType,
  type TrainingScenario,
  type CurriculumConfig
} from './training-curriculum';

// Continuous Learning
export {
  ContinuousLearning,
  LearningAlgorithm,
  type TradingDecision,
  type TradingOutcome,
  type LearningPattern,
  type QNetworkUpdate,
  type ReflexionEntry,
  type LearningConfig
} from './continuous-learning';

/**
 * Convenience function to initialize complete learning system
 */
import { AURELIA } from '../trading/aurelia';
import { KnowledgeValidator } from './knowledge-validator';
import { ResponseEvaluator } from './response-evaluator';
import { TrainingCurriculum } from './training-curriculum';
import { ContinuousLearning } from './continuous-learning';

export interface LearningSystemConfig {
  validatorConfig?: Partial<import('./knowledge-validator').ValidatorConfig>;
  evaluatorConfig?: Partial<import('./response-evaluator').EvaluatorConfig>;
  curriculumConfig?: Partial<import('./training-curriculum').CurriculumConfig>;
  learningConfig?: Partial<import('./continuous-learning').LearningConfig>;
}

export interface LearningSystem {
  validator: KnowledgeValidator;
  evaluator: ResponseEvaluator;
  curriculum: TrainingCurriculum;
  learning: ContinuousLearning;
}

/**
 * Initialize complete AURELIA learning system
 */
export async function initializeLearningSystem(
  aurelia: AURELIA,
  config: LearningSystemConfig = {}
): Promise<LearningSystem> {
  const validator = new KnowledgeValidator(aurelia, config.validatorConfig);
  const evaluator = new ResponseEvaluator(aurelia, config.evaluatorConfig);
  const curriculum = new TrainingCurriculum(config.curriculumConfig);
  const learning = new ContinuousLearning(aurelia, config.learningConfig);

  return {
    validator,
    evaluator,
    curriculum,
    learning
  };
}

/**
 * Close all learning system components
 */
export async function closeLearningSystem(system: LearningSystem): Promise<void> {
  await Promise.all([
    system.validator.close(),
    system.evaluator.close(),
    system.curriculum.close(),
    system.learning.close()
  ]);
}

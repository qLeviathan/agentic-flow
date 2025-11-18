export const config = {
  // YouTube API configuration
  youtube: {
    outputDir: process.env.YOUTUBE_OUTPUT_DIR || './youtube-downloads',
    maxFrames: parseInt(process.env.MAX_FRAMES || '30'),
    saveFrames: process.env.SAVE_FRAMES === 'true',
  },

  // AgentDB configuration
  agentdb: {
    path: process.env.AGENTDB_PATH || './youtube-vision-memory.db',
    enableReflexion: true,
    enableSkillLibrary: true,
    enableCausalMemory: true,
  },

  // Swarm configuration
  swarm: {
    maxAgents: parseInt(process.env.MAX_AGENTS || '8'),
    frameAnalyzers: parseInt(process.env.FRAME_ANALYZERS || '5'),
    textAnalyzers: parseInt(process.env.TEXT_ANALYZERS || '2'),
    insightGenerators: parseInt(process.env.INSIGHT_GENERATORS || '1'),
  },

  // Computer vision configuration
  vision: {
    minObjectSize: 50,
    faceDetectionEnabled: true,
    textExtractionEnabled: true,
    colorAnalysisEnabled: true,
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    logDir: './logs',
  },
};

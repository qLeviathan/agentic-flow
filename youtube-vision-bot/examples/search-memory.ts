#!/usr/bin/env tsx

import YouTubeVisionBot from '../src/index.js';

async function main() {
  const query = process.argv.slice(2).join(' ');

  if (!query) {
    console.error('❌ Usage: tsx examples/search-memory.ts <search query>');
    console.error('Example: tsx examples/search-memory.ts "machine learning tutorials"');
    process.exit(1);
  }

  console.log('🔍 Searching AgentDB memory...\n');

  const bot = new YouTubeVisionBot();

  try {
    await bot.initialize();

    const results = await bot.queryPastAnalyses(query, 5);

    console.log(`\n📊 Found ${results.length} matching analyses:\n`);
    console.log('═══════════════════════════════════════════════════════');

    results.forEach((result: any, index: number) => {
      console.log(`\n${index + 1}. ${result.metadata.title}`);
      console.log(`   Video ID: ${result.metadata.videoId}`);
      console.log(`   Duration: ${result.metadata.duration}s`);
      console.log(`   Frames: ${result.metadata.frameCount}`);
      console.log(`   Sentiment: ${result.metadata.sentiment || 'N/A'}`);
      console.log(`   Keywords: ${result.metadata.keywords?.slice(0, 5).join(', ') || 'N/A'}`);
      console.log(`   Similarity: ${(result.similarity * 100).toFixed(1)}%`);
    });

    console.log('\n═══════════════════════════════════════════════════════\n');

    await bot.shutdown();

  } catch (error) {
    console.error(`\n❌ Error: ${error}`);
    process.exit(1);
  }
}

main();

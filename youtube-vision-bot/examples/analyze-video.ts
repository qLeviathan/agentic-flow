#!/usr/bin/env tsx

import YouTubeVisionBot from '../src/index.js';

async function main() {
  const videoUrl = process.argv[2];

  if (!videoUrl) {
    console.error('❌ Usage: npm run analyze:video <YouTube URL>');
    console.error('Example: npm run analyze:video "https://www.youtube.com/watch?v=dQw4w9WgXcQ"');
    process.exit(1);
  }

  console.log('🚀 Starting YouTube Vision Bot...\n');

  const bot = new YouTubeVisionBot();

  try {
    // Initialize bot
    await bot.initialize();

    // Run full analysis
    console.log(`\n📊 Analyzing video: ${videoUrl}\n`);

    const results = await bot.analyzeVideo({
      videoUrl,
      analysisType: 'full',
      maxFrames: 30,
      saveFrames: true,
    });

    // Display results
    console.log('\n✅ Analysis Complete!\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 VIDEO INFORMATION');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Title: ${results.videoInfo.title}`);
    console.log(`Author: ${results.videoInfo.author}`);
    console.log(`Duration: ${results.videoInfo.duration}s`);
    console.log(`Views: ${results.videoInfo.views.toLocaleString()}`);

    if (results.frameAnalysis) {
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('🖼️  VISUAL ANALYSIS');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`Frames Analyzed: ${results.frameAnalysis.length}`);
      console.log(`Faces Detected: ${results.frameAnalysis.filter((f: any) => f.faces.length > 0).length} frames`);
      console.log(`Text Found: ${results.frameAnalysis.filter((f: any) => f.text.length > 0).length} frames`);
    }

    if (results.textAnalysis) {
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('📝 TEXT ANALYSIS');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`Sentiment: ${results.textAnalysis.sentiment}`);
      console.log(`Keywords: ${results.textAnalysis.keywords.slice(0, 10).join(', ')}`);
    }

    if (results.insights) {
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('🧠 SWARM INSIGHTS');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`Summary: ${results.insights.videoSummary}`);

      if (results.insights.keyMoments.length > 0) {
        console.log('\n🎬 Key Moments:');
        results.insights.keyMoments.slice(0, 5).forEach((moment: any, i: number) => {
          console.log(`  ${i + 1}. ${moment.timestamp.toFixed(1)}s - ${moment.reason}`);
        });
      }

      if (results.insights.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        results.insights.recommendations.forEach((rec: string, i: number) => {
          console.log(`  ${i + 1}. ${rec}`);
        });
      }
    }

    console.log('\n═══════════════════════════════════════════════════════\n');

    // Save full results to JSON
    const fs = await import('fs/promises');
    const outputPath = `./analysis-${results.videoInfo.id}.json`;
    await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
    console.log(`💾 Full results saved to: ${outputPath}\n`);

    // Shutdown
    await bot.shutdown();

  } catch (error) {
    console.error(`\n❌ Error: ${error}`);
    process.exit(1);
  }
}

main();

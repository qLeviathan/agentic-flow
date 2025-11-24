/**
 * Test Script for Pro Se Fact-Checking System
 *
 * This script runs the fact-checker on existing evidence and validates output
 */

import * as fs from 'fs';
import * as path from 'path';
import FactCheckingSystem from './fact-checker';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

class FactCheckerTester {
  private results: TestResult[] = [];
  private baseDir = '/home/user/agentic-flow/docs/pro-se-platform';

  async runAllTests(): Promise<void> {
    console.log('🧪 FACT-CHECKER TEST SUITE');
    console.log('='.repeat(70));
    console.log();

    // Pre-flight checks
    await this.testFileExistence();
    await this.testEvidenceCatalog();

    // System initialization test
    await this.testSystemInitialization();

    // Claim extraction tests
    await this.testClaimExtraction();

    // Evidence verification tests
    await this.testEvidenceVerification();

    // Anomaly detection tests
    await this.testAnomalyDetection();

    // Report generation tests
    await this.testReportGeneration();

    // Output validation tests
    await this.testOutputValidation();

    // Print results
    this.printResults();
  }

  private async testFileExistence(): Promise<void> {
    console.log('📁 Testing File Existence...\n');

    const requiredFiles = [
      { path: 'legal-docs/executive-summary.md', critical: true },
      { path: 'timeline/MASTER-TIMELINE.md', critical: true },
      { path: 'evidence/catalog.json', critical: true },
      { path: 'system/fact-checker.ts', critical: true }
    ];

    for (const file of requiredFiles) {
      const fullPath = path.join(this.baseDir, file.path);
      const exists = fs.existsSync(fullPath);

      this.results.push({
        name: `File exists: ${file.path}`,
        passed: exists,
        message: exists ? 'Found' : 'Missing',
        details: { path: fullPath, critical: file.critical }
      });

      if (!exists && file.critical) {
        console.error(`✗ CRITICAL: ${file.path} not found`);
      }
    }
  }

  private async testEvidenceCatalog(): Promise<void> {
    console.log('\n📊 Testing Evidence Catalog...\n');

    try {
      const catalogPath = path.join(this.baseDir, 'evidence/catalog.json');
      const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

      this.results.push({
        name: 'Catalog JSON valid',
        passed: true,
        message: `Loaded ${catalog.length} evidence items`,
        details: { itemCount: catalog.length }
      });

      // Validate catalog structure
      const firstItem = catalog[0];
      const hasRequiredFields = firstItem.batesNumber &&
                                firstItem.filename &&
                                firstItem.hash;

      this.results.push({
        name: 'Catalog structure valid',
        passed: hasRequiredFields,
        message: hasRequiredFields ? 'All required fields present' : 'Missing fields',
        details: { sample: firstItem }
      });

      // Check for content
      const itemsWithContent = catalog.filter((item: any) => item.content).length;
      const contentPercentage = (itemsWithContent / catalog.length) * 100;

      this.results.push({
        name: 'Evidence content available',
        passed: contentPercentage >= 50,
        message: `${contentPercentage.toFixed(1)}% of items have content`,
        details: { itemsWithContent, total: catalog.length }
      });

    } catch (error) {
      this.results.push({
        name: 'Catalog loading',
        passed: false,
        message: `Error: ${error}`,
        details: { error }
      });
    }
  }

  private async testSystemInitialization(): Promise<void> {
    console.log('\n🚀 Testing System Initialization...\n');

    try {
      const system = new FactCheckingSystem();

      this.results.push({
        name: 'System instantiation',
        passed: true,
        message: 'FactCheckingSystem created successfully'
      });

      // Check if evidence loaded
      const evidenceCount = (system as any).evidence.size;

      this.results.push({
        name: 'Evidence loading',
        passed: evidenceCount > 0,
        message: `Loaded ${evidenceCount} evidence items`,
        details: { evidenceCount }
      });

    } catch (error) {
      this.results.push({
        name: 'System initialization',
        passed: false,
        message: `Failed: ${error}`,
        details: { error }
      });
    }
  }

  private async testClaimExtraction(): Promise<void> {
    console.log('\n🔍 Testing Claim Extraction...\n');

    try {
      const system = new FactCheckingSystem();
      const summaryPath = path.join(this.baseDir, 'legal-docs/executive-summary.md');
      const timelinePath = path.join(this.baseDir, 'timeline/MASTER-TIMELINE.md');

      system.extractClaims(summaryPath, timelinePath);

      const claimCount = (system as any).claims.size;

      this.results.push({
        name: 'Claim extraction',
        passed: claimCount > 0,
        message: `Extracted ${claimCount} claims`,
        details: { claimCount }
      });

      // Check claim types
      const claims = Array.from((system as any).claims.values());
      const claimTypes = [...new Set(claims.map((c: any) => c.claimType))];

      this.results.push({
        name: 'Claim type diversity',
        passed: claimTypes.length >= 3,
        message: `Found ${claimTypes.length} claim types: ${claimTypes.join(', ')}`,
        details: { claimTypes }
      });

    } catch (error) {
      this.results.push({
        name: 'Claim extraction',
        passed: false,
        message: `Failed: ${error}`,
        details: { error }
      });
    }
  }

  private async testEvidenceVerification(): Promise<void> {
    console.log('\n✓ Testing Evidence Verification...\n');

    try {
      const system = new FactCheckingSystem();
      const summaryPath = path.join(this.baseDir, 'legal-docs/executive-summary.md');
      const timelinePath = path.join(this.baseDir, 'timeline/MASTER-TIMELINE.md');

      system.extractClaims(summaryPath, timelinePath);
      system.verifyEvidence();

      const claims = Array.from((system as any).claims.values());
      const verifiedClaims = claims.filter((c: any) => c.verified);
      const verificationRate = (verifiedClaims.length / claims.length) * 100;

      this.results.push({
        name: 'Evidence verification',
        passed: verifiedClaims.length > 0,
        message: `${verifiedClaims.length}/${claims.length} claims verified (${verificationRate.toFixed(1)}%)`,
        details: { verified: verifiedClaims.length, total: claims.length }
      });

      // Check confidence levels
      const highConfidence = claims.filter((c: any) => c.confidence === 'high').length;
      const mediumConfidence = claims.filter((c: any) => c.confidence === 'medium').length;
      const lowConfidence = claims.filter((c: any) => c.confidence === 'low').length;

      this.results.push({
        name: 'Confidence distribution',
        passed: true,
        message: `High: ${highConfidence}, Medium: ${mediumConfidence}, Low: ${lowConfidence}`,
        details: { high: highConfidence, medium: mediumConfidence, low: lowConfidence }
      });

    } catch (error) {
      this.results.push({
        name: 'Evidence verification',
        passed: false,
        message: `Failed: ${error}`,
        details: { error }
      });
    }
  }

  private async testAnomalyDetection(): Promise<void> {
    console.log('\n🔎 Testing Anomaly Detection...\n');

    try {
      const system = new FactCheckingSystem();
      system.detectSedgwickAnomalies();

      const anomalies = (system as any).anomalies;

      this.results.push({
        name: 'Anomaly detection execution',
        passed: true,
        message: `Detected ${anomalies.length} anomalies`,
        details: { anomalyCount: anomalies.length }
      });

      // Check anomaly types
      const anomalyTypes = [...new Set(anomalies.map((a: any) => a.type))];

      this.results.push({
        name: 'Anomaly type detection',
        passed: anomalyTypes.length > 0,
        message: `Found types: ${anomalyTypes.join(', ')}`,
        details: { anomalyTypes }
      });

    } catch (error) {
      this.results.push({
        name: 'Anomaly detection',
        passed: false,
        message: `Failed: ${error}`,
        details: { error }
      });
    }
  }

  private async testReportGeneration(): Promise<void> {
    console.log('\n📝 Testing Report Generation...\n');

    try {
      const system = new FactCheckingSystem();
      const summaryPath = path.join(this.baseDir, 'legal-docs/executive-summary.md');
      const timelinePath = path.join(this.baseDir, 'timeline/MASTER-TIMELINE.md');

      system.extractClaims(summaryPath, timelinePath);
      system.verifyEvidence();
      system.detectSedgwickAnomalies();

      const testOutputDir = path.join(this.baseDir, 'evidence/test-output');
      if (!fs.existsSync(testOutputDir)) {
        fs.mkdirSync(testOutputDir, { recursive: true });
      }

      // Test verification report
      const verificationReport = path.join(testOutputDir, 'TEST-VERIFICATION-REPORT.md');
      system.generateVerificationReport(verificationReport);

      this.results.push({
        name: 'Verification report generation',
        passed: fs.existsSync(verificationReport),
        message: fs.existsSync(verificationReport) ? 'Report generated' : 'Report failed',
        details: { path: verificationReport }
      });

      // Test gaps analysis
      const gapsReport = path.join(testOutputDir, 'TEST-GAPS-ANALYSIS.md');
      system.generateGapsAnalysis(gapsReport);

      this.results.push({
        name: 'Gaps analysis generation',
        passed: fs.existsSync(gapsReport),
        message: fs.existsSync(gapsReport) ? 'Report generated' : 'Report failed',
        details: { path: gapsReport }
      });

      // Test anomalies report
      const anomaliesReport = path.join(testOutputDir, 'TEST-ANOMALIES-REPORT.md');
      system.generateAnomaliesReport(anomaliesReport);

      this.results.push({
        name: 'Anomalies report generation',
        passed: fs.existsSync(anomaliesReport),
        message: fs.existsSync(anomaliesReport) ? 'Report generated' : 'Report failed',
        details: { path: anomaliesReport }
      });

      // Test database export
      const dbExport = path.join(testOutputDir, 'TEST-fact-check-database.json');
      system.exportDatabase(dbExport);

      this.results.push({
        name: 'Database export',
        passed: fs.existsSync(dbExport),
        message: fs.existsSync(dbExport) ? 'Database exported' : 'Export failed',
        details: { path: dbExport }
      });

    } catch (error) {
      this.results.push({
        name: 'Report generation',
        passed: false,
        message: `Failed: ${error}`,
        details: { error }
      });
    }
  }

  private async testOutputValidation(): Promise<void> {
    console.log('\n📋 Testing Output Validation...\n');

    const testOutputDir = path.join(this.baseDir, 'evidence/test-output');
    const verificationReport = path.join(testOutputDir, 'TEST-VERIFICATION-REPORT.md');

    if (fs.existsSync(verificationReport)) {
      const content = fs.readFileSync(verificationReport, 'utf-8');

      // Check for required sections
      const requiredSections = [
        '## SUMMARY',
        '## CLAIMS BY TYPE',
        '## DETAILED VERIFICATION',
        '## UNVERIFIED CLAIMS'
      ];

      const missingSections = requiredSections.filter(section => !content.includes(section));

      this.results.push({
        name: 'Report structure validation',
        passed: missingSections.length === 0,
        message: missingSections.length === 0
          ? 'All sections present'
          : `Missing: ${missingSections.join(', ')}`,
        details: { missingSections }
      });

      // Check for data
      const hasData = content.includes('Total Claims:') &&
                     content.includes('Verified Claims:');

      this.results.push({
        name: 'Report data validation',
        passed: hasData,
        message: hasData ? 'Contains claim data' : 'Missing claim data'
      });
    }
  }

  private printResults(): void {
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(70));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    const passRate = (passed / total) * 100;

    console.log(`\nTotal Tests: ${total}`);
    console.log(`Passed: ${passed} ✓`);
    console.log(`Failed: ${failed} ✗`);
    console.log(`Pass Rate: ${passRate.toFixed(1)}%\n`);

    // Print failures
    const failures = this.results.filter(r => !r.passed);
    if (failures.length > 0) {
      console.log('❌ FAILED TESTS:');
      failures.forEach(result => {
        console.log(`  ✗ ${result.name}: ${result.message}`);
        if (result.details) {
          console.log(`    Details: ${JSON.stringify(result.details, null, 2)}`);
        }
      });
      console.log();
    }

    // Print successes
    console.log('✅ PASSED TESTS:');
    this.results.filter(r => r.passed).forEach(result => {
      console.log(`  ✓ ${result.name}: ${result.message}`);
    });

    console.log('\n' + '='.repeat(70));
    console.log(passRate === 100 ? '🎉 ALL TESTS PASSED!' : `⚠️  ${failed} test(s) need attention`);
    console.log('='.repeat(70));
  }
}

// Run tests
if (require.main === module) {
  const tester = new FactCheckerTester();
  tester.runAllTests().catch(console.error);
}

export default FactCheckerTester;

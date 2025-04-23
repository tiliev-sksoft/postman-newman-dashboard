const newman = require('newman');
const open = require('open');
const fs = require('fs');
const path = require('path');

// Constants
const PORT = 3000;
const reportsDir = path.join(__dirname, 'reports');
const historyFile = path.join(__dirname, 'run-history.json');

// Ensure "reports" directory exists
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
  console.log(`📁 Created reports directory: ${reportsDir}`);
}

// Helper function to generate a timestamped report name
function generateTimestampedReportName(prefix = 'newman-report') {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .split('Z')[0];
  return `${prefix}-${timestamp}.html`;
}

// Helper function to read JSON file with fallback
function readJsonFile(filePath, fallback = []) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8').trim();
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`⚠️ Failed to read JSON file (${filePath}):`, err);
  }
  return fallback;
}

// Helper function to write JSON file
function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ Successfully wrote to ${filePath}`);
  } catch (err) {
    console.error(`❌ Failed to write JSON file (${filePath}):`, err);
  }
}

// Generate report name and path
const reportName = generateTimestampedReportName();
const reportPath = path.join(reportsDir, reportName);

// Run Newman tests
newman.run(
  {
    collection: require('./data/Coll-Release Automated Postman CLI Testing1.json'), // Postman collection file
    environment: require('./data/Env-Test API Testing Postman Automated API Testing1.json'), // Postman environment file
    reporters: ['cli', 'htmlextra'], // Use CLI and HTML Extra reporters
    reporter: {
      htmlextra: {
        export: reportPath, // Export the report to the specified path
        title: 'SKsoft Postman API Test Dashboard', // Title of the report
        showOnlyFails: false, // Show all results, not just failures
        skipScreenshots: true, // Skip screenshots in the report
        browserTitle: 'SKsoft Test Report', // Browser title for the report
        darkTheme: true, // Use dark theme for the report
      },
    },
  },
  async (err, run) => {
    if (err) {
      console.error('❌ Newman run failed:', err);
      return;
    }

    const summary = run?.summary?.run?.stats?.tests; // Extract test summary
    console.log('📋 Test Summary:', summary);

    if (!summary || summary.total === 0) {
      console.warn('⚠️ No test summary found — nothing to save.');
      return;
    }

    // Metadata for the test run
    const reportUrl = `/reports/${reportName}`;
    const runMeta = {
      timestamp: new Date().toISOString(),
      reportName,
      reportUrl,
      passed: summary.total - summary.failed,
      failed: summary.failed,
      total: summary.total,
    };

    // Read and update run history
    const history = readJsonFile(historyFile, []);
    history.unshift(runMeta); // Add the new run to the beginning of the history
    writeJsonFile(historyFile, history); // Save the updated history

    console.log(`✅ Report saved at: ${reportPath}`);
    console.log(`🧪 Passed: ${runMeta.passed}, Failed: ${runMeta.failed}`);

    // Open the report in the browser
    try {
      await open(reportPath);
    } catch (err) {
      console.error('❌ Failed to open report in browser:', err);
    }
  }
);

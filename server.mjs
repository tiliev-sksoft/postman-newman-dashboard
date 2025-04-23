import fs from 'fs';
import path from 'path';
import newman from 'newman';
import express from 'express';
import { ensureDirectoryExists, readJsonFile, writeJsonFile, generateTimestampedReportName } from './helpers.mjs';

const app = express();
const PORT = 3000; // Port for the server
const reportsDir = path.join(process.cwd(), 'reports'); // Directory to store reports
const historyFile = path.join(process.cwd(), 'run-history.json'); // File to store test run history

// ✅ Ensure "reports" folder exists
ensureDirectoryExists(reportsDir);

// ✅ Serve static files from the "public" directory
app.use(express.static('public'));
// ✅ Serve reports from the "reports" directory
app.use('/reports', express.static('reports'));

let open; // Variable to hold the "open" module for opening URLs in the browser

(async () => {
  // Dynamically import the "open" module
  open = (await import('open')).default;

  // ✅ POST route to run tests
  app.post('/run-tests', async (req, res) => {
    try {
      const reportName = generateTimestampedReportName(); // Generate a unique report name
      const reportPath = path.join(reportsDir, reportName); // Full path to the report file

      // Run Newman tests
      newman.run(
        {
          collection: './data/Coll-Release Automated Postman CLI Testing1.json', // Postman collection file
          environment: './data/Env-Test API Testing Postman Automated API Testing1.json', // Postman environment file
          reporters: ['cli', 'htmlextra'], // Use CLI and HTML Extra reporters
          reporter: {
            htmlextra: {
              export: reportPath, // Export the report to the specified path
              title: 'SKsoft API Test Dashboard', // Title of the report
              browserTitle: 'API Test Results', // Browser title for the report
              darkTheme: true, // Use dark theme for the report
            },
          },
        },
        async (err, run) => {
          if (err) {
            console.error('❌ Newman test run error:', err);
            return res.status(500).send({ error: err.message });
          }

          const reportUrl = `/reports/${reportName}`; // URL to access the report
          console.log(`✅ Report generated: ${reportUrl}`);
          await open(`http://localhost:${PORT}${reportUrl}`); // Open the report in the browser

          const summary = run?.summary?.run?.stats?.tests; // Extract test summary

          if (!summary) {
            console.error('❌ Summary data missing from Newman run.');
            return res.status(500).send({ error: 'Test summary not available' });
          }

          // Metadata for the test run
          const runMeta = {
            timestamp: new Date().toISOString(),
            reportName,
            reportUrl,
            passed: summary.total - summary.failed,
            failed: summary.failed,
            total: summary.total,
          };

          // Update run history
          const history = readJsonFile(historyFile, []); // Read existing history
          history.unshift(runMeta); // Add the new run to the beginning of the history
          writeJsonFile(historyFile, history); // Save the updated history

          // Send response to the client
          res.status(200).send({
            message: 'Test complete! Report opened in browser.',
            reportUrl,
          });
        }
      );
    } catch (err) {
      console.error('❌ Error running tests:', err);
      res.status(500).send({ error: 'Failed to run tests' });
    }
  });

  // ✅ GET route to list available reports
  app.get('/get-reports', (req, res) => {
    try {
      const files = fs.readdirSync(reportsDir); // Read the "reports" directory
      const htmlReports = files.filter((file) => file.endsWith('.html')).sort().reverse(); // Filter and sort HTML reports
      res.json(htmlReports); // Send the list of reports as JSON
    } catch (err) {
      console.error('❌ Failed to read reports folder:', err);
      res.status(500).json({ error: 'Failed to read reports folder' });
    }
  });

  // ✅ GET route to fetch run history
  app.get('/get-run-history', (req, res) => {
    try {
      const history = readJsonFile(historyFile, []); // Read the run history file
      res.json(history); // Send the history as JSON
    } catch (err) {
      console.error('❌ Failed to read run history:', err);
      res.status(500).json({ error: 'Failed to read run history' });
    }
  });

  // ✅ Start the server
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
})();

// ✅ Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err);
});
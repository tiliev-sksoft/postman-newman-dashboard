import fs from 'fs';
import path from 'path';

const helpers = {
  ensureDirectoryExists,
  readJsonFile,
  writeJsonFile,
  generateTimestampedReportName,
};

export default helpers;

/**
 * Ensures a directory exists. If it doesn't, creates it.
 * @param {string} dirPath - The path of the directory to ensure.
 */
export function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

/**
 * Reads a JSON file and parses its content.
 * @param {string} filePath - The path to the JSON file.
 * @param {Array|Object} fallback - The fallback value if the file doesn't exist or fails to parse.
 * @returns {Array|Object} - The parsed JSON content or the fallback value.
 */
export function readJsonFile(filePath, fallback = []) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8').trim();
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`⚠️ Failed to read JSON file (${filePath}):`, err);
  }
  return fallback; // Return fallback if parsing fails
}

/**
 * Writes data to a JSON file.
 * @param {string} filePath - The path to the JSON file.
 * @param {Array|Object} data - The data to write to the file.
 */
export function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ Successfully wrote to ${filePath}`);
  } catch (err) {
    console.error(`❌ Failed to write JSON file (${filePath}):`, err);
  }
}

/**
 * Generates a timestamped report name.
 * @param {string} prefix - The prefix for the report name.
 * @returns {string} - The generated report name.
 */
export function generateTimestampedReportName(prefix = 'newman-report') {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .split('Z')[0];
  return `${prefix}-${timestamp}.html`;
}

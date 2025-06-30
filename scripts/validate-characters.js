#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const charactersDir = path.join(__dirname, '..', 'public', 'characters');
const schemaPath = path.join(__dirname, '..', 'src', 'character-schema.json');

// Get all JSON files in the characters directory
const files = fs.readdirSync(charactersDir)
  .filter(file => file.endsWith('.json') && file !== 'character-schema.json');

console.log('Validating character files...\n');

let hasErrors = false;

files.forEach(file => {
  const filePath = path.join(charactersDir, file);
  
  try {
    execSync(`npx ajv validate --spec=draft2019 -s "${schemaPath}" -d "${filePath}"`, {
      stdio: 'pipe'
    });
    console.log(`✓ ${file} - valid`);
  } catch (error) {
    hasErrors = true;
    console.error(`✗ ${file} - invalid`);
    console.error(error.stdout.toString());
  }
});

if (hasErrors) {
  console.error('\nValidation failed!');
  process.exit(1);
} else {
  console.log('\nAll character files are valid!');
}
#!/usr/bin/env tsx
import Ajv from 'ajv';
import fs from 'fs';
import path from 'path';

const ajv = new Ajv();

// Load the enemy schema
const schemaPath = path.join(process.cwd(), 'src', 'enemy-schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const validate = ajv.compile(schema);

// Get all enemy files
const enemiesDir = path.join(process.cwd(), 'public', 'enemies');
const enemyFiles = fs.readdirSync(enemiesDir).filter(file => file.endsWith('.json'));

console.log('Validating enemy files...\n');

let allValid = true;

for (const filename of enemyFiles) {
  const filePath = path.join(enemiesDir, filename);
  
  try {
    const enemyData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const isValid = validate(enemyData);
    
    if (isValid) {
      console.log(`✓ ${filename} - valid`);
    } else {
      console.log(`✗ ${filename} - invalid:`);
      console.log(validate.errors?.map(err => `  - ${err.instancePath} ${err.message}`).join('\n'));
      allValid = false;
    }
  } catch (error) {
    console.log(`✗ ${filename} - error reading file: ${error}`);
    allValid = false;
  }
}

if (allValid) {
  console.log('\nAll enemy files are valid!');
  process.exit(0);
} else {
  console.log('\nSome enemy files failed validation.');
  process.exit(1);
}
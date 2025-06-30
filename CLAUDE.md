# Wildcombat Project

## Overview
Wildcombat is a Vite React application for managing Wildsea RPG character sheets and combat scenarios.

## Project Structure
- **Frontend**: React + Vite
- **Character Data**: JSON files stored in `public/characters/`
- **Validation**: JSON Schema validation using AJV

## Character System
The project contains character data for a Wildsea RPG campaign with four characters:
- Cap (Ironbound Screw) - Metal-controlling character with magnetic abilities
- Cosmia (Mothryn Augur) - Fortune-telling moth person with astral abilities  
- Kari (Itzenko Tempest) - Lightning-wielding insectoid stowaway
- Phil (Gau Char) - Mushroom person chef with psychotropic spores

### Character Schema
Characters are validated against a JSON Schema (draft-2019-09) located at `public/characters/character-schema.json`. The schema defines the required structure including:
- Basic info (name, portrait, background)
- Game mechanics (edges, skills, languages, drives, mires)
- Resources (charts, salvage, specimens, whispers)
- Aspects (abilities and equipment)
- Progress tracking (milestones, temporary tracks)

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run validate:characters` - Validate all character JSON files

## Important Notes
⚠️ **DO NOT modify any files in `public/characters/*.json`** - These are player character sheets that should only be edited by the players themselves or through the application interface.

## Technical Details
- Uses ES modules (`"type": "module"` in package.json)
- Character validation script at `scripts/validate-characters.js`
- AJV CLI for JSON schema validation (supports draft-07 and draft-2019-09 only)

## Dependencies
- React 19.1.0
- Vite 7.0.0
- AJV 8.17.1 (for JSON schema validation)
- AJV CLI 5.0.0
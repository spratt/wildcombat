# Wildcombat Project

## Overview
Wildcombat is a Vite React application for managing Wildsea RPG character sheets and combat scenarios. It provides a complete combat simulation system with party management, enemy encounters, and dice-based combat mechanics.

## Project Structure
- **Frontend**: React + Vite with modular CSS architecture
- **Character Data**: JSON files stored in `public/characters/`
- **Enemy Data**: JSON files stored in `public/enemies/`
- **Validation**: JSON Schema validation using AJV
- **State Management**: localStorage for persistence
- **Combat Engine**: Modular utilities for dice rolling and damage calculation

## Application Tabs

### Party Tab (Combined Character Viewer & Party Management)
- **Character Viewer**: Select, upload, view, and manage individual characters
- **Character Actions**: Add to Party, Save Character, Export Character, Heal All Aspects
- **Party Management**: Build party, view party stats, heal party
- **Auto-save**: Party automatically saves to localStorage on every change
- **Character Persistence**: Last viewed character is remembered across sessions

### Enemies Tab
- **Enemy Management**: Select and view enemy details from JSON files
- **Encounter Builder**: Add enemies to encounters with count management
- **Auto-save**: Encounters automatically save to localStorage on every change
- **Enemy Stats**: Display enemy aspects, drives, quirks, and presence

### Simulate Tab
- **Combat Simulation**: Full dice-based combat system
- **Party vs Encounter**: Displays party and enemy stats side-by-side
- **Simulation Options**: Configurable damage models
- **Combat Controls**: Simulate rounds, sessions, or clear state
- **Combat Log**: Detailed round-by-round combat results

## Character System
The project contains character data for a Wildsea RPG campaign with four characters:
- **Cap** (Ironbound Screw) - Metal-controlling character with magnetic abilities
- **Cosmia** (Mothryn Augur) - Fortune-telling moth person with astral abilities  
- **Kari** (Itzenko Tempest) - Lightning-wielding insectoid stowaway
- **Phil** (Gau Char) - Mushroom person chef with psychotropic spores

### Character Schema
Characters are validated against a JSON Schema (draft-07) located at `src/character-schema.json`. The schema defines:
- **Basic info**: name, portrait, background
- **Game mechanics**: edges, skills, languages, drives, mires
- **Resources**: charts, salvage, specimens, whispers
- **Aspects**: abilities and equipment with track values
- **Progress tracking**: milestones, temporary tracks

### Aspect System
- **Track Rendering**: ⦿ (filled), ⦾ (empty), ⦻ (burned)
- **HP Calculation**: Sum of unchecked (0) bubbles across all aspects
- **Default Values**: Missing aspect values default to `[0]` (1 HP)
- **Combat Integration**: Longest aspect track used in damage calculations

## Combat System

### Core Mechanics
- **Dice System**: d6-based with multiple dice pools
- **Damage Calculation**: Based on highest die roll and doubles bonus
- **Targeting**: Players attack lowest HP enemy, enemies attack lowest HP player
- **Defense**: Defense rolls determine damage taken and counter-attack opportunities

### Damage Models
1. **0,1,2,counter**: Original model
   - Roll 6: 0 damage
   - Roll 4-5: 1 damage  
   - Roll 1-3: 2 damage
   - Doubles: Counter-attack

2. **1,2,aspect,counter**: Aspect-based model
   - Roll 6: 1 damage
   - Roll 4-5: 2 damage
   - Roll 1-3: Damage = longest aspect track length
   - Doubles: Counter-attack

### Combat Flow
1. **Player Attack Phase**: Each party member attacks lowest HP enemy
2. **Enemy Attack Phase**: Each enemy attacks lowest HP player
3. **Defense Resolution**: Target rolls defense, takes damage, potential counter
4. **Win/Lose Conditions**: Combat ends when one side is eliminated

## CSS Architecture
Modular CSS structure in `src/styles/`:
- `global.css` - Root styles and common elements
- `tabs.css` - Tab navigation styling
- `components/Character.css` - Character display and management
- `components/PartyTab.css` - Party management interface
- `components/EnemiesTab.css` - Enemy and encounter management
- `components/SimulateTab.css` - Combat simulation interface

## State Management & Persistence

### localStorage Keys
- `wildcombat-party` - Current party composition
- `wildcombat-encounter` - Current enemy encounter
- `wildcombat-active-tab` - Last selected tab
- `wildcombat-last-character` - Last viewed character in Character Viewer

### Auto-save Behavior
- **Party**: Saves on add/remove character, heal party
- **Encounter**: Saves on add/remove enemy, count changes
- **Character**: Saves last viewed character on selection/upload/heal
- **Tab**: Saves active tab on change

## Utility Modules

### Combat Engine (`src/utils/combatEngine.js`)
- `rollDice(count)` - Roll specified number of d6
- `calculateDamage(rolls)` - Calculate attack damage from rolls
- `calculateDefenseDamage(rolls, damageModel, character)` - Calculate defense damage
- `checkWinConditions(enemies, party)` - Determine combat end state

### Combat Simulator (`src/utils/combatSimulator.js`)
- `simulatePlayerAttackPhase(party, enemies)` - Player attacks
- `simulateEnemyAttackPhase(enemies, party, damageModel)` - Enemy attacks
- `simulateOneRound(party, enemies, round, damageModel)` - Complete round

### Session Simulator (`src/utils/sessionSimulator.js`)
- `simulateFullSession(party, enemies, startRound, damageModel)` - Full combat with timeout

### Data Manager (`src/utils/dataManager.js`)
- Party and encounter loading functions
- Statistics calculations
- State reset utilities

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run lint` - Run ESLint
- `npm run validate:characters` - Validate all character JSON files

## Important Notes

### File Modification Rules
⚠️ **DO NOT modify any files in `public/characters/*.json`** - These are player character sheets that should only be edited by the players themselves or through the application interface.

⚠️ **DO NOT modify any files in `public/enemies/*.json`** - These are enemy definitions used by the combat system.

### Data Integrity
- All character and enemy data is validated against JSON schemas
- Missing aspect values automatically default to `[0]`
- HP calculations include all aspects (including defaults)
- Combat state is preserved across page reloads

### Performance Considerations
- Session simulation has 1-second timeout protection
- Maximum 100 rounds per session to prevent infinite loops
- Modular CSS reduces style conflicts
- localStorage operations are wrapped in try-catch blocks

## Technical Details
- **Module System**: ES modules (`"type": "module"` in package.json)
- **Validation**: AJV 8.17.1 with draft-07 JSON Schema support
- **Character Schema**: `src/character-schema.json`
- **Enemy Schema**: `src/enemy-schema.json`
- **Validation Script**: `scripts/validate-characters.js`

## Dependencies
- React 19.1.0
- Vite 7.0.0
- AJV 8.17.1 (JSON schema validation)
- AJV CLI 5.0.0

## Development Workflow
1. Characters are managed in the Party tab (view, add to party, heal)
2. Encounters are built in the Enemies tab (add enemies, set counts)
3. Combat is simulated in the Simulate tab (configure options, run simulation)
4. All data persists automatically via localStorage
5. Tab selection and character views are remembered across sessions
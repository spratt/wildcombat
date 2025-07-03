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
- **Simulation Options**: Configurable damage models and enemy attacks per round
- **Ability Controls**: Checkbox to enable/disable enemy ability usage
- **Combat Controls**: Simulate rounds, sessions, or many sessions with statistics
- **Session Statistics**: Win/loss rates, average rounds, average HP tracking
- **Combat Log**: Detailed round-by-round combat results with message styling

## Character System
The project contains character data for a Wildsea RPG campaign. Example characters include:
- **Zara** (Ardent Dredger) - Medical specialist with healing abilities
- **Thresh** (Ketra Rootless) - Navigator with weather prediction abilities
- **Felix** (Tzelicrae Spit) - Acrobatic fighter with mobility skills
- **Nova** (Cacophony Shankling) - Sonic musician with sound-based abilities

Character lists are dynamically loaded from `config.json` to allow easy addition/removal.

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

3. **1,aspect,2aspect,counter**: Double aspect model
   - Roll 6: 1 damage
   - Roll 4-5: Damage = longest aspect track length
   - Roll 1-3: Damage = 2x longest aspect track length
   - Doubles: Counter-attack

### Enemy Abilities
- **Incapacitate**: Special enemy attack that can disable characters
  - Roll 6: 1 damage
  - Roll 4-5: Character incapacitated for 1 round
  - Roll 1-3: Character fully incapacitated (all HP removed)
- **Usage Control**: Abilities can be enabled/disabled via checkbox
- **Once Per Session**: Each enemy ability can only be used once per combat session
- **Aspect-Based**: Abilities are tied to specific enemy aspects with abilityCode
- **Function-Based System**: Abilities now use a modular function mapping system for extensibility
- **Unique Enemy Abilities**: Special boss enemies have custom abilities:
  - **violetHaze**: AoE poison damage affecting all party members
  - **bonniesRevenge**: Damage boost when allies are defeated
  - **ganglandExecution**: Reduces wounded enemies to 1 HP
  - **dualWieldBarrage**: Multi-target attack with advantage defense
  - **highNoonDuel**: Single-target lockdown mechanic
  - **desertMirage**: Defensive confusion effect

### Combat Flow
1. **Incapacitation Clear**: All incapacitation status cleared at round start
2. **Player Attack Phase**: Each party member attacks lowest HP enemy
3. **Enemy Attack Phase**: Each enemy attacks lowest HP player or uses abilities
4. **Defense Resolution**: Target rolls defense, takes damage, potential counter
5. **Win/Lose Conditions**: Combat ends when one side is eliminated

### Session Statistics
- **Multi-Session Simulation**: Run 1-100 sessions with full statistics
- **Win/Loss Tracking**: Percentage breakdown of session outcomes
- **Round Averaging**: Calculate average combat duration
- **HP Tracking**: Average remaining HP for wins/losses
- **State Management**: Proper button disable/enable based on combat state

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
- `wildcombat-use-abilities` - Enemy ability usage setting

### Auto-save Behavior
- **Party**: Saves on add/remove character, heal party
- **Encounter**: Saves on add/remove enemy, count changes
- **Character**: Saves last viewed character on selection/upload/heal
- **Tab**: Saves active tab on change

## Utility Modules

### Combat Engine (`src/utils/combatEngine.js`)
- `rollDice(count, options)` - Roll specified number of d6 with optional advantage/cut modifiers
  - `advantage`: Roll extra dice and keep the best results
  - `cut`: Roll fewer dice (minimum 1) for disadvantage
- `calculateDamage(rolls)` - Calculate attack damage from rolls
- `calculateDefenseDamage(rolls, damageModel, character)` - Calculate defense damage
- `calculateIncapacitateDefense(rolls)` - Calculate incapacitation effects
- `checkWinConditions(enemies, party)` - Determine combat end state
- **Ability Functions**: Modular system for unique enemy abilities
  - Each ability is a separate function in the abilities module
  - Abilities can modify dice rolls, damage, or target selection

### Combat Simulator (`src/utils/combatSimulator.js`)
- `simulatePlayerAttackPhase(party, enemies, damageModel, attacksPerRound)` - Player attacks
- `simulateEnemyAttackPhase(enemies, party, damageModel, attacksPerRound, useAbilities)` - Enemy attacks
- `simulateOneRound(party, enemies, round, damageModel, attacksPerRound, useAbilities)` - Complete round

### Session Simulator (`src/utils/sessionSimulator.js`)
- `simulateFullSession(party, enemies, startRound, damageModel, attacksPerRound, useAbilities)` - Full combat with timeout

### Data Manager (`src/utils/dataManager.js`)
- `calculateEnemyTrackLength(enemy)` - Calculate total HP from aspect trackLengths
- `calculatePartyStats(party)` - Calculate total party statistics
- `calculateEncounterStats(enemies)` - Calculate total encounter statistics
- Party and encounter loading functions
- State reset utilities

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run build:pages` - Build for GitHub Pages deployment
- `npm run lint` - Run ESLint
- `npm test` - Run unit tests (Vitest)
- `npm run test:run` - Run tests once and exit
- `npm run coverage` - Run tests with coverage report
- `npm run validate:characters` - Validate all character JSON files
- `npm run validate:enemies` - Validate all enemy JSON files
- `npm run check:file-sizes` - Check for oversized files to prevent repository bloat
- `npm run typecheck` - Run TypeScript type checking

## Important Notes

### File Modification Rules
⚠️ **DO NOT modify any files in `public/characters/*.json`** - These are player character sheets that should only be edited by the players themselves or through the application interface.

⚠️ **DO NOT modify any files in `public/enemies/*.json`** - These are enemy definitions used by the combat system. Note: Enemy trackLength field has been moved to individual aspects.

### Data Integrity
- All character and enemy data is validated against JSON schemas
- **Character Schema**: `src/character-schema.json` validates character structure
- **Enemy Schema**: `src/enemy-schema.json` validates enemy structure and aspect trackLengths
- **Unique Enemy Support**: Schema includes `unique` boolean field for boss enemies
- **Ability Validation**: Enemy abilities validated with `abilityCode` field
- Missing aspect values automatically default to `[0]`
- HP calculations include all aspects (including defaults)
- Combat state is preserved across page reloads
- Pre-commit hooks validate all data before allowing commits
- File size monitoring prevents large files (>1MB) from being committed

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
- **Validation Scripts**: 
  - `scripts/validate-characters.ts` - TypeScript validation for characters
  - `scripts/validate-enemies.ts` - TypeScript validation for enemies
- **Configuration**: `public/config.json` contains dynamic lists of available enemies and characters
- **File Size Monitoring**: Shell script prevents large files from being committed
- **ESLint Configuration**: Modern flat config with proper TypeScript support

## Dependencies
- React 19.1.0
- Vite 7.0.0
- AJV 8.17.1 (JSON schema validation)
- AJV CLI 5.0.0
- Vitest 2.1.8 (testing framework)

## Testing
- **Unit Test Coverage**: Comprehensive tests for combat simulation logic with improved coverage
- **Test Files**: Located in `src/tests/` directory
  - `combatEngine.test.js` - Core combat mechanics including advantage/cut (28 tests)
  - `combatSimulator.test.js` - Attack phases and rounds with ability testing (15 tests)
  - `dataManager.test.js` - Data calculations and statistics (14 tests)
  - `sessionSimulator.test.js` - Full session simulation with timeout protection (7 tests)
- **Test Framework**: Vitest with mocking for deterministic results
- **Test Coverage**: 64 tests covering:
  - Dice rolling with advantage/cut modifiers
  - Damage calculation for all models
  - Enemy abilities and special attacks
  - Win conditions and edge cases
  - Session timeout protection
- **Coverage Reporting**: Run with `npm run coverage` for detailed metrics
- **CI/CD Ready**: Tests run once and exit for automation compatibility

## Recent Improvements (2025)
- **Unique Enemy System**: Added support for boss-type enemies with custom abilities and lore
- **Function-Based Abilities**: Refactored ability system to use modular function mapping
- **Dynamic Configuration**: Enemy and character lists now loaded from `config.json`
- **Enhanced Dice System**: Added advantage/cut modifiers for more complex combat scenarios
- **File Size Monitoring**: Prevents repository bloat by checking file sizes pre-commit
- **TypeScript Integration**: Validation scripts converted to TypeScript
- **Improved Test Coverage**: Enhanced unit tests for all new features
- **Enemy Validation**: Added JSON schema validation for enemy data integrity

## Development Workflow
1. Characters are managed in the Party tab (view, add to party, heal)
2. Encounters are built in the Enemies tab (add enemies, set counts)
3. Combat is simulated in the Simulate tab (configure options, run simulation)
4. Enemy abilities can be toggled on/off for different simulation scenarios
5. Multi-session statistics provide balance analysis for game design
6. All data persists automatically via localStorage
7. Tab selection and character views are remembered across sessions
8. Unit tests ensure combat logic reliability and catch regressions
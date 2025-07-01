# Wildcombat

A Vite React application for managing Wildsea RPG character sheets and combat scenarios. This tool provides a complete combat simulation system with party management, enemy encounters, and dice-based combat mechanics for the Wildsea tabletop RPG.

## 🎮 Demo

Try the live demo: [https://spratt.github.io/wildcombat/](https://spratt.github.io/wildcombat/)

## ✨ Features

### Character Management
- **Character Viewer**: Upload, view, and manage Wildsea character sheets
- **Party Builder**: Create and manage adventuring parties
- **Character Persistence**: Auto-save functionality with localStorage
- **JSON Schema Validation**: Ensures character data integrity

### Combat Simulation
- **Dice-Based Combat**: Full implementation of Wildsea combat mechanics
- **Multiple Damage Models**: Choose between different damage calculation systems
- **Enemy Abilities**: Special attacks like incapacitation with toggle controls
- **Multi-Session Statistics**: Run hundreds of simulations for balance analysis
- **Real-Time Combat Log**: Detailed round-by-round combat results with color coding
- **Session Analytics**: Win/loss rates, average rounds, HP tracking
- **Win/Loss Detection**: Automatic combat resolution

### Enemy Management
- **Enemy Database**: Browse and select from available enemies
- **Encounter Builder**: Create custom enemy encounters with counts
- **Enemy Stats Display**: View enemy aspects, drives, and abilities

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/spratt/wildcombat.git
cd wildcombat

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
# Build for regular deployment
npm run build

# Build for GitHub Pages (outputs to docs/)
npm run build:pages
```

## 🎲 How to Use

1. **Party Tab**: Upload character sheets or use the provided example characters to build your party
2. **Enemies Tab**: Select enemies and build encounters for your party to face
3. **Simulate Tab**: Run combat simulations with configurable damage models, enemy abilities, and statistical analysis

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── Character.jsx    # Character display and management
│   ├── PartyTab.jsx     # Party management interface
│   ├── EnemiesTab.jsx   # Enemy and encounter management
│   └── SimulateTab.jsx  # Combat simulation interface
├── utils/               # Core game logic
│   ├── combatEngine.js  # Dice rolling and damage calculation
│   ├── combatSimulator.js # Combat round simulation
│   ├── sessionSimulator.js # Full session simulation
│   └── dataManager.js   # Data loading and statistics
├── tests/               # Unit test suites (Vitest)
├── styles/              # Modular CSS architecture
└── schemas/             # JSON Schema validation
```

## 🎯 Combat System

### Damage Models

**Original (0,1,2,counter)**
- Roll 6: 0 damage
- Roll 4-5: 1 damage  
- Roll 1-3: 2 damage
- Doubles: Counter-attack opportunity

**Aspect-based (1,2,aspect,counter)**
- Roll 6: 1 damage
- Roll 4-5: 2 damage
- Roll 1-3: Damage = longest aspect track length
- Doubles: Counter-attack opportunity

**Double Aspect (1,aspect,2aspect,counter)**
- Roll 6: 1 damage
- Roll 4-5: Damage = longest aspect track length
- Roll 1-3: Damage = 2x longest aspect track length
- Doubles: Counter-attack opportunity

### Enemy Abilities
- **Incapacitate**: Special attack that can disable characters temporarily or permanently
- **Once Per Session**: Each ability can only be used once per combat session
- **Toggle Control**: Enable/disable ability usage via checkbox for different scenarios

### Combat Flow
1. **Incapacitation Clear**: All status effects cleared at round start
2. **Player Attack Phase**: Each party member attacks lowest HP enemy
3. **Enemy Attack Phase**: Each enemy attacks lowest HP player or uses special abilities
4. **Defense Resolution**: Target rolls defense, takes damage, potential counter
5. **Win/Lose Conditions**: Combat ends when one side is eliminated

## 📊 Character System

Characters are validated against JSON Schema and include:
- **Basic Info**: Name, portrait, background (bloodline, origin, post)
- **Game Mechanics**: Edges, skills, languages, drives, mires
- **Resources**: Charts, salvage, specimens, whispers
- **Aspects**: Abilities and equipment with damage tracks
- **Progress Tracking**: Milestones and temporary tracks

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:pages` - Build for GitHub Pages
- `npm run lint` - Run ESLint
- `npm test` - Run unit tests
- `npm run validate:characters` - Validate character JSON files

### Technologies Used

- **Frontend**: React 19, Vite 7
- **Testing**: Vitest with comprehensive unit tests (64 tests)
- **Validation**: AJV with JSON Schema
- **State Management**: localStorage for persistence
- **Styling**: Modular CSS with responsive design

### Testing

The project includes comprehensive unit tests covering all combat simulation logic:
- **64 tests** across 4 test suites
- **Combat Engine**: Dice rolling, damage calculation, win conditions
- **Combat Simulator**: Attack phases, rounds, abilities
- **Data Manager**: Statistics and calculations
- **Session Simulator**: Full session simulation with timeout protection

## 🎮 Example Characters

The project includes 4 example characters showcasing different Wildsea bloodlines and roles:

- **Zara**: Ardent Dredger Sawbones (medical specialist)
- **Thresh**: Ketra Rootless Navigator (weather prediction)
- **Felix**: Tzelicrae Spit Corsair (acrobatic fighter)
- **Nova**: Cacophony Shankling Spit-Lyre (sonic musician)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🙏 Acknowledgments

- Built for the [Wildsea RPG](https://www.mythworksgames.com/the-wildsea) by Mythworks Games
- Character data structure based on the official Wildsea character sheet format
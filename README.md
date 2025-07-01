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
- **Real-Time Combat Log**: Detailed round-by-round combat results with color coding
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
3. **Simulate Tab**: Run combat simulations with configurable damage models and view detailed results

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
│   └── dataManager.js   # Data loading and statistics
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

### Combat Flow
1. **Player Attack Phase**: Each party member attacks lowest HP enemy
2. **Enemy Attack Phase**: Each enemy attacks lowest HP player
3. **Defense Resolution**: Target rolls defense, takes damage, potential counter
4. **Win/Lose Conditions**: Combat ends when one side is eliminated

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
- `npm run validate:characters` - Validate character JSON files

### Technologies Used

- **Frontend**: React 19, Vite 7
- **Validation**: AJV with JSON Schema
- **State Management**: localStorage for persistence
- **Styling**: Modular CSS with responsive design

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
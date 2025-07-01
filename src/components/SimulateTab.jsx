import { useState, useEffect } from 'react';
import { simulateOneRound } from '../utils/combatSimulator.js';
import { simulateFullSession } from '../utils/sessionSimulator.js';
import { checkWinConditions } from '../utils/combatEngine.js';
import { 
  loadPartyFromStorage, 
  loadEncounterFromStorage, 
  loadEnemiesData,
  generateUniqueEnemyNames,
  renderTrackLength,
  calculatePartyStats,
  calculateEncounterStats,
  resetCombatState
} from '../utils/dataManager.js';

const SimulateTab = () => {
  const [partyCharacters, setPartyCharacters] = useState([]);
  const [encounter, setEncounter] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [uniqueEnemies, setUniqueEnemies] = useState([]);
  const [combatLog, setCombatLog] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [combatResult, setCombatResult] = useState(null);
  const [damageModel, setDamageModel] = useState(() => {
    try {
      return localStorage.getItem('wildcombat-damage-model') || '0,1,2,counter';
    } catch (error) {
      console.warn('Failed to load damage model from localStorage:', error);
      return '0,1,2,counter';
    }
  });
  const [enemyAttacksPerRound, setEnemyAttacksPerRound] = useState(() => {
    try {
      return parseInt(localStorage.getItem('wildcombat-enemy-attacks-per-round')) || 1;
    } catch (error) {
      console.warn('Failed to load enemy attacks per round from localStorage:', error);
      return 1;
    }
  });

  useEffect(() => {
    loadParty();
    loadEncounter();
    loadEnemies();
  }, []);

  // Generate unique enemy names when encounter or enemies change
  useEffect(() => {
    if (encounter.length > 0 && enemies.length > 0) {
      const uniqueEnemyList = generateUniqueEnemyNames(encounter, enemies);
      setUniqueEnemies(uniqueEnemyList);
    } else {
      setUniqueEnemies([]);
    }
  }, [encounter, enemies]);

  const loadParty = () => {
    const partyData = loadPartyFromStorage();
    setPartyCharacters(partyData);
  };

  const loadEncounter = () => {
    const encounterData = loadEncounterFromStorage();
    setEncounter(encounterData);
  };

  const loadEnemies = async () => {
    const enemyData = await loadEnemiesData();
    setEnemies(enemyData);
  };

  // Calculate stats using utility functions
  const { totalHitPoints: totalPartyHitPoints, totalAttackScore: totalPartyAttackScore, totalDefenseScore: totalPartyDefenseScore } = calculatePartyStats(partyCharacters);
  const { totalHP: totalEncounterHP } = calculateEncounterStats(uniqueEnemies);

  // Check if combat is over using utility function
  const { isOver: combatOver, aliveEnemies, aliveParty } = checkWinConditions(uniqueEnemies, partyCharacters);

  // Save damage model to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('wildcombat-damage-model', damageModel);
    } catch (error) {
      console.warn('Failed to save damage model to localStorage:', error);
    }
  }, [damageModel]);

  // Save enemy attacks per round to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('wildcombat-enemy-attacks-per-round', enemyAttacksPerRound.toString());
    } catch (error) {
      console.warn('Failed to save enemy attacks per round to localStorage:', error);
    }
  }, [enemyAttacksPerRound]);

  // Get damage model explanation
  const getDamageModelExplanation = (model) => {
    switch (model) {
      case '0,1,2,counter':
        return `Original damage model:
• Roll 6: 0 damage
• Roll 4-5: 1 damage  
• Roll 1-3: 2 damage
• Doubles: Counter-attack opportunity

This model rewards high rolls by dealing less damage, representing skilled defensive maneuvers that minimize harm.`;
      
      case '1,2,aspect,counter':
        return `Aspect-based damage model:
• Roll 6: 1 damage
• Roll 4-5: 2 damage
• Roll 1-3: Damage = longest aspect track length
• Doubles: Counter-attack opportunity

This model scales damage based on character capabilities, where poor rolls can deal devastating damage equal to the defender's longest aspect track.`;
      
      case '1,aspect,2aspect,counter':
        return `Aspect track damage model:
• Roll 6: 1 damage
• Roll 4-5: 1 aspect of damage (= longest aspect track length)
• Roll 1-3: 2 aspects of damage (= 2x longest aspect track length)
• Doubles: Counter-attack opportunity

This model uses aspect track lengths as the basis for damage calculations, making poor defensive rolls extremely punishing by dealing multiple aspects worth of damage.`;
      
      default:
        return 'Unknown damage model selected.';
    }
  };


  const handleSimulateOneRound = () => {
    const result = simulateOneRound(partyCharacters, uniqueEnemies, currentRound, damageModel, enemyAttacksPerRound);
    
    // Update state with results
    setUniqueEnemies(result.updatedEnemies);
    setPartyCharacters(result.updatedParty);
    setCombatLog(prev => [...prev, ...result.log]);
    
    if (result.combatResult) {
      setCombatResult(result.combatResult);
    }
    
    if (!result.isOver) {
      setCurrentRound(prev => prev + 1);
    }
  };

  const clearSimulation = () => {
    const { resetEnemies, resetParty } = resetCombatState(uniqueEnemies, partyCharacters);
    
    setUniqueEnemies(resetEnemies);
    setPartyCharacters(resetParty);
    setCombatLog([]);
    setCurrentRound(1);
    setCombatResult(null);
  };

  const handleSimulateOneSession = () => {
    const sessionResult = simulateFullSession(partyCharacters, uniqueEnemies, currentRound, damageModel, enemyAttacksPerRound);
    
    // Update state with final session results
    setUniqueEnemies(sessionResult.finalEnemies);
    setPartyCharacters(sessionResult.finalParty);
    setCurrentRound(sessionResult.finalRound);
    setCombatLog(prev => [...prev, ...sessionResult.sessionLog]);
    
    if (sessionResult.combatResult) {
      setCombatResult(sessionResult.combatResult);
    }
  };

  return (
    <div className="tab-content">
      <h2>Combat Simulation</h2>
      
      <div className="simulate-layout">
        {/* Party Column */}
        <div className="party-column">
          <div className="party-section">
            <h3>Party</h3>
            
            {partyCharacters.length === 0 ? (
              <div className="empty-party">
                <p>No party loaded. Go to the Party tab to build a party.</p>
              </div>
            ) : (
              <>
                {/* Party Stats */}
                <div className="party-stats">
                  <div className="stat">
                    <span className="stat-label">Characters:</span>
                    <span className="stat-value">{partyCharacters.length}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Total HP:</span>
                    <span className="stat-value">{totalPartyHitPoints}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Total ATK:</span>
                    <span className="stat-value">{totalPartyAttackScore}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Total DEF:</span>
                    <span className="stat-value">{totalPartyDefenseScore}</span>
                  </div>
                </div>

                {/* Party Characters */}
                <div className="party-characters">
                  {partyCharacters.map(character => (
                    <div key={character.partyId} className="party-character">
                      <div className="character-info">
                        <span className="character-name">{character.name}</span>
                        <div className="character-stats">
                          <span className="character-hp">HP: {character.currentHP !== undefined ? character.currentHP : character.hitPoints}/{character.hitPoints}</span>
                          <span className="character-attack">ATK: {character.attackScore} ({character.attackSkill})</span>
                          <span className="character-defense">DEF: {character.defenseScore} ({character.defenseSkill})</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Encounter Column */}
        <div className="encounter-column">
          <div className="encounter-section">
            <h3>Encounter</h3>
            
            {uniqueEnemies.length === 0 ? (
              <div className="empty-encounter">
                <p>No encounter loaded. Go to the Enemies tab to build an encounter.</p>
              </div>
            ) : (
              <>
                {/* Encounter Stats */}
                <div className="encounter-stats">
                  <div className="stat">
                    <span className="stat-label">Enemies:</span>
                    <span className="stat-value">{uniqueEnemies.length}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Total HP:</span>
                    <span className="stat-value">{totalEncounterHP}</span>
                  </div>
                </div>

                {/* Encounter Enemies */}
                <div className="encounter-enemies">
                  {uniqueEnemies.map(enemy => {
                    const currentHP = enemy.currentHP !== undefined ? enemy.currentHP : enemy.trackLength;
                    const maxHP = enemy.trackLength;
                    const damageTaken = maxHP - currentHP;
                    
                    // Create track with damage marked
                    const trackDisplay = Array(maxHP).fill('⦾').map((bubble, index) => {
                      if (index < damageTaken) return '⦿'; // Marked (damaged)
                      return bubble; // Empty
                    }).join('-');
                    
                    return (
                      <div key={enemy.instanceId} className="encounter-enemy">
                        <div className="enemy-info">
                          <span className="enemy-name">{enemy.uniqueName}</span>
                          <div className="enemy-stats">
                            <span className="enemy-hp">HP: {currentHP}/{maxHP}</span>
                            <span className="enemy-track">Track: {trackDisplay}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Simulation Operations */}
      <div className="simulation-section">
        <h3>Simulation Operations</h3>
        <div className="simulation-controls">
          <button 
            className="simulate-round-button"
            onClick={handleSimulateOneRound}
            disabled={partyCharacters.length === 0 || uniqueEnemies.length === 0 || combatOver}
          >
            Simulate One Round
          </button>
          <button 
            className="simulate-session-button"
            onClick={handleSimulateOneSession}
            disabled={partyCharacters.length === 0 || uniqueEnemies.length === 0 || combatOver}
          >
            Simulate One Session
          </button>
          <button 
            className="clear-simulation-button"
            onClick={clearSimulation}
            disabled={partyCharacters.length === 0 && uniqueEnemies.length === 0 && combatLog.length === 0}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Simulation Options */}
      <div className="simulation-options-section">
        <h3>Simulation Options</h3>
        <div className="simulation-options">
          <div className="option-group">
            <label htmlFor="damage-model">Damage Model:</label>
            <select 
              id="damage-model"
              value={damageModel}
              onChange={(e) => setDamageModel(e.target.value)}
              className="damage-model-select"
            >
              <option value="0,1,2,counter">0,1,2,counter</option>
              <option value="1,2,aspect,counter">1,2,aspect,counter</option>
              <option value="1,aspect,2aspect,counter">1,aspect,2aspect,counter</option>
            </select>
          </div>
          <div className="option-group">
            <label htmlFor="enemy-attacks">Enemy Attacks per Round:</label>
            <div className="counter-control">
              <button 
                className="counter-button"
                onClick={() => setEnemyAttacksPerRound(Math.max(1, enemyAttacksPerRound - 1))}
                disabled={enemyAttacksPerRound <= 1}
              >
                -
              </button>
              <span className="counter-value">{enemyAttacksPerRound}</span>
              <button 
                className="counter-button"
                onClick={() => setEnemyAttacksPerRound(Math.min(5, enemyAttacksPerRound + 1))}
                disabled={enemyAttacksPerRound >= 5}
              >
                +
              </button>
            </div>
          </div>
          <div className="damage-model-explanation">
            <label htmlFor="damage-model-details">Details:</label>
            <textarea
              id="damage-model-details"
              value={getDamageModelExplanation(damageModel)}
              readOnly
              className="damage-model-details"
              rows="8"
            />
          </div>
        </div>
      </div>

      {/* Simulation Stats */}
      <div className="simulation-stats-section">
        <h3>Simulation Stats</h3>
        <div className="simulation-stats">
          <div className="stat">
            <span className="stat-label">Round:</span>
            <span className="stat-value">{currentRound}</span>
          </div>
          {combatResult && (
            <div className="stat result-stat">
              <span className="stat-label">Result:</span>
              <span className="stat-value">{combatResult}</span>
            </div>
          )}
        </div>
      </div>

      {/* Combat Log */}
      {combatLog.length > 0 && (
        <div className="combat-log-section">
          <h3>Log</h3>
          <div className="combat-log">
            {combatLog.map((entry, index) => (
              <div key={index} className={`log-entry ${entry.type || 'neutral'}`}>
                {entry.message || entry}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulateTab;
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
  resetCombatState,
  calculateEnemyTrackLength
} from '../utils/dataManager.js';
import Tooltip from './Tooltip.jsx';

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
  const [sessionsToSimulate, setSessionsToSimulate] = useState(() => {
    try {
      return parseInt(localStorage.getItem('wildcombat-sessions-to-simulate')) || 2;
    } catch (error) {
      console.warn('Failed to load sessions to simulate from localStorage:', error);
      return 2;
    }
  });
  const [sessionStats, setSessionStats] = useState({
    totalSessions: 0,
    wins: 0,
    losses: 0,
    totalRounds: 0
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

  // Save sessions to simulate to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('wildcombat-sessions-to-simulate', sessionsToSimulate.toString());
    } catch (error) {
      console.warn('Failed to save sessions to simulate to localStorage:', error);
    }
  }, [sessionsToSimulate]);

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
    setSessionStats({
      totalSessions: 0,
      wins: 0,
      losses: 0,
      totalRounds: 0
    });
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

  const handleSimulateManySessions = () => {
    const initialParty = partyCharacters.map(char => ({ ...char, currentHP: char.hitPoints }));
    const initialEnemies = resetCombatState(uniqueEnemies, partyCharacters).resetEnemies;
    
    let totalSessions = 0;
    let wins = 0;
    let losses = 0;
    let totalRounds = 0;
    const allSessionLogs = [];

    for (let i = 0; i < sessionsToSimulate; i++) {
      // Reset for each session
      const sessionParty = initialParty.map(char => ({ ...char }));
      const sessionEnemies = initialEnemies.map(enemy => ({ ...enemy }));
      
      // Simulate one complete session
      const sessionResult = simulateFullSession(sessionParty, sessionEnemies, 1, damageModel, enemyAttacksPerRound);
      
      totalSessions++;
      totalRounds += sessionResult.finalRound - 1; // finalRound is 1 more than rounds completed
      
      // Determine win/loss
      if (sessionResult.combatResult && sessionResult.combatResult.includes('WON')) {
        wins++;
      } else {
        losses++;
      }
      
      // Add session header to logs
      allSessionLogs.push({
        message: `=== SESSION ${i + 1}/${sessionsToSimulate} ===`,
        type: 'neutral'
      });
      allSessionLogs.push(...sessionResult.sessionLog);
      allSessionLogs.push({
        message: `Session ${i + 1} Result: ${sessionResult.combatResult || 'Unknown'}`,
        type: 'neutral'
      });
      allSessionLogs.push({
        message: ` `,
        type: 'neutral'
      });
    }

    // Update session stats
    setSessionStats({
      totalSessions,
      wins,
      losses,
      totalRounds
    });

    // Update combat log with all session results
    setCombatLog(allSessionLogs);

    // Set final summary result
    const winPercentage = totalSessions > 0 ? ((wins / totalSessions) * 100).toFixed(1) : 0;
    const lossPercentage = totalSessions > 0 ? ((losses / totalSessions) * 100).toFixed(1) : 0;
    const avgRounds = totalSessions > 0 ? (totalRounds / totalSessions).toFixed(1) : 0;
    
    setCombatResult(`Many Sessions Complete: ${wins}W/${losses}L (${winPercentage}%W, ${lossPercentage}%L), Avg: ${avgRounds} rounds`);
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
                    <Tooltip content="Sum of unmarked aspect bubbles across all party characters">
                      <span className="stat-value">{totalPartyHitPoints}</span>
                    </Tooltip>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Total ATK:</span>
                    <Tooltip content="Sum of attack scores (highest skill from BREAK, HUNT, FLOURISH)">
                      <span className="stat-value">{totalPartyAttackScore}</span>
                    </Tooltip>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Total DEF:</span>
                    <Tooltip content="Sum of defense scores (highest skill from BRACE, VAULT, RATTLE)">
                      <span className="stat-value">{totalPartyDefenseScore}</span>
                    </Tooltip>
                  </div>
                </div>

                {/* Party Characters */}
                <div className="party-characters">
                  {partyCharacters.map(character => (
                    <div key={character.partyId} className="party-character">
                      <div className="character-info">
                        <span className="character-name">{character.name}</span>
                        <div className="character-stats">
                          <Tooltip content="Hit Points: Number of unmarked aspect bubbles">
                            <span className="character-hp">HP: {character.currentHP !== undefined ? character.currentHP : character.hitPoints}/{character.hitPoints}</span>
                          </Tooltip>
                          <Tooltip content="Attack Score: Highest skill from BREAK, HUNT, FLOURISH">
                            <span className="character-attack">ATK: {character.attackScore} ({character.attackSkill})</span>
                          </Tooltip>
                          <Tooltip content="Defense Score: Highest skill from BRACE, VAULT, RATTLE">
                            <span className="character-defense">DEF: {character.defenseScore} ({character.defenseSkill})</span>
                          </Tooltip>
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
                    <Tooltip content="Sum of enemy track lengths (unmarked bubbles)">
                      <span className="stat-value">{totalEncounterHP}</span>
                    </Tooltip>
                  </div>
                </div>

                {/* Encounter Enemies */}
                <div className="encounter-enemies">
                  {uniqueEnemies.map(enemy => {
                    const currentHP = enemy.currentHP !== undefined ? enemy.currentHP : calculateEnemyTrackLength(enemy);
                    const maxHP = calculateEnemyTrackLength(enemy);
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
                            <Tooltip content="Hit Points: Number of unmarked track bubbles (⦾ = empty, ⦿ = marked/damaged)">
                              <span className="enemy-hp">HP: {currentHP}/{maxHP}</span>
                            </Tooltip>
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
          
          <div className="simulate-many-sessions-container">
            <button 
              className="simulate-many-sessions-button"
              onClick={handleSimulateManySessions}
              disabled={partyCharacters.length === 0 || uniqueEnemies.length === 0}
            >
              Simulate Many Sessions
            </button>
            <div className="sessions-counter">
              <button 
                className="counter-button"
                onClick={() => setSessionsToSimulate(Math.max(1, sessionsToSimulate - 1))}
                disabled={sessionsToSimulate <= 1}
              >
                -
              </button>
              <span className="counter-value">{sessionsToSimulate}</span>
              <button 
                className="counter-button"
                onClick={() => setSessionsToSimulate(Math.min(100, sessionsToSimulate + 1))}
                disabled={sessionsToSimulate >= 100}
              >
                +
              </button>
            </div>
          </div>
          
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
          {sessionStats.totalSessions === 0 && (
            <div className="stat">
              <span className="stat-label">Round:</span>
              <span className="stat-value">{currentRound}</span>
            </div>
          )}
          {combatResult && (
            <div className="stat result-stat">
              <span className="stat-label">Result:</span>
              <span className="stat-value">{combatResult}</span>
            </div>
          )}
          {sessionStats.totalSessions > 0 && (
            <>
              <div className="stat">
                <span className="stat-label">Sessions:</span>
                <span className="stat-value">{sessionStats.totalSessions}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Wins:</span>
                <span className="stat-value">{sessionStats.wins} ({sessionStats.totalSessions > 0 ? ((sessionStats.wins / sessionStats.totalSessions) * 100).toFixed(1) : 0}%)</span>
              </div>
              <div className="stat">
                <span className="stat-label">Losses:</span>
                <span className="stat-value">{sessionStats.losses} ({sessionStats.totalSessions > 0 ? ((sessionStats.losses / sessionStats.totalSessions) * 100).toFixed(1) : 0}%)</span>
              </div>
              <div className="stat">
                <span className="stat-label">Avg Rounds:</span>
                <span className="stat-value">{sessionStats.totalSessions > 0 ? (sessionStats.totalRounds / sessionStats.totalSessions).toFixed(1) : 0}</span>
              </div>
            </>
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
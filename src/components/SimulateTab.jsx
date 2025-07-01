import { useState, useEffect } from 'react';

// Helper function to render trackLength as empty bubbles
const renderTrackLength = (length) => {
  if (!length || length <= 0) return '';
  return Array(length).fill('⦾').join('-');
};

// Helper function to generate unique enemy names
const generateUniqueEnemyNames = (encounter, enemies) => {
  const enemyCounts = {};
  
  return encounter.map(encounterEnemy => {
    const enemy = enemies.find(e => e.id === encounterEnemy.enemyId);
    if (!enemy) return null;
    
    const baseName = enemy.name;
    if (!enemyCounts[baseName]) {
      enemyCounts[baseName] = 0;
    }
    
    const instances = [];
    for (let i = 0; i < encounterEnemy.count; i++) {
      enemyCounts[baseName]++;
      const uniqueName = encounterEnemy.count > 1 ? `${baseName} ${enemyCounts[baseName]}` : baseName;
      instances.push({
        uniqueName,
        baseName,
        trackLength: enemy.trackLength,
        enemyId: encounterEnemy.enemyId,
        instanceId: `${encounterEnemy.enemyId}-${enemyCounts[baseName]}`
      });
    }
    
    return instances;
  }).filter(Boolean).flat();
};

const SimulateTab = () => {
  const [partyCharacters, setPartyCharacters] = useState([]);
  const [encounter, setEncounter] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [uniqueEnemies, setUniqueEnemies] = useState([]);
  const [combatLog, setCombatLog] = useState([]);

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
    try {
      const savedParty = localStorage.getItem('wildcombat-party');
      if (savedParty) {
        const partyData = JSON.parse(savedParty);
        setPartyCharacters(partyData);
      }
    } catch (error) {
      console.error('Error loading party:', error);
    }
  };

  const loadEncounter = () => {
    try {
      const savedEncounter = localStorage.getItem('wildcombat-encounter');
      if (savedEncounter) {
        const encounterData = JSON.parse(savedEncounter);
        setEncounter(encounterData);
      }
    } catch (error) {
      console.error('Error loading encounter:', error);
    }
  };

  const loadEnemies = async () => {
    try {
      // For now, we'll hardcode the test enemy
      const enemyFiles = ['shadowclaw-spider.json'];
      
      const enemyData = await Promise.all(
        enemyFiles.map(async (filename) => {
          try {
            const response = await fetch(`/enemies/${filename}`);
            if (!response.ok) throw new Error(`Failed to load ${filename}`);
            const data = await response.json();
            return { id: filename, ...data };
          } catch (err) {
            console.error(`Error loading ${filename}:`, err);
            return null;
          }
        })
      );

      const validEnemies = enemyData.filter(Boolean);
      setEnemies(validEnemies);
    } catch (err) {
      console.error('Error loading enemies:', err);
    }
  };

  // Calculate party stats
  const totalPartyHitPoints = partyCharacters.reduce((total, character) => {
    return total + (character.hitPoints || 0);
  }, 0);
  
  const totalPartyAttackScore = partyCharacters.reduce((total, character) => {
    return total + (character.attackScore || 1);
  }, 0);
  
  const totalPartyDefenseScore = partyCharacters.reduce((total, character) => {
    return total + (character.defenseScore || 1);
  }, 0);

  // Calculate encounter stats
  const totalEncounterHP = uniqueEnemies.reduce((total, enemy) => {
    return total + (enemy.currentHP !== undefined ? enemy.currentHP : enemy.trackLength || 0);
  }, 0);

  // Combat simulation functions
  const rollDice = (count) => {
    const rolls = [];
    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(Math.random() * 6) + 1);
    }
    return rolls;
  };

  const calculateDamage = (rolls) => {
    if (rolls.length === 0) return 0;
    
    const highest = Math.max(...rolls);
    let damage = 0;
    
    // Base damage from highest die
    if (highest === 6) damage = 2;
    else if (highest >= 4) damage = 1;
    else damage = 0;
    
    // Check for doubles (any two dice with same value)
    const counts = {};
    rolls.forEach(roll => {
      counts[roll] = (counts[roll] || 0) + 1;
    });
    
    const hasDoubles = Object.values(counts).some(count => count >= 2);
    if (hasDoubles) damage += 1;
    
    return damage;
  };

  const simulateOneRound = () => {
    if (partyCharacters.length === 0 || uniqueEnemies.length === 0) {
      setCombatLog(prev => [...prev, "Cannot simulate: missing party or encounter"]);
      return;
    }

    // Filter out defeated enemies (HP <= 0)
    const aliveEnemies = uniqueEnemies.filter(enemy => (enemy.currentHP !== undefined ? enemy.currentHP : enemy.trackLength) > 0);
    
    if (aliveEnemies.length === 0) {
      setCombatLog(prev => [...prev, "Combat over: All enemies defeated!"]);
      return;
    }

    const newLog = [];
    let updatedEnemies = [...uniqueEnemies];

    partyCharacters.forEach(character => {
      const stillAlive = updatedEnemies.filter(enemy => (enemy.currentHP !== undefined ? enemy.currentHP : enemy.trackLength) > 0);
      if (stillAlive.length === 0) return; // No more targets
      
      // Choose random enemy from those still alive
      const targetIndex = Math.floor(Math.random() * stillAlive.length);
      const target = stillAlive[targetIndex];
      
      // Roll dice
      const attackScore = character.attackScore || 1;
      const rolls = rollDice(attackScore);
      const damage = calculateDamage(rolls);
      
      // Log dice roll
      newLog.push(`${character.name} rolled ${rolls.join(', ')} (${attackScore} dice)`);
      
      if (damage > 0) {
        // Find enemy in updatedEnemies array and apply damage
        const enemyIndex = updatedEnemies.findIndex(e => e.instanceId === target.instanceId);
        if (enemyIndex !== -1) {
          const currentHP = updatedEnemies[enemyIndex].currentHP !== undefined ? updatedEnemies[enemyIndex].currentHP : updatedEnemies[enemyIndex].trackLength;
          updatedEnemies[enemyIndex].currentHP = Math.max(0, currentHP - damage);
          
          newLog.push(`${character.name} attacked ${target.uniqueName} for ${damage} damage`);
          
          // Check if defeated
          if (updatedEnemies[enemyIndex].currentHP <= 0) {
            newLog.push(`${target.uniqueName} was defeated!`);
          }
        }
      }
    });

    setUniqueEnemies(updatedEnemies);
    setCombatLog(prev => [...prev, ...newLog]);
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
                          <span className="character-hp">HP: {character.hitPoints}</span>
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
            onClick={simulateOneRound}
            disabled={partyCharacters.length === 0 || uniqueEnemies.length === 0}
          >
            Simulate One Round
          </button>
        </div>
      </div>

      {/* Combat Log */}
      {combatLog.length > 0 && (
        <div className="combat-log-section">
          <h3>Log</h3>
          <div className="combat-log">
            {combatLog.map((entry, index) => (
              <div key={index} className="log-entry">
                {entry}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulateTab;
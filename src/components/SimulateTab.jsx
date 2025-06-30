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
              <div className="encounter-enemies">
                {uniqueEnemies.map(enemy => (
                  <div key={enemy.instanceId} className="encounter-enemy">
                    <div className="enemy-info">
                      <span className="enemy-name">{enemy.uniqueName}</span>
                      <div className="enemy-stats">
                        <span className="enemy-track">Track: {renderTrackLength(enemy.trackLength)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulateTab;
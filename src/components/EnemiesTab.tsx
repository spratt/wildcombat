import React, { useState, useEffect, useCallback } from 'react';
import Tooltip from './Tooltip';
import { calculateEnemyTrackLength } from '../utils/dataManager';
import { Enemy } from '../types';

// Helper function to render trackLength as empty bubbles
const renderTrackLength = (length: number): string => {
  if (!length || length <= 0) return '';
  return Array(length).fill('⦾').join('-');
};

interface EnemyFile extends Enemy {
  id: string;
}

interface EncounterEnemy {
  enemyId: string;
  name: string;
  count: number;
}

const EnemiesTab: React.FC = () => {
  const [enemies, setEnemies] = useState<EnemyFile[]>([]);
  const [selectedEnemy, setSelectedEnemy] = useState<EnemyFile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [encounter, setEncounter] = useState<EncounterEnemy[]>([]);

  const handleEnemySelect = useCallback((enemyId: string) => {
    const enemy = enemies.find(e => e.id === enemyId);
    setSelectedEnemy(enemy || null);
  }, [enemies]);

  const loadEnemies = async () => {
    try {
      // Load enemy file list from config
      const configResponse = await fetch('./config.json');
      if (!configResponse.ok) throw new Error('Failed to load config.json');
      const config = await configResponse.json();
      const enemyFiles = config.enemyJsons || [];
      
      const enemyData = await Promise.all(
        enemyFiles.map(async (filename: string): Promise<EnemyFile | null> => {
          try {
            const response = await fetch(`./enemies/${filename}`);
            if (!response.ok) throw new Error(`Failed to load ${filename}`);
            const data = await response.json();
            return { id: filename, ...data };
          } catch (err) {
            console.error(`Error loading ${filename}:`, err);
            return null;
          }
        })
      );

      const validEnemies = enemyData.filter((enemy): enemy is EnemyFile => enemy !== null);
      setEnemies(validEnemies);
      setLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnemies();
  }, []);

  // Separate effect to load encounter after enemies are loaded
  useEffect(() => {
    if (enemies.length > 0) {
      // Load encounter from localStorage
      try {
        const savedEncounter = localStorage.getItem('wildcombat-encounter');
        if (savedEncounter) {
          const encounterData = JSON.parse(savedEncounter);
          setEncounter(encounterData);
          
          // Auto-select first enemy in encounter if available
          if (encounterData.length > 0) {
            const firstEnemyId = encounterData[0].enemyId;
            handleEnemySelect(firstEnemyId);
          }
        }
      } catch (error) {
        console.error('Error loading saved encounter:', error);
      }
    }
  }, [enemies, handleEnemySelect]);

  // Add enemy to encounter
  const addToEncounter = (enemy: EnemyFile) => {
    if (!enemy) return;
    
    const existingEnemy = encounter.find(e => e.enemyId === enemy.id);
    let newEncounter: EncounterEnemy[];
    
    if (existingEnemy) {
      // For unique enemies, don't allow adding more than one
      if (enemy.unique) {
        console.log(`${enemy.name} is unique and already in encounter - cannot add more`);
        return;
      }
      // Increment count if enemy already in encounter (non-unique only)
      newEncounter = encounter.map(e => 
        e.enemyId === enemy.id 
          ? { ...e, count: e.count + 1 }
          : e
      );
    } else {
      // Add new enemy to encounter
      newEncounter = [...encounter, {
        enemyId: enemy.id,
        name: enemy.name,
        count: 1
      }];
    }
    
    setEncounter(newEncounter);
    
    // Save to localStorage
    try {
      localStorage.setItem('wildcombat-encounter', JSON.stringify(newEncounter));
    } catch (error) {
      console.error('Error saving encounter:', error);
    }
  };

  // Remove enemy from encounter entirely
  const removeFromEncounter = (enemyId: string) => {
    const newEncounter = encounter.filter(e => e.enemyId !== enemyId);
    setEncounter(newEncounter);
    
    // Save to localStorage
    try {
      localStorage.setItem('wildcombat-encounter', JSON.stringify(newEncounter));
    } catch (error) {
      console.error('Error saving encounter:', error);
    }
  };

  // Increment enemy count in encounter
  const incrementEnemyCount = (enemyId: string) => {
    // Find the enemy data to check if it's unique
    const enemyData = enemies.find(e => e.id === enemyId);
    if (enemyData?.unique) {
      console.log(`${enemyData.name} is unique - cannot increment count`);
      return;
    }
    
    const newEncounter = encounter.map(e => 
      e.enemyId === enemyId 
        ? { ...e, count: e.count + 1 }
        : e
    );
    setEncounter(newEncounter);
    
    // Save to localStorage
    try {
      localStorage.setItem('wildcombat-encounter', JSON.stringify(newEncounter));
    } catch (error) {
      console.error('Error saving encounter:', error);
    }
  };

  // Decrement enemy count in encounter
  const decrementEnemyCount = (enemyId: string) => {
    const newEncounter = encounter.map(e => 
      e.enemyId === enemyId 
        ? { ...e, count: Math.max(1, e.count - 1) }
        : e
    );
    setEncounter(newEncounter);
    
    // Save to localStorage
    try {
      localStorage.setItem('wildcombat-encounter', JSON.stringify(newEncounter));
    } catch (error) {
      console.error('Error saving encounter:', error);
    }
  };

  if (loading) return <div className="tab-content">Loading enemies...</div>;
  if (error) return <div className="tab-content">Error loading enemies: {error}</div>;

  return (
    <div className="tab-content">
      <h2>Enemy Management</h2>
      
      <div className="enemies-layout">
        <div className="enemy-management-column">
          <div className="enemy-section">
            <h3>Select Enemy</h3>
            <select 
              value={selectedEnemy?.id || ''} 
              onChange={(e) => handleEnemySelect(e.target.value)}
              className="enemy-selector"
            >
              <option value="">-- Choose an enemy --</option>
              {enemies.map(enemy => (
                <option key={enemy.id} value={enemy.id}>
                  {enemy.name}
                </option>
              ))}
            </select>
          </div>

          {selectedEnemy && (
            <div className="enemy-sheet">
              <div className="enemy-header">
                <div className="enemy-title-section">
                  <h1>{selectedEnemy.name}</h1>
                  <div className="enemy-basic-stats">
                    <div className="enemy-stat">
                      <span className="stat-label">Track:</span>
                      <span className="stat-value">{renderTrackLength(calculateEnemyTrackLength(selectedEnemy))}</span>
                    </div>
                  </div>
                  <div className="enemy-actions">
                    <button 
                      className="add-to-encounter-button"
                      onClick={() => addToEncounter(selectedEnemy)}
                    >
                      Add to Encounter
                    </button>
                  </div>
                </div>
              </div>

              <div className="enemy-description">
                <h2>Description</h2>
                <p>{selectedEnemy.description}</p>
              </div>

              {selectedEnemy.presence && typeof selectedEnemy.presence === 'object' && (
                <div className="enemy-presence">
                  <h2>Presence</h2>
                  <div className="presence-list">
                    {Object.entries(selectedEnemy.presence).map(([sense, description]) => (
                      <div key={sense} className="presence-item">
                        <strong>{sense}:</strong> {description}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEnemy.aspects && selectedEnemy.aspects.length > 0 && (
                <div className="enemy-aspects">
                  <h2>Aspects</h2>
                  {selectedEnemy.aspects.map((aspect, index) => (
                    <div key={index} className="enemy-aspect">
                      <div className="aspect-header">
                        <span className="aspect-name">{aspect.name}</span>
                        <span className="aspect-track">{renderTrackLength(aspect.trackLength)}</span>
                      </div>
                      {aspect.ability && <p className="aspect-ability">{aspect.ability}</p>}
                    </div>
                  ))}
                </div>
              )}

              {selectedEnemy.drives && selectedEnemy.drives.length > 0 && (
                <div className="enemy-drives">
                  <h2>Drives</h2>
                  <ul>
                    {selectedEnemy.drives.map((drive, index) => (
                      <li key={index}>
                        <strong>{typeof drive === 'object' ? drive.name : drive}</strong>
                        {typeof drive === 'object' && drive.description && (
                          <div>{drive.description}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedEnemy.quirks && selectedEnemy.quirks.length > 0 && (
                <div className="enemy-quirks">
                  <h2>Quirks</h2>
                  <ul>
                    {selectedEnemy.quirks.map((quirk, index) => (
                      <li key={index}>
                        <strong>{typeof quirk === 'object' ? quirk.name : quirk}</strong>
                        {typeof quirk === 'object' && quirk.description && (
                          <div>{quirk.description}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {encounter.length > 0 && (
          <div className="encounter-column">
            <div className="encounter-section">
              <h3>Encounter</h3>

              {/* Encounter Stats */}
              <div className="encounter-stats">
                <div className="stat">
                  <span className="stat-label">Total Enemies:</span>
                  <span className="stat-value">
                    {encounter.reduce((total, enemy) => total + enemy.count, 0)}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Total HP:</span>
                  <Tooltip content="Sum of enemy track lengths (unmarked bubbles)">
                    <span className="stat-value">
                      {encounter.reduce((total, encounterEnemy) => {
                        const enemy = enemies.find(e => e.id === encounterEnemy.enemyId);
                        return total + (enemy ? calculateEnemyTrackLength(enemy) * encounterEnemy.count : 0);
                      }, 0)}
                    </span>
                  </Tooltip>
                </div>
              </div>
              
              <div className="encounter-enemies">
                {encounter.map(enemy => {
                  const enemyData = enemies.find(e => e.id === enemy.enemyId);
                  const isUnique = enemyData?.unique;
                  
                  return (
                    <div key={enemy.enemyId} className="encounter-enemy">
                      <div className="enemy-name">
                        {enemy.name}
                        {isUnique && <span className="unique-label"> (Unique)</span>}
                      </div>
                      <div className="enemy-controls">
                        {!isUnique && (
                          <button 
                            className="decrement-button"
                            onClick={() => decrementEnemyCount(enemy.enemyId)}
                          >
                            -
                          </button>
                        )}
                        <span className="enemy-count">{enemy.count}</span>
                        {!isUnique && (
                          <button 
                            className="increment-button"
                            onClick={() => incrementEnemyCount(enemy.enemyId)}
                          >
                            +
                          </button>
                        )}
                        <button 
                          className="remove-enemy-button"
                          onClick={() => removeFromEncounter(enemy.enemyId)}
                          title="Remove from encounter"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnemiesTab;
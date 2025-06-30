import { useState, useEffect } from 'react';

// Helper function to render trackLength as empty bubbles
const renderTrackLength = (length) => {
  if (!length || length <= 0) return '';
  return Array(length).fill('⦾').join('-');
};

const EnemiesTab = () => {
  const [enemies, setEnemies] = useState([]);
  const [selectedEnemy, setSelectedEnemy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [encounter, setEncounter] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    loadEnemies();
    loadEncounter();
  }, []);

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
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Load encounter from localStorage
  const loadEncounter = () => {
    try {
      const savedEncounter = localStorage.getItem('wildcombat-encounter');
      if (savedEncounter) {
        const encounterData = JSON.parse(savedEncounter);
        setEncounter(encounterData);
        
        // Auto-select first enemy in encounter if available
        if (encounterData.length > 0) {
          // Wait for enemies to load before selecting
          setTimeout(() => {
            const firstEnemyId = encounterData[0].enemyId;
            handleEnemySelect(firstEnemyId);
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error loading saved encounter:', error);
    }
  };

  const handleEnemySelect = (enemyId) => {
    const enemy = enemies.find(e => e.id === enemyId);
    setSelectedEnemy(enemy || null);
  };

  // Add enemy to encounter
  const addToEncounter = (enemy) => {
    if (!enemy) return;
    
    const existingEnemy = encounter.find(e => e.enemyId === enemy.id);
    if (existingEnemy) {
      // Increment count if enemy already in encounter
      setEncounter(prev => prev.map(e => 
        e.enemyId === enemy.id 
          ? { ...e, count: e.count + 1 }
          : e
      ));
    } else {
      // Add new enemy to encounter
      setEncounter(prev => [...prev, {
        enemyId: enemy.id,
        name: enemy.name,
        count: 1
      }]);
    }
  };

  // Remove enemy from encounter entirely
  const removeFromEncounter = (enemyId) => {
    setEncounter(prev => prev.filter(e => e.enemyId !== enemyId));
  };

  // Increment enemy count in encounter
  const incrementEnemyCount = (enemyId) => {
    setEncounter(prev => prev.map(e => 
      e.enemyId === enemyId 
        ? { ...e, count: e.count + 1 }
        : e
    ));
  };

  // Decrement enemy count in encounter
  const decrementEnemyCount = (enemyId) => {
    setEncounter(prev => prev.map(e => 
      e.enemyId === enemyId 
        ? { ...e, count: Math.max(1, e.count - 1) }
        : e
    ));
  };

  // Save encounter to localStorage
  const saveEncounter = () => {
    try {
      localStorage.setItem('wildcombat-encounter', JSON.stringify(encounter));
      setSaveStatus('Encounter saved!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving encounter:', error);
      setSaveStatus('Error saving encounter');
      setTimeout(() => setSaveStatus(''), 3000);
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
                      <span className="stat-label">Size:</span>
                      <span className="stat-value">{selectedEnemy.size}</span>
                    </div>
                    <div className="enemy-stat">
                      <span className="stat-label">Track:</span>
                      <span className="stat-value">{renderTrackLength(selectedEnemy.trackLength)}</span>
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

              <div className="enemy-blurb">
                <h2>Blurb</h2>
                <p>{selectedEnemy.blurb}</p>
              </div>

              <div className="enemy-description">
                <h2>Description</h2>
                <p>{selectedEnemy.description}</p>
              </div>

              {selectedEnemy.aspects && selectedEnemy.aspects.length > 0 && (
                <div className="enemy-aspects">
                  <h2>Aspects</h2>
                  {selectedEnemy.aspects.map((aspect, index) => (
                    <div key={index} className="enemy-aspect">
                      <div className="aspect-header">
                        <span className="aspect-name">{aspect.name}</span>
                      </div>
                      <p className="aspect-details">{aspect.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {selectedEnemy.drives && selectedEnemy.drives.length > 0 && (
                <div className="enemy-drives">
                  <h2>Drives</h2>
                  {selectedEnemy.drives.map((drive, index) => (
                    <div key={index} className="enemy-drive">
                      <div className="drive-header">
                        <span className="drive-name">{drive.name}</span>
                      </div>
                      <p className="drive-details">{drive.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {selectedEnemy.quirks && selectedEnemy.quirks.length > 0 && (
                <div className="enemy-quirks">
                  <h2>Quirks</h2>
                  {selectedEnemy.quirks.map((quirk, index) => (
                    <div key={index} className="enemy-quirk">
                      <div className="quirk-header">
                        <span className="quirk-name">{quirk.name}</span>
                      </div>
                      <p className="quirk-details">{quirk.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {selectedEnemy.presence && Object.keys(selectedEnemy.presence).length > 0 && (
                <div className="enemy-presence">
                  <h2>Presence</h2>
                  <div className="presence-grid">
                    {Object.entries(selectedEnemy.presence).map(([sense, description]) => (
                      <div key={sense} className="presence-sense">
                        <h3>{sense}</h3>
                        <p>{description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {encounter.length > 0 && (
          <div className="encounter-column">
            <div className="encounter-section">
              <h3>Encounter</h3>
              <div className="encounter-save-section">
                <button 
                  className="save-encounter-button"
                  onClick={saveEncounter}
                >
                  Save Encounter
                </button>
                {saveStatus && (
                  <span className={`encounter-save-status ${saveStatus.includes('Error') ? 'error' : 'success'}`}>
                    {saveStatus}
                  </span>
                )}
              </div>
              
              <div className="encounter-enemies">
                {encounter.map(enemy => (
                  <div key={enemy.enemyId} className="encounter-enemy">
                    <div className="enemy-name">{enemy.name}</div>
                    <div className="enemy-controls">
                      <button 
                        className="decrement-button"
                        onClick={() => decrementEnemyCount(enemy.enemyId)}
                      >
                        -
                      </button>
                      <span className="enemy-count">{enemy.count}</span>
                      <button 
                        className="increment-button"
                        onClick={() => incrementEnemyCount(enemy.enemyId)}
                      >
                        +
                      </button>
                      <button 
                        className="remove-enemy-button"
                        onClick={() => removeFromEncounter(enemy.enemyId)}
                        title="Remove from encounter"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnemiesTab;
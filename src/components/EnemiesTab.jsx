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

  useEffect(() => {
    loadEnemies();
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

  const handleEnemySelect = (enemyId) => {
    const enemy = enemies.find(e => e.id === enemyId);
    setSelectedEnemy(enemy || null);
  };

  if (loading) return <div className="tab-content">Loading enemies...</div>;
  if (error) return <div className="tab-content">Error loading enemies: {error}</div>;

  return (
    <div className="tab-content">
      <h2>Enemy Management</h2>
      
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
  );
};

export default EnemiesTab;
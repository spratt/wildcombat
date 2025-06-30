import { useState, useEffect } from 'react';

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
        <div className="enemy-display">
          <div className="enemy-header">
            <h1>{selectedEnemy.name}</h1>
            <div className="enemy-basic-info">
              <span className="enemy-size">Size: {selectedEnemy.size}</span>
              <span className="enemy-track">Track Length: {selectedEnemy.trackLength}</span>
            </div>
          </div>

          <div className="enemy-blurb">
            <h3>Blurb</h3>
            <p>{selectedEnemy.blurb}</p>
          </div>

          <div className="enemy-description">
            <h3>Description</h3>
            <p>{selectedEnemy.description}</p>
          </div>

          {selectedEnemy.aspects && selectedEnemy.aspects.length > 0 && (
            <div className="enemy-aspects">
              <h3>Aspects</h3>
              {selectedEnemy.aspects.map((aspect, index) => (
                <div key={index} className="enemy-aspect">
                  <h4>{aspect.name}</h4>
                  <p>{aspect.description}</p>
                </div>
              ))}
            </div>
          )}

          {selectedEnemy.drives && selectedEnemy.drives.length > 0 && (
            <div className="enemy-drives">
              <h3>Drives</h3>
              {selectedEnemy.drives.map((drive, index) => (
                <div key={index} className="enemy-drive">
                  <h4>{drive.name}</h4>
                  <p>{drive.description}</p>
                </div>
              ))}
            </div>
          )}

          {selectedEnemy.quirks && selectedEnemy.quirks.length > 0 && (
            <div className="enemy-quirks">
              <h3>Quirks</h3>
              {selectedEnemy.quirks.map((quirk, index) => (
                <div key={index} className="enemy-quirk">
                  <h4>{quirk.name}</h4>
                  <p>{quirk.description}</p>
                </div>
              ))}
            </div>
          )}

          {selectedEnemy.presence && Object.keys(selectedEnemy.presence).length > 0 && (
            <div className="enemy-presence">
              <h3>Presence</h3>
              {Object.entries(selectedEnemy.presence).map(([sense, description]) => (
                <div key={sense} className="presence-sense">
                  <h4>{sense}</h4>
                  <p>{description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnemiesTab;
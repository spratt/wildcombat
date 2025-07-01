// Data management utilities for party and encounter operations

export const loadPartyFromStorage = () => {
  try {
    const savedParty = localStorage.getItem('wildcombat-party');
    if (savedParty) {
      return JSON.parse(savedParty);
    }
    return [];
  } catch (error) {
    console.error('Error loading party:', error);
    return [];
  }
};

export const loadEncounterFromStorage = () => {
  try {
    const savedEncounter = localStorage.getItem('wildcombat-encounter');
    if (savedEncounter) {
      return JSON.parse(savedEncounter);
    }
    return [];
  } catch (error) {
    console.error('Error loading encounter:', error);
    return [];
  }
};

export const loadEnemiesData = async () => {
  try {
    // Get the base path for assets (handles both dev and production builds)
    const basePath = import.meta.env.BASE_URL || '/';
    
    // Load all enemy files
    const enemyFiles = [
      'shadowclaw-spider.json',
      'thornback-beetle.json', 
      'dire-squirrel.json'
    ];
    
    const enemyData = await Promise.all(
      enemyFiles.map(async (filename) => {
        try {
          const response = await fetch(`${basePath}enemies/${filename}`);
          if (!response.ok) throw new Error(`Failed to load ${filename}`);
          const data = await response.json();
          return { id: filename, ...data };
        } catch (err) {
          console.error(`Error loading ${filename}:`, err);
          return null;
        }
      })
    );

    return enemyData.filter(Boolean);
  } catch (err) {
    console.error('Error loading enemies:', err);
    return [];
  }
};

// Helper function to generate unique enemy names
export const generateUniqueEnemyNames = (encounter, enemies) => {
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

// Helper function to render trackLength as empty bubbles
export const renderTrackLength = (length) => {
  if (!length || length <= 0) return '';
  return Array(length).fill('⦾').join('-');
};

// Calculate party statistics
export const calculatePartyStats = (partyCharacters) => {
  const totalHitPoints = partyCharacters.reduce((total, character) => {
    return total + (character.currentHP !== undefined ? character.currentHP : character.hitPoints || 0);
  }, 0);
  
  const totalAttackScore = partyCharacters.reduce((total, character) => {
    return total + (character.attackScore || 1);
  }, 0);
  
  const totalDefenseScore = partyCharacters.reduce((total, character) => {
    return total + (character.defenseScore || 1);
  }, 0);

  return {
    totalHitPoints,
    totalAttackScore,
    totalDefenseScore
  };
};

// Calculate encounter statistics
export const calculateEncounterStats = (uniqueEnemies) => {
  const totalHP = uniqueEnemies.reduce((total, enemy) => {
    return total + (enemy.currentHP !== undefined ? enemy.currentHP : enemy.trackLength || 0);
  }, 0);

  return {
    totalHP,
    enemyCount: uniqueEnemies.length
  };
};

// Reset combat state functions
export const resetCombatState = (uniqueEnemies, partyCharacters) => {
  const resetEnemies = uniqueEnemies.map(enemy => ({
    ...enemy,
    currentHP: enemy.trackLength
  }));
  
  const resetParty = partyCharacters.map(character => ({
    ...character,
    currentHP: character.hitPoints
  }));

  return {
    resetEnemies,
    resetParty
  };
};
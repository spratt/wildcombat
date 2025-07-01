// Combat simulation engine - handles all combat logic

export const rollDice = (count) => {
  const rolls = [];
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * 6) + 1);
  }
  return rolls;
};

export const calculateDamage = (rolls) => {
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

export const calculateDefenseDamage = (rolls, damageModel = '0,1,2,counter', targetCharacter = null) => {
  if (rolls.length === 0) return { damage: 0, hasDoubles: false };
  
  const highest = Math.max(...rolls);
  let damage = 0;
  
  if (damageModel === '0,1,2,counter') {
    // Original defense damage calculation
    if (highest === 6) damage = 0; // No damage on 6
    else if (highest >= 4) damage = 1; // 1 damage on 4-5
    else damage = 2; // 2 damage on 1-3
  } else if (damageModel === '1,2,aspect,counter') {
    // New damage model
    if (highest === 6) {
      damage = 1; // 1 damage on 6
    } else if (highest >= 4) {
      damage = 2; // 2 damage on 4-5
    } else {
      // On 1-3, damage equals longest aspect track
      damage = calculateLongestAspectTrack(targetCharacter);
    }
  }
  
  // Check for doubles (any two dice with same value)
  const counts = {};
  rolls.forEach(roll => {
    counts[roll] = (counts[roll] || 0) + 1;
  });
  
  const hasDoubles = Object.values(counts).some(count => count >= 2);
  
  return { damage, hasDoubles };
};

// Helper function to calculate the length of the longest aspect track
const calculateLongestAspectTrack = (character) => {
  if (!character || !character.aspects) return 1; // Default to 1 if no aspects
  
  let longestTrack = 0;
  character.aspects.forEach(aspect => {
    // Use aspect.value (from character sheet) or default to [0] if missing
    const track = aspect.value || [0];
    if (Array.isArray(track)) {
      const trackLength = track.length;
      if (trackLength > longestTrack) {
        longestTrack = trackLength;
      }
    }
  });
  
  return longestTrack || 1; // Default to 1 if no tracks found
};

export const checkWinConditions = (enemies, party) => {
  const aliveEnemies = enemies.filter(enemy => 
    (enemy.currentHP !== undefined ? enemy.currentHP : enemy.trackLength) > 0
  );
  const aliveParty = party.filter(char => 
    (char.currentHP !== undefined ? char.currentHP : char.hitPoints) > 0
  );
  
  if (aliveEnemies.length === 0) {
    return { isOver: true, result: 'win', aliveEnemies, aliveParty };
  }
  
  if (aliveParty.length === 0) {
    return { isOver: true, result: 'lose', aliveEnemies, aliveParty };
  }
  
  return { isOver: false, result: null, aliveEnemies, aliveParty };
};
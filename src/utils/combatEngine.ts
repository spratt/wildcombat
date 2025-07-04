// Combat simulation engine - handles all combat logic
import { calculateEnemyTrackLength } from './dataManager';
import type { 
  DiceRoll, 
  DefenseResult, 
  CombatCharacter, 
  CombatEnemy,
  Character
} from '../types';

export const rollDice = (count: number, cut: number = 0, advantage: number = 0): DiceRoll => {
  // Roll base dice plus advantage dice
  const totalDice = count + advantage;
  const rolls: number[] = [];
  for (let i = 0; i < totalDice; i++) {
    rolls.push(Math.floor(Math.random() * 6) + 1);
  }
  
  // Apply cut: remove the highest dice, but always keep at least one die (the lowest)
  if (cut > 0 && rolls.length > 1) {
    // Sort dice in descending order to remove highest first
    const sortedRolls = [...rolls].sort((a, b) => b - a);
    // Remove up to 'cut' dice, but never remove all dice (keep at least 1)
    const dicesToRemove = Math.min(cut, rolls.length - 1);
    // Return the remaining dice (lowest dice are kept)
    return sortedRolls.slice(dicesToRemove);
  }
  
  return rolls;
};

export const calculateDamage = (rolls: DiceRoll): number => {
  if (rolls.length === 0) return 0;
  
  const highest = Math.max(...rolls);
  let damage = 0;
  
  // Base damage from highest die
  if (highest === 6) damage = 2;
  else if (highest >= 4) damage = 1;
  else damage = 0;
  
  // Check for doubles (any two dice with same value)
  const counts: Record<number, number> = {};
  rolls.forEach(roll => {
    counts[roll] = (counts[roll] || 0) + 1;
  });
  
  const hasDoubles = Object.values(counts).some(count => count >= 2);
  if (hasDoubles) damage += 1;
  
  return damage;
};

export const calculateDefenseDamage = (
  rolls: DiceRoll, 
  damageModel: string = '0,1,2,counter', 
  targetCharacter: CombatCharacter | null = null
): DefenseResult => {
  if (rolls.length === 0) return { damage: 0, counter: false };
  
  const highest = Math.max(...rolls);
  let damage = 0;
  
  if (damageModel === '0,1,2,counter') {
    // Original defense damage calculation
    if (highest === 6) damage = 0; // No damage on 6
    else if (highest >= 4) damage = 1; // 1 damage on 4-5
    else damage = 2; // 2 damage on 1-3
  } else if (damageModel === '1,2,aspect,counter') {
    // Aspect-based damage model
    if (highest === 6) {
      damage = 1; // 1 damage on 6
    } else if (highest >= 4) {
      damage = 2; // 2 damage on 4-5
    } else {
      // On 1-3, damage equals longest aspect track
      damage = calculateLongestAspectTrack(targetCharacter);
    }
  } else if (damageModel === '1,aspect,2aspect,counter') {
    // Aspect track damage model
    if (highest === 6) {
      damage = 1; // 1 damage on 6
    } else if (highest >= 4) {
      // On 4-5, damage equals longest aspect track (1 aspect of damage)
      damage = calculateLongestAspectTrack(targetCharacter);
    } else {
      // On 1-3, damage equals 2x longest aspect track (2 aspects of damage)
      damage = calculateLongestAspectTrack(targetCharacter) * 2;
    }
  }
  
  // Check for doubles (any two dice with same value)
  const counts: Record<number, number> = {};
  rolls.forEach(roll => {
    counts[roll] = (counts[roll] || 0) + 1;
  });
  
  const hasDoubles = Object.values(counts).some(count => count >= 2);
  
  return { damage, counter: hasDoubles };
};

// Helper function to calculate the length of the longest aspect track
const calculateLongestAspectTrack = (character: CombatCharacter | Character | null): number => {
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

// Helper function to calculate incapacitate ability defense results
export const calculateIncapacitateDefense = (
  rolls: DiceRoll, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _targetCharacter: CombatCharacter
): DefenseResult => {
  const highest = Math.max(...rolls);
  let damage = 0;
  let incapacitated = false;
  let fullyIncapacitated = false;
  
  if (highest === 6) {
    damage = 1; // 1 damage on 6
  } else if (highest >= 4) {
    incapacitated = true; // Cannot attack for 1 turn on 4-5
  } else {
    fullyIncapacitated = true; // All HP removed on 1-3
  }
  
  // Check for doubles (any two dice with same value)
  const counts: Record<number, number> = {};
  rolls.forEach(roll => {
    counts[roll] = (counts[roll] || 0) + 1;
  });
  
  const hasDoubles = Object.values(counts).some(count => count >= 2);
  
  return { 
    damage, 
    counter: hasDoubles,
    incapacitated: incapacitated ? true : undefined,
    fullIncapacitation: fullyIncapacitated ? true : undefined
  };
};

export interface WinConditionResult {
  isOver: boolean;
  result: 'win' | 'lose' | null;
  aliveEnemies: CombatEnemy[];
  aliveParty: CombatCharacter[];
}

export const checkWinConditions = (
  enemies: CombatEnemy[], 
  party: CombatCharacter[]
): WinConditionResult => {
  const aliveEnemies = enemies.filter(enemy => {
    // Prioritize currentHP (combat state) over hp (initial/max), then calculate from aspects
    const hp = enemy.currentHP !== undefined ? enemy.currentHP :
               enemy.hp !== undefined ? enemy.hp :
               calculateEnemyTrackLength(enemy);
    return hp > 0;
  });
  const aliveParty = party.filter(char => {
    // Prioritize currentHP (combat state) over hp, then fall back to hitPoints
    const hp = char.currentHP !== undefined ? char.currentHP :
               char.hp !== undefined ? char.hp :
               char.hitPoints || 0;
    return hp > 0;
  });
  
  if (aliveEnemies.length === 0) {
    return { isOver: true, result: 'win', aliveEnemies, aliveParty };
  }
  
  if (aliveParty.length === 0) {
    return { isOver: true, result: 'lose', aliveEnemies, aliveParty };
  }
  
  return { isOver: false, result: null, aliveEnemies, aliveParty };
};
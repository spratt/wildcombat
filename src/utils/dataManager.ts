// Data management utilities for party and encounter operations
import type { 
  Character, 
  Enemy, 
  CombatCharacter, 
  CombatEnemy,
  PartyState,
  EncounterState
} from '../types';

// Extended types for internal use
interface CharacterInstance extends Character {
  partyId?: string;
  currentHP?: number;
  hitPoints: number;
  attackSkill: string;
  attackScore: number;
  defenseSkill: string;
  defenseScore: number;
}

interface EnemyInstance extends Enemy {
  id: string;
  uniqueName?: string;
  baseName?: string;
  enemyId?: string;
  instanceId?: string;
  currentHP?: number;
}

interface EncounterEnemy {
  enemyId: string;
  count: number;
}

interface PartyStatistics {
  totalHitPoints: number;
  totalAttackScore: number;
  totalDefenseScore: number;
}

interface EncounterStatistics {
  totalHP: number;
  enemyCount: number;
}

interface ResetCombatResult {
  resetEnemies: EnemyInstance[];
  resetParty: CharacterInstance[];
}

// Helper function to calculate total enemy trackLength from aspects
export const calculateEnemyTrackLength = (enemy: Enemy | EnemyInstance): number => {
  if (!enemy || !enemy.aspects) return 0;
  return enemy.aspects.reduce((total, aspect) => {
    return total + (aspect.trackLength || 0);
  }, 0);
};

// Helper function to calculate unchecked aspect tracks (hit points)
const calculateHitPoints = (character: Character): number => {
  if (!character.aspects || !Array.isArray(character.aspects)) {
    return 0;
  }
  
  return character.aspects.reduce((total, aspect) => {
    // Use aspect.value or default to [0] if missing
    const aspectValue = aspect.value || [0];
    if (!Array.isArray(aspectValue)) {
      return total;
    }
    
    // Count unchecked bubbles (0 values)
    const uncheckedBubbles = aspectValue.filter(bubble => bubble === 0).length;
    return total + uncheckedBubbles;
  }, 0);
};

// Helper function to calculate attack skill and score
const calculateAttackStats = (character: Character): { skill: string; score: number } => {
  if (!character.skills) {
    return { skill: 'BREAK', score: 1 };
  }
  
  const attackSkills = ['BREAK', 'HACK', 'HUNT'];
  let bestSkill = 'BREAK';
  let maxFilledBubbles = 0;
  
  attackSkills.forEach(skillName => {
    const skill = character.skills[skillName];
    if (skill && Array.isArray(skill)) {
      const filledBubbles = skill.filter((bubble: number) => bubble === 1).length;
      if (filledBubbles > maxFilledBubbles) {
        maxFilledBubbles = filledBubbles;
        bestSkill = skillName;
      }
    }
  });
  
  return {
    skill: bestSkill,
    score: 1 + maxFilledBubbles
  };
};

// Helper function to calculate defense skill and score
const calculateDefenseStats = (character: Character): { skill: string; score: number } => {
  if (!character.skills) {
    return { skill: 'BRACE', score: 1 };
  }
  
  const defenseSkills = ['BRACE', 'FLOURISH', 'VAULT'];
  let bestSkill = 'BRACE';
  let maxFilledBubbles = 0;
  
  defenseSkills.forEach(skillName => {
    const skill = character.skills[skillName];
    if (skill && Array.isArray(skill)) {
      const filledBubbles = skill.filter((bubble: number) => bubble === 1).length;
      if (filledBubbles > maxFilledBubbles) {
        maxFilledBubbles = filledBubbles;
        bestSkill = skillName;
      }
    }
  });
  
  return {
    skill: bestSkill,
    score: 1 + maxFilledBubbles
  };
};

export const loadPartyFromStorage = (): CharacterInstance[] => {
  try {
    const savedParty = localStorage.getItem('wildcombat-party');
    if (savedParty) {
      const partyData: Character[] = JSON.parse(savedParty);
      // Add calculated properties to each character
      return partyData.map(character => {
        const hitPoints = calculateHitPoints(character);
        const attackStats = calculateAttackStats(character);
        const defenseStats = calculateDefenseStats(character);
        
        return {
          ...character,
          hitPoints,
          attackSkill: attackStats.skill,
          attackScore: attackStats.score,
          defenseSkill: defenseStats.skill,
          defenseScore: defenseStats.score
        } as CharacterInstance;
      });
    }
    return [];
  } catch (error) {
    console.error('Error loading party:', error);
    return [];
  }
};

export const loadEncounterFromStorage = (): EncounterEnemy[] => {
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

export const loadEnemiesData = async (): Promise<EnemyInstance[]> => {
  try {
    // Load all enemy files using relative paths
    const enemyFiles = [
      'shadowclaw-spider.json',
      'thornback-beetle.json', 
      'dire-squirrel.json',
      'zitera.json'
    ];
    
    const enemyData = await Promise.all(
      enemyFiles.map(async (filename) => {
        try {
          const response = await fetch(`./enemies/${filename}`);
          if (!response.ok) throw new Error(`Failed to load ${filename}`);
          const data = await response.json();
          return { id: filename, ...data } as EnemyInstance;
        } catch (err) {
          console.error(`Error loading ${filename}:`, err);
          return null;
        }
      })
    );

    return enemyData.filter((enemy): enemy is EnemyInstance => enemy !== null);
  } catch (err) {
    console.error('Error loading enemies:', err);
    return [];
  }
};

// Helper function to generate unique enemy names
export const generateUniqueEnemyNames = (
  encounter: EncounterEnemy[], 
  enemies: EnemyInstance[]
): EnemyInstance[] => {
  const enemyCounts: Record<string, number> = {};
  
  return encounter.map(encounterEnemy => {
    const enemy = enemies.find(e => e.id === encounterEnemy.enemyId);
    if (!enemy) return null;
    
    const baseName = enemy.name;
    if (!enemyCounts[baseName]) {
      enemyCounts[baseName] = 0;
    }
    
    const instances: EnemyInstance[] = [];
    for (let i = 0; i < encounterEnemy.count; i++) {
      enemyCounts[baseName]++;
      const uniqueName = `${baseName} ${enemyCounts[baseName]}`;
      instances.push({
        ...enemy, // Copy all enemy data fields
        uniqueName,
        baseName,
        enemyId: encounterEnemy.enemyId,
        instanceId: `${encounterEnemy.enemyId}-${enemyCounts[baseName]}`
      });
    }
    
    return instances;
  }).filter((instances): instances is EnemyInstance[] => instances !== null).flat();
};

// Helper function to render trackLength as empty bubbles
export const renderTrackLength = (length: number): string => {
  if (!length || length <= 0) return '';
  return Array(length).fill('⦾').join('-');
};

// Calculate party statistics
export const calculatePartyStats = (partyCharacters: CharacterInstance[]): PartyStatistics => {
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
export const calculateEncounterStats = (uniqueEnemies: EnemyInstance[]): EncounterStatistics => {
  const totalHP = uniqueEnemies.reduce((total, enemy) => {
    return total + (enemy.currentHP !== undefined ? enemy.currentHP : calculateEnemyTrackLength(enemy));
  }, 0);

  return {
    totalHP,
    enemyCount: uniqueEnemies.length
  };
};

// Reset combat state functions
export const resetCombatState = (
  uniqueEnemies: EnemyInstance[], 
  partyCharacters: CharacterInstance[]
): ResetCombatResult => {
  const resetEnemies = uniqueEnemies.map(enemy => ({
    ...enemy,
    currentHP: calculateEnemyTrackLength(enemy)
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
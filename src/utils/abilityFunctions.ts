// Enemy ability functions for combat simulation
import { 
  rollDice, 
  calculateDamage,
  calculateDefenseDamage, 
  calculateIncapacitateDefense
} from './combatEngine';
import { calculateEnemyTrackLength } from './dataManager';
import type { 
  CombatCharacter, 
  CombatEnemy
} from '../types';

interface CombatLogEntry {
  message: string;
  type: 'player' | 'enemy' | 'neutral';
}

interface CombatCharacterInstance extends CombatCharacter {
  partyId?: string;
  currentHP?: number;
  hitPoints?: number;
  attackScore?: number;
  attackSkill?: string;
  defenseScore?: number;
  defenseSkill?: string;
}

interface CombatEnemyInstance extends CombatEnemy {
  instanceId: string;
  uniqueName: string;
  currentHP?: number;
}

interface AbilityContext {
  enemy: CombatEnemyInstance;
  ability: { name: string; abilityCode: string };
  target: CombatCharacterInstance;
  updatedParty: CombatCharacterInstance[];
  updatedEnemies: CombatEnemyInstance[];
  damageModel: string;
  enemyAttacksPerRound: number;
  attackNum: number;
  log: CombatLogEntry[];
}

interface AbilityResult {
  updatedParty: CombatCharacterInstance[];
  updatedEnemies: CombatEnemyInstance[];
  log: CombatLogEntry[];
  shouldContinue: boolean;
}

type AbilityFunction = (context: AbilityContext) => AbilityResult;

// Helper function to handle counter-attacks
export const handleCounterAttack = (
  target: CombatCharacterInstance,
  enemy: CombatEnemyInstance,
  updatedEnemies: CombatEnemyInstance[],
  log: CombatLogEntry[]
): { updatedEnemies: CombatEnemyInstance[]; shouldContinue: boolean } => {
  const counterAttackScore = target.attackScore || 1;
  const counterAttackSkill = target.attackSkill || 'BREAK';
  const counterRolls = rollDice(counterAttackScore);
  const counterDamage = calculateDamage(counterRolls);
  
  log.push({
    message: `${target.name} counter-attacks with ${counterAttackSkill} and rolled ${counterRolls.join(', ')} (${counterAttackScore} dice)`,
    type: 'player'
  });
  
  if (counterDamage > 0) {
    const enemyIndex = updatedEnemies.findIndex(e => e.instanceId === enemy.instanceId);
    if (enemyIndex !== -1) {
      const currentEnemyHP = updatedEnemies[enemyIndex].currentHP !== undefined 
        ? updatedEnemies[enemyIndex].currentHP 
        : calculateEnemyTrackLength(updatedEnemies[enemyIndex]);
      updatedEnemies[enemyIndex].currentHP = Math.max(0, currentEnemyHP - counterDamage);
      
      log.push({
        message: `${target.name} does ${counterDamage} damage to ${enemy.uniqueName}`,
        type: 'player'
      });
      
      if (updatedEnemies[enemyIndex].currentHP <= 0) {
        log.push({
          message: `${enemy.uniqueName} was defeated by the counter-attack!`,
          type: 'neutral'
        });
        return { updatedEnemies, shouldContinue: false };
      }
    }
  }
  
  return { updatedEnemies, shouldContinue: true };
};

// Incapacitate ability
const incapacitateAbility: AbilityFunction = (context) => {
  const { enemy, ability, target, updatedParty, updatedEnemies, enemyAttacksPerRound, attackNum, log } = context;
  
  const defenseScore = target.defenseScore || 1;
  const defenseSkill = target.defenseSkill || 'BRACE';
  const defenseRolls = rollDice(defenseScore);
  const abilityResult = calculateIncapacitateDefense(defenseRolls, target);
  
  // Log ability use and defense
  const attackLabel = enemyAttacksPerRound > 1 ? ` (attack ${attackNum}/${enemyAttacksPerRound})` : '';
  log.push({
    message: `${enemy.uniqueName} uses ${ability.name}${attackLabel}`,
    type: 'enemy'
  });
  log.push({
    message: `${target.name} defends with ${defenseSkill} and rolled ${defenseRolls.join(', ')} (${defenseScore} dice)`,
    type: 'player'
  });
  
  // Apply ability effects
  if (abilityResult.fullIncapacitation) {
    const charIndex = updatedParty.findIndex(c => c.partyId === target.partyId);
    if (charIndex !== -1) {
      updatedParty[charIndex].currentHP = 0;
      log.push({
        message: `${target.name} is fully incapacitated and loses all HP!`,
        type: 'enemy'
      });
      log.push({
        message: `${target.name} was defeated!`,
        type: 'neutral'
      });
    }
  } else if (abilityResult.incapacitated) {
    const charIndex = updatedParty.findIndex(c => c.partyId === target.partyId);
    if (charIndex !== -1) {
      updatedParty[charIndex].incapacitated = true;
      log.push({
        message: `${target.name} is incapacitated and cannot attack next turn!`,
        type: 'enemy'
      });
    }
  } else if (abilityResult.damage > 0) {
    const charIndex = updatedParty.findIndex(c => c.partyId === target.partyId);
    if (charIndex !== -1) {
      const currentHP = updatedParty[charIndex].currentHP !== undefined 
        ? updatedParty[charIndex].currentHP 
        : updatedParty[charIndex].hitPoints || 0;
      updatedParty[charIndex].currentHP = Math.max(0, currentHP - abilityResult.damage);
      
      log.push({
        message: `${enemy.uniqueName} does ${abilityResult.damage} damage to ${target.name}`,
        type: 'enemy'
      });
      
      if (updatedParty[charIndex].currentHP <= 0) {
        log.push({
          message: `${target.name} was defeated!`,
          type: 'neutral'
        });
      }
    }
  }
  
  // Handle counter-attack on doubles
  let shouldContinue = true;
  if (abilityResult.counter) {
    log.push({
      message: `${target.name} rolled doubles and gets a free counter-attack!`,
      type: 'player'
    });
    
    const counterResult = handleCounterAttack(target, enemy, updatedEnemies, log);
    shouldContinue = counterResult.shouldContinue;
  }
  
  return { updatedParty, updatedEnemies, log, shouldContinue };
};

// Dual Wield Barrage ability
const dualWieldBarrageAbility: AbilityFunction = (context) => {
  const { enemy, ability, updatedParty, updatedEnemies, damageModel, enemyAttacksPerRound, attackNum, log } = context;
  
  const attackLabel = enemyAttacksPerRound > 1 ? ` (attack ${attackNum}/${enemyAttacksPerRound})` : '';
  log.push({
    message: `${enemy.uniqueName} uses ${ability.name}${attackLabel} - targeting ALL players!`,
    type: 'enemy'
  });
  
  // Attack each alive player
  const aliveParty = updatedParty.filter(char => {
    const hp = char.currentHP !== undefined ? char.currentHP : char.hitPoints || 0;
    return hp > 0;
  });
  
  let shouldContinue = true;
  for (const partyTarget of aliveParty) {
    if (!shouldContinue) break;
    
    const defenseScore = partyTarget.defenseScore || 1;
    const defenseSkill = partyTarget.defenseSkill || 'BRACE';
    const defenseRolls = rollDice(defenseScore, 0, 1); // 1 advantage for defending against barrage
    const defenseResult = calculateDefenseDamage(defenseRolls, damageModel, partyTarget);
    
    log.push({
      message: `${partyTarget.name} defends with ${defenseSkill} (with advantage) and rolled ${defenseRolls.join(', ')} (${defenseScore + 1} dice)`,
      type: 'player'
    });
    
    if (defenseResult.damage > 0) {
      const charIndex = updatedParty.findIndex(c => c.partyId === partyTarget.partyId);
      if (charIndex !== -1) {
        const currentHP = updatedParty[charIndex].currentHP !== undefined 
          ? updatedParty[charIndex].currentHP 
          : updatedParty[charIndex].hitPoints || 0;
        updatedParty[charIndex].currentHP = Math.max(0, currentHP - defenseResult.damage);
        
        log.push({
          message: `${partyTarget.name} takes ${defenseResult.damage} damage from the barrage`,
          type: 'enemy'
        });
        
        if (updatedParty[charIndex].currentHP <= 0) {
          log.push({
            message: `${partyTarget.name} was defeated!`,
            type: 'neutral'
          });
        }
      }
    } else {
      log.push({
        message: `${partyTarget.name} successfully defends against the barrage`,
        type: 'player'
      });
    }
    
    // Handle counter-attack on doubles
    if (defenseResult.counter) {
      log.push({
        message: `${partyTarget.name} rolled doubles and gets a free counter-attack!`,
        type: 'player'
      });
      
      const counterResult = handleCounterAttack(partyTarget, enemy, updatedEnemies, log);
      shouldContinue = counterResult.shouldContinue;
    }
  }
  
  return { updatedParty, updatedEnemies, log, shouldContinue };
};

// High Noon Duel ability
const highNoonDuelAbility: AbilityFunction = (context) => {
  const { enemy, ability, target, updatedParty, updatedEnemies, damageModel, enemyAttacksPerRound, attackNum, log } = context;
  
  const attackLabel = enemyAttacksPerRound > 1 ? ` (attack ${attackNum}/${enemyAttacksPerRound})` : '';
  log.push({
    message: `${enemy.uniqueName} uses ${ability.name}${attackLabel} - challenging ${target.name} to a duel!`,
    type: 'enemy'
  });
  
  const defenseScore = target.defenseScore || 1;
  const defenseSkill = target.defenseSkill || 'BRACE';
  const defenseRolls = rollDice(defenseScore);
  const defenseResult = calculateDefenseDamage(defenseRolls, damageModel, target);
  
  log.push({
    message: `${target.name} defends with ${defenseSkill} and rolled ${defenseRolls.join(', ')} (${defenseScore} dice)`,
    type: 'player'
  });
  
  if (defenseResult.damage > 0) {
    const charIndex = updatedParty.findIndex(c => c.partyId === target.partyId);
    if (charIndex !== -1) {
      const currentHP = updatedParty[charIndex].currentHP !== undefined 
        ? updatedParty[charIndex].currentHP 
        : updatedParty[charIndex].hitPoints || 0;
      updatedParty[charIndex].currentHP = Math.max(0, currentHP - defenseResult.damage);
      
      log.push({
        message: `${target.name} takes ${defenseResult.damage} damage in the duel`,
        type: 'enemy'
      });
      
      if (updatedParty[charIndex].currentHP <= 0) {
        log.push({
          message: `${target.name} was defeated in the duel!`,
          type: 'neutral'
        });
      }
    }
  } else {
    log.push({
      message: `${target.name} successfully defends in the duel`,
      type: 'player'
    });
  }
  
  // Handle counter-attack
  let shouldContinue = true;
  if (defenseResult.counter) {
    log.push({
      message: `${target.name} rolled doubles and gets a free counter-attack in the duel!`,
      type: 'player'
    });
    
    const counterResult = handleCounterAttack(target, enemy, updatedEnemies, log);
    shouldContinue = counterResult.shouldContinue;
  }
  
  return { updatedParty, updatedEnemies, log, shouldContinue };
};

// Desert Mirage ability
const desertMirageAbility: AbilityFunction = (context) => {
  const { enemy, ability, target, updatedParty, updatedEnemies, damageModel, enemyAttacksPerRound, attackNum, log } = context;
  
  const attackLabel = enemyAttacksPerRound > 1 ? ` (attack ${attackNum}/${enemyAttacksPerRound})` : '';
  log.push({
    message: `${enemy.uniqueName} uses ${ability.name}${attackLabel} - reality shimmers and distorts!`,
    type: 'enemy'
  });
  
  log.push({
    message: `Shimmering mirages make it harder for players to focus their attacks`,
    type: 'neutral'
  });
  
  const defenseScore = target.defenseScore || 1;
  const defenseSkill = target.defenseSkill || 'BRACE';
  const defenseRolls = rollDice(defenseScore);
  const defenseResult = calculateDefenseDamage(defenseRolls, damageModel, target);
  
  log.push({
    message: `${target.name} defends with ${defenseSkill} and rolled ${defenseRolls.join(', ')} (${defenseScore} dice)`,
    type: 'player'
  });
  
  if (defenseResult.damage > 0) {
    const charIndex = updatedParty.findIndex(c => c.partyId === target.partyId);
    if (charIndex !== -1) {
      const currentHP = updatedParty[charIndex].currentHP !== undefined 
        ? updatedParty[charIndex].currentHP 
        : updatedParty[charIndex].hitPoints || 0;
      updatedParty[charIndex].currentHP = Math.max(0, currentHP - defenseResult.damage);
      
      log.push({
        message: `${target.name} takes ${defenseResult.damage} damage through the mirage`,
        type: 'enemy'
      });
      
      if (updatedParty[charIndex].currentHP <= 0) {
        log.push({
          message: `${target.name} was defeated!`,
          type: 'neutral'
        });
      }
    }
  } else {
    log.push({
      message: `${target.name} successfully defends against the mirage attack`,
      type: 'player'
    });
  }
  
  // Handle counter-attack
  let shouldContinue = true;
  if (defenseResult.counter) {
    log.push({
      message: `${target.name} rolled doubles and gets a free counter-attack!`,
      type: 'player'
    });
    
    const counterResult = handleCounterAttack(target, enemy, updatedEnemies, log);
    shouldContinue = counterResult.shouldContinue;
  }
  
  return { updatedParty, updatedEnemies, log, shouldContinue };
};

// Violet Haze ability
const violetHazeAbility: AbilityFunction = (context) => {
  const { enemy, ability, updatedParty, updatedEnemies, damageModel, enemyAttacksPerRound, attackNum, log } = context;
  
  const attackLabel = enemyAttacksPerRound > 1 ? ` (attack ${attackNum}/${enemyAttacksPerRound})` : '';
  log.push({
    message: `${enemy.uniqueName} uses ${ability.name}${attackLabel} - releasing toxic wisteria pollen!`,
    type: 'enemy'
  });
  
  log.push({
    message: `Purple clouds of poisonous pollen fill the air, choking all enemies`,
    type: 'enemy'
  });
  
  // Attack each alive player with poison damage
  const aliveParty = updatedParty.filter(char => {
    const hp = char.currentHP !== undefined ? char.currentHP : char.hitPoints || 0;
    return hp > 0;
  });
  
  let shouldContinue = true;
  for (const partyTarget of aliveParty) {
    if (!shouldContinue) break;
    
    const defenseScore = partyTarget.defenseScore || 1;
    const defenseSkill = partyTarget.defenseSkill || 'BRACE';
    const defenseRolls = rollDice(defenseScore);
    const defenseResult = calculateDefenseDamage(defenseRolls, damageModel, partyTarget);
    
    log.push({
      message: `${partyTarget.name} tries to resist the toxic pollen with ${defenseSkill} and rolled ${defenseRolls.join(', ')} (${defenseScore} dice)`,
      type: 'player'
    });
    
    if (defenseResult.damage > 0) {
      const charIndex = updatedParty.findIndex(c => c.partyId === partyTarget.partyId);
      if (charIndex !== -1) {
        const currentHP = updatedParty[charIndex].currentHP !== undefined 
          ? updatedParty[charIndex].currentHP 
          : updatedParty[charIndex].hitPoints || 0;
        updatedParty[charIndex].currentHP = Math.max(0, currentHP - defenseResult.damage);
        
        log.push({
          message: `${partyTarget.name} takes ${defenseResult.damage} poison damage from the violet haze`,
          type: 'enemy'
        });
        
        if (updatedParty[charIndex].currentHP <= 0) {
          log.push({
            message: `${partyTarget.name} succumbs to the toxic pollen!`,
            type: 'neutral'
          });
        }
      }
    } else {
      log.push({
        message: `${partyTarget.name} successfully resists the poisonous cloud`,
        type: 'player'
      });
    }
    
    // Handle counter-attack on doubles (represents fighting through the poison)
    if (defenseResult.counter) {
      log.push({
        message: `${partyTarget.name} rolled doubles and fights through the poison for a counter-attack!`,
        type: 'player'
      });
      
      const counterResult = handleCounterAttack(partyTarget, enemy, updatedEnemies, log);
      shouldContinue = counterResult.shouldContinue;
    }
  }
  
  return { updatedParty, updatedEnemies, log, shouldContinue };
};

// Bonnie's Revenge ability
const bonniesRevengeAbility: AbilityFunction = (context) => {
  const { enemy, ability, target, updatedParty, updatedEnemies, damageModel, enemyAttacksPerRound, attackNum, log } = context;
  
  // Check if any allies have been defeated
  const totalEnemies = updatedEnemies.length;
  const aliveEnemies = updatedEnemies.filter(e => {
    const hp = e.currentHP !== undefined ? e.currentHP : calculateEnemyTrackLength(e);
    return hp > 0;
  });
  const defeatedAllies = totalEnemies - aliveEnemies.length;
  
  const attackLabel = enemyAttacksPerRound > 1 ? ` (attack ${attackNum}/${enemyAttacksPerRound})` : '';
  
  if (defeatedAllies > 0) {
    log.push({
      message: `${enemy.uniqueName} uses ${ability.name}${attackLabel} - fueled by vengeance for ${defeatedAllies} fallen ally${defeatedAllies > 1 ? 's' : ''}!`,
      type: 'enemy'
    });
    
    // Bonnie gets +1 damage per fallen ally
    const vengeanceBonus = defeatedAllies;
    
    const defenseScore = target.defenseScore || 1;
    const defenseSkill = target.defenseSkill || 'BRACE';
    const defenseRolls = rollDice(defenseScore);
    const baseDefenseResult = calculateDefenseDamage(defenseRolls, damageModel, target);
    
    // Add vengeance damage bonus
    const defenseResult = {
      ...baseDefenseResult,
      damage: baseDefenseResult.damage + (baseDefenseResult.damage > 0 ? vengeanceBonus : 0)
    };
    
    log.push({
      message: `${target.name} defends with ${defenseSkill} and rolled ${defenseRolls.join(', ')} (${defenseScore} dice)`,
      type: 'player'
    });
    
    if (defenseResult.damage > 0) {
      const charIndex = updatedParty.findIndex(c => c.partyId === target.partyId);
      if (charIndex !== -1) {
        const currentHP = updatedParty[charIndex].currentHP !== undefined 
          ? updatedParty[charIndex].currentHP 
          : updatedParty[charIndex].hitPoints || 0;
        updatedParty[charIndex].currentHP = Math.max(0, currentHP - defenseResult.damage);
        
        log.push({
          message: `${enemy.uniqueName} does ${defenseResult.damage} damage to ${target.name} (including +${vengeanceBonus} vengeance damage)`,
          type: 'enemy'
        });
        
        if (updatedParty[charIndex].currentHP <= 0) {
          log.push({
            message: `${target.name} was defeated by vengeful fury!`,
            type: 'neutral'
          });
        }
      }
    } else {
      log.push({
        message: `${target.name} successfully defends against the vengeful attack`,
        type: 'player'
      });
    }
    
    // Handle counter-attack
    let shouldContinue = true;
    if (defenseResult.counter) {
      log.push({
        message: `${target.name} rolled doubles and gets a free counter-attack!`,
        type: 'player'
      });
      
      const counterResult = handleCounterAttack(target, enemy, updatedEnemies, log);
      shouldContinue = counterResult.shouldContinue;
    }
    
    return { updatedParty, updatedEnemies, log, shouldContinue };
  } else {
    // No defeated allies, normal attack
    log.push({
      message: `${enemy.uniqueName} uses ${ability.name}${attackLabel} - but no allies have fallen yet`,
      type: 'enemy'
    });
    
    const defenseScore = target.defenseScore || 1;
    const defenseSkill = target.defenseSkill || 'BRACE';
    const defenseRolls = rollDice(defenseScore);
    const defenseResult = calculateDefenseDamage(defenseRolls, damageModel, target);
    
    log.push({
      message: `${target.name} defends with ${defenseSkill} and rolled ${defenseRolls.join(', ')} (${defenseScore} dice)`,
      type: 'player'
    });
    
    if (defenseResult.damage > 0) {
      const charIndex = updatedParty.findIndex(c => c.partyId === target.partyId);
      if (charIndex !== -1) {
        const currentHP = updatedParty[charIndex].currentHP !== undefined 
          ? updatedParty[charIndex].currentHP 
          : updatedParty[charIndex].hitPoints || 0;
        updatedParty[charIndex].currentHP = Math.max(0, currentHP - defenseResult.damage);
        
        log.push({
          message: `${enemy.uniqueName} does ${defenseResult.damage} damage to ${target.name}`,
          type: 'enemy'
        });
        
        if (updatedParty[charIndex].currentHP <= 0) {
          log.push({
            message: `${target.name} was defeated!`,
            type: 'neutral'
          });
        }
      }
    } else {
      log.push({
        message: `${target.name} successfully defends`,
        type: 'player'
      });
    }
    
    // Handle counter-attack
    let shouldContinue = true;
    if (defenseResult.counter) {
      log.push({
        message: `${target.name} rolled doubles and gets a free counter-attack!`,
        type: 'player'
      });
      
      const counterResult = handleCounterAttack(target, enemy, updatedEnemies, log);
      shouldContinue = counterResult.shouldContinue;
    }
    
    return { updatedParty, updatedEnemies, log, shouldContinue };
  }
};

// Ability mapping
export const abilityMap: Record<string, AbilityFunction> = {
  'incapacitate': incapacitateAbility,
  'Incapacitate': incapacitateAbility,
  'dualWieldBarrage': dualWieldBarrageAbility,
  'highNoonDuel': highNoonDuelAbility,
  'desertMirage': desertMirageAbility,
  'violetHaze': violetHazeAbility,
  'bonniesRevenge': bonniesRevengeAbility,
};

// Re-export types for use in other modules
export type { 
  AbilityContext, 
  AbilityResult, 
  AbilityFunction, 
  CombatLogEntry, 
  CombatCharacterInstance, 
  CombatEnemyInstance 
};
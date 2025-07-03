// Combat simulator - orchestrates combat rounds and sessions
import { 
  rollDice, 
  calculateDamage, 
  calculateDefenseDamage, 
  checkWinConditions 
} from './combatEngine';
import { calculateEnemyTrackLength } from './dataManager';
import { 
  abilityMap,
  handleCounterAttack,
  type AbilityContext,
  type CombatLogEntry,
  type CombatCharacterInstance,
  type CombatEnemyInstance
} from './abilityFunctions';
import type { 
  CombatCharacter, 
  CombatEnemy
} from '../types';
import type {
  CharacterInstance,
  EnemyInstance
} from './dataManager';


interface PlayerAttackPhaseResult {
  updatedEnemies: CombatEnemyInstance[];
  log: CombatLogEntry[];
}

interface EnemyAttackPhaseResult {
  updatedParty: CombatCharacterInstance[];
  updatedEnemies: CombatEnemyInstance[];
  log: CombatLogEntry[];
}

interface SimulateRoundResult {
  updatedParty: (CombatCharacter | CharacterInstance)[];
  updatedEnemies: (CombatEnemy | EnemyInstance)[];
  log: CombatLogEntry[];
  combatResult: string | null;
  isOver: boolean;
}

export const simulatePlayerAttackPhase = (
  party: CombatCharacterInstance[], 
  enemies: CombatEnemyInstance[]
): PlayerAttackPhaseResult => {
  const log: CombatLogEntry[] = [];
  let updatedEnemies = [...enemies];
  
  party.forEach(character => {
    // Skip incapacitated characters
    if (character.incapacitated) {
      log.push({
        message: `${character.name} is incapacitated and cannot attack this turn`,
        type: 'neutral'
      });
      return;
    }
    
    const stillAlive = updatedEnemies.filter(enemy => 
      (enemy.currentHP !== undefined ? enemy.currentHP : calculateEnemyTrackLength(enemy)) > 0
    );
    if (stillAlive.length === 0) return; // No more targets
    
    // Target enemy with lowest HP
    const target = stillAlive.reduce((lowest, enemy) => {
      const enemyHP = enemy.currentHP !== undefined ? enemy.currentHP : calculateEnemyTrackLength(enemy);
      const lowestHP = lowest.currentHP !== undefined ? lowest.currentHP : calculateEnemyTrackLength(lowest);
      return enemyHP < lowestHP ? enemy : lowest;
    });
    
    // Roll dice
    const attackScore = character.attackScore || 1;
    const attackSkill = character.attackSkill || 'BREAK';
    const rolls = rollDice(attackScore);
    const damage = calculateDamage(rolls);
    
    // Log dice roll
    log.push({
      message: `${character.name} attacks ${target.uniqueName} with ${attackSkill} and rolled ${rolls.join(', ')} (${attackScore} dice)`,
      type: 'player'
    });
    
    if (damage > 0) {
      // Find enemy in updatedEnemies array and apply damage
      const enemyIndex = updatedEnemies.findIndex(e => e.instanceId === target.instanceId);
      if (enemyIndex !== -1) {
        const currentHP = updatedEnemies[enemyIndex].currentHP !== undefined 
          ? updatedEnemies[enemyIndex].currentHP 
          : calculateEnemyTrackLength(updatedEnemies[enemyIndex]);
        updatedEnemies[enemyIndex].currentHP = Math.max(0, currentHP - damage);
        
        log.push({
          message: `${character.name} does ${damage} damage to ${target.uniqueName}`,
          type: 'player'
        });
        
        // Check if defeated
        if (updatedEnemies[enemyIndex].currentHP <= 0) {
          log.push({
            message: `${target.uniqueName} was defeated!`,
            type: 'neutral'
          });
        }
      }
    }
  });
  
  return { updatedEnemies, log };
};

export const simulateEnemyAttackPhase = (
  enemies: CombatEnemyInstance[], 
  party: CombatCharacterInstance[], 
  damageModel: string = '0,1,2,counter', 
  enemyAttacksPerRound: number = 1, 
  useAbilities: boolean = true,
  debugMode: boolean = false
): EnemyAttackPhaseResult => {
  
  const log: CombatLogEntry[] = [];
  let updatedParty = [...party];
  let updatedEnemies = [...enemies];
  
  // Filter alive enemies and party at start of phase
  const aliveEnemies = updatedEnemies.filter(enemy => 
    (enemy.currentHP !== undefined ? enemy.currentHP : calculateEnemyTrackLength(enemy)) > 0
  );
  let aliveParty = updatedParty.filter(char => 
    (char.currentHP !== undefined ? char.currentHP : char.hitPoints || 0) > 0
  );
  
  if (debugMode) {
    log.push({
      message: `DEBUG: Starting enemy attack phase with ${aliveEnemies.length} alive enemies and ${aliveParty.length} alive party members`,
      type: 'neutral'
    });
  }
  
  if (aliveEnemies.length === 0 || aliveParty.length === 0) {
    if (debugMode) {
      log.push({
        message: `DEBUG: Enemy attack phase skipped - no valid targets (enemies: ${aliveEnemies.length}, party: ${aliveParty.length})`,
        type: 'neutral'
      });
    }
    return { updatedParty, updatedEnemies, log };
  }
  
  aliveEnemies.forEach(enemy => {
    if (debugMode) {
      log.push({
        message: `DEBUG: ${enemy.uniqueName} preparing to attack (${enemyAttacksPerRound} attacks per round)`,
        type: 'neutral'
      });
    }
    
    // Each enemy makes multiple attacks per round
    for (let attackNum = 1; attackNum <= enemyAttacksPerRound; attackNum++) {
      // Update alive party for each attack (some might have died)
      aliveParty = updatedParty.filter(char => 
        (char.currentHP !== undefined ? char.currentHP : char.hitPoints || 0) > 0
      );
      
      if (aliveParty.length === 0) {
        if (debugMode) {
          log.push({
            message: `DEBUG: ${enemy.uniqueName} attack ${attackNum} cancelled - no alive party members`,
            type: 'neutral'
          });
        }
        return; // No more targets
      }
      
      // Target player with lowest HP
      const target = aliveParty.reduce((lowest, player) => {
        const playerHP = player.currentHP !== undefined ? player.currentHP : player.hitPoints || 0;
        const lowestHP = lowest.currentHP !== undefined ? lowest.currentHP : lowest.hitPoints || 0;
        return playerHP < lowestHP ? player : lowest;
      });
    
      // Check if enemy should use ability instead of attack (once per session)
      // Get the current enemy state from updatedEnemies
      const currentEnemyIndex = updatedEnemies.findIndex(e => e.instanceId === enemy.instanceId);
      const currentEnemy = currentEnemyIndex !== -1 ? updatedEnemies[currentEnemyIndex] : enemy;
      
      const availableAbilities = currentEnemy.aspects?.filter(aspect => 
        aspect.abilityCode && !currentEnemy.usedAbilities?.has(aspect.name)
      ) || [];
      
      const useAbility = useAbilities && availableAbilities.length > 0; // Use abilities only if enabled and available
      
      if (debugMode) {
        log.push({
          message: `DEBUG: ${enemy.uniqueName} attack ${attackNum} - useAbilities: ${useAbilities}, availableAbilities: ${availableAbilities.length}, will use ability: ${useAbility}`,
          type: 'neutral'
        });
      }
      
      if (useAbility) {
        // Use random available ability
        const ability = availableAbilities[Math.floor(Math.random() * availableAbilities.length)];
        
        if (!ability.abilityCode) {
          // Skip abilities without abilityCode
          continue;
        }
        
        if (debugMode) {
          log.push({
            message: `DEBUG: ${enemy.uniqueName} selected ability "${ability.name}" with abilityCode "${ability.abilityCode}"`,
            type: 'neutral'
          });
        }
        
        // Mark ability as used on the enemy in updatedEnemies array
        const enemyIndexForAbility = updatedEnemies.findIndex(e => e.instanceId === enemy.instanceId);
        if (enemyIndexForAbility !== -1) {
          if (!updatedEnemies[enemyIndexForAbility].usedAbilities) {
            updatedEnemies[enemyIndexForAbility].usedAbilities = new Set<string>();
          }
          updatedEnemies[enemyIndexForAbility].usedAbilities.add(ability.name);
        }
        
        // Use ability mapping system to handle special abilities
        const abilityFunction = abilityMap[ability.abilityCode || ''];
        
        if (abilityFunction) {
          // Create context for ability function
          const context: AbilityContext = {
            enemy,
            ability: { name: ability.name, abilityCode: ability.abilityCode! },
            target,
            updatedParty,
            updatedEnemies,
            damageModel,
            enemyAttacksPerRound,
            attackNum,
            log: [] // Give ability function a fresh log array
          };
          
          // Execute the ability and get results
          const abilityResult = abilityFunction(context);
          
          // Update state from ability results
          updatedParty = abilityResult.updatedParty;
          updatedEnemies = abilityResult.updatedEnemies;
          log.push(...abilityResult.log);
          
          // If ability indicates we should stop (enemy defeated), break from attack loop
          if (!abilityResult.shouldContinue) {
            return { updatedParty, updatedEnemies, log };
          }
        } else {
          // Unknown ability code - treat as regular attack with fallback logic
          if (debugMode) {
            log.push({
              message: `DEBUG: ${enemy.uniqueName} ability "${ability.name}" has unknown abilityCode "${ability.abilityCode}" - treating as regular attack`,
              type: 'neutral'
            });
          }
          
          // Set up defense for unknown ability (fallback to regular attack)
          const defenseScore = target.defenseScore || 1;
          const defenseSkill = target.defenseSkill || 'BRACE';
          const defenseRolls = rollDice(defenseScore);
          const defenseResult = calculateDefenseDamage(defenseRolls, damageModel, target);
          
          const attackLabel = enemyAttacksPerRound > 1 ? ` (attack ${attackNum}/${enemyAttacksPerRound})` : '';
          log.push({
            message: `${enemy.uniqueName} uses ${ability.name}${attackLabel}`,
            type: 'enemy'
          });
          
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
          }
          
          // Handle counter-attack on doubles
          if (defenseResult.counter) {
            log.push({
              message: `${target.name} rolled doubles and gets a free counter-attack!`,
              type: 'player'
            });
            
            const counterResult = handleCounterAttack(target, enemy, updatedEnemies, log);
            if (!counterResult.shouldContinue) {
              return { updatedParty, updatedEnemies, log };
            }
          }
        }
      } else {
        // Regular attack
        
        // Target defends with their defense skill
        const defenseScore = target.defenseScore || 1;
        const defenseSkill = target.defenseSkill || 'BRACE';
        const defenseRolls = rollDice(defenseScore);
        const defenseResult = calculateDefenseDamage(defenseRolls, damageModel, target);
        
        // Log enemy attack and defense
        const attackLabel = enemyAttacksPerRound > 1 ? ` (attack ${attackNum}/${enemyAttacksPerRound})` : '';
        log.push({
          message: `${enemy.uniqueName} attacks ${target.name}${attackLabel}`,
          type: 'enemy'
        });
        log.push({
          message: `${target.name} defends with ${defenseSkill} and rolled ${defenseRolls.join(', ')} (${defenseScore} dice)`,
          type: 'player'
        });
      
        if (defenseResult.damage > 0) {
          // Find character in updatedParty array and apply damage
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
            
            // Check if character is defeated
            if (updatedParty[charIndex].currentHP <= 0) {
              log.push({
                message: `${target.name} was defeated!`,
                type: 'neutral'
              });
              // Remove from alive party
              const aliveIndex = aliveParty.findIndex(c => c.partyId === target.partyId);
              if (aliveIndex !== -1) {
                aliveParty.splice(aliveIndex, 1);
              }
            }
          }
        }
        
        // Check for doubles - free counter attack
        if (defenseResult.counter) {
          log.push({
            message: `${target.name} rolled doubles and gets a free counter-attack!`,
            type: 'player'
          });
          
          // Counter attack
          const counterAttackScore = target.attackScore || 1;
          const counterAttackSkill = target.attackSkill || 'BREAK';
          const counterRolls = rollDice(counterAttackScore);
          const counterDamage = calculateDamage(counterRolls);
          
          log.push({
            message: `${target.name} counter-attacks ${enemy.uniqueName} with ${counterAttackSkill} and rolled ${counterRolls.join(', ')} (${counterAttackScore} dice)`,
            type: 'player'
          });
          
          if (counterDamage > 0) {
            // Apply counter damage to enemy
            const enemyIndex = updatedEnemies.findIndex(e => e.instanceId === enemy.instanceId);
            if (enemyIndex !== -1) {
              const currentHP = updatedEnemies[enemyIndex].currentHP !== undefined 
                ? updatedEnemies[enemyIndex].currentHP 
                : calculateEnemyTrackLength(updatedEnemies[enemyIndex]);
              updatedEnemies[enemyIndex].currentHP = Math.max(0, currentHP - counterDamage);
              
              log.push({
                message: `${target.name} does ${counterDamage} damage to ${enemy.uniqueName}`,
                type: 'player'
              });
              
              // Check if enemy is defeated by counter
              if (updatedEnemies[enemyIndex].currentHP <= 0) {
                log.push({
                  message: `${enemy.uniqueName} was defeated by the counter-attack!`,
                  type: 'neutral'
                });
              }
            }
          }
        }
      } // End of else (regular attack)
    } // End of attack loop
  });
  
  return { updatedParty, updatedEnemies, log };
};

export const simulateOneRound = (
  party: CharacterInstance[] | CombatCharacter[], 
  enemies: EnemyInstance[] | CombatEnemy[], 
  currentRound: number, 
  damageModel: string = '0,1,2,counter', 
  enemyAttacksPerRound: number = 1, 
  useAbilities: boolean = true,
  debugMode: boolean = false
): SimulateRoundResult => {
  if (party.length === 0 || enemies.length === 0) {
    return {
      updatedParty: party,
      updatedEnemies: enemies,
      log: [{ message: "Cannot simulate: missing party or encounter", type: 'neutral' }],
      combatResult: null,
      isOver: false
    };
  }

  // Check if combat is already over  
  const combatEnemies = enemies.map(e => ({ ...e, hp: e.currentHP !== undefined ? e.currentHP : calculateEnemyTrackLength(e), maxHp: 0, count: 1 }));
  const combatParty = party.map(p => ({ ...p, hp: p.currentHP !== undefined ? p.currentHP : (p.hitPoints || 10), maxHp: 0 }));
  const { isOver } = checkWinConditions(combatEnemies, combatParty);
  if (isOver) {
    return {
      updatedParty: party,
      updatedEnemies: enemies,
      log: [{ message: "Combat over: All enemies defeated!", type: 'neutral' }],
      combatResult: null,
      isOver: true
    };
  }

  const roundLog: CombatLogEntry[] = [{ message: `--- Round ${currentRound} ---`, type: 'neutral' }];
  
  // Clear incapacitation status at start of round - handle both CharacterInstance and CombatCharacter
  let updatedParty: CombatCharacterInstance[] = party.map((char): CombatCharacterInstance => {
    const characterInstance = char as CharacterInstance;
    const combatCharacter = char as CombatCharacter;
    
    // Determine which type we're dealing with
    const isCharacterInstance = 'attackSkill' in char && typeof characterInstance.attackSkill === 'string';
    
    if (isCharacterInstance) {
      // Already a CharacterInstance, convert to CombatCharacterInstance
      const hp = characterInstance.currentHP || characterInstance.hitPoints || 10;
      return {
        ...characterInstance,
        incapacitated: false,
        hp: hp,
        maxHp: characterInstance.hitPoints || 10
      };
    } else {
      // Convert CombatCharacter to CombatCharacterInstance
      const hp = combatCharacter.currentHP !== undefined ? combatCharacter.currentHP : combatCharacter.hp || 10;
      return {
        ...combatCharacter,
        incapacitated: false,
        partyId: combatCharacter.name,
        hitPoints: combatCharacter.hitPoints || combatCharacter.hp || 10,
        currentHP: hp,
        hp: hp,
        maxHp: combatCharacter.maxHp || combatCharacter.hitPoints || 10,
        attackScore: 2,
        attackSkill: 'BREAK',
        defenseScore: 2,
        defenseSkill: 'BRACE'
      };
    }
  });
  
  // Convert enemies to instances for combat functions
  const enemyInstances: CombatEnemyInstance[] = enemies.map((enemy, index): CombatEnemyInstance => {
    const enemyInstance = enemy as EnemyInstance;
    const combatEnemy = enemy as CombatEnemy;
    
    // Determine which type we're dealing with
    const isEnemyInstance = 'id' in enemy && typeof enemyInstance.id === 'string';
    
    if (isEnemyInstance) {
      // Already an EnemyInstance, convert to CombatEnemyInstance
      const hp = enemyInstance.currentHP || calculateEnemyTrackLength(enemyInstance);
      return {
        ...enemyInstance,
        instanceId: enemyInstance.id || `${enemy.name}_${index}`,
        uniqueName: enemyInstance.uniqueName || enemy.name,
        currentHP: hp,
        hp: hp,
        maxHp: calculateEnemyTrackLength(enemyInstance),
        count: 1
      };
    } else {
      // Convert CombatEnemy to CombatEnemyInstance
      const hp = combatEnemy.currentHP !== undefined ? combatEnemy.currentHP : combatEnemy.hp || calculateEnemyTrackLength(combatEnemy);
      return {
        ...combatEnemy,
        instanceId: `${enemy.name}_${index}`,
        uniqueName: combatEnemy.count > 1 ? `${enemy.name} ${index + 1}` : enemy.name,
        currentHP: hp,
        hp: hp,
        maxHp: combatEnemy.maxHp || calculateEnemyTrackLength(combatEnemy),
        count: combatEnemy.count || 1
      };
    }
  });
  
  // Player attack phase
  const playerPhase = simulatePlayerAttackPhase(updatedParty, enemyInstances);
  roundLog.push(...playerPhase.log);
  
  // Enemy attack phase
  const enemyPhase = simulateEnemyAttackPhase(playerPhase.updatedEnemies, updatedParty, damageModel, enemyAttacksPerRound, useAbilities, debugMode);
  roundLog.push(...enemyPhase.log);
  
  // Check win/lose conditions
  const winCheck = checkWinConditions(enemyPhase.updatedEnemies, enemyPhase.updatedParty);
  let combatResult: string | null = null;
  
  if (winCheck.isOver) {
    if (winCheck.result === 'win') {
      roundLog.push({ message: "The players win!", type: 'player' });
      combatResult = `The players WON after ${currentRound} rounds`;
    } else {
      roundLog.push({ message: "The players lose!", type: 'enemy' });
      combatResult = `The players LOST after ${currentRound} rounds`;
    }
  }
  
  // Convert back to the expected types for the caller
  const finalParty = enemyPhase.updatedParty.map((char): CharacterInstance | CombatCharacter => {
    if ('attackSkill' in char && typeof char.attackSkill === 'string') {
      // Return as CharacterInstance
      return {
        ...char,
        hitPoints: char.hitPoints || char.hp || 10,
        currentHP: char.currentHP !== undefined ? char.currentHP : char.hp
      };
    } else {
      // Return as CombatCharacter
      return {
        ...char,
        hp: char.currentHP !== undefined ? char.currentHP : char.hp || 10,
        maxHp: char.maxHp || char.hitPoints || 10
      };
    }
  });

  const finalEnemies = enemyPhase.updatedEnemies.map((enemy): EnemyInstance | CombatEnemy => {
    if ('id' in enemy && typeof enemy.id === 'string') {
      // Return as EnemyInstance
      return {
        ...enemy,
        id: enemy.instanceId || enemy.id || `${enemy.name}_0`,
        currentHP: enemy.currentHP !== undefined ? enemy.currentHP : enemy.hp
      };
    } else {
      // Return as CombatEnemy
      return {
        ...enemy,
        hp: enemy.currentHP !== undefined ? enemy.currentHP : enemy.hp || calculateEnemyTrackLength(enemy),
        maxHp: enemy.maxHp || calculateEnemyTrackLength(enemy)
      };
    }
  });

  return {
    updatedParty: finalParty,
    updatedEnemies: finalEnemies,
    log: roundLog,
    combatResult,
    isOver: winCheck.isOver
  };
};
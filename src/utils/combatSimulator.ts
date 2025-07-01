// Combat simulator - orchestrates combat rounds and sessions
import { 
  rollDice, 
  calculateDamage, 
  calculateDefenseDamage, 
  calculateIncapacitateDefense, 
  checkWinConditions 
} from './combatEngine';
import { calculateEnemyTrackLength } from './dataManager';
import type { 
  CombatCharacter, 
  CombatEnemy,
  DiceRoll,
  DefenseResult
} from '../types';

interface CombatLogEntry {
  message: string;
  type: 'player' | 'enemy' | 'neutral';
}

interface PlayerAttackPhaseResult {
  updatedEnemies: CombatEnemy[];
  log: CombatLogEntry[];
}

interface EnemyAttackPhaseResult {
  updatedParty: CombatCharacter[];
  updatedEnemies: CombatEnemy[];
  log: CombatLogEntry[];
}

interface SimulateRoundResult {
  updatedParty: CombatCharacter[];
  updatedEnemies: CombatEnemy[];
  log: CombatLogEntry[];
  combatResult: string | null;
  isOver: boolean;
}

// Extended types for combat instances
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
  const aliveEnemies = enemies.filter(enemy => 
    (enemy.currentHP !== undefined ? enemy.currentHP : calculateEnemyTrackLength(enemy)) > 0
  );
  let aliveParty = party.filter(char => 
    (char.currentHP !== undefined ? char.currentHP : char.hitPoints) > 0
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
        (char.currentHP !== undefined ? char.currentHP : char.hitPoints) > 0
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
        const playerHP = player.currentHP !== undefined ? player.currentHP : player.hitPoints;
        const lowestHP = lowest.currentHP !== undefined ? lowest.currentHP : lowest.hitPoints;
        return playerHP < lowestHP ? player : lowest;
      });
    
      // Check if enemy should use ability instead of attack (once per session)
      const availableAbilities = enemy.aspects?.filter(aspect => 
        aspect.abilityCode && !enemy.usedAbilities?.has(aspect.name)
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
        
        if (debugMode) {
          log.push({
            message: `DEBUG: ${enemy.uniqueName} selected ability "${ability.name}" with abilityCode "${ability.abilityCode}"`,
            type: 'neutral'
          });
        }
        
        // Mark ability as used
        if (!enemy.usedAbilities) {
          enemy.usedAbilities = new Set<string>();
        }
        enemy.usedAbilities.add(ability.name);
        
        // Target defends against ability
        const defenseScore = target.defenseScore || 1;
        const defenseSkill = target.defenseSkill || 'BRACE';
        const defenseRolls = rollDice(defenseScore);
        
        if (ability.abilityCode === 'incapacitate' || ability.abilityCode === 'Incapacitate') {
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
            // Remove all HP
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
            // Mark as incapacitated for next turn
            const charIndex = updatedParty.findIndex(c => c.partyId === target.partyId);
            if (charIndex !== -1) {
              updatedParty[charIndex].incapacitated = true;
              log.push({
                message: `${target.name} is incapacitated and cannot attack next turn!`,
                type: 'enemy'
              });
            }
          } else if (abilityResult.damage > 0) {
            // Apply regular damage
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
              
              // Check if character is defeated
              if (updatedParty[charIndex].currentHP <= 0) {
                log.push({
                  message: `${target.name} was defeated!`,
                  type: 'neutral'
                });
              }
            }
          }
          
          // Handle counter-attack on doubles
          if (abilityResult.counter) {
            log.push({
              message: `${target.name} rolled doubles and gets a free counter-attack!`,
              type: 'player'
            });
            
            const counterAttackScore = target.attackScore || 1;
            const counterAttackSkill = target.attackSkill || 'BREAK';
            const counterRolls = rollDice(counterAttackScore);
            const counterDamage = calculateDamage(counterRolls);
            
            log.push({
              message: `${target.name} counter-attacks ${enemy.uniqueName} with ${counterAttackSkill} and rolled ${counterRolls.join(', ')} (${counterAttackScore} dice)`,
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
                }
              }
            }
          }
        } else if (ability.abilityCode === 'dualWieldBarrage') {
          // Dual Wield Barrage: Attack all players, they defend with advantage
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
          
          for (const partyTarget of aliveParty) {
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
              
              const counterAttackScore = partyTarget.attackScore || 1;
              const counterAttackSkill = partyTarget.attackSkill || 'BREAK';
              const counterRolls = rollDice(counterAttackScore);
              const counterDamage = calculateDamage(counterRolls);
              
              log.push({
                message: `${partyTarget.name} counter-attacks with ${counterAttackSkill} and rolled ${counterRolls.join(', ')} (${counterAttackScore} dice)`,
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
                    message: `${partyTarget.name} does ${counterDamage} damage to ${enemy.uniqueName}`,
                    type: 'player'
                  });
                  
                  if (updatedEnemies[enemyIndex].currentHP <= 0) {
                    log.push({
                      message: `${enemy.uniqueName} was defeated by the counter-attack!`,
                      type: 'neutral'
                    });
                    break; // Enemy is defeated, stop processing barrage
                  }
                }
              }
            }
          }
        } else if (ability.abilityCode === 'highNoonDuel') {
          // High Noon Duel: Target one player, create duel state (simplified for now)
          const attackLabel = enemyAttacksPerRound > 1 ? ` (attack ${attackNum}/${enemyAttacksPerRound})` : '';
          log.push({
            message: `${enemy.uniqueName} uses ${ability.name}${attackLabel} - challenging ${target.name} to a duel!`,
            type: 'enemy'
          });
          
          // For now, treat as a powerful single attack (duel mechanics would require more complex state)
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
          if (defenseResult.counter) {
            log.push({
              message: `${target.name} rolled doubles and gets a free counter-attack in the duel!`,
              type: 'player'
            });
            
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
                  message: `${target.name} does ${counterDamage} damage to ${enemy.uniqueName} in the duel`,
                  type: 'player'
                });
                
                if (updatedEnemies[enemyIndex].currentHP <= 0) {
                  log.push({
                    message: `${enemy.uniqueName} was defeated in the duel!`,
                    type: 'neutral'
                  });
                }
              }
            }
          }
        } else if (ability.abilityCode === 'desertMirage') {
          // Desert Mirage: All player attacks get +1 cut next round (simplified - just affect this attack)
          const attackLabel = enemyAttacksPerRound > 1 ? ` (attack ${attackNum}/${enemyAttacksPerRound})` : '';
          log.push({
            message: `${enemy.uniqueName} uses ${ability.name}${attackLabel} - reality shimmers and distorts!`,
            type: 'enemy'
          });
          
          log.push({
            message: `Shimmering mirages make it harder for players to focus their attacks`,
            type: 'neutral'
          });
          
          // For now, treat as a regular attack (mirage effects would require state tracking)
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
          if (defenseResult.counter) {
            log.push({
              message: `${target.name} rolled doubles and gets a free counter-attack!`,
              type: 'player'
            });
            
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
                }
              }
            }
          }
        } else {
          if (debugMode) {
            log.push({
              message: `DEBUG: ${enemy.uniqueName} ability "${ability.name}" has unknown abilityCode "${ability.abilityCode}" - treating as regular attack`,
              type: 'neutral'
            });
          }
          
          // For unknown ability codes, treat as regular attack for now
          // This ensures enemies still do something rather than nothing
          const attackLabel = enemyAttacksPerRound > 1 ? ` (attack ${attackNum}/${enemyAttacksPerRound})` : '';
          log.push({
            message: `${enemy.uniqueName} uses ${ability.name}${attackLabel}`,
            type: 'enemy'
          });
          
          // Use regular attack mechanics
          const defenseResult = calculateDefenseDamage(defenseRolls, damageModel, target);
          
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
              }
            }
          }
          
          // Handle counter-attack on doubles
          if (defenseResult.counter) {
            log.push({
              message: `${target.name} rolled doubles and gets a free counter-attack!`,
              type: 'player'
            });
            
            const counterAttackScore = target.attackScore || 1;
            const counterAttackSkill = target.attackSkill || 'BREAK';
            const counterRolls = rollDice(counterAttackScore);
            const counterDamage = calculateDamage(counterRolls);
            
            log.push({
              message: `${target.name} counter-attacks ${enemy.uniqueName} with ${counterAttackSkill} and rolled ${counterRolls.join(', ')} (${counterAttackScore} dice)`,
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
                }
              }
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
  party: CombatCharacterInstance[], 
  enemies: CombatEnemyInstance[], 
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
  const { isOver } = checkWinConditions(enemies as CombatEnemy[], party as CombatCharacter[]);
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
  
  // Clear incapacitation status at start of round
  let updatedParty = party.map(char => ({
    ...char,
    incapacitated: false
  }));
  
  // Player attack phase
  const playerPhase = simulatePlayerAttackPhase(updatedParty, enemies);
  roundLog.push(...playerPhase.log);
  
  // Enemy attack phase
  const enemyPhase = simulateEnemyAttackPhase(playerPhase.updatedEnemies, updatedParty, damageModel, enemyAttacksPerRound, useAbilities, debugMode);
  roundLog.push(...enemyPhase.log);
  
  // Check win/lose conditions
  const winCheck = checkWinConditions(enemyPhase.updatedEnemies as CombatEnemy[], enemyPhase.updatedParty as CombatCharacter[]);
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
  
  return {
    updatedParty: enemyPhase.updatedParty,
    updatedEnemies: enemyPhase.updatedEnemies,
    log: roundLog,
    combatResult,
    isOver: winCheck.isOver
  };
};
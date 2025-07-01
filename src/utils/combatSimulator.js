// Combat simulator - orchestrates combat rounds and sessions
import { rollDice, calculateDamage, calculateDefenseDamage, checkWinConditions } from './combatEngine.js';

export const simulatePlayerAttackPhase = (party, enemies) => {
  const log = [];
  let updatedEnemies = [...enemies];
  
  party.forEach(character => {
    const stillAlive = updatedEnemies.filter(enemy => 
      (enemy.currentHP !== undefined ? enemy.currentHP : enemy.trackLength) > 0
    );
    if (stillAlive.length === 0) return; // No more targets
    
    // Target enemy with lowest HP
    const target = stillAlive.reduce((lowest, enemy) => {
      const enemyHP = enemy.currentHP !== undefined ? enemy.currentHP : enemy.trackLength;
      const lowestHP = lowest.currentHP !== undefined ? lowest.currentHP : lowest.trackLength;
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
          : updatedEnemies[enemyIndex].trackLength;
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

export const simulateEnemyAttackPhase = (enemies, party, damageModel = '0,1,2,counter', enemyAttacksPerRound = 1) => {
  const log = [];
  let updatedParty = [...party];
  let updatedEnemies = [...enemies];
  
  // Filter alive enemies and party at start of phase
  const aliveEnemies = enemies.filter(enemy => 
    (enemy.currentHP !== undefined ? enemy.currentHP : enemy.trackLength) > 0
  );
  let aliveParty = party.filter(char => 
    (char.currentHP !== undefined ? char.currentHP : char.hitPoints) > 0
  );
  
  if (aliveEnemies.length === 0 || aliveParty.length === 0) {
    return { updatedParty, updatedEnemies, log };
  }
  
  aliveEnemies.forEach(enemy => {
    // Each enemy makes multiple attacks per round
    for (let attackNum = 1; attackNum <= enemyAttacksPerRound; attackNum++) {
      // Update alive party for each attack (some might have died)
      aliveParty = updatedParty.filter(char => 
        (char.currentHP !== undefined ? char.currentHP : char.hitPoints) > 0
      );
      
      if (aliveParty.length === 0) return; // No more targets
      
      // Target player with lowest HP
      const target = aliveParty.reduce((lowest, player) => {
        const playerHP = player.currentHP !== undefined ? player.currentHP : player.hitPoints;
        const lowestHP = lowest.currentHP !== undefined ? lowest.currentHP : lowest.hitPoints;
        return playerHP < lowestHP ? player : lowest;
      });
    
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
            : updatedParty[charIndex].hitPoints;
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
    if (defenseResult.hasDoubles) {
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
            : updatedEnemies[enemyIndex].trackLength;
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
    } // End of attack loop
  });
  
  return { updatedParty, updatedEnemies, log };
};

export const simulateOneRound = (party, enemies, currentRound, damageModel = '0,1,2,counter', enemyAttacksPerRound = 1) => {
  if (party.length === 0 || enemies.length === 0) {
    return {
      updatedParty: party,
      updatedEnemies: enemies,
      log: [{ message: "Cannot simulate: missing party or encounter", type: 'neutral' }],
      combatResult: null
    };
  }

  // Check if combat is already over
  const { isOver } = checkWinConditions(enemies, party);
  if (isOver) {
    return {
      updatedParty: party,
      updatedEnemies: enemies,
      log: [{ message: "Combat over: All enemies defeated!", type: 'neutral' }],
      combatResult: null
    };
  }

  const roundLog = [{ message: `--- Round ${currentRound} ---`, type: 'neutral' }];
  
  // Player attack phase
  const playerPhase = simulatePlayerAttackPhase(party, enemies);
  roundLog.push(...playerPhase.log);
  
  // Enemy attack phase
  const enemyPhase = simulateEnemyAttackPhase(playerPhase.updatedEnemies, party, damageModel, enemyAttacksPerRound);
  roundLog.push(...enemyPhase.log);
  
  // Check win/lose conditions
  const winCheck = checkWinConditions(enemyPhase.updatedEnemies, enemyPhase.updatedParty);
  let combatResult = null;
  
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
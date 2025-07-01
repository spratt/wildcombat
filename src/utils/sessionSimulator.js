// Session simulator - handles full session simulation with timeout protection
import { simulateOneRound } from './combatSimulator.js';
import { checkWinConditions } from './combatEngine.js';

export const simulateFullSession = (party, enemies, startingRound = 1, damageModel = '0,1,2,counter', enemyAttacksPerRound = 1) => {
  const startTime = Date.now();
  const timeout = 1000; // 1 second timeout
  const maxRounds = 100; // Additional safeguard

  let currentParty = [...party];
  let currentEnemies = [...enemies];
  let currentRoundNum = startingRound;
  let sessionLog = [];
  let combatResult = null;
  let timeoutOccurred = false;

  while (true) {
    // Check timeout
    if (Date.now() - startTime > timeout) {
      sessionLog.push("Session simulation timed out after 1 second");
      timeoutOccurred = true;
      break;
    }
    
    // Check max rounds safeguard
    if (currentRoundNum - startingRound >= maxRounds) {
      sessionLog.push(`Session simulation stopped after ${maxRounds} rounds to prevent infinite loop`);
      break;
    }
    
    // Check if combat is already over
    const preRoundCheck = checkWinConditions(currentEnemies, currentParty);
    if (preRoundCheck.isOver) {
      if (preRoundCheck.result === 'win') {
        combatResult = `The players WON after ${currentRoundNum - 1} rounds`;
      } else {
        combatResult = `The players LOST after ${currentRoundNum - 1} rounds`;
      }
      break;
    }

    // Simulate one round using the utility function
    const roundResult = simulateOneRound(currentParty, currentEnemies, currentRoundNum, damageModel, enemyAttacksPerRound);
    
    // Add round log to session log
    sessionLog.push(...roundResult.log);
    
    // Update state
    currentParty = roundResult.updatedParty;
    currentEnemies = roundResult.updatedEnemies;
    
    // Check if combat ended this round
    if (roundResult.isOver) {
      combatResult = roundResult.combatResult;
      break;
    }
    
    // Move to next round
    currentRoundNum++;
  }

  return {
    finalParty: currentParty,
    finalEnemies: currentEnemies,
    finalRound: currentRoundNum,
    sessionLog,
    combatResult,
    timeoutOccurred
  };
};
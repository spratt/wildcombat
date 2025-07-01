// Session simulator - handles full session simulation with timeout protection
import { simulateOneRound } from './combatSimulator';
import { checkWinConditions } from './combatEngine';
import type { CombatCharacter, CombatEnemy } from '../types';

interface CombatLogEntry {
  message: string;
  type: 'player' | 'enemy' | 'neutral';
}

interface FullSessionResult {
  finalParty: CombatCharacter[];
  finalEnemies: CombatEnemy[];
  finalRound: number;
  sessionLog: CombatLogEntry[];
  combatResult: string | null;
  timeoutOccurred: boolean;
}

export const simulateFullSession = (
  party: CombatCharacter[], 
  enemies: CombatEnemy[], 
  startingRound: number = 1, 
  damageModel: string = '0,1,2,counter', 
  enemyAttacksPerRound: number = 1, 
  useAbilities: boolean = true,
  debugMode: boolean = false
): FullSessionResult => {
  const startTime = Date.now();
  const timeout = 1000; // 1 second timeout
  const maxRounds = 100; // Additional safeguard

  let currentParty = [...party];
  let currentEnemies = [...enemies];
  let currentRoundNum = startingRound;
  let sessionLog: CombatLogEntry[] = [];
  let combatResult: string | null = null;
  let timeoutOccurred = false;

  while (true) {
    // Check timeout
    if (Date.now() - startTime > timeout) {
      sessionLog.push({
        message: "Session simulation timed out after 1 second",
        type: 'neutral'
      });
      timeoutOccurred = true;
      break;
    }
    
    // Check max rounds safeguard
    if (currentRoundNum - startingRound >= maxRounds) {
      sessionLog.push({
        message: `Session simulation stopped after ${maxRounds} rounds to prevent infinite loop`,
        type: 'neutral'
      });
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
    const roundResult = simulateOneRound(
      currentParty as CombatCharacter[], // Type coercion needed for extended combat types
      currentEnemies as CombatEnemy[], 
      currentRoundNum, 
      damageModel, 
      enemyAttacksPerRound, 
      useAbilities,
      debugMode
    );
    
    // Add round log to session log
    sessionLog.push(...roundResult.log);
    
    // Update state
    currentParty = roundResult.updatedParty as CombatCharacter[];
    currentEnemies = roundResult.updatedEnemies as CombatEnemy[];
    
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
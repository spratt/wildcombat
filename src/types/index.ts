// Character types
export interface Character {
  name: string;
  portrait?: string;
  background: string | { bloodline?: string; origin?: string; post?: string; notes?: string };
  bloodline?: string;
  origin?: string;
  post?: string;
  edges: string[] | Record<string, boolean>;
  skills: Record<string, number[]>;
  languages: Record<string, number[]>;
  drives: string | Drive[];
  mires: Mire[];
  charts?: string[];
  cargo?: string[];
  specimens?: string[];
  whispers?: string[];
  aspects: Aspect[];
  temporaryTracks?: TemporaryTrack[];
  milestones?: Milestone[];
  major?: number;
  minor?: number;
}

export interface Drive {
  name: string;
  description?: string;
}

export interface Mire {
  name: string;
  mark: 0 | 1;
  description?: string;
}

export interface Aspect {
  type: 'trait' | 'gear' | 'companion' | 'condition';
  name: string;
  description?: string;
  tags?: string[];
  qualities?: string[];
  value: number[];
  ability?: string;
  abilityMire?: string;
}

export interface TemporaryTrack {
  name: string;
  length: number;
  value: number[];
}

export interface Milestone {
  type: 'major' | 'minor';
  description: string;
}

// Enemy types
export interface Enemy {
  name: string;
  description?: string;
  aspects: EnemyAspect[];
  drives?: (string | { name: string; description?: string })[];
  quirks?: (string | { name: string; description?: string })[];
  presence?: number | Record<string, string>;
}

export interface EnemyAspect {
  name: string;
  trackLength: number;
  ability?: string;
  abilityCode?: 'Incapacitate' | 'dualWieldBarrage' | 'highNoonDuel' | 'desertMirage';
}

// Combat types
export interface CombatCharacter extends Character {
  hp: number;
  maxHp: number;
  incapacitated?: boolean;
}

export interface CombatEnemy extends Enemy {
  hp: number;
  maxHp: number;
  count: number;
  usedAbilities?: Set<string>;
}

export interface DamageModel {
  id: string;
  name: string;
  description: string;
}

export interface CombatResult {
  round: number;
  messages: string[];
  winner: 'party' | 'enemies' | null;
}

export interface SessionResult {
  winner: 'party' | 'enemies';
  rounds: number;
  remainingPartyHp: number;
  remainingEnemyHp: number;
}

export interface SessionStatistics {
  totalSessions: number;
  partyWins: number;
  enemyWins: number;
  averageRounds: number;
  averagePartyHpOnWin: number;
  averageEnemyHpOnWin: number;
}

// State types
export interface PartyState {
  party: Character[];
  lastCharacter: string | null;
}

export interface EncounterState {
  enemies: CombatEnemy[];
}

// Utility types
export type DiceRoll = number[];
export type AttackResult = {
  attacker: string;
  target: string;
  damage: number;
  message: string;
};

export type DefenseResult = {
  damage: number;
  counter: boolean;
  incapacitated?: boolean;
  fullIncapacitation?: boolean;
};
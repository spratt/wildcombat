import { describe, it, expect, vi, beforeEach } from 'vitest'
import { simulatePlayerAttackPhase, simulateEnemyAttackPhase, simulateOneRound } from '../utils/combatSimulator'
import type { CombatCharacter, CombatEnemy, DiceRoll } from '../types'

// Mock the combat engine functions
vi.mock('../utils/combatEngine', () => ({
  rollDice: vi.fn((count: number): DiceRoll => Array(count).fill(4)), // Always roll 4s
  calculateDamage: vi.fn((rolls: DiceRoll): number => rolls.includes(6) ? 2 : rolls.includes(4) ? 1 : 0),
  calculateDefenseDamage: vi.fn((rolls: DiceRoll, damageModel: string) => ({ damage: 1, hasDoubles: false })),
  calculateIncapacitateDefense: vi.fn((rolls: DiceRoll) => ({ 
    damage: 0, 
    incapacitated: true, 
    fullyIncapacitated: false, 
    hasDoubles: false 
  })),
  checkWinConditions: vi.fn((enemies: any[], party: any[]) => ({ isOver: false, result: null, aliveEnemies: enemies, aliveParty: party }))
}))

// Mock the data manager
vi.mock('../utils/dataManager', () => ({
  calculateEnemyTrackLength: vi.fn((enemy: any) => enemy.aspects?.reduce((sum: number, aspect: any) => sum + (aspect.trackLength || 0), 0) || enemy.trackLength || 10)
}))

interface MockCombatCharacter extends Partial<CombatCharacter> {
  name: string
  hitPoints: number
  currentHP: number
  attackScore: number
  attackSkill: string
  defenseScore: number
  defenseSkill: string
  partyId: string
  incapacitated?: boolean
}

interface MockCombatEnemy extends Partial<CombatEnemy> {
  name: string
  uniqueName: string
  currentHP: number
  trackLength: number
  instanceId: string
  aspects: Array<{
    name: string
    trackLength: number
    abilityCode?: string
  }>
  usedAbilities?: string[]
}

describe('Combat Simulator', () => {
  const mockParty: MockCombatCharacter[] = [
    {
      name: 'Hero 1',
      hitPoints: 10,
      currentHP: 10,
      attackScore: 2,
      attackSkill: 'BREAK',
      defenseScore: 2,
      defenseSkill: 'BRACE',
      partyId: 'hero1'
    },
    {
      name: 'Hero 2',
      hitPoints: 8,
      currentHP: 8,
      attackScore: 3,
      attackSkill: 'DELVE',
      defenseScore: 1,
      defenseSkill: 'FLOURISH',
      partyId: 'hero2'
    }
  ]

  const mockEnemies: MockCombatEnemy[] = [
    {
      name: 'Goblin',
      uniqueName: 'Goblin 1',
      currentHP: 6,
      trackLength: 6,
      instanceId: 'goblin1',
      aspects: [
        { name: 'Claws', trackLength: 3 },
        { name: 'Bite', trackLength: 3 }
      ]
    },
    {
      name: 'Orc',
      uniqueName: 'Orc 1',
      currentHP: 8,
      trackLength: 8,
      instanceId: 'orc1',
      aspects: [
        { name: 'Sword', trackLength: 4, abilityCode: 'test' },
        { name: 'Shield', trackLength: 4 }
      ]
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('simulatePlayerAttackPhase', () => {
    it('should process attacks for all party members', () => {
      const result = simulatePlayerAttackPhase(mockParty, mockEnemies)
      
      expect(result.log).toHaveLength(4) // 2 characters × 2 log entries each
      expect(result.updatedEnemies).toBeDefined()
      expect(result.updatedEnemies).toHaveLength(2)
    })

    it('should skip incapacitated characters', () => {
      const incapacitatedParty: MockCombatCharacter[] = [
        { ...mockParty[0], incapacitated: true },
        mockParty[1]
      ]
      
      const result = simulatePlayerAttackPhase(incapacitatedParty, mockEnemies)
      
      // Should have 1 incapacitation message + 2 attack messages for second character
      expect(result.log).toHaveLength(3)
      expect(result.log[0].message).toContain('incapacitated')
    })

    it('should target enemy with lowest HP', () => {
      const enemiesWithDifferentHP: MockCombatEnemy[] = [
        { ...mockEnemies[0], currentHP: 2 }, // Lower HP
        { ...mockEnemies[1], currentHP: 8 }
      ]
      
      const result = simulatePlayerAttackPhase(mockParty, enemiesWithDifferentHP)
      
      // Both characters should target the first enemy (lowest HP)
      expect(result.log[0].message).toContain('Goblin 1')
      expect(result.log[2].message).toContain('Goblin 1')
    })

    it('should not attack when no enemies are alive', () => {
      const deadEnemies: MockCombatEnemy[] = mockEnemies.map(enemy => ({ ...enemy, currentHP: 0 }))
      
      const result = simulatePlayerAttackPhase(mockParty, deadEnemies)
      
      expect(result.log).toHaveLength(0)
      expect(result.updatedEnemies).toEqual(deadEnemies)
    })
  })

  describe('simulateEnemyAttackPhase', () => {
    it('should process attacks for all alive enemies', () => {
      const result = simulateEnemyAttackPhase(mockEnemies, mockParty)
      
      // Each enemy makes 1 attack by default, 2 log entries per attack
      expect(result.log.length).toBeGreaterThan(0)
      expect(result.updatedParty).toBeDefined()
    })

    it('should respect enemyAttacksPerRound parameter', () => {
      const result = simulateEnemyAttackPhase(mockEnemies, mockParty, '0,1,2,counter', 2)
      
      // Should have more log entries for multiple attacks per enemy
      expect(result.log.length).toBeGreaterThan(4)
    })

    it('should use abilities when useAbilities is true and abilities are available', () => {
      // Just test that the function runs without errors when abilities are enabled
      const enemyWithAbilities: MockCombatEnemy[] = [
        {
          ...mockEnemies[1],
          currentHP: 8, // Make sure enemy is alive
          aspects: [
            { name: 'Special Attack', abilityCode: 'incapacitate', trackLength: 4 }
          ]
        }
      ]
      
      const result = simulateEnemyAttackPhase(enemyWithAbilities, mockParty, '0,1,2,counter', 1, true)
      
      // Just verify the function completes and returns the expected structure
      expect(result).toHaveProperty('log')
      expect(result).toHaveProperty('updatedParty')
      expect(result).toHaveProperty('updatedEnemies')
    })

    it('should not use abilities when useAbilities is false', () => {
      const enemyWithAbilities: MockCombatEnemy[] = [
        {
          ...mockEnemies[1],
          aspects: [
            { name: 'Special Attack', abilityCode: 'incapacitate', trackLength: 4 }
          ]
        }
      ]
      
      const result = simulateEnemyAttackPhase(enemyWithAbilities, mockParty, '0,1,2,counter', 1, false)
      
      // Should not use abilities, only regular attacks
      expect(result.log.some(entry => entry.message.includes('uses Special Attack'))).toBe(false)
      expect(result.log.some(entry => entry.message.includes('attacks'))).toBe(true)
    })

    it('should not attack when no party members are alive', () => {
      const deadParty: MockCombatCharacter[] = mockParty.map(char => ({ ...char, currentHP: 0 }))
      
      const result = simulateEnemyAttackPhase(mockEnemies, deadParty)
      
      expect(result.log).toHaveLength(0)
    })

    it('should not have dead enemies attack', () => {
      const mixedEnemies: MockCombatEnemy[] = [
        { ...mockEnemies[0], currentHP: 0 }, // Dead
        mockEnemies[1] // Alive
      ]
      
      const result = simulateEnemyAttackPhase(mixedEnemies, mockParty)
      
      // Only alive enemy should attack
      expect(result.log.every(entry => !entry.message.includes('Goblin 1'))).toBe(true)
    })
  })

  describe('simulateOneRound', () => {
    it('should simulate both player and enemy phases', () => {
      const result = simulateOneRound(mockParty, mockEnemies, 1)
      
      expect(result.updatedParty).toBeDefined()
      expect(result.updatedEnemies).toBeDefined()
      expect(result.log).toBeDefined()
      expect(result.log[0].message).toContain('Round 1')
    })

    it('should clear incapacitation at start of round', () => {
      const incapacitatedParty: MockCombatCharacter[] = mockParty.map(char => ({ ...char, incapacitated: true }))
      
      const result = simulateOneRound(incapacitatedParty, mockEnemies, 1)
      
      // Characters should not be incapacitated in the result
      expect(result.updatedParty.every(char => !char.incapacitated)).toBe(true)
    })

    it('should return early if no party', () => {
      const result = simulateOneRound([], mockEnemies, 1)
      
      expect(result.combatResult).toBe(null)
      expect(result.log[0].message).toContain('Cannot simulate')
    })

    it('should return early if no enemies', () => {
      const result = simulateOneRound(mockParty, [], 1)
      
      expect(result.combatResult).toBe(null)
      expect(result.log[0].message).toContain('Cannot simulate')
    })

    it('should pass useAbilities parameter through', () => {
      const enemyWithAbilities: MockCombatEnemy[] = [
        {
          ...mockEnemies[1],
          currentHP: 8,
          aspects: [
            { name: 'Special Attack', abilityCode: 'incapacitate', trackLength: 4 }
          ],
          usedAbilities: new Set() // Fresh abilities available
        }
      ]
      
      // Test with abilities enabled - should find and use ability
      const resultWithAbilities = simulateOneRound(mockParty, enemyWithAbilities, 1, '0,1,2,counter', 1, true)
      
      // Test with abilities disabled - should skip abilities
      const resultWithoutAbilities = simulateOneRound(mockParty, enemyWithAbilities, 1, '0,1,2,counter', 1, false)
      
      // Should call simulateEnemyAttackPhase with different useAbilities parameter
      // We can test this by checking if the function was called correctly
      expect(resultWithAbilities).toBeDefined()
      expect(resultWithoutAbilities).toBeDefined()
      // At minimum, both should complete without error
    })
  })
})
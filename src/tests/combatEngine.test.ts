import { describe, it, expect, vi } from 'vitest'
import { 
  rollDice, 
  calculateDamage, 
  calculateDefenseDamage, 
  calculateIncapacitateDefense,
  checkWinConditions 
} from '../utils/combatEngine'
import type { CombatCharacter, CombatEnemy, DiceRoll } from '../types'

describe('Combat Engine', () => {
  describe('rollDice', () => {
    it('should return correct number of dice', () => {
      const result: DiceRoll = rollDice(3)
      expect(result).toHaveLength(3)
    })

    it('should return dice values between 1 and 6', () => {
      const result: DiceRoll = rollDice(10)
      result.forEach((die: number) => {
        expect(die).toBeGreaterThanOrEqual(1)
        expect(die).toBeLessThanOrEqual(6)
      })
    })

    it('should return empty array for 0 dice', () => {
      const result: DiceRoll = rollDice(0)
      expect(result).toEqual([])
    })

    it('should apply cut parameter correctly', () => {
      // Mock Math.random to return predictable results
      const spy = vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.83) // 0.83*6=4.98, floor=4, +1=5
        .mockReturnValueOnce(0.33) // 0.33*6=1.98, floor=1, +1=2
        .mockReturnValueOnce(0.66) // 0.66*6=3.96, floor=3, +1=4
        .mockReturnValueOnce(0.16) // 0.16*6=0.96, floor=0, +1=1

      const result = rollDice(4, 2) // Roll 4 dice, cut 2 highest
      // Original rolls would be [5, 2, 4, 1], after cutting 2 highest: [2, 1]
      expect(result).toHaveLength(2)
      expect(result).toContain(2)
      expect(result).toContain(1)
      expect(result).not.toContain(5)
      expect(result).not.toContain(4)

      spy.mockRestore()
    })

    it('should never cut all dice (always keep at least one)', () => {
      const spy = vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.83) // 0.83*6=4.98, floor=4, +1=5
        .mockReturnValueOnce(0.33) // 0.33*6=1.98, floor=1, +1=2

      const result = rollDice(2, 5) // Try to cut 5 dice from 2 dice
      expect(result).toHaveLength(1) // Should keep 1 die (the lowest)
      expect(result).toEqual([2]) // Should keep the lowest die

      spy.mockRestore()
    })

    it('should not modify dice when cut is 0', () => {
      const spy = vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.83) // 0.83*6=4.98, floor=4, +1=5
        .mockReturnValueOnce(0.33) // 0.33*6=1.98, floor=1, +1=2

      const result = rollDice(2, 0)
      expect(result).toHaveLength(2)
      expect(result).toContain(5)
      expect(result).toContain(2)

      spy.mockRestore()
    })

    it('should not modify single die when cut > 0', () => {
      const result = rollDice(1, 2) // Try to cut from 1 die
      expect(result).toHaveLength(1) // Should keep the single die
    })

    it('should add advantage dice correctly', () => {
      const spy = vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.83) // 0.83*6=4.98, floor=4, +1=5
        .mockReturnValueOnce(0.33) // 0.33*6=1.98, floor=1, +1=2
        .mockReturnValueOnce(0.66) // 0.66*6=3.96, floor=3, +1=4

      const result = rollDice(2, 0, 1) // Roll 2 base dice + 1 advantage = 3 total dice
      expect(result).toHaveLength(3)
      expect(result).toContain(5)
      expect(result).toContain(2)
      expect(result).toContain(4)

      spy.mockRestore()
    })

    it('should combine advantage and cut correctly', () => {
      const spy = vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.83) // 0.83*6=4.98, floor=4, +1=5
        .mockReturnValueOnce(0.33) // 0.33*6=1.98, floor=1, +1=2
        .mockReturnValueOnce(0.66) // 0.66*6=3.96, floor=3, +1=4
        .mockReturnValueOnce(0.16) // 0.16*6=0.96, floor=0, +1=1

      const result = rollDice(2, 1, 2) // Roll 2 base + 2 advantage = 4 total, cut 1 highest
      // Total rolls: [5, 2, 4, 1], after cutting 1 highest: [2, 4, 1]
      expect(result).toHaveLength(3)
      expect(result).toContain(2)
      expect(result).toContain(4)
      expect(result).toContain(1)
      expect(result).not.toContain(5)

      spy.mockRestore()
    })

    it('should work with zero advantage (default behavior)', () => {
      const spy = vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.83) // 0.83*6=4.98, floor=4, +1=5
        .mockReturnValueOnce(0.33) // 0.33*6=1.98, floor=1, +1=2

      const result = rollDice(2, 0, 0) // Explicit 0 advantage
      expect(result).toHaveLength(2)
      expect(result).toContain(5)
      expect(result).toContain(2)

      spy.mockRestore()
    })

    it('should handle advantage with single base die', () => {
      const spy = vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.83) // 0.83*6=4.98, floor=4, +1=5
        .mockReturnValueOnce(0.33) // 0.33*6=1.98, floor=1, +1=2

      const result = rollDice(1, 0, 1) // 1 base die + 1 advantage = 2 total
      expect(result).toHaveLength(2)
      expect(result).toContain(5)
      expect(result).toContain(2)

      spy.mockRestore()
    })
  })

  describe('calculateDamage', () => {
    it('should return 0 for empty rolls', () => {
      expect(calculateDamage([])).toBe(0)
    })

    it('should return 2 damage for highest roll of 6', () => {
      expect(calculateDamage([6])).toBe(2)
      expect(calculateDamage([3, 6, 2])).toBe(2)
    })

    it('should return 1 damage for highest roll of 4-5', () => {
      expect(calculateDamage([4])).toBe(1)
      expect(calculateDamage([5])).toBe(1)
      expect(calculateDamage([3, 4, 2])).toBe(1)
    })

    it('should return 0 damage for highest roll of 1-3', () => {
      expect(calculateDamage([1])).toBe(0)
      expect(calculateDamage([2])).toBe(0)
      expect(calculateDamage([3])).toBe(0)
      expect(calculateDamage([1, 2, 3])).toBe(0)
    })

    it('should add 1 bonus damage for doubles', () => {
      expect(calculateDamage([6, 6])).toBe(3) // 2 base + 1 doubles
      expect(calculateDamage([4, 4])).toBe(2) // 1 base + 1 doubles
      expect(calculateDamage([2, 2])).toBe(1) // 0 base + 1 doubles
      expect(calculateDamage([3, 3, 6])).toBe(3) // 2 base + 1 doubles
    })

    it('should not add doubles bonus for no pairs', () => {
      expect(calculateDamage([1, 2, 3, 4])).toBe(1) // highest is 4
      expect(calculateDamage([1, 2, 6])).toBe(2) // highest is 6
    })
  })

  describe('calculateDefenseDamage', () => {
    const mockCharacter: CombatCharacter = {
      name: 'Test Character',
      background: 'Test Background',
      edges: [],
      skills: {},
      languages: {},
      drives: [],
      mires: [],
      aspects: [
        { type: 'trait', name: 'Aspect 1', value: [0, 0, 0] }, // length 3
        { type: 'trait', name: 'Aspect 2', value: [0, 0, 0, 0, 0] }, // length 5
        { type: 'trait', name: 'Aspect 3', value: [0, 0] } // length 2
      ],
      hp: 10,
      maxHp: 10
    }

    describe('0,1,2,counter model', () => {
      it('should return 0 damage for roll of 6', () => {
        const result = calculateDefenseDamage([6], '0,1,2,counter')
        expect(result.damage).toBe(0)
        expect(result.counter).toBe(false)
      })

      it('should return 1 damage for rolls of 4-5', () => {
        expect(calculateDefenseDamage([4], '0,1,2,counter').damage).toBe(1)
        expect(calculateDefenseDamage([5], '0,1,2,counter').damage).toBe(1)
      })

      it('should return 2 damage for rolls of 1-3', () => {
        expect(calculateDefenseDamage([1], '0,1,2,counter').damage).toBe(2)
        expect(calculateDefenseDamage([2], '0,1,2,counter').damage).toBe(2)
        expect(calculateDefenseDamage([3], '0,1,2,counter').damage).toBe(2)
      })

      it('should detect doubles', () => {
        const result = calculateDefenseDamage([4, 4], '0,1,2,counter')
        expect(result.counter).toBe(true)
      })
    })

    describe('1,2,aspect,counter model', () => {
      it('should return 1 damage for roll of 6', () => {
        const result = calculateDefenseDamage([6], '1,2,aspect,counter', mockCharacter)
        expect(result.damage).toBe(1)
      })

      it('should return 2 damage for rolls of 4-5', () => {
        expect(calculateDefenseDamage([4], '1,2,aspect,counter', mockCharacter).damage).toBe(2)
        expect(calculateDefenseDamage([5], '1,2,aspect,counter', mockCharacter).damage).toBe(2)
      })

      it('should return longest aspect track length for rolls of 1-3', () => {
        const result = calculateDefenseDamage([1], '1,2,aspect,counter', mockCharacter)
        expect(result.damage).toBe(5) // longest track is 5
      })
    })

    describe('1,aspect,2aspect,counter model', () => {
      it('should return 1 damage for roll of 6', () => {
        const result = calculateDefenseDamage([6], '1,aspect,2aspect,counter', mockCharacter)
        expect(result.damage).toBe(1)
      })

      it('should return longest aspect track length for rolls of 4-5', () => {
        const result = calculateDefenseDamage([4], '1,aspect,2aspect,counter', mockCharacter)
        expect(result.damage).toBe(5) // longest track is 5
      })

      it('should return 2x longest aspect track length for rolls of 1-3', () => {
        const result = calculateDefenseDamage([1], '1,aspect,2aspect,counter', mockCharacter)
        expect(result.damage).toBe(10) // 2 * 5
      })
    })
  })

  describe('calculateIncapacitateDefense', () => {
    const mockTarget: Partial<CombatCharacter> = {
      name: 'Test Character',
      hp: 5,
      maxHp: 10
    }

    it('should return 1 damage for roll of 6', () => {
      const result = calculateIncapacitateDefense([6], mockTarget as CombatCharacter)
      expect(result.damage).toBe(1)
      expect(result.incapacitated).toBeUndefined()
      expect(result.fullIncapacitation).toBeUndefined()
    })

    it('should incapacitate for rolls of 4-5', () => {
      const result4 = calculateIncapacitateDefense([4], mockTarget as CombatCharacter)
      expect(result4.damage).toBe(0)
      expect(result4.incapacitated).toBe(true)
      expect(result4.fullIncapacitation).toBeUndefined()

      const result5 = calculateIncapacitateDefense([5], mockTarget as CombatCharacter)
      expect(result5.damage).toBe(0)
      expect(result5.incapacitated).toBe(true)
      expect(result5.fullIncapacitation).toBeUndefined()
    })

    it('should fully incapacitate for rolls of 1-3', () => {
      const result1 = calculateIncapacitateDefense([1], mockTarget as CombatCharacter)
      expect(result1.damage).toBe(0)
      expect(result1.incapacitated).toBeUndefined()
      expect(result1.fullIncapacitation).toBe(true)

      const result3 = calculateIncapacitateDefense([3], mockTarget as CombatCharacter)
      expect(result3.damage).toBe(0)
      expect(result3.incapacitated).toBeUndefined()
      expect(result3.fullIncapacitation).toBe(true)
    })

    it('should detect doubles', () => {
      const result = calculateIncapacitateDefense([4, 4], mockTarget as CombatCharacter)
      expect(result.counter).toBe(true)
    })
  })

  describe('checkWinConditions', () => {
    const mockParty: CombatCharacter[] = [
      { 
        name: 'Hero 1', 
        background: 'Test', 
        edges: [], 
        skills: {}, 
        languages: {}, 
        drives: [], 
        mires: [], 
        aspects: [], 
        currentHP: 5, 
        hitPoints: 10, 
        hp: 5, 
        maxHp: 10 
      },
      { 
        name: 'Hero 2', 
        background: 'Test', 
        edges: [], 
        skills: {}, 
        languages: {}, 
        drives: [], 
        mires: [], 
        aspects: [], 
        currentHP: 3, 
        hitPoints: 8, 
        hp: 3, 
        maxHp: 8 
      }
    ]

    const mockEnemies: CombatEnemy[] = [
      { 
        name: 'Enemy 1', 
        aspects: [{ name: 'Track', trackLength: 6 }], 
        currentHP: 4, 
        hp: 4, 
        maxHp: 6, 
        count: 1 
      },
      { 
        name: 'Enemy 2', 
        aspects: [{ name: 'Track', trackLength: 5 }], 
        currentHP: 0, 
        hp: 0, 
        maxHp: 5, 
        count: 1 
      }
    ]

    it('should return win when all enemies are defeated', () => {
      const defeatedEnemies: CombatEnemy[] = [
        { 
          name: 'Enemy 1', 
          aspects: [{ name: 'Track', trackLength: 6 }], 
          currentHP: 0, 
          hp: 0, 
          maxHp: 6, 
          count: 1 
        },
        { 
          name: 'Enemy 2', 
          aspects: [{ name: 'Track', trackLength: 5 }], 
          currentHP: 0, 
          hp: 0, 
          maxHp: 5, 
          count: 1 
        }
      ]
      
      const result = checkWinConditions(defeatedEnemies, mockParty)
      expect(result.isOver).toBe(true)
      expect(result.result).toBe('win')
    })

    it('should return lose when all party members are defeated', () => {
      const defeatedParty: CombatCharacter[] = [
        { 
          name: 'Hero 1', 
          background: 'Test', 
          edges: [], 
          skills: {}, 
          languages: {}, 
          drives: [], 
          mires: [], 
          aspects: [], 
          currentHP: 0, 
          hitPoints: 10, 
          hp: 0, 
          maxHp: 10 
        },
        { 
          name: 'Hero 2', 
          background: 'Test', 
          edges: [], 
          skills: {}, 
          languages: {}, 
          drives: [], 
          mires: [], 
          aspects: [], 
          currentHP: 0, 
          hitPoints: 8, 
          hp: 0, 
          maxHp: 8 
        }
      ]
      
      const result = checkWinConditions(mockEnemies, defeatedParty)
      expect(result.isOver).toBe(true)
      expect(result.result).toBe('lose')
    })

    it('should return ongoing when both sides have survivors', () => {
      const result = checkWinConditions(mockEnemies, mockParty)
      expect(result.isOver).toBe(false)
      expect(result.result).toBe(null)
    })

    it('should handle enemies without currentHP (using hp/maxHp)', () => {
      const enemiesWithoutCurrentHP: CombatEnemy[] = [
        { 
          name: 'Enemy 1', 
          aspects: [{ name: 'Track', trackLength: 6 }], 
          hp: 6, 
          maxHp: 6, 
          count: 1 
        }, // alive
        { 
          name: 'Enemy 2', 
          aspects: [{ name: 'Track', trackLength: 5 }], 
          currentHP: 0, 
          hp: 0, 
          maxHp: 5, 
          count: 1 
        } // dead
      ]
      
      const result = checkWinConditions(enemiesWithoutCurrentHP, mockParty)
      expect(result.isOver).toBe(false)
    })

    it('should handle party without currentHP (using hitPoints)', () => {
      const partyWithoutCurrentHP: CombatCharacter[] = [
        { 
          name: 'Hero 1', 
          background: 'Test', 
          edges: [], 
          skills: {}, 
          languages: {}, 
          drives: [], 
          mires: [], 
          aspects: [], 
          hitPoints: 10, 
          hp: 10, 
          maxHp: 10 
        }, // alive
        { 
          name: 'Hero 2', 
          background: 'Test', 
          edges: [], 
          skills: {}, 
          languages: {}, 
          drives: [], 
          mires: [], 
          aspects: [], 
          hitPoints: 8, 
          hp: 8, 
          maxHp: 8 
        } // alive
      ]
      
      const result = checkWinConditions(mockEnemies, partyWithoutCurrentHP)
      expect(result.isOver).toBe(false)
    })
  })
})
import { describe, it, expect, vi } from 'vitest'
import { 
  rollDice, 
  calculateDamage, 
  calculateDefenseDamage, 
  calculateIncapacitateDefense,
  checkWinConditions 
} from '../utils/combatEngine.js'

describe('Combat Engine', () => {
  describe('rollDice', () => {
    it('should return correct number of dice', () => {
      const result = rollDice(3)
      expect(result).toHaveLength(3)
    })

    it('should return dice values between 1 and 6', () => {
      const result = rollDice(10)
      result.forEach(die => {
        expect(die).toBeGreaterThanOrEqual(1)
        expect(die).toBeLessThanOrEqual(6)
      })
    })

    it('should return empty array for 0 dice', () => {
      const result = rollDice(0)
      expect(result).toEqual([])
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
    const mockCharacter = {
      aspects: [
        { value: [0, 0, 0] }, // length 3
        { value: [0, 0, 0, 0, 0] }, // length 5
        { value: [0, 0] } // length 2
      ]
    }

    describe('0,1,2,counter model', () => {
      it('should return 0 damage for roll of 6', () => {
        const result = calculateDefenseDamage([6], '0,1,2,counter')
        expect(result.damage).toBe(0)
        expect(result.hasDoubles).toBe(false)
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
        expect(result.hasDoubles).toBe(true)
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
    it('should return 1 damage for roll of 6', () => {
      const result = calculateIncapacitateDefense([6])
      expect(result.damage).toBe(1)
      expect(result.incapacitated).toBe(false)
      expect(result.fullyIncapacitated).toBe(false)
    })

    it('should incapacitate for rolls of 4-5', () => {
      const result4 = calculateIncapacitateDefense([4])
      expect(result4.damage).toBe(0)
      expect(result4.incapacitated).toBe(true)
      expect(result4.fullyIncapacitated).toBe(false)

      const result5 = calculateIncapacitateDefense([5])
      expect(result5.damage).toBe(0)
      expect(result5.incapacitated).toBe(true)
      expect(result5.fullyIncapacitated).toBe(false)
    })

    it('should fully incapacitate for rolls of 1-3', () => {
      const result1 = calculateIncapacitateDefense([1])
      expect(result1.damage).toBe(0)
      expect(result1.incapacitated).toBe(false)
      expect(result1.fullyIncapacitated).toBe(true)

      const result3 = calculateIncapacitateDefense([3])
      expect(result3.damage).toBe(0)
      expect(result3.incapacitated).toBe(false)
      expect(result3.fullyIncapacitated).toBe(true)
    })

    it('should detect doubles', () => {
      const result = calculateIncapacitateDefense([4, 4])
      expect(result.hasDoubles).toBe(true)
    })
  })

  describe('checkWinConditions', () => {
    const mockParty = [
      { currentHP: 5, hitPoints: 10 },
      { currentHP: 3, hitPoints: 8 }
    ]

    const mockEnemies = [
      { currentHP: 4, trackLength: 6 },
      { currentHP: 0, trackLength: 5 }
    ]

    it('should return win when all enemies are defeated', () => {
      const defeatedEnemies = [
        { currentHP: 0, trackLength: 6 },
        { currentHP: 0, trackLength: 5 }
      ]
      
      const result = checkWinConditions(defeatedEnemies, mockParty)
      expect(result.isOver).toBe(true)
      expect(result.result).toBe('win')
    })

    it('should return lose when all party members are defeated', () => {
      const defeatedParty = [
        { currentHP: 0, hitPoints: 10 },
        { currentHP: 0, hitPoints: 8 }
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

    it('should handle enemies without currentHP (using trackLength)', () => {
      const enemiesWithoutCurrentHP = [
        { trackLength: 6 }, // alive
        { currentHP: 0, trackLength: 5 } // dead
      ]
      
      const result = checkWinConditions(enemiesWithoutCurrentHP, mockParty)
      expect(result.isOver).toBe(false)
    })

    it('should handle party without currentHP (using hitPoints)', () => {
      const partyWithoutCurrentHP = [
        { hitPoints: 10 }, // alive
        { hitPoints: 8 } // alive
      ]
      
      const result = checkWinConditions(mockEnemies, partyWithoutCurrentHP)
      expect(result.isOver).toBe(false)
    })
  })
})
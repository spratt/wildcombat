import { describe, it, expect } from 'vitest'
import { calculateEnemyTrackLength, calculatePartyStats, calculateEncounterStats } from '../utils/dataManager.js'

describe('Data Manager', () => {
  describe('calculateEnemyTrackLength', () => {
    it('should return 0 for null/undefined enemy', () => {
      expect(calculateEnemyTrackLength(null)).toBe(0)
      expect(calculateEnemyTrackLength(undefined)).toBe(0)
    })

    it('should return 0 for enemy without aspects', () => {
      const enemy = { name: 'Test Enemy' }
      expect(calculateEnemyTrackLength(enemy)).toBe(0)
    })

    it('should sum aspect trackLengths', () => {
      const enemy = {
        name: 'Test Enemy',
        aspects: [
          { name: 'Aspect 1', trackLength: 3 },
          { name: 'Aspect 2', trackLength: 6 },
          { name: 'Aspect 3', trackLength: 4 }
        ]
      }
      expect(calculateEnemyTrackLength(enemy)).toBe(13)
    })

    it('should handle aspects without trackLength (default to 0)', () => {
      const enemy = {
        name: 'Test Enemy',
        aspects: [
          { name: 'Aspect 1', trackLength: 3 },
          { name: 'Aspect 2' }, // no trackLength
          { name: 'Aspect 3', trackLength: 4 }
        ]
      }
      expect(calculateEnemyTrackLength(enemy)).toBe(7)
    })

    it('should return 1 for empty aspects array', () => {
      const enemy = {
        name: 'Test Enemy',
        aspects: []
      }
      expect(calculateEnemyTrackLength(enemy)).toBe(0)
    })
  })

  describe('calculatePartyStats', () => {
    const mockParty = [
      {
        name: 'Character 1',
        hitPoints: 10,
        aspects: [
          { name: 'Skill 1', value: [0, 0, 0] },
          { name: 'Skill 2', value: [0, 0, 0, 0] }
        ],
        attackScore: 3,
        attackSkill: 'BREAK',
        defenseScore: 2,
        defenseSkill: 'BRACE'
      },
      {
        name: 'Character 2',
        hitPoints: 8,
        aspects: [
          { name: 'Skill 1', value: [0, 0] },
          { name: 'Skill 2', value: [0, 0, 0, 0, 0] }
        ],
        attackScore: 2,
        attackSkill: 'DELVE',
        defenseScore: 4,
        defenseSkill: 'FLOURISH'
      }
    ]

    it('should calculate total hit points', () => {
      const stats = calculatePartyStats(mockParty)
      expect(stats.totalHitPoints).toBe(18) // 10 + 8
    })

    it('should calculate total attack score', () => {
      const stats = calculatePartyStats(mockParty)
      expect(stats.totalAttackScore).toBe(5) // 3 + 2
    })

    it('should calculate total defense score', () => {
      const stats = calculatePartyStats(mockParty)
      expect(stats.totalDefenseScore).toBe(6) // 2 + 4
    })

    it('should handle empty party', () => {
      const stats = calculatePartyStats([])
      expect(stats.totalHitPoints).toBe(0)
      expect(stats.totalAttackScore).toBe(0)
      expect(stats.totalDefenseScore).toBe(0)
    })

    it('should handle characters with currentHP', () => {
      const partyWithCurrentHP = [
        { ...mockParty[0], currentHP: 5 },
        { ...mockParty[1], currentHP: 3 }
      ]
      const stats = calculatePartyStats(partyWithCurrentHP)
      expect(stats.totalHitPoints).toBe(8) // 5 + 3 (currentHP used instead of hitPoints)
    })
  })

  describe('calculateEncounterStats', () => {
    const mockEnemies = [
      {
        name: 'Enemy 1',
        aspects: [
          { name: 'Aspect 1', trackLength: 6 },
          { name: 'Aspect 2', trackLength: 3 }
        ]
      },
      {
        name: 'Enemy 2',
        aspects: [
          { name: 'Aspect 1', trackLength: 4 },
          { name: 'Aspect 2', trackLength: 5 }
        ]
      }
    ]

    it('should calculate total HP from trackLengths', () => {
      const stats = calculateEncounterStats(mockEnemies)
      expect(stats.totalHP).toBe(18) // (6+3) + (4+5)
    })

    it('should use currentHP when available', () => {
      const enemiesWithCurrentHP = [
        { ...mockEnemies[0], currentHP: 5 },
        { ...mockEnemies[1], currentHP: 3 }
      ]
      const stats = calculateEncounterStats(enemiesWithCurrentHP)
      expect(stats.totalHP).toBe(8) // 5 + 3
    })

    it('should handle empty encounter', () => {
      const stats = calculateEncounterStats([])
      expect(stats.totalHP).toBe(0)
    })

    it('should handle enemies without aspects', () => {
      const enemiesWithoutAspects = [
        { name: 'Enemy 1' },
        { name: 'Enemy 2' }
      ]
      const stats = calculateEncounterStats(enemiesWithoutAspects)
      expect(stats.totalHP).toBe(0)
    })
  })
})
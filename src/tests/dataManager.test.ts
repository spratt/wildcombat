import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  calculateEnemyTrackLength, 
  calculatePartyStats, 
  calculateEncounterStats,
  loadPartyFromStorage,
  loadEncounterFromStorage,
  generateUniqueEnemyNames,
  renderTrackLength,
  resetCombatState
} from '../utils/dataManager'
import type { Enemy, Character, EnemyAspect } from '../types'

describe('Data Manager', () => {
  describe('calculateEnemyTrackLength', () => {
    it('should return 0 for null/undefined enemy', () => {
      expect(calculateEnemyTrackLength(null)).toBe(0)
      expect(calculateEnemyTrackLength(undefined)).toBe(0)
    })

    it('should return 0 for enemy without aspects', () => {
      const enemy = { name: 'Test Enemy' } as Enemy
      expect(calculateEnemyTrackLength(enemy)).toBe(0)
    })

    it('should sum aspect trackLengths', () => {
      const enemy: Enemy = {
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
      const enemy: Enemy = {
        name: 'Test Enemy',
        aspects: [
          { name: 'Aspect 1', trackLength: 3 },
          { name: 'Aspect 2', trackLength: 0 }, // explicit 0
          { name: 'Aspect 3', trackLength: 4 }
        ]
      }
      expect(calculateEnemyTrackLength(enemy)).toBe(7)
    })

    it('should return 0 for empty aspects array', () => {
      const enemy: Enemy = {
        name: 'Test Enemy',
        aspects: []
      }
      expect(calculateEnemyTrackLength(enemy)).toBe(0)
    })
  })

  describe('calculatePartyStats', () => {
    interface MockCharacter extends Character {
      hitPoints: number
      attackScore: number
      attackSkill: string
      defenseScore: number
      defenseSkill: string
      currentHP?: number
    }

    const mockParty: MockCharacter[] = [
      {
        name: 'Character 1',
        background: 'Test',
        edges: [],
        skills: {},
        languages: {},
        drives: [],
        mires: [],
        hitPoints: 10,
        aspects: [
          { type: 'trait', name: 'Skill 1', value: [0, 0, 0] },
          { type: 'trait', name: 'Skill 2', value: [0, 0, 0, 0] }
        ],
        attackScore: 3,
        attackSkill: 'BREAK',
        defenseScore: 2,
        defenseSkill: 'BRACE'
      },
      {
        name: 'Character 2',
        background: 'Test',
        edges: [],
        skills: {},
        languages: {},
        drives: [],
        mires: [],
        hitPoints: 8,
        aspects: [
          { type: 'trait', name: 'Skill 1', value: [0, 0] },
          { type: 'trait', name: 'Skill 2', value: [0, 0, 0, 0, 0] }
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
      const partyWithCurrentHP: MockCharacter[] = [
        { ...mockParty[0], currentHP: 5 },
        { ...mockParty[1], currentHP: 3 }
      ]
      const stats = calculatePartyStats(partyWithCurrentHP)
      expect(stats.totalHitPoints).toBe(8) // 5 + 3 (currentHP used instead of hitPoints)
    })
  })

  describe('calculateEncounterStats', () => {
    interface MockEnemy extends Partial<Enemy> {
      id: string
      name: string
      aspects: EnemyAspect[]
      currentHP?: number
    }

    const mockEnemies: MockEnemy[] = [
      {
        id: 'enemy-1',
        name: 'Enemy 1',
        aspects: [
          { name: 'Aspect 1', trackLength: 6 },
          { name: 'Aspect 2', trackLength: 3 }
        ]
      },
      {
        id: 'enemy-2',
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
      const enemiesWithCurrentHP: MockEnemy[] = [
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
      const enemiesWithoutAspects: MockEnemy[] = [
        { id: 'enemy-1', name: 'Enemy 1', aspects: [] },
        { id: 'enemy-2', name: 'Enemy 2', aspects: [] }
      ]
      const stats = calculateEncounterStats(enemiesWithoutAspects)
      expect(stats.totalHP).toBe(0)
    })
  })

  describe('loadPartyFromStorage', () => {
    beforeEach(() => {
      // Mock localStorage
      global.localStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn()
      }
    })

    afterEach(() => {
      vi.clearAllMocks()
    })

    it('should return empty array when no party in storage', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null)
      const result = loadPartyFromStorage()
      expect(result).toEqual([])
      expect(localStorage.getItem).toHaveBeenCalledWith('wildcombat-party')
    })

    it('should return empty array when localStorage throws error', () => {
      vi.mocked(localStorage.getItem).mockImplementation(() => {
        throw new Error('Storage error')
      })
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const result = loadPartyFromStorage()
      expect(result).toEqual([])
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('should parse and enhance character data from storage', () => {
      const mockCharacterData = [{
        name: 'Test Character',
        aspects: [
          { type: 'trait', name: 'Aspect 1', value: [0, 0, 0] },
          { type: 'trait', name: 'Aspect 2', value: [0, 0] }
        ],
        skills: {
          BREAK: [1, 1, 0],
          BRACE: [1, 0, 0],
          HUNT: [1, 1, 1, 0]
        }
      }]
      
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(mockCharacterData))
      
      const result = loadPartyFromStorage()
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Test Character')
      expect(result[0].hitPoints).toBe(5) // 3 + 2 unchecked bubbles
      expect(result[0].attackScore).toBe(4) // 1 + 3 filled HUNT bubbles
      expect(result[0].attackSkill).toBe('HUNT')
      expect(result[0].defenseScore).toBe(2) // 1 + 1 filled BRACE bubble
      expect(result[0].defenseSkill).toBe('BRACE')
    })
  })

  describe('loadEncounterFromStorage', () => {
    beforeEach(() => {
      global.localStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn()
      }
    })

    afterEach(() => {
      vi.clearAllMocks()
    })

    it('should return empty array when no encounter in storage', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null)
      const result = loadEncounterFromStorage()
      expect(result).toEqual([])
      expect(localStorage.getItem).toHaveBeenCalledWith('wildcombat-encounter')
    })

    it('should return empty array when localStorage throws error', () => {
      vi.mocked(localStorage.getItem).mockImplementation(() => {
        throw new Error('Storage error')
      })
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const result = loadEncounterFromStorage()
      expect(result).toEqual([])
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('should parse encounter data from storage', () => {
      const mockEncounterData = [
        { enemyId: 'spider-1', count: 2 },
        { enemyId: 'beetle-1', count: 1 }
      ]
      
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(mockEncounterData))
      
      const result = loadEncounterFromStorage()
      expect(result).toEqual(mockEncounterData)
    })
  })

  describe('generateUniqueEnemyNames', () => {
    const mockEnemies = [
      {
        id: 'spider-1',
        name: 'Spider',
        aspects: [{ name: 'Bite', trackLength: 3 }]
      },
      {
        id: 'beetle-1', 
        name: 'Beetle',
        aspects: [{ name: 'Shell', trackLength: 5 }]
      }
    ]

    it('should generate unique names for multiple instances of same enemy', () => {
      const encounter = [
        { enemyId: 'spider-1', count: 3 }
      ]
      
      const result = generateUniqueEnemyNames(encounter, mockEnemies)
      expect(result).toHaveLength(3)
      expect(result[0].uniqueName).toBe('Spider 1')
      expect(result[1].uniqueName).toBe('Spider 2')
      expect(result[2].uniqueName).toBe('Spider 3')
      expect(result[0].instanceId).toBe('spider-1-1')
      expect(result[1].instanceId).toBe('spider-1-2')
      expect(result[2].instanceId).toBe('spider-1-3')
    })

    it('should handle multiple different enemies', () => {
      const encounter = [
        { enemyId: 'spider-1', count: 2 },
        { enemyId: 'beetle-1', count: 1 }
      ]
      
      const result = generateUniqueEnemyNames(encounter, mockEnemies)
      expect(result).toHaveLength(3)
      expect(result[0].uniqueName).toBe('Spider 1')
      expect(result[1].uniqueName).toBe('Spider 2')
      expect(result[2].uniqueName).toBe('Beetle 1')
    })

    it('should handle empty encounter', () => {
      const result = generateUniqueEnemyNames([], mockEnemies)
      expect(result).toEqual([])
    })

    it('should filter out enemies not found in enemy data', () => {
      const encounter = [
        { enemyId: 'spider-1', count: 1 },
        { enemyId: 'unknown-enemy', count: 1 }
      ]
      
      const result = generateUniqueEnemyNames(encounter, mockEnemies)
      expect(result).toHaveLength(1)
      expect(result[0].uniqueName).toBe('Spider 1')
    })
  })

  describe('renderTrackLength', () => {
    it('should render track with empty bubbles', () => {
      expect(renderTrackLength(3)).toBe('⦾-⦾-⦾')
      expect(renderTrackLength(5)).toBe('⦾-⦾-⦾-⦾-⦾')
    })

    it('should return empty string for zero length', () => {
      expect(renderTrackLength(0)).toBe('')
    })

    it('should return empty string for negative length', () => {
      expect(renderTrackLength(-1)).toBe('')
    })

    it('should handle undefined/null length', () => {
      expect(renderTrackLength(null as unknown as number)).toBe('')
      expect(renderTrackLength(undefined as unknown as number)).toBe('')
    })
  })

  describe('resetCombatState', () => {
    const mockEnemies = [
      {
        id: 'spider-1',
        name: 'Spider',
        uniqueName: 'Spider 1',
        instanceId: 'spider-1-1',
        currentHP: 3,
        aspects: [{ name: 'Bite', trackLength: 6 }]
      }
    ]

    const mockParty = [
      {
        name: 'Hero',
        background: 'Test',
        edges: [],
        skills: {},
        languages: {},
        drives: [],
        mires: [],
        hitPoints: 10,
        currentHP: 5,
        attackScore: 3,
        attackSkill: 'BREAK',
        defenseScore: 2,
        defenseSkill: 'BRACE',
        aspects: []
      }
    ]

    it('should reset enemy HP to full', () => {
      const result = resetCombatState(mockEnemies, mockParty)
      expect(result.resetEnemies[0].currentHP).toBe(6) // Full trackLength
    })

    it('should reset party HP to full', () => {
      const result = resetCombatState(mockEnemies, mockParty)
      expect(result.resetParty[0].currentHP).toBe(10) // Full hitPoints
    })

    it('should handle empty arrays', () => {
      const result = resetCombatState([], [])
      expect(result.resetEnemies).toEqual([])
      expect(result.resetParty).toEqual([])
    })
  })
})
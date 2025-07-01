import { describe, it, expect, vi, beforeEach } from 'vitest'
import { simulateFullSession } from '../utils/sessionSimulator.js'

// Mock the dependencies
vi.mock('../utils/combatSimulator.js', () => ({
  simulateOneRound: vi.fn()
}))

vi.mock('../utils/combatEngine.js', () => ({
  checkWinConditions: vi.fn()
}))

describe('Session Simulator', () => {
  const mockParty = [
    {
      name: 'Hero 1',
      hitPoints: 5,
      currentHP: 5,
      partyId: 'hero1'
    },
    {
      name: 'Hero 2', 
      hitPoints: 3,
      currentHP: 3,
      partyId: 'hero2'
    }
  ]

  const mockEnemies = [
    {
      name: 'Goblin',
      uniqueName: 'Goblin 1',
      currentHP: 4,
      trackLength: 4,
      instanceId: 'goblin1'
    }
  ]

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get the mocked functions
    const { simulateOneRound } = await import('../utils/combatSimulator.js')
    const { checkWinConditions } = await import('../utils/combatEngine.js')
    
    // Set up default behaviors
    vi.mocked(checkWinConditions).mockReturnValue({ isOver: false, result: null })
    vi.mocked(simulateOneRound).mockReturnValue({
      updatedParty: mockParty,
      updatedEnemies: mockEnemies,
      log: [{ message: 'Round simulated', type: 'neutral' }],
      combatResult: null,
      isOver: false
    })
  })

  describe('simulateFullSession', () => {
    it('should return basic session structure', () => {
      const result = simulateFullSession(mockParty, mockEnemies, 1)
      
      expect(result).toHaveProperty('finalParty')
      expect(result).toHaveProperty('finalEnemies')
      expect(result).toHaveProperty('finalRound')
      expect(result).toHaveProperty('sessionLog')
      expect(result).toHaveProperty('combatResult')
      expect(result).toHaveProperty('timeoutOccurred')
    })

    it('should handle empty party', () => {
      const result = simulateFullSession([], mockEnemies, 1)
      
      expect(result.finalParty).toBeDefined()
      expect(result.finalRound).toBeGreaterThanOrEqual(1)
    })

    it('should handle empty enemies', () => {
      const result = simulateFullSession(mockParty, [], 1)
      
      expect(result.finalEnemies).toBeDefined()
      expect(result.finalRound).toBeGreaterThanOrEqual(1)
    })

    it('should pass parameters to simulateOneRound', async () => {
      const { simulateOneRound } = await import('../utils/combatSimulator.js')
      const { checkWinConditions } = await import('../utils/combatEngine.js')
      
      // Mock win condition after one round
      vi.mocked(checkWinConditions)
        .mockReturnValueOnce({ isOver: false, result: null }) // Pre-round check
        .mockReturnValueOnce({ isOver: true, result: 'win' })  // Post-round check
      
      vi.mocked(simulateOneRound).mockReturnValue({
        updatedParty: mockParty,
        updatedEnemies: mockEnemies.map(e => ({ ...e, currentHP: 0 })),
        log: [{ message: 'Enemies defeated', type: 'neutral' }],
        combatResult: 'The players WON after 1 rounds',
        isOver: true
      })

      const result = simulateFullSession(
        mockParty, 
        mockEnemies, 
        1, 
        '1,2,aspect,counter', 
        2, 
        false
      )

      expect(vi.mocked(simulateOneRound)).toHaveBeenCalledWith(
        mockParty,
        mockEnemies,
        1,
        '1,2,aspect,counter',
        2,
        false
      )
    })

    it('should stop session when isOver is true', async () => {
      const { simulateOneRound } = await import('../utils/combatSimulator.js')
      
      vi.mocked(simulateOneRound).mockReturnValue({
        updatedParty: mockParty,
        updatedEnemies: mockEnemies.map(e => ({ ...e, currentHP: 0 })),
        log: [{ message: 'Combat ended', type: 'neutral' }],
        combatResult: 'The players WON after 0 rounds',
        isOver: true
      })

      const result = simulateFullSession(mockParty, mockEnemies, 1)

      expect(result.combatResult).toBe('The players WON after 0 rounds')
      expect(result.sessionLog).toBeDefined()
    })

    it('should timeout after max rounds', async () => {
      const { simulateOneRound } = await import('../utils/combatSimulator.js')
      
      // Mock infinite combat that never ends
      vi.mocked(simulateOneRound).mockReturnValue({
        updatedParty: mockParty,
        updatedEnemies: mockEnemies,
        log: [{ message: 'Round continues', type: 'neutral' }],
        combatResult: null,
        isOver: false
      })

      const result = simulateFullSession(mockParty, mockEnemies, 1)

      expect(result.sessionLog.some(entry => 
        typeof entry === 'object' && entry.message && entry.message.includes('100 rounds')
      )).toBe(true)
    })

    it('should handle win from simulateOneRound result', async () => {
      const { simulateOneRound } = await import('../utils/combatSimulator.js')
      
      vi.mocked(simulateOneRound).mockReturnValue({
        updatedParty: mockParty,
        updatedEnemies: mockEnemies.map(e => ({ ...e, currentHP: 0 })),
        log: [{ message: 'Enemies defeated', type: 'neutral' }],
        combatResult: 'The players WON after 1 rounds',
        isOver: true
      })

      const result = simulateFullSession(mockParty, mockEnemies, 1)

      expect(result.combatResult).toBe('The players WON after 1 rounds')
      expect(result.finalRound).toBe(1)
    })
  })
})
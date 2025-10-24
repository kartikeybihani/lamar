import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the supabase module before importing the functions
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}))

import { 
  checkDuplicatePatient, 
  checkDuplicateProvider, 
  checkDuplicateOrder 
} from '@/lib/supabaseServices'

describe('Duplicate Detection Logic', () => {
  let mockSupabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const { supabase } = await import('@/lib/supabase')
    mockSupabase = supabase
  })

  describe('checkDuplicatePatient', () => {
    it('returns true when patient MRN exists', async () => {
      // Mock Supabase response for existing patient
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'patient-123' },
            error: null
          })
        })
      })
      
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect
      } as any)

      const result = await checkDuplicatePatient('123456')
      
      expect(result).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('patients')
      expect(mockSelect).toHaveBeenCalledWith('id')
    })

    it('returns false when patient MRN does not exist', async () => {
      // Mock Supabase response for non-existing patient
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'No rows returned' }
          })
        })
      })
      
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect
      } as any)

      const result = await checkDuplicatePatient('999999')
      
      expect(result).toBe(false)
    })

    it('throws error for database errors other than no rows', async () => {
      // Mock Supabase response for database error
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST001', message: 'Database connection failed' }
          })
        })
      })
      
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect
      } as any)

      await expect(checkDuplicatePatient('123456')).rejects.toThrow('Database error: Database connection failed')
    })
  })

  describe('checkDuplicateProvider', () => {
    it('returns true when provider NPI exists', async () => {
      // Mock Supabase response for existing provider
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'provider-123' },
            error: null
          })
        })
      })
      
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect
      } as any)

      const result = await checkDuplicateProvider('1234567890')
      
      expect(result).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('providers')
      expect(mockSelect).toHaveBeenCalledWith('id')
    })

    it('returns false when provider NPI does not exist', async () => {
      // Mock Supabase response for non-existing provider
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'No rows returned' }
          })
        })
      })
      
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect
      } as any)

      const result = await checkDuplicateProvider('9999999999')
      
      expect(result).toBe(false)
    })

    it('throws error for database errors other than no rows', async () => {
      // Mock Supabase response for database error
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST001', message: 'Database connection failed' }
          })
        })
      })
      
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect
      } as any)

      await expect(checkDuplicateProvider('1234567890')).rejects.toThrow('Database error: Database connection failed')
    })
  })

  describe('checkDuplicateOrder', () => {
    it('returns true when duplicate order exists', async () => {
      // Mock Supabase response for existing order
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'order-123' },
                error: null
              })
            })
          })
        })
      })
      
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect
      } as any)

      const result = await checkDuplicateOrder('patient-123', 'Metformin', 'Type 2 Diabetes')
      
      expect(result).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('orders')
      expect(mockSelect).toHaveBeenCalledWith('id')
    })

    it('returns false when no duplicate order exists', async () => {
      // Mock Supabase response for non-existing order
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'No rows returned' }
              })
            })
          })
        })
      })
      
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect
      } as any)

      const result = await checkDuplicateOrder('patient-999', 'Insulin', 'Type 1 Diabetes')
      
      expect(result).toBe(false)
    })

    it('throws error for database errors other than no rows', async () => {
      // Mock Supabase response for database error
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST001', message: 'Database connection failed' }
              })
            })
          })
        })
      })
      
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect
      } as any)

      await expect(checkDuplicateOrder('patient-123', 'Metformin', 'Type 2 Diabetes'))
        .rejects.toThrow('Database error: Database connection failed')
    })
  })
})
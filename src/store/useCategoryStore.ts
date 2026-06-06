import { create } from 'zustand'

export interface Topic {
  id: number
  category_id: number
  code: string
  title: string
  description?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  code: string
  title: string
  description?: string
  created_at: string
  updated_at: string
  topics: Topic[]
}

interface TourStore {
  selectedCategoryIds: number[]
  selectedTopicCodes: string[]
  toggleCategory: (id: number) => void
  toggleTopic: (code: string) => void
  clearSelection: () => void
}

export const useCategoryStore = create<TourStore>((set) => ({
  selectedCategoryIds: [],
  selectedTopicCodes: [],
  toggleCategory: (id) => set((state) => {
    const isSelected = state.selectedCategoryIds.includes(id)
    return {
      selectedCategoryIds: isSelected 
        ? state.selectedCategoryIds.filter(c => c !== id)
        : [...state.selectedCategoryIds, id]
    }
  }),
  toggleTopic: (code) => set((state) => {
    const isSelected = state.selectedTopicCodes.includes(code)
    return {
      selectedTopicCodes: isSelected 
        ? state.selectedTopicCodes.filter(c => c !== code)
        : [...state.selectedTopicCodes, code]
    }
  }),
  clearSelection: () => set({ selectedCategoryIds: [], selectedTopicCodes: [] }),
}))

import React, { createContext, useState, useContext } from 'react'

// Define the animal categories type
export type Category = 'Beef cattle' | 'Dairy cattle' | 'Sheep' | 'Deer'

interface ActiveCategoriesContextType {
  activeCategories: Set<Category>
  toggleCategory: (cat: Category) => void
}

const ActiveCategoriesContext = createContext<ActiveCategoriesContextType | undefined>(undefined)

export const ActiveCategoriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCategories, setActiveCategories] = useState<Set<Category>>(new Set(['Beef cattle', 'Dairy cattle', 'Sheep', 'Deer']))
  const toggleCategory = (cat: Category) => {
    setActiveCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }
  return (
    <ActiveCategoriesContext.Provider value={{ activeCategories, toggleCategory }}>
      {children}
    </ActiveCategoriesContext.Provider>
  )
}

export const useActiveCategories = (): ActiveCategoriesContextType => {
  const ctx = useContext(ActiveCategoriesContext)
  if (!ctx) throw new Error('useActiveCategories must be used within a ActiveCategoriesProvider')
  return ctx
}
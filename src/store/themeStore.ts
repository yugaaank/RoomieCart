import { create } from 'zustand'

type ThemeState = {
  theme: 'light' | 'dark' | null
  manualTheme: 'light' | 'dark' | null
  setManualTheme: (theme: 'light' | 'dark' | null) => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: null,
  manualTheme: null,
  setManualTheme: (theme) => set({ manualTheme: theme }),
}))

import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'

type AuthState = {
  user: User | null
  session: Session | null
  loading: boolean
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
    }),

  setLoading: (loading) => set({ loading }),
}))

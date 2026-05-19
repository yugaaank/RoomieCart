import { supabase } from '../lib/supabase'
import { Profile } from '../types/database.types'

export const profileService = {
  async getProfile(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Profile
  },

  async updateProfile(id: string, updates: Partial<Profile>) {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)

    if (error) throw error
  }
}

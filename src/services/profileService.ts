import { supabase } from '../lib/supabase'
import { Profile } from '../types/database.types'
import { sanitizeTextInput } from '../lib/validation'

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
    const sanitizedUpdates = {
      ...updates,
      name: updates.name === undefined || updates.name === null
        ? updates.name
        : sanitizeTextInput(updates.name),
    }

    const { error } = await supabase
      .from('profiles')
      .update(sanitizedUpdates)
      .eq('id', id)

    if (error) throw error
  }
}

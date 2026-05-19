import { supabase } from '../lib/supabase'
import { ShoppingItem } from '../types/database.types'

export const itemService = {
  async getRoomItems(roomId: string) {
    const { data, error } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as ShoppingItem[]
  },

  async addItem(roomId: string, userId: string, name: string, quantity: string = '1', unit?: string) {
    const normalizedName = name.trim().toLowerCase()
    
    const { data, error } = await supabase
      .from('shopping_items')
      .insert({
        room_id: roomId,
        added_by: userId,
        name: name.trim(),
        normalized_name: normalizedName,
        quantity,
        unit,
      })
      .select()
      .single()

    if (error) throw error
    return data as ShoppingItem
  },

  async updateItemStatus(itemId: string, status: ShoppingItem['status']) {
    const { error } = await supabase
      .from('shopping_items')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', itemId)

    if (error) throw error
  },

  async deleteItem(itemId: string) {
    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .eq('id', itemId)

    if (error) throw error
  },

  async searchDuplicate(roomId: string, name: string) {
    const normalizedName = name.trim().toLowerCase()
    const { data, error } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('room_id', roomId)
      .eq('normalized_name', normalizedName)
      .eq('status', 'active')
      .maybeSingle()

    if (error) throw error
    return data as ShoppingItem | null
  },

  async createChangeRequest(itemId: string, userId: string, newQuantity: string, reason?: string) {
    const { data, error } = await supabase
      .from('item_change_requests')
      .insert({
        item_id: itemId,
        requested_by: userId,
        new_quantity: newQuantity,
        reason,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getPendingRequests(roomId: string) {
    const { data, error } = await supabase
      .from('item_change_requests')
      .select(`
        *,
        shopping_items!inner(room_id),
        profiles:requested_by(name)
      `)
      .eq('shopping_items.room_id', roomId)
      .eq('status', 'pending')

    if (error) throw error
    return data
  },

  async resolveChangeRequest(requestId: string, userId: string, status: 'approved' | 'rejected') {
    const { error } = await supabase
      .from('item_change_requests')
      .update({
        status,
        resolved_by: userId,
      })
      .eq('id', requestId)

    if (error) throw error
  }
}

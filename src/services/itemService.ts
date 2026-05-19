import { supabase } from '../lib/supabase'
import { ShoppingItem } from '../types/database.types'
import { sanitizeTextInput } from '../lib/validation'

function sortItemsWithPurchasedLast(items: any[]) {
  return [...items].sort((a, b) => {
    if (a.status === b.status) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }

    if (a.status === 'purchased') return 1
    if (b.status === 'purchased') return -1

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

export const itemService = {
  async getRoomItems(roomId: string) {
    const { data, error } = await supabase
      .from('shopping_items')
      .select(`
        *,
        profiles:added_by (
          name
        )
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return sortItemsWithPurchasedLast(data as any[])
  },

  async addItem(
    roomId: string,
    userId: string,
    name: string,
    quantity: string = '1',
    unit?: string,
    targetMemberIds: string[] = []
  ) {
    const sanitizedName = sanitizeTextInput(name)
    const sanitizedQuantity = sanitizeTextInput(quantity)
    const normalizedName = sanitizedName.toLowerCase()
    
    const { data, error } = await supabase
      .from('shopping_items')
      .insert({
        room_id: roomId,
        added_by: userId,
        name: sanitizedName,
        normalized_name: normalizedName,
        quantity: sanitizedQuantity,
        unit,
        target_member_ids: targetMemberIds,
      })
      .select(`
        *,
        profiles:added_by (
          name
        )
      `)
      .single()

    if (error) throw error
    return data as any
  },

  async mergeItemQuantity(itemId: string, newQuantity: string) {
    const sanitizedQuantity = sanitizeTextInput(newQuantity)

    const { data, error } = await supabase
      .from('shopping_items')
      .update({ 
        quantity: sanitizedQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select(`
        *,
        profiles:added_by (
          name
        )
      `)
      .single()

    if (error) throw error
    return data
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
    const normalizedName = sanitizeTextInput(name).toLowerCase()
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

  async createChangeRequest(
    itemId: string,
    userId: string,
    oldQuantity: string,
    newQuantity: string,
    reason?: string
  ) {
    const { data: existingRequest, error: existingRequestError } = await supabase
      .from('item_change_requests')
      .select('id')
      .eq('item_id', itemId)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingRequestError) throw existingRequestError

    if (existingRequest) {
      throw new Error('There is already a pending quantity request for this item')
    }

    const { data, error } = await supabase
      .from('item_change_requests')
      .insert({
        item_id: itemId,
        requested_by: userId,
        old_quantity: sanitizeTextInput(oldQuantity),
        new_quantity: sanitizeTextInput(newQuantity),
        reason: reason ? sanitizeTextInput(reason) : null,
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
        shopping_items!inner(
          id,
          room_id,
          name,
          quantity,
          unit,
          target_member_ids,
          status
        ),
        profiles:requested_by(name),
        item_change_request_votes (
          id,
          voter_id,
          vote,
          created_at,
          updated_at
        )
      `)
      .eq('shopping_items.room_id', roomId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async submitChangeRequestVote(requestId: string, vote: 'yes' | 'no') {
    const { data, error } = await supabase.rpc('submit_change_request_vote', {
      request_id_param: requestId,
      vote_param: vote,
    })

    if (error) throw error
    return data
  },

  async cancelChangeRequest(requestId: string) {
    const { data, error } = await supabase.rpc('cancel_change_request', {
      request_id_param: requestId,
    })

    if (error) throw error
    return data
  }
}

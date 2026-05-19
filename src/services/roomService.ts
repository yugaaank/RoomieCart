import { supabase } from '../lib/supabase'
import { Room, RoomMember } from '../types/database.types'

export const roomService = {
  async createRoom(name: string, ownerId: string) {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    // 1. Create the room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({
        name,
        invite_code: inviteCode,
        owner_id: ownerId,
      })
      .select()
      .single()

    if (roomError) throw roomError

    // 2. Add creator as owner member
    const { error: memberError } = await supabase
      .from('room_members')
      .insert({
        room_id: room.id,
        user_id: ownerId,
        role: 'owner',
      })

    if (memberError) throw memberError

    return room as Room
  },

  async joinRoom(inviteCode: string, userId: string) {
    // 1. Find the room by invite code
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id')
      .eq('invite_code', inviteCode)
      .single()

    if (roomError) throw new Error('Invalid invite code')

    // 2. Join the room
    const { error: memberError } = await supabase
      .from('room_members')
      .insert({
        room_id: room.id,
        user_id: userId,
        role: 'member',
      })

    if (memberError) {
      if (memberError.code === '23505') {
        throw new Error('You are already a member of this room')
      }
      throw memberError
    }

    return room.id
  },

  async getUserRooms(userId: string) {
    const { data, error } = await supabase
      .from('room_members')
      .select(`
        room_id,
        rooms (
          id,
          name,
          invite_code,
          owner_id,
          created_at
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')

    if (error) throw error
    return data.map((m: any) => m.rooms) as Room[]
  },

  async getRoomMembers(roomId: string) {
    const { data, error } = await supabase
      .from('room_members')
      .select(`
        *,
        profiles (
          id,
          name,
          avatar_url
        )
      `)
      .eq('room_id', roomId)

    if (error) throw error
    return data
  }
}

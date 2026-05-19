export type Profile = {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  preferred_language: string
  created_at: string
}

export type Room = {
  id: string
  name: string
  invite_code: string
  owner_id: string
  max_members: number
  settings_json: any
  created_at: string
  updated_at: string
}

export type RoomMember = {
  id: string
  room_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  status: 'active' | 'left' | 'removed'
  joined_at: string
}

export type ShoppingItem = {
  id: string
  room_id: string
  name: string
  normalized_name: string
  quantity: string
  unit: string | null
  added_by: string
  status: 'active' | 'purchased' | 'archived' | 'discussion_pending'
  created_at: string
  updated_at: string
}

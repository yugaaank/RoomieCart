import { create } from 'zustand'
import { Room } from '../types/database.types'
import { roomService } from '../services/roomService'

type RoomState = {
  rooms: Room[]
  currentRoom: Room | null
  loading: boolean
  error: string | null
  fetchRooms: (userId: string) => Promise<void>
  setCurrentRoom: (room: Room | null) => void
  createRoom: (name: string, userId: string) => Promise<void>
  joinRoom: (inviteCode: string, userId: string) => Promise<void>
  regenerateInviteCode: (roomId: string) => Promise<void>
  leaveRoom: (roomId: string, userId: string) => Promise<void>
  deleteRoom: (roomId: string) => Promise<void>
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  currentRoom: null,
  loading: false,
  error: null,

  fetchRooms: async (userId) => {
    set({ loading: true, error: null })
    try {
      const rooms = await roomService.getUserRooms(userId)
      set({ rooms, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },

  setCurrentRoom: (room) => set({ currentRoom: room }),

  createRoom: async (name, userId) => {
    set({ loading: true, error: null })
    try {
      const newRoom = await roomService.createRoom(name, userId)
      const currentRooms = get().rooms
      set({ rooms: [newRoom, ...currentRooms], currentRoom: newRoom, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  joinRoom: async (inviteCode, userId) => {
    set({ loading: true, error: null })
    try {
      await roomService.joinRoom(inviteCode, userId)
      await get().fetchRooms(userId)
    } catch (err: any) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  regenerateInviteCode: async (roomId: string) => {
    try {
      const newCode = await roomService.regenerateInviteCode(roomId)
      const currentRoom = get().currentRoom
      if (currentRoom && currentRoom.id === roomId) {
        set({ currentRoom: { ...currentRoom, invite_code: newCode } })
      }
      const rooms = get().rooms.map(r => r.id === roomId ? { ...r, invite_code: newCode } : r)
      set({ rooms })
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  leaveRoom: async (roomId: string, userId: string) => {
    set({ loading: true, error: null })
    try {
      await roomService.leaveRoom(roomId, userId)
      const rooms = get().rooms.filter(r => r.id !== roomId)
      set({ rooms, currentRoom: null, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  deleteRoom: async (roomId: string) => {
    set({ loading: true, error: null })
    try {
      await roomService.deleteRoom(roomId)
      const rooms = get().rooms.filter(r => r.id !== roomId)
      set({ rooms, currentRoom: null, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
      throw err
    }
  },
}))

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
}))

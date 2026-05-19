import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ShoppingItem } from '../types/database.types'

export function useRealtimeItems(roomId: string, onUpdate: () => void) {
  useEffect(() => {
    if (!roomId) return

    const channel = supabase
      .channel(`room-items-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_items',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          onUpdate()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, onUpdate])
}

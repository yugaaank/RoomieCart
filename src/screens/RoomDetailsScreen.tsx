import { useState, useEffect, useLayoutEffect, useCallback } from 'react'
import { View, Text, FlatList, TextInput, Button, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { itemService } from '../services/itemService'
import { useAuthStore } from '../store/authStore'
import { ShoppingItem } from '../types/database.types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useRealtimeItems } from '../hooks/useRealtimeItems'

type Props = NativeStackScreenProps<RootStackParamList, 'RoomDetails'>

export default function RoomDetailsScreen({ route, navigation }: Props) {
  const { roomId, roomName } = route.params
  const user = useAuthStore((state) => state.user)
  
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [newItemName, setNewItemName] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchItems = useCallback(async () => {
    try {
      const data = await itemService.getRoomItems(roomId)
      setItems(data)
    } catch (err: any) {
      Alert.alert('Error fetching items', err.message)
    } finally {
      setLoading(false)
    }
  }, [roomId])

  useLayoutEffect(() => {
    navigation.setOptions({ title: roomName })
  }, [navigation, roomName])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // Enable Realtime
  useRealtimeItems(roomId, fetchItems)

  const handleAddItem = async () => {
    if (!newItemName.trim()) return

    try {
      // Check for duplicates
      const existing = await itemService.searchDuplicate(roomId, newItemName)
      if (existing) {
        Alert.alert(
          'Duplicate Item',
          `"${existing.name}" is already on the list. Add it anyway?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Add Anyway', onPress: () => performAddItem() }
          ]
        )
      } else {
        await performAddItem()
      }
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  const performAddItem = async () => {
    try {
      const newItem = await itemService.addItem(roomId, user!.id, newItemName)
      setItems([newItem, ...items])
      setNewItemName('')
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  const toggleStatus = async (item: ShoppingItem) => {
    const newStatus = item.status === 'active' ? 'purchased' : 'active'
    try {
      await itemService.updateItemStatus(item.id, newStatus)
      setItems(items.map(i => i.id === item.id ? { ...i, status: newStatus } : i))
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  const deleteItem = async (itemId: string) => {
    try {
      await itemService.deleteItem(itemId)
      setItems(items.filter(i => i.id !== itemId))
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  const renderItem = ({ item }: { item: ShoppingItem }) => (
    <View style={{ 
      flexDirection: 'row', 
      padding: 16, 
      borderBottomWidth: 1, 
      borderBottomColor: '#eee',
      alignItems: 'center',
      backgroundColor: item.status === 'purchased' ? '#f9f9f9' : 'white'
    }}>
      <TouchableOpacity 
        style={{ flex: 1 }}
        onPress={() => toggleStatus(item)}
      >
        <Text style={{ 
          fontSize: 16, 
          textDecorationLine: item.status === 'purchased' ? 'line-through' : 'none',
          color: item.status === 'purchased' ? '#aaa' : '#000'
        }}>
          {item.name} {item.quantity !== '1' ? `(${item.quantity})` : ''}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => deleteItem(item.id)}>
        <Text style={{ color: 'red', marginLeft: 10 }}>Delete</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput
            placeholder="Add new item..."
            value={newItemName}
            onChangeText={setNewItemName}
            style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5 }}
          />
          <Button title="Add" onPress={handleAddItem} />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>
              Your shopping list is empty.
            </Text>
          }
        />
      )}
    </View>
  )
}

import { useState, useEffect, useLayoutEffect, useCallback } from 'react'
import { FlatList, Alert } from 'react-native'
import { itemService } from '../services/itemService'
import { useAuthStore } from '../store/authStore'
import { ShoppingItem } from '../types/database.types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useRealtimeItems } from '../hooks/useRealtimeItems'
import RequestChangeModal from '../components/RequestChangeModal'
import { Container, YStack, XStack, Text, Button, Input, Card } from '../components/ui'
import { Plus, Check, ShoppingCart, Trash2, MessageSquare, AlertCircle } from '@tamagui/lucide-icons'

type Props = NativeStackScreenProps<RootStackParamList, 'RoomDetails'>

export default function RoomDetailsScreen({ route, navigation }: Props) {
  const { roomId, roomName } = route.params
  const user = useAuthStore((state) => state.user)
  
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [newItemName, setNewItemName] = useState('')
  const [loading, setLoading] = useState(true)

  const [selectedItem, setSelectedItem] = useState<ShoppingItem | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)

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

  useRealtimeItems(roomId, fetchItems)

  const handleAddItem = async () => {
    if (!newItemName.trim()) return

    try {
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

  const handleLongPress = (item: ShoppingItem) => {
    setSelectedItem(item)
    Alert.alert(
      item.name,
      'Actions',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Request Qty Change', onPress: () => setIsModalVisible(true) },
        { text: 'Delete Item', style: 'destructive', onPress: () => deleteItem(item.id) }
      ]
    )
  }

  const renderItem = ({ item }: { item: ShoppingItem }) => (
    <Card 
      elevation={item.status === 'active' ? '$2' : '$0'}
      borderWidth={1}
      borderColor="$borderColor"
      backgroundColor={item.status === 'purchased' ? '$backgroundTransparent' : '$background'}
      padding="$4" 
      marginBottom="$2"
      onPress={() => toggleStatus(item)}
      onLongPress={() => handleLongPress(item)}
      opacity={item.status === 'purchased' ? 0.6 : 1}
    >
      <XStack jc="space-between" ai="center">
        <XStack gap="$3" ai="center" flex={1}>
          <YStack 
            width={24} 
            height={24} 
            borderRadius={12} 
            borderWidth={1} 
            borderColor={item.status === 'purchased' ? '$green10' : '$colorSubtitle'}
            ai="center" 
            jc="center"
            backgroundColor={item.status === 'purchased' ? '$green10' : 'transparent'}
          >
            {item.status === 'purchased' && <Check size={14} color="white" />}
          </YStack>
          
          <YStack flex={1}>
            <Text 
              fontSize={16} 
              fontWeight="500"
              textDecorationLine={item.status === 'purchased' ? 'line-through' : 'none'}
            >
              {item.name}
            </Text>
            <XStack ai="center" gap="$1">
              <Text fontSize={14} color="$colorSubtitle">
                Qty: {item.quantity} {item.unit || ''}
              </Text>
              {item.status === 'discussion_pending' && (
                <XStack ai="center" gap="$1" backgroundColor="$yellow4" paddingHorizontal="$2" borderRadius="$2">
                  <AlertCircle size={12} color="$yellow10" />
                  <Text fontSize={12} color="$yellow10" fontWeight="bold">NEGOTIATING</Text>
                </XStack>
              )}
            </XStack>
          </YStack>
        </XStack>
        
        <XStack gap="$2">
          {item.status === 'discussion_pending' && (
            <Button size="$2" circular icon={MessageSquare} chromeless />
          )}
          <Button 
            size="$2" 
            circular 
            icon={Trash2} 
            chromeless 
            theme="red" 
            onPress={() => deleteItem(item.id)} 
          />
        </XStack>
      </XStack>
    </Card>
  )

  return (
    <Container padding="$0">
      <YStack padding="$4" backgroundColor="$backgroundStrong" borderBottomWidth={1} borderColor="$borderColor">
        <XStack gap="$3">
          <Input
            flex={1}
            placeholder="Add to list..."
            value={newItemName}
            onChangeText={setNewItemName}
            size="$4"
          />
          <Button 
            theme="active" 
            icon={Plus} 
            onPress={handleAddItem}
            size="$4"
          />
        </XStack>
      </YStack>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <YStack ai="center" jc="center" padding="$10" gap="$4">
            <ShoppingCart size={48} color="$colorSubtitle" opacity={0.5} />
            <Text textAlign="center" color="$colorSubtitle">
              Your shopping list is empty. Add something above!
            </Text>
          </YStack>
        }
      />

      <RequestChangeModal
        visible={isModalVisible}
        item={selectedItem}
        userId={user!.id}
        onClose={() => setIsModalVisible(false)}
        onSuccess={() => {
          fetchItems()
          setSelectedItem(null)
        }}
      />
    </Container>
  )
}

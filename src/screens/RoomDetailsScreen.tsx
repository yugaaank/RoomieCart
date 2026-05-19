import { useState, useEffect, useLayoutEffect, useCallback } from 'react'
import { FlatList, Alert, ScrollView } from 'react-native'
import { itemService } from '../services/itemService'
import { roomService } from '../services/roomService'
import { useAuthStore } from '../store/authStore'
import { ShoppingItem } from '../types/database.types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useRealtimeItems } from '../hooks/useRealtimeItems'
import RequestChangeModal from '../components/RequestChangeModal'
import { Container, YStack, XStack, Text, Button, Input, Card } from '../components/ui'
import { Plus, Check, ShoppingCart, Trash2, MessageSquare, AlertCircle, Settings } from '@tamagui/lucide-icons'

type Props = NativeStackScreenProps<RootStackParamList, 'RoomDetails'>

const UNITS = ['pcs', 'kg', 'g', 'L', 'ml', 'pack', 'box', 'other']

export default function RoomDetailsScreen({ route, navigation }: Props) {
  const { roomId, roomName } = route.params
  const user = useAuthStore((state) => state.user)
  
  const [items, setItems] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [newItemName, setNewItemName] = useState('')
  const [newItemQuantity, setNewItemQuantity] = useState('1')
  const [selectedUnit, setSelectedUnit] = useState('pcs')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [selectedItem, setSelectedItem] = useState<ShoppingItem | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)

  const fetchItems = useCallback(async () => {
    try {
      const [itemsData, membersData] = await Promise.all([
        itemService.getRoomItems(roomId),
        roomService.getRoomMembers(roomId)
      ])
      setItems(itemsData)
      setMembers(membersData)
    } catch (err: any) {
      Alert.alert('Error fetching room data', err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [roomId])

  useLayoutEffect(() => {
    navigation.setOptions({ 
      title: roomName,
      headerRight: () => (
        <XStack gap="$2" ai="center">
          <Button 
            size="$2" 
            icon={AlertCircle} 
            theme="active" 
            onPress={() => navigation.navigate('PendingRequests', { roomId })}
          >
            Requests
          </Button>
          <Button 
            size="$2" 
            icon={Settings} 
            chromeless
            onPress={() => navigation.navigate('RoomSettings', { roomId })}
          />
        </XStack>
      )
    })
  }, [navigation, roomName, roomId])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  useRealtimeItems(roomId, fetchItems)

  const onRefresh = () => {
    setRefreshing(true)
    fetchItems()
  }

  const handleAddItem = async () => {
    if (!newItemName.trim()) return
    if (!newItemQuantity.trim()) {
      Alert.alert('Error', 'Please enter a quantity')
      return
    }

    try {
      const existing = await itemService.searchDuplicate(roomId, newItemName)
      if (existing) {
        const requestedQty = parseFloat(newItemQuantity) || 1
        Alert.alert(
          'Duplicate Item',
          `"${existing.name}" is already on the list with quantity ${existing.quantity}.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Add Anyway', onPress: () => performAddItem() },
            { 
              text: 'Merge Qty', 
              onPress: () => {
                const currentQty = parseFloat(existing.quantity) || 0
                const mergedQty = (currentQty + requestedQty).toString()
                handleMerge(existing.id, mergedQty)
              } 
            }
          ]
        )
      } else {
        await performAddItem()
      }
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  const handleMerge = async (itemId: string, newQty: string) => {
    try {
      await itemService.mergeItemQuantity(itemId, newQty)
      fetchItems()
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  const performAddItem = async () => {
    try {
      const newItem = await itemService.addItem(
        roomId,
        user!.id,
        newItemName,
        newItemQuantity.trim(),
        selectedUnit
      )
      setItems((currentItems) => [newItem, ...currentItems])
      setNewItemName('')
      setNewItemQuantity('1')
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  const toggleStatus = async (item: ShoppingItem) => {
    const newStatus = item.status === 'active' ? 'purchased' : 'active'
    try {
      await itemService.updateItemStatus(item.id, newStatus)
      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id ? { ...currentItem, status: newStatus } : currentItem
        )
      )
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  const deleteItem = async (itemId: string) => {
    try {
      await itemService.deleteItem(itemId)
      setItems((currentItems) => currentItems.filter((item) => item.id !== itemId))
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

  const renderItem = ({ item }: { item: any }) => (
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
            <YStack gap="$1">
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
              <Text fontSize={11} color="$colorSubtitle">
                Added by {item.profiles?.name || 'Someone'} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </YStack>
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
      <YStack padding="$4" backgroundColor="$backgroundStrong" borderBottomWidth={1} borderColor="$borderColor" gap="$3">
        <XStack gap="$2" ai="center" paddingBottom="$2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack gap="$2">
              {members.map((m) => (
                <XStack 
                  key={m.id} 
                  ai="center" 
                  gap="$1" 
                  bc="$background" 
                  px="$2" 
                  py="$1" 
                  br="$10" 
                  borderWidth={1} 
                  borderColor="$borderColor"
                >
                  <YStack bc="$blue5" w={16} h={16} br={8} ai="center" jc="center">
                    <Text fontSize={8} color="white" fontWeight="bold">
                      {(m.profiles?.name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </YStack>
                  <Text fontSize={12} fontWeight={m.user_id === user?.id ? "bold" : "400"}>
                    {m.profiles?.name?.split(' ')[0] || 'User'}
                  </Text>
                  {m.role === 'owner' && <Text fontSize={8}>👑</Text>}
                </XStack>
              ))}
            </XStack>
          </ScrollView>
        </XStack>

        <XStack gap="$3">
          <Input
            flex={1}
            placeholder="Add to list..."
            value={newItemName}
            onChangeText={setNewItemName}
            size="$4"
          />
          <Input
            width={96}
            placeholder="Qty"
            value={newItemQuantity}
            onChangeText={setNewItemQuantity}
            keyboardType="numeric"
            size="$4"
          />
          <Button 
            theme="active" 
            icon={Plus} 
            onPress={handleAddItem}
            size="$4"
          />
        </XStack>
        
        <XStack gap="$2" flexWrap="wrap">
          {UNITS.map(unit => (
            <Button 
              key={unit}
              size="$2"
              theme={selectedUnit === unit ? 'active' : undefined}
              onPress={() => setSelectedUnit(unit)}
              variant={selectedUnit === unit ? undefined : 'outlined'}
            >
              {unit}
            </Button>
          ))}
        </XStack>
      </YStack>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
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

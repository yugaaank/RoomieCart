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
import { supabase } from '../lib/supabase'
import { Container, YStack, XStack, Text, Button, Input, Card } from '../components/ui'
import { Plus, Check, ShoppingCart, Trash2, MessageSquare, AlertCircle, Settings, ChevronDown, ChevronUp, Tag, DollarSign, Info, MapPin } from '@tamagui/lucide-icons'
import {
  MAX_ITEM_NAME_LENGTH,
  MAX_QUANTITY_VALUE,
  isValidQuantityValue,
  sanitizeTextInput,
} from '../lib/validation'

type Props = NativeStackScreenProps<RootStackParamList, 'RoomDetails'>

const UNITS = ['pcs', 'kg', 'g', 'L', 'ml', 'pack', 'box', 'other']
const CATEGORIES = ['Produce', 'Dairy', 'Meat', 'Bakery', 'Frozen', 'Pantry', 'Cleaning', 'Personal Care', 'Other']
const PRIORITIES = ['low', 'medium', 'high']

export default function RoomDetailsScreen({ route, navigation }: Props) {
  const { roomId, roomName } = route.params
  const user = useAuthStore((state) => state.user)
  
  const [items, setItems] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  
  // Basic Form
  const [newItemName, setNewItemName] = useState('')
  const [newItemQuantity, setNewItemQuantity] = useState('1')
  const [selectedUnit, setSelectedUnit] = useState('pcs')
  const [selectedTargetMemberIds, setSelectedTargetMemberIds] = useState<string[]>([])
  
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [notes, setNotes] = useState('')
  const [estimatedPrice, setEstimatedPrice] = useState('')
  const [store, setStore] = useState('')

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pendingRequestCount, setPendingRequestCount] = useState(0)
  const [addItemError, setAddItemError] = useState<string | null>(null)

  const [selectedItem, setSelectedItem] = useState<ShoppingItem | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)

  const fetchItems = useCallback(async () => {
    try {
      const [itemsData, membersData, pendingRequests] = await Promise.all([
        itemService.getRoomItems(roomId),
        roomService.getRoomMembers(roomId),
        itemService.getPendingRequests(roomId),
      ])
      setItems(itemsData)
      setMembers(membersData)
      setPendingRequestCount(pendingRequests.length)
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
            {pendingRequestCount > 0 ? `Requests (${pendingRequestCount})` : 'Requests'}
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
  }, [navigation, roomName, roomId, pendingRequestCount])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  useRealtimeItems(roomId, fetchItems)

  useEffect(() => {
    const requestChannel = supabase
      .channel(`room-request-count-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'item_change_requests',
        },
        () => {
          fetchItems()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(requestChannel)
    }
  }, [fetchItems, roomId])

  const onRefresh = () => {
    setRefreshing(true)
    fetchItems()
  }

  const handleAddItem = async () => {
    const sanitizedItemName = sanitizeTextInput(newItemName)
    const sanitizedQuantity = sanitizeTextInput(newItemQuantity)
    const priceNum = estimatedPrice ? parseFloat(estimatedPrice) : undefined

    if (!sanitizedItemName) {
      setAddItemError('Enter an item name.')
      return
    }

    if (!isValidQuantityValue(sanitizedQuantity)) {
      setAddItemError(`Quantity must be a number between 0 and ${MAX_QUANTITY_VALUE}.`)
      return
    }

    setAddItemError(null)

    try {
      const existing = await itemService.searchDuplicate(roomId, sanitizedItemName)
      if (existing) {
        const requestedQty = parseFloat(sanitizedQuantity) || 1
        Alert.alert(
          'Duplicate Item',
          `"${existing.name}" is already on the list.`,
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
        sanitizeTextInput(newItemName),
        sanitizeTextInput(newItemQuantity),
        selectedUnit,
        selectedTargetMemberIds,
        {
          category: category || undefined,
          priority: priority,
          notes: notes.trim() || undefined,
          estimated_price: estimatedPrice ? parseFloat(estimatedPrice) : undefined,
          store: store.trim() || undefined
        }
      )
      setItems((currentItems) => [newItem, ...currentItems])
      
      // Reset Form
      setNewItemName('')
      setNewItemQuantity('1')
      setSelectedTargetMemberIds([])
      setCategory('')
      setPriority('medium')
      setNotes('')
      setEstimatedPrice('')
      setStore('')
      setAddItemError(null)
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  const toggleTargetMember = (memberUserId: string) => {
    setSelectedTargetMemberIds((currentIds) =>
      currentIds.includes(memberUserId)
        ? currentIds.filter((id) => id !== memberUserId)
        : [...currentIds, memberUserId]
    )
  }

  const getTargetMemberLabel = (item: any) => {
    if (!item.target_member_ids || item.target_member_ids.length === 0) {
      return 'Everyone'
    }

    const selectedNames = members
      .filter((member) => item.target_member_ids.includes(member.user_id))
      .map((member) => member.profiles?.name?.split(' ')[0] || 'User')

    return selectedNames.length > 0 ? selectedNames.join(', ') : 'Selected'
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
        { text: 'Propose Changes', onPress: () => setIsModalVisible(true) },
        { text: 'Delete Item', style: 'destructive', onPress: () => deleteItem(item.id) }
      ]
    )
  }

  const renderItem = ({ item }: { item: ShoppingItem | any }) => {
    const priorityColor = item.priority === 'high' ? '$red10' : item.priority === 'low' ? '$blue10' : '$colorSubtitle'
    
    return (
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
        <XStack jc="space-between" ai="flex-start">
          <XStack gap="$3" ai="flex-start" flex={1}>
            <YStack 
              width={24} 
              height={24} 
              borderRadius={12} 
              borderWidth={1} 
              borderColor={item.status === 'purchased' ? '$green10' : '$colorSubtitle'}
              ai="center" 
              jc="center"
              marginTop="$1"
              backgroundColor={item.status === 'purchased' ? '$green10' : 'transparent'}
            >
              {item.status === 'purchased' && <Check size={14} color="white" />}
            </YStack>
            
            <YStack flex={1} gap="$1">
              <XStack ai="center" gap="$2">
                <Text 
                  fontSize={16} 
                  fontWeight="bold"
                  textDecorationLine={item.status === 'purchased' ? 'line-through' : 'none'}
                >
                  {item.name}
                </Text>
                {(item.priority && item.priority !== 'medium') && (
                  <Text fontSize={10} fontWeight="bold" color={priorityColor}>
                    [{item.priority.toUpperCase()}]
                  </Text>
                )}
              </XStack>

              <XStack gap="$2" flexWrap="wrap">
                <Text fontSize={14} color="$colorSubtitle">
                  {item.quantity} {item.unit || ''}
                </Text>
                {item.category && (
                  <XStack ai="center" gap="$1" bc="$backgroundStrong" px="$2" br="$2">
                    <Tag size={10} color="$colorSubtitle" />
                    <Text fontSize={11} color="$colorSubtitle">{item.category}</Text>
                  </XStack>
                )}
                {item.store && (
                  <XStack ai="center" gap="$1" bc="$backgroundStrong" px="$2" br="$2">
                    <MapPin size={10} color="$colorSubtitle" />
                    <Text fontSize={11} color="$colorSubtitle">{item.store}</Text>
                  </XStack>
                )}
                {item.estimated_price && (
                  <XStack ai="center" gap="$1" bc="$green2" px="$2" br="$2">
                    <DollarSign size={10} color="$green10" />
                    <Text fontSize={11} color="$green10">${item.estimated_price}</Text>
                  </XStack>
                )}
              </XStack>

              {item.notes && (
                <XStack ai="flex-start" gap="$1">
                  <Info size={12} color="$colorSubtitle" marginTop="$1" />
                  <Text fontSize={12} fontStyle="italic" color="$colorSubtitle" flex={1}>
                    {item.notes}
                  </Text>
                </XStack>
              )}

              <YStack gap="$1" marginTop="$1">
                {item.status === 'discussion_pending' && (
                  <XStack ai="center" gap="$1" backgroundColor="$yellow4" paddingHorizontal="$2" borderRadius="$2" alignSelf="flex-start">
                    <AlertCircle size={12} color="$yellow10" />
                    <Text fontSize={10} color="$yellow10" fontWeight="bold">NEGOTIATING</Text>
                  </XStack>
                )}
                <Text fontSize={10} color="$colorSubtitle">
                  Added by {item.profiles?.name || 'Someone'} • For: {getTargetMemberLabel(item)}
                </Text>
              </YStack>
            </YStack>
          </XStack>
          
          <Button 
            size="$2" 
            circular 
            icon={Trash2} 
            chromeless 
            theme="red" 
            onPress={() => deleteItem(item.id)} 
          />
        </XStack>
      </Card>
    )
  }

  return (
    <Container padding="$0">
      <YStack padding="$4" backgroundColor="$backgroundStrong" borderBottomWidth={1} borderColor="$borderColor" gap="$3">
        {/* Required Section */}
        <YStack gap="$3">
          <XStack gap="$3">
            <Input
              flex={1}
              placeholder="Item name..."
              value={newItemName}
              onChangeText={setNewItemName}
              size="$4"
              maxLength={MAX_ITEM_NAME_LENGTH}
            />
            <Input
              width={70}
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

          <YStack gap="$2">
            <Text fontSize={12} fontWeight="bold" color="$colorSubtitle">UNIT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <XStack gap="$1">
                {UNITS.map(u => (
                  <Button 
                    key={u} 
                    size="$2" 
                    backgroundColor={selectedUnit === u ? '$blue9' : '$background'}
                    color={selectedUnit === u ? 'white' : '$color'}
                    onPress={() => setSelectedUnit(u)}
                    borderWidth={1}
                    borderColor={selectedUnit === u ? '$blue9' : '$borderColor'}
                  >
                    {u}
                  </Button>
                ))}
              </XStack>
            </ScrollView>
          </YStack>

          <YStack gap="$2">
            <Text fontSize={12} fontWeight="bold" color="$colorSubtitle">WHO IS THIS FOR?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <XStack gap="$1">
                <Button 
                  size="$2" 
                  backgroundColor={selectedTargetMemberIds.length === 0 ? '$blue9' : '$background'}
                  color={selectedTargetMemberIds.length === 0 ? 'white' : '$color'}
                  onPress={() => setSelectedTargetMemberIds([])}
                  borderWidth={1}
                  borderColor={selectedTargetMemberIds.length === 0 ? '$blue9' : '$borderColor'}
                >
                  Everyone
                </Button>
                {members.map(m => (
                  <Button 
                    key={m.user_id} 
                    size="$2" 
                    backgroundColor={selectedTargetMemberIds.includes(m.user_id) ? '$blue9' : '$background'}
                    color={selectedTargetMemberIds.includes(m.user_id) ? 'white' : '$color'}
                    onPress={() => toggleTargetMember(m.user_id)}
                    borderWidth={1}
                    borderColor={selectedTargetMemberIds.includes(m.user_id) ? '$blue9' : '$borderColor'}
                  >
                    {m.profiles?.name?.split(' ')[0]}
                  </Button>
                ))}
              </XStack>
            </ScrollView>
          </YStack>
        </YStack>

        <YStack borderTopWidth={1} borderColor="$borderColor" paddingTop="$3" gap="$3">
          <Text fontSize={12} fontWeight="bold" color="$colorSubtitle">EXTRA DETAILS (OPTIONAL)</Text>
          
          <YStack gap="$2">
            <Text fontSize={11} fontWeight="bold">CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <XStack gap="$1">
                {CATEGORIES.map(c => (
                  <Button 
                    key={c} 
                    size="$2" 
                    backgroundColor={category === c ? '$blue10' : '$background'}
                    color={category === c ? 'white' : '$color'}
                    onPress={() => setCategory(c)}
                    borderWidth={1}
                    borderColor={category === c ? '$blue10' : '$borderColor'}
                  >
                    {c}
                  </Button>
                ))}
              </XStack>
            </ScrollView>
          </YStack>

          <XStack gap="$3">
            <YStack f={1} gap="$1">
              <Text fontSize={11} fontWeight="bold">PRIORITY</Text>
              <XStack gap="$1">
                {PRIORITIES.map(p => (
                  <Button 
                    key={p} 
                    f={1} 
                    size="$2" 
                    backgroundColor={priority === p ? '$blue10' : '$background'}
                    color={priority === p ? 'white' : '$color'}
                    onPress={() => setPriority(p as any)}
                    borderWidth={1}
                    borderColor={priority === p ? '$blue10' : '$borderColor'}
                  >
                    {p.charAt(0).toUpperCase()}
                  </Button>
                ))}
              </XStack>
            </YStack>
            <YStack f={1} gap="$1">
              <Text fontSize={11} fontWeight="bold">EST. PRICE</Text>
              <Input size="$3" value={estimatedPrice} onChangeText={setEstimatedPrice} keyboardType="numeric" placeholder="$0.00" />
            </YStack>
            <YStack f={1} gap="$1">
              <Text fontSize={11} fontWeight="bold">STORE</Text>
              <Input size="$3" value={store} onChangeText={setStore} placeholder="Costco..." />
            </YStack>
          </XStack>

          <YStack gap="$1">
            <Text fontSize={11} fontWeight="bold">NOTES</Text>
            <Input size="$3" value={notes} onChangeText={setNotes} placeholder="Brand, size, etc." />
          </YStack>
        </YStack>

        {addItemError && (
          <Text color="$red10" fontSize={12} marginTop="$1">
            {addItemError}
          </Text>
        )}
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
              Your shopping list is empty.
            </Text>
          </YStack>
        }
      />

      <RequestChangeModal
        visible={isModalVisible}
        item={selectedItem}
        userId={user!.id}
        roomMembers={members}
        onClose={() => setIsModalVisible(false)}
        onSuccess={() => {
          fetchItems()
          setSelectedItem(null)
        }}
      />
    </Container>
  )
}

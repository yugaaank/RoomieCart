import { useState, useEffect, useLayoutEffect, useCallback, useMemo } from 'react'
import { FlatList, Alert, ScrollView, StyleSheet } from 'react-native'
import { itemService } from '../services/itemService'
import { roomService } from '../services/roomService'
import { useAuthStore } from '../store/authStore'
import { ShoppingItem } from '../types/database.types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useRealtimeItems } from '../hooks/useRealtimeItems'
import RequestChangeModal from '../components/RequestChangeModal'
import AddItemSheet from '../components/AddItemSheet'
import { supabase } from '../lib/supabase'
import { Container, YStack, XStack, Text, Button, Card } from '../components/ui'
import { 
  Plus, 
  Check, 
  ShoppingCart, 
  Trash2, 
  MessageSquare, 
  AlertCircle, 
  Settings, 
  Tag, 
  DollarSign, 
  Info, 
  MapPin,
  Filter,
  User,
  LayoutGrid
} from '@tamagui/lucide-icons'

type Props = NativeStackScreenProps<RootStackParamList, 'RoomDetails'>

const CATEGORIES = ['Produce', 'Dairy', 'Meat', 'Bakery', 'Frozen', 'Pantry', 'Cleaning', 'Personal Care', 'Other']

export default function RoomDetailsScreen({ route, navigation }: Props) {
  const { roomId, roomName } = route.params
  const user = useAuthStore((state) => state.user)
  
  const [items, setItems] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pendingRequestCount, setPendingRequestCount] = useState(0)
  
  // Modals
  const [selectedItem, setSelectedItem] = useState<ShoppingItem | null>(null)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isAddSheetVisible, setIsAddSheetVisible] = useState(false)

  // Filters
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null)
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string | null>(null)
  const [sortByCategory, setSortByCategory] = useState(false)

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
            {pendingRequestCount > 0 ? `(${pendingRequestCount})` : ''}
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

  const handleAddData = async (data: any) => {
    try {
      const newItem = await itemService.addItem(
        roomId,
        user!.id,
        data.name,
        data.quantity,
        data.unit,
        data.targetMemberIds,
        {
          category: data.category,
          priority: data.priority,
          notes: data.notes,
          estimated_price: data.estimated_price,
          store: data.store
        }
      )
      setItems((currentItems) => [newItem, ...currentItems])
    } catch (err: any) {
      throw err
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
        { text: 'Propose Changes', onPress: () => setIsEditModalVisible(true) },
        { text: 'Delete Item', style: 'destructive', onPress: () => deleteItem(item.id) }
      ]
    )
  }

  const filteredAndSortedItems = useMemo(() => {
    let result = [...items]

    // Filtering
    if (selectedCategoryFilter) {
      result = result.filter(item => item.category === selectedCategoryFilter)
    }
    if (selectedMemberFilter) {
      result = result.filter(item => 
        !item.target_member_ids || 
        item.target_member_ids.length === 0 || 
        item.target_member_ids.includes(selectedMemberFilter)
      )
    }

    // Sorting
    if (sortByCategory) {
      result.sort((a, b) => {
        const catA = a.category || 'Z-Other'
        const catB = b.category || 'Z-Other'
        if (catA < catB) return -1
        if (catA > catB) return 1
        return 0
      })
    }

    // Secondary sort: active first, then created_at
    result.sort((a, b) => {
      if (a.status === 'purchased' && b.status !== 'purchased') return 1
      if (a.status !== 'purchased' && b.status === 'purchased') return -1
      return 0
    })

    return result
  }, [items, selectedCategoryFilter, selectedMemberFilter, sortByCategory])

  const renderItem = ({ item }: { item: any }) => {
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
                  Added by {item.profiles?.name || 'Someone'}
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
      <YStack bc="$backgroundStrong" p="$3" borderBottomWidth={1} borderColor="$borderColor" gap="$3">
        {/* Sorting & Category Filter */}
        <YStack gap="$2">
          <XStack ai="center" jc="space-between">
            <XStack ai="center" gap="$2">
              <Filter size={16} color="$colorSubtitle" />
              <Text fontSize={12} fontWeight="bold" color="$colorSubtitle">FILTERS</Text>
            </XStack>
            <Button 
              size="$2" 
              bc={sortByCategory ? '$blue5' : 'transparent'}
              icon={LayoutGrid} 
              onPress={() => setSortByCategory(!sortByCategory)}
              chromeless
            >
              Sort by Category
            </Button>
          </XStack>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack gap="$1">
              <Button 
                size="$2" 
                backgroundColor={selectedCategoryFilter === null ? '$blue9' : '$background'}
                color={selectedCategoryFilter === null ? 'white' : '$color'}
                onPress={() => setSelectedCategoryFilter(null)}
                borderWidth={1}
                borderColor={selectedCategoryFilter === null ? '$blue9' : '$borderColor'}
              >
                All Categories
              </Button>
              {CATEGORIES.map(cat => (
                <Button 
                  key={cat} 
                  size="$2" 
                  backgroundColor={selectedCategoryFilter === cat ? '$blue9' : '$background'}
                  color={selectedCategoryFilter === cat ? 'white' : '$color'}
                  onPress={() => setSelectedCategoryFilter(cat)}
                  borderWidth={1}
                  borderColor={selectedCategoryFilter === cat ? '$blue9' : '$borderColor'}
                >
                  {cat}
                </Button>
              ))}
            </XStack>
          </ScrollView>
        </YStack>

        {/* Member Filter */}
        <YStack gap="$2">
          <XStack ai="center" gap="$2">
            <User size={16} color="$colorSubtitle" />
            <Text fontSize={12} fontWeight="bold" color="$colorSubtitle">SHOPPING FOR</Text>
          </XStack>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack gap="$1">
              <Button 
                size="$2" 
                backgroundColor={selectedMemberFilter === null ? '$blue9' : '$background'}
                color={selectedMemberFilter === null ? 'white' : '$color'}
                onPress={() => setSelectedMemberFilter(null)}
                borderWidth={1}
                borderColor={selectedMemberFilter === null ? '$blue9' : '$borderColor'}
              >
                Everyone
              </Button>
              {members.map(m => (
                <Button 
                  key={m.user_id} 
                  size="$2" 
                  backgroundColor={selectedMemberFilter === m.user_id ? '$blue9' : '$background'}
                  color={selectedMemberFilter === m.user_id ? 'white' : '$color'}
                  onPress={() => setSelectedMemberFilter(m.user_id)}
                  borderWidth={1}
                  borderColor={selectedMemberFilter === m.user_id ? '$blue9' : '$borderColor'}
                >
                  {m.profiles?.name?.split(' ')[0]}
                </Button>
              ))}
            </XStack>
          </ScrollView>
        </YStack>
      </YStack>

      <FlatList
        data={filteredAndSortedItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <YStack ai="center" jc="center" padding="$10" gap="$4">
            <ShoppingCart size={48} color="$colorSubtitle" opacity={0.5} />
            <Text textAlign="center" color="$colorSubtitle">
              No items found.
            </Text>
          </YStack>
        }
      />

      {/* Floating Add Button */}
      <Button
        position="absolute"
        bottom={30}
        right={30}
        size="$6"
        circular
        theme="active"
        icon={Plus}
        elevation="$4"
        onPress={() => setIsAddSheetVisible(true)}
      />

      <AddItemSheet 
        visible={isAddSheetVisible}
        onClose={() => setIsAddSheetVisible(false)}
        onAdd={handleAddData}
        members={members}
      />

      <RequestChangeModal
        visible={isEditModalVisible}
        item={selectedItem}
        userId={user!.id}
        roomMembers={members}
        onClose={() => setIsEditModalVisible(false)}
        onSuccess={() => {
          fetchItems()
          setSelectedItem(null)
        }}
      />
    </Container>
  )
}

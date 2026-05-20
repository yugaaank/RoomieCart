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
import { Container, YStack, XStack, Text, Button, Card, Badge } from '../components/ui'
import { 
  Plus, 
  Check, 
  ShoppingCart, 
  Trash2, 
  AlertCircle, 
  Settings, 
  Tag, 
  DollarSign, 
  Info, 
  MapPin,
  Filter,
  User,
  LayoutGrid,
  ChevronRight,
  X
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
      headerTitle: () => (
        <YStack ai="center">
          <Text fontSize={16} fontWeight="700" letterSpacing={-0.5}>{roomName}</Text>
          <Text fontSize={11} color="$colorSubtitle" fontWeight="500">Room Details</Text>
        </YStack>
      ),
      headerRight: () => (
        <XStack gap="$1" ai="center">
          <Button 
            size="$2" 
            circular 
            variant="ghost" 
            icon={AlertCircle} 
            onPress={() => navigation.navigate('PendingRequests', { roomId })}
          >
            {pendingRequestCount > 0 && (
              <Badge variant="destructive" position="absolute" top={-4} right={-4} width={16} height={16} padding={0}>
                <Text fontSize={8} color="white" fontWeight="900">{pendingRequestCount}</Text>
              </Badge>
            )}
          </Button>
          <Button 
            size="$2" 
            circular 
            variant="ghost" 
            icon={Settings} 
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
    setIsEditModalVisible(true)
  }

  const filteredAndSortedItems = useMemo(() => {
    let result = [...items]

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

    if (sortByCategory) {
      result.sort((a, b) => {
        const catA = a.category || 'Z-Other'
        const catB = b.category || 'Z-Other'
        if (catA < catB) return -1
        if (catA > catB) return 1
        return 0
      })
    }

    result.sort((a, b) => {
      if (a.status === 'purchased' && b.status !== 'purchased') return 1
      if (a.status !== 'purchased' && b.status === 'purchased') return -1
      return 0
    })

    return result
  }, [items, selectedCategoryFilter, selectedMemberFilter, sortByCategory])

  const renderItem = ({ item }: { item: any }) => {
    const isNegotiating = item.status === 'discussion_pending'
    const isPurchased = item.status === 'purchased'

    return (
      <Card 
        padding="$0" 
        marginBottom="$3"
        onPress={() => toggleStatus(item)}
        onLongPress={() => handleLongPress(item)}
        opacity={isPurchased ? 0.6 : 1}
        elevation={isPurchased ? 0 : 2}
        borderRadius="$3"
        borderColor={isNegotiating ? '$yellow8' : '$borderColor'}
        overflow="hidden"
      >
        <XStack f={1} p="$4" ai="center" gap="$4">
          <YStack 
            width={24} 
            height={24} 
            borderRadius={12} 
            borderWidth={1.5} 
            borderColor={isPurchased ? '$green9' : '$borderColor'}
            ai="center" 
            jc="center"
            backgroundColor={isPurchased ? '$green9' : 'transparent'}
          >
            {isPurchased && <Check size={14} color="white" fontWeight="bold" />}
          </YStack>

          <YStack f={1} gap="$1">
            <XStack ai="center" jc="space-between">
              <XStack ai="center" gap="$2" f={1}>
                <Text 
                  fontSize={16} 
                  fontWeight="600"
                  color={isPurchased ? '$colorSubtitle' : '$color'}
                  textDecorationLine={isPurchased ? 'line-through' : 'none'}
                >
                  {item.name}
                </Text>
                {item.priority === 'high' && (
                  <Badge variant="destructive">
                    <Text fontSize={8} fontWeight="900" color="$red11">URGENT</Text>
                  </Badge>
                )}
              </XStack>
              <Button 
                size="$2" 
                variant="ghost" 
                circular 
                icon={Trash2} 
                opacity={0.3}
                onPress={(e) => {
                  e.stopPropagation()
                  deleteItem(item.id)
                }}
              />
            </XStack>

            <XStack ai="center" gap="$2">
              <Text fontSize={14} fontWeight="500" color={isPurchased ? '$colorSubtitle' : '$color'}>
                {item.quantity} {item.unit || ''}
              </Text>
              {item.category && (
                <Badge variant="outline">
                  <Text fontSize={10} fontWeight="600" color="$colorSubtitle">{item.category}</Text>
                </Badge>
              )}
            </XStack>

            <XStack gap="$3" ai="center" flexWrap="wrap" marginTop="$1">
              {item.store && (
                <XStack ai="center" gap="$1">
                  <MapPin size={10} color="$colorSubtitle" />
                  <Text fontSize={11} color="$colorSubtitle">{item.store}</Text>
                </XStack>
              )}
              {item.estimated_price && (
                <XStack ai="center" gap="$1">
                  <DollarSign size={10} color="$green10" />
                  <Text fontSize={11} fontWeight="700" color="$green10">{item.estimated_price}</Text>
                </XStack>
              )}
            </XStack>

            {isNegotiating && (
              <Badge variant="secondary" backgroundColor="$yellow2" borderColor="$yellow5" borderWidth={1} alignSelf="flex-start" marginTop="$1">
                <XStack ai="center" gap="$1">
                  <AlertCircle size={10} color="$yellow10" />
                  <Text fontSize={9} color="$yellow10" fontWeight="800">PENDING CHANGES</Text>
                </XStack>
              </Badge>
            )}

            <XStack jc="space-between" ai="center" marginTop="$2">
              <Text fontSize={10} color="$colorSubtitle">
                By <Text fontWeight="700">{item.profiles?.name || 'User'}</Text>
              </Text>

              {item.target_member_ids && item.target_member_ids.length > 0 && (
                <XStack>
                  {item.target_member_ids.slice(0, 3).map((id: string, idx: number) => (
                    <YStack 
                      key={id} 
                      width={18} 
                      height={18} 
                      br={9} 
                      bc="$backgroundStrong" 
                      ai="center" 
                      jc="center"
                      ml={idx > 0 ? -6 : 0}
                      bw={1}
                      boc="$background"
                    >
                      <Text fontSize={8} fontWeight="700" color="$color">
                        {members.find(m => m.user_id === id)?.profiles?.name?.charAt(0) || '?'}
                      </Text>
                    </YStack>
                  ))}
                </XStack>
              )}
            </XStack>
          </YStack>
        </XStack>
      </Card>
    )
  }

  return (
    <Container padding="$0">
      <YStack bc="$background" p="$3" borderBottomWidth={1} borderColor="$borderColor" gap="$3">
        <YStack gap="$2">
          <XStack ai="center" jc="space-between" px="$1">
            <XStack ai="center" gap="$1.5">
              <Filter size={12} color="$colorSubtitle" />
              <Text fontSize={11} fontWeight="700" color="$colorSubtitle" letterSpacing={0.5}>FILTERS</Text>
            </XStack>
            <Button 
              size="$1.5" 
              variant="ghost" 
              icon={LayoutGrid} 
              onPress={() => setSortByCategory(!sortByCategory)}
              backgroundColor={sortByCategory ? '$backgroundStrong' : 'transparent'}
            >
              <Text fontSize={10} fontWeight="700">Group Categories</Text>
            </Button>
          </XStack>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack gap="$2" px="$1">
              <Button 
                size="$2.5" 
                variant={selectedCategoryFilter === null ? 'primary' : 'outline'}
                onPress={() => setSelectedCategoryFilter(null)}
                borderRadius="$full"
                paddingHorizontal="$4"
              >
                All
              </Button>
              {CATEGORIES.map(cat => (
                <Button 
                  key={cat} 
                  size="$2.5" 
                  variant={selectedCategoryFilter === cat ? 'primary' : 'outline'}
                  onPress={() => setSelectedCategoryFilter(cat)}
                  borderRadius="$full"
                  paddingHorizontal="$4"
                >
                  {cat}
                </Button>
              ))}
            </XStack>
          </ScrollView>
        </YStack>

        <YStack gap="$2">
          <XStack ai="center" gap="$1.5" px="$1">
            <User size={12} color="$colorSubtitle" />
            <Text fontSize={11} fontWeight="700" color="$colorSubtitle" letterSpacing={0.5}>SHOPPING FOR</Text>
          </XStack>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack gap="$2" px="$1">
              <Button 
                size="$2.5" 
                variant={selectedMemberFilter === null ? 'primary' : 'outline'}
                onPress={() => setSelectedMemberFilter(null)}
                borderRadius="$full"
                paddingHorizontal="$4"
              >
                Everyone
              </Button>
              {members.map(m => (
                <Button 
                  key={m.user_id} 
                  size="$2.5" 
                  variant={selectedMemberFilter === m.user_id ? 'primary' : 'outline'}
                  onPress={() => setSelectedMemberFilter(m.user_id)}
                  borderRadius="$full"
                  paddingHorizontal="$4"
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
            <ShoppingCart size={40} color="$borderColor" />
            <Text textAlign="center" color="$colorSubtitle" fontSize={14} fontWeight="500">
              No items in this room yet.
            </Text>
          </YStack>
        }
      />

      <Button
        position="absolute"
        bottom={32}
        right={24}
        size="$5"
        circular
        variant="primary"
        icon={isAddSheetVisible ? X : Plus}
        elevation={4}
        onPress={() => setIsAddSheetVisible(!isAddSheetVisible)}
        zIndex={2000}
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

import { useState, useEffect, useLayoutEffect, useCallback, useMemo } from 'react'
import { FlatList, Alert, ScrollView } from 'react-native'
import { itemService } from '../services/itemService'
import { roomService } from '../services/roomService'
import { useAuthStore } from '../store/authStore'
import { ShoppingItem } from '../types/database.types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useRealtimeItems } from '../hooks/useRealtimeItems'
import RequestChangeModal from '../components/RequestChangeModal'
import AddItemSheet from '../components/AddItemSheet'
import { ItemActionMenu } from '../components/ItemActionMenu'
import ItemDetailsModal from '../components/ItemDetailsModal'
import { supabase } from '../lib/supabase'
import { Container, YStack, XStack, Text, Button, Card, Badge } from '../components/ui'
import { Plus, Check, ShoppingCart, Trash2, MessageSquare, Settings, MapPin, DollarSign, Filter, User, LayoutGrid, X, MoreVertical } from '@tamagui/lucide-icons'

type Props = NativeStackScreenProps<RootStackParamList, 'RoomDetails'>
const CATEGORIES = ['Produce', 'Dairy', 'Meat', 'Bakery', 'Frozen', 'Pantry', 'Cleaning', 'Personal Care', 'Other']

export default function RoomDetailsScreen({ route, navigation }: Props) {
  const { roomId, roomName } = route.params
  const user = useAuthStore((state) => state.user)
  const [items, setItems] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingRequestCount, setPendingRequestCount] = useState(0)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null)
  const [isAddSheetVisible, setIsAddSheetVisible] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ShoppingItem | null>(null)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isActionMenuVisible, setIsActionMenuVisible] = useState(false)
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false)

  const handleItemLongPress = (item: ShoppingItem) => {
    setSelectedItem(item)
    setIsActionMenuVisible(true)
  }

  const deleteItem = async (itemId: string) => {
    try {
      await itemService.deleteItem(itemId)
      setItems((currentItems) => currentItems.filter((item) => item.id !== itemId))
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
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
      setItems(prev => [newItem, ...prev])
    } catch (err: any) {
      throw err
    }
  }

  const fetchItems = useCallback(async () => {
    const [itemsData, membersData, pendingRequests] = await Promise.all([itemService.getRoomItems(roomId), roomService.getRoomMembers(roomId), itemService.getPendingRequests(roomId)])
    setItems(itemsData)
    setMembers(membersData)
    setPendingRequestCount(pendingRequests.length)
    setLoading(false)
  }, [roomId])

  useLayoutEffect(() => {
    navigation.setOptions({ 
      title: roomName,
      headerRight: () => (
        <XStack gap="$1" ai="center">
          <Button 
            size="$2" 
            circular 
            variant="ghost" 
            icon={MessageSquare} 
            onPress={() => navigation.navigate('PendingRequests', { roomId })}
          >
            {pendingRequestCount > 0 && (
              <Badge variant="destructive" position="absolute" top={-2} right={-2} width={18} height={18} padding={0} zIndex={10}>
                <Text fontSize={9} color="white" fontWeight="900" textAlign="center">{pendingRequestCount}</Text>
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

  useEffect(() => { fetchItems() }, [fetchItems])
  useRealtimeItems(roomId, fetchItems)

  const filteredItems = useMemo(() => {
    return selectedCategoryFilter ? items.filter(i => i.category === selectedCategoryFilter) : items
  }, [items, selectedCategoryFilter])

  const sections = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    filteredItems.forEach(item => {
      const cat = item.category || 'Other'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(item)
    })
    return Object.entries(grouped).map(([title, data]) => ({ title, data }))
  }, [filteredItems])

  return (
    <Container padding="$0">
      <YStack padding="$4" gap="$3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}>
           <Button height={28} variant={selectedCategoryFilter === null ? 'primary' : 'outline'} onPress={() => setSelectedCategoryFilter(null)} borderRadius="$full" paddingHorizontal="$3" fontSize={12}>All Items</Button>
           {CATEGORIES.map(cat => (
             <Button key={cat} height={28} variant={selectedCategoryFilter === cat ? 'primary' : 'outline'} onPress={() => setSelectedCategoryFilter(cat)} borderRadius="$full" paddingHorizontal="$3" fontSize={12}>{cat}</Button>
           ))}
        </ScrollView>
        <XStack ai="center" flexWrap="wrap" gap="$1">
          <Text fontSize={12} color="$colorSubtitle" fontWeight="700">MEMBERS:</Text>
          <XStack flexWrap="wrap" gap="$1">
             {members.map((m) => (
                <YStack key={m.user_id} width={28} height={28} borderRadius="$1" backgroundColor="$primary" alignItems="center" justifyContent="center">
                  <Text fontSize={12} fontWeight="bold" color="white">{m.profiles?.name?.charAt(0).toUpperCase() || '?'}</Text>
                </YStack>
             ))}
          </XStack>
        </XStack>
      </YStack>

      <FlatList
        data={sections}
        keyExtractor={(s) => s.title}
        renderItem={({ item: section }) => (
          <YStack>
            <Text padding="$4" fontSize={16} fontWeight="700" color="$primary">{section.title}</Text>
            {section.data.map(item => (
              <Card key={item.id} marginHorizontal="$4" marginBottom="$3" onLongPress={() => handleItemLongPress(item)} onPress={() => itemService.updateItemStatus(item.id, item.status === 'active' ? 'purchased' : 'active').then(fetchItems)}>
                <XStack ai="center" gap="$4">
                  <YStack 
                    width={24} 
                    height={24} 
                    borderRadius="$3" 
                    borderWidth={1.5} 
                    borderColor={item.status === 'purchased' ? '$primary' : '$borderColor'} 
                    backgroundColor={item.status === 'purchased' ? '$primary' : 'transparent'} 
                    ai="center" 
                    jc="center"
                  >
                    {item.status === 'purchased' && <Check size={14} color="white" />}
                  </YStack>
                  <YStack f={1}>
                    <Text fontWeight="600">{item.name}</Text>
                    <Text fontSize={12} color="$colorSubtitle">Requested by {item.profiles?.name || 'User'}</Text>
                    
                    {/* Inline extra details */}
                    <XStack gap="$2" ai="center" mt="$1" flexWrap="wrap">
                      {item.store && (
                         <XStack ai="center" gap="$1"><MapPin size={10} color="$colorSubtitle"/><Text fontSize={10} color="$colorSubtitle">{item.store}</Text></XStack>
                      )}
                      {item.estimated_price && (
                         <XStack ai="center" gap="$1"><DollarSign size={10} color="$colorSubtitle"/><Text fontSize={10} color="$colorSubtitle">${item.estimated_price}</Text></XStack>
                      )}
                      {item.notes && (
                         <Text fontSize={10} color="$colorSubtitle" fontStyle="italic">"{item.notes}"</Text>
                      )}
                    </XStack>
                  </YStack>
                  <Text fontSize={12} color="$colorSubtitle">Qty: {item.quantity}</Text>
                  <Button size="$2" variant="ghost" circular icon={MoreVertical} onPress={() => handleItemLongPress(item)} />
                </XStack>
              </Card>
            ))}
          </YStack>
        )}
      />

      <Button position="absolute" bottom={32} right={24} size="$5" circular variant="primary" icon={Plus} elevation={4} onPress={() => setIsAddSheetVisible(true)} zIndex={10000} />
      
      <AddItemSheet visible={isAddSheetVisible} onClose={() => setIsAddSheetVisible(false)} onAdd={handleAddData} members={members} />

      <ItemActionMenu 
        visible={isActionMenuVisible} 
        onClose={() => setIsActionMenuVisible(false)}
        onIssue={() => { setIsActionMenuVisible(false); setIsEditModalVisible(true) }}
        onDetails={() => { setIsActionMenuVisible(false); setIsDetailsModalVisible(true) }}
        onRemove={() => { setIsActionMenuVisible(false); selectedItem && deleteItem(selectedItem.id) }}
      />
      
      <ItemDetailsModal
        visible={isDetailsModalVisible}
        item={selectedItem}
        onClose={() => setIsDetailsModalVisible(false)}
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

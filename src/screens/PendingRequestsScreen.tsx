import { useState, useEffect, useCallback } from 'react'
import { FlatList, Alert } from 'react-native'
import { itemService } from '../services/itemService'
import { roomService } from '../services/roomService'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { Container, YStack, XStack, Text, Button, Card } from '../components/ui'
import { Check, X, ArrowRight, Clock3, AlertCircle } from '@tamagui/lucide-icons'

type Props = NativeStackScreenProps<RootStackParamList, 'PendingRequests'>

export default function PendingRequestsScreen({ route, navigation }: Props) {
  const { roomId } = route.params
  const user = useAuthStore((state) => state.user)
  const [requests, setRequests] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = useCallback(async () => {
    try {
      const [requestsData, membersData] = await Promise.all([
        itemService.getPendingRequests(roomId),
        roomService.getRoomMembers(roomId),
      ])
      setRequests(requestsData)
      setMembers(membersData.filter((member: any) => member.status === 'active'))
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setLoading(false)
    }
  }, [roomId])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleResolve = async (requestId: string, vote: 'yes' | 'no') => {
    try {
      await itemService.submitChangeRequestVote(requestId, vote)
      fetchRequests()
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  const handleCancel = async (requestId: string) => {
    try {
      await itemService.cancelChangeRequest(requestId)
      fetchRequests()
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  const renderChangeItem = (label: string, oldVal: any, newVal: any) => {
    if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return null
    const displayOld = Array.isArray(oldVal) ? `${oldVal.length} members` : (oldVal || 'None')
    const displayNew = Array.isArray(newVal) ? `${newVal.length} members` : (newVal || 'None')
    return (
      <YStack key={label} gap="$1" paddingVertical="$2" borderBottomWidth={1} borderColor="$borderColor">
        <Text fontSize={12} fontWeight="bold" color="$colorSubtitle">{label.toUpperCase()}</Text>
        <XStack ai="center" gap="$2" flexWrap="wrap">
          <Text fontSize={14} color="$red10" textDecorationLine="line-through">{displayOld}</Text>
          <ArrowRight size={12} color="$colorSubtitle" />
          <Text fontSize={14} color="$primary" fontWeight="bold">{displayNew}</Text>
        </XStack>
      </YStack>
    )
  }

  const renderRequest = ({ item }: { item: any }) => {
    const votes = item.item_change_request_votes || []
    const yesVotes = votes.filter((v: any) => v.vote === 'yes').length
    const noVotes = votes.filter((v: any) => v.vote === 'no').length
    
    const newData = item.new_data || { quantity: item.new_quantity }
    const oldData = item.old_data || { quantity: item.old_quantity || item.shopping_items?.quantity }
    
    const eligibleMembers = members.filter((m: any) => m.user_id !== item.requested_by)
    const currentUserVote = votes.find((v: any) => v.voter_id === user?.id)
    const isRequester = item.requested_by === user?.id
    const isResolved = item.status !== 'pending'
    
    return (
      <Card padding="$4" marginBottom="$3" backgroundColor="$backgroundStrong" borderColor="$borderColor" borderWidth={1}>
        <YStack gap="$3">
          <XStack jc="space-between" ai="center">
            <YStack>
              <Text fontWeight="bold" fontSize={16} color="$color">{oldData.name || item.shopping_items?.name}</Text>
              <Text color="$colorSubtitle" fontSize={12}>Requested by {item.profiles?.name || 'Someone'}</Text>
            </YStack>
          </XStack>

          <YStack bc="$background" p="$3" br="$4">
            <Text fontSize={13} fontWeight="bold" mb="$2" color="$color">PROPOSED CHANGES:</Text>
            {renderChangeItem('Name', oldData.name, newData.name)}
            {renderChangeItem('Quantity', oldData.quantity, newData.quantity)}
            {renderChangeItem('Unit', oldData.unit, newData.unit)}
            {renderChangeItem('Est. Price', oldData.estimated_price, newData.estimated_price)}
            {renderChangeItem('Notes', oldData.notes, newData.notes)}
          </YStack>

          {item.reason && (
            <YStack bc="$background" p="$3" br="$4" borderLeftWidth={4} borderColor="$primary">
              <Text fontSize={14} fontStyle="italic" color="$color">"{item.reason}"</Text>
            </YStack>
          )}

          {isRequester ? (
            <Button variant="outline" size="$3" onPress={() => handleCancel(item.id)}>Cancel Request</Button>
          ) : currentUserVote ? (
            <XStack ai="center" jc="center" p="$2" bc="$background" br="$4"><Text fontWeight="bold" color="$color">You voted: {currentUserVote.vote.toUpperCase()}</Text></XStack>
          ) : isResolved ? (
            <Text textAlign="center" color="$colorSubtitle">Resolved</Text>
          ) : (
            <XStack gap="$3">
              <Button f={1} variant="outline" borderColor="$red10" color="$red10" icon={X} onPress={() => handleResolve(item.id, 'no')}>Reject</Button>
              <Button f={1} variant="primary" icon={Check} onPress={() => handleResolve(item.id, 'yes')}>Approve</Button>
            </XStack>
          )}
        </YStack>
      </Card>
    )
  }

  return (
    <Container>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequest}
        onRefresh={fetchRequests}
        refreshing={loading}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <YStack ai="center" jc="center" padding="$10" gap="$4">
            <AlertCircle size={48} color="$colorSubtitle" opacity={0.5} />
            <Text textAlign="center" color="$colorSubtitle">No pending change requests.</Text>
          </YStack>
        }
      />
    </Container>
  )
}

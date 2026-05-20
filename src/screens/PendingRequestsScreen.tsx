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

  useEffect(() => {
    const requestChannel = supabase
      .channel(`room-requests-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'item_change_requests',
        },
        () => {
          fetchRequests()
        }
      )
      .subscribe()

    const voteChannel = supabase
      .channel(`room-request-votes-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'item_change_request_votes',
        },
        () => {
          fetchRequests()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(requestChannel)
      supabase.removeChannel(voteChannel)
    }
  }, [fetchRequests, roomId])

  const handleResolve = async (requestId: string, vote: 'yes' | 'no') => {
    try {
      const updatedRequest = await itemService.submitChangeRequestVote(requestId, vote)

      if (updatedRequest.status === 'pending') {
        Alert.alert('Vote Submitted', `You voted ${vote.toUpperCase()}. Waiting on the other roommates.`)
      } else if (updatedRequest.status === 'approved') {
        Alert.alert('Approved', 'All roommates voted YES. The changes have been applied.')
      } else if (updatedRequest.status === 'rejected') {
        Alert.alert('Rejected', 'At least one roommate voted NO. The negotiation has failed.')
      }

      fetchRequests()
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  const handleCancel = async (requestId: string) => {
    try {
      await itemService.cancelChangeRequest(requestId)
      Alert.alert('Cancelled', 'Your request has been cancelled.')
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
          <Text fontSize={14} color="$green10" fontWeight="bold">{displayNew}</Text>
        </XStack>
      </YStack>
    )
  }

  const renderRequest = ({ item }: { item: any }) => {
    const votes = item.item_change_request_votes || []
    const yesVotes = votes.filter((vote: any) => vote.vote === 'yes').length
    const noVotes = votes.filter((vote: any) => vote.vote === 'no').length
    
    // Use new_data if available, otherwise fallback to legacy quantity fields
    const newData = item.new_data || { quantity: item.new_quantity }
    const oldData = item.old_data || { quantity: item.old_quantity || item.shopping_items?.quantity }
    
    const targetMemberIds = newData.target_member_ids || item.shopping_items?.target_member_ids || []
    
    const eligibleMembers = members.filter((member: any) => {
      if (member.user_id === item.requested_by) return false
      return true // For now, all room members vote on all changes
    })

    const eligibleVoterCount = eligibleMembers.length
    const currentUserVote = votes.find((vote: any) => vote.voter_id === user?.id)
    const isRequester = item.requested_by === user?.id
    const isResolved = item.status !== 'pending'
    
    const voteByUserId = new Map(votes.map((vote: any) => [vote.voter_id, vote.vote]))
    const pendingMembers = eligibleMembers.filter((member: any) => !voteByUserId.has(member.user_id))
    const yesVoters = eligibleMembers.filter((member: any) => voteByUserId.get(member.user_id) === 'yes')
    const noVoters = eligibleMembers.filter((member: any) => voteByUserId.get(member.user_id) === 'no')

    return (
      <Card elevation="$2" borderWidth={1} borderColor="$borderColor" padding="$4" marginBottom="$3">
        <YStack gap="$3">
          <XStack jc="space-between" ai="center">
            <YStack>
              <Text fontWeight="bold" fontSize={16}>{oldData.name || item.shopping_items?.name}</Text>
              <Text color="$colorSubtitle" fontSize={12}>Requested by {item.profiles?.name || 'Someone'}</Text>
            </YStack>
            <YStack bc="$yellow4" px="$2" py="$1" br="$2">
              <Text fontSize={10} fontWeight="bold" color="$yellow10">NEGOTIATION</Text>
            </YStack>
          </XStack>

          <YStack bc="$backgroundStrong" p="$3" br="$4">
            <Text fontSize={13} fontWeight="bold" mb="$2">PROPOSED CHANGES:</Text>
            {renderChangeItem('Name', oldData.name, newData.name)}
            {renderChangeItem('Quantity', oldData.quantity, newData.quantity)}
            {renderChangeItem('Unit', oldData.unit, newData.unit)}
            {renderChangeItem('Target Members', oldData.target_member_ids, newData.target_member_ids)}
            {renderChangeItem('Category', oldData.category, newData.category)}
            {renderChangeItem('Priority', oldData.priority, newData.priority)}
            {renderChangeItem('Est. Price', oldData.estimated_price, newData.estimated_price)}
            {renderChangeItem('Store', oldData.store, newData.store)}
            {renderChangeItem('Notes', oldData.notes, newData.notes)}
          </YStack>

          <YStack gap="$2">
            <XStack ai="center" gap="$2">
              <Check size={14} color="$green10" />
              <Text color="$colorSubtitle">Yes: {yesVotes}/{eligibleVoterCount}</Text>
            </XStack>
            {yesVoters.length > 0 && (
              <Text color="$colorSubtitle" fontSize={12}>
                Voted Yes: {yesVoters.map((m: any) => m.profiles?.name || 'User').join(', ')}
              </Text>
            )}
            <XStack ai="center" gap="$2">
              <X size={14} color="$red10" />
              <Text color="$colorSubtitle">No: {noVotes}</Text>
            </XStack>
            {noVoters.length > 0 && (
              <Text color="$colorSubtitle" fontSize={12}>
                Voted No: {noVoters.map((m: any) => m.profiles?.name || 'User').join(', ')}
              </Text>
            )}
          </YStack>

          {item.reason && (
            <YStack bc="$backgroundTransparent" p="$3" br="$4" borderLeftWidth={4} borderColor="$blue8">
              <Text fontSize={14} fontStyle="italic">"{item.reason}"</Text>
            </YStack>
          )}

          <XStack ai="center" gap="$2">
            <Clock3 size={14} color="$colorSubtitle" />
            <Text color="$colorSubtitle" fontSize={11}>
              Requested {new Date(item.created_at).toLocaleString()}
            </Text>
          </XStack>

          {isRequester ? (
            <Button
              theme="red"
              variant="outlined"
              size="$3"
              onPress={() => handleCancel(item.id)}
            >
              Cancel Request
            </Button>
          ) : currentUserVote ? (
            <XStack ai="center" jc="center" p="$2" bc="$backgroundStrong" br="$4">
              <Text fontWeight="bold">You voted: {currentUserVote.vote.toUpperCase()}</Text>
            </XStack>
          ) : isResolved ? (
            <Text textAlign="center" color="$colorSubtitle">Resolved</Text>
          ) : (
            <XStack gap="$3">
              <Button
                f={1}
                theme="red"
                icon={X}
                onPress={() => handleResolve(item.id, 'no')}
              >
                Reject
              </Button>
              <Button
                f={1}
                theme="active"
                icon={Check}
                onPress={() => handleResolve(item.id, 'yes')}
              >
                Approve
              </Button>
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
            <Text textAlign="center" color="$colorSubtitle">
              No pending change requests in this room.
            </Text>
          </YStack>
        }
      />
    </Container>
  )
}

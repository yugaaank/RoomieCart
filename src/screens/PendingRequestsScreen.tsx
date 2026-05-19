import { useState, useEffect, useCallback } from 'react'
import { FlatList, Alert } from 'react-native'
import { itemService } from '../services/itemService'
import { roomService } from '../services/roomService'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { Container, YStack, XStack, Text, Button, Card } from '../components/ui'
import { Check, X, ArrowRight, Clock3 } from '@tamagui/lucide-icons'

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
        Alert.alert('Approved', 'All roommates voted YES. The quantity change has been applied.')
      } else if (updatedRequest.status === 'rejected') {
        Alert.alert('Rejected', 'At least one roommate voted NO. The negotiation has failed.')
      }

      fetchRequests()
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  const renderRequest = ({ item }: { item: any }) => {
    const votes = item.item_change_request_votes || []
    const yesVotes = votes.filter((vote: any) => vote.vote === 'yes').length
    const noVotes = votes.filter((vote: any) => vote.vote === 'no').length
    const eligibleMembers = members.filter((member: any) => member.user_id !== item.requested_by)
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
            <Text fontWeight="bold" fontSize={16}>{item.shopping_items?.name}</Text>
            <Text color="$colorSubtitle" fontSize={12}>by {item.profiles?.name || 'Someone'}</Text>
          </XStack>

          <YStack bc="$backgroundStrong" p="$3" br="$4">
            <XStack ai="center" jc="center" gap="$3">
              <Text color="$colorSubtitle">
                {item.old_quantity || item.shopping_items?.quantity || '?'} {item.shopping_items?.unit || ''}
              </Text>
              <ArrowRight size={16} color="$colorSubtitle" />
              <Text fontWeight="bold" fontSize={18} color="$blue10">
                {item.new_quantity} {item.shopping_items?.unit || ''}
              </Text>
            </XStack>
          </YStack>

          <YStack gap="$2">
            <XStack ai="center" gap="$2">
              <Check size={14} color="$green10" />
              <Text color="$colorSubtitle">Yes: {yesVotes}/{eligibleVoterCount}</Text>
            </XStack>
            {yesVoters.length > 0 && (
              <Text color="$colorSubtitle" fontSize={12}>
                Yes by: {yesVoters.map((member: any) => member.profiles?.name || 'Unknown').join(', ')}
              </Text>
            )}
            <XStack ai="center" gap="$2">
              <X size={14} color="$red10" />
              <Text color="$colorSubtitle">No: {noVotes}</Text>
            </XStack>
            {noVoters.length > 0 && (
              <Text color="$colorSubtitle" fontSize={12}>
                No by: {noVoters.map((member: any) => member.profiles?.name || 'Unknown').join(', ')}
              </Text>
            )}
            <XStack ai="center" gap="$2">
              <Clock3 size={14} color="$yellow10" />
              <Text color="$colorSubtitle">
                Change applies only if every other roommate votes YES.
              </Text>
            </XStack>
            {pendingMembers.length > 0 && (
              <Text color="$colorSubtitle" fontSize={12}>
                Waiting on: {pendingMembers.map((member: any) => member.profiles?.name || 'Unknown').join(', ')}
              </Text>
            )}
          </YStack>

          {item.reason && (
            <Text fontSize={14} color="$colorSubtitle" fontStyle="italic">
              {item.reason}
            </Text>
          )}

          {isRequester ? (
            <Text color="$colorSubtitle">
              Waiting for roommates to vote.
            </Text>
          ) : currentUserVote ? (
            <Text color="$colorSubtitle">
              You voted {currentUserVote.vote.toUpperCase()}.
            </Text>
          ) : isResolved ? (
            <Text color="$colorSubtitle">
              This request has already been resolved.
            </Text>
          ) : (
            <XStack gap="$3">
              <Button
                f={1}
                theme="red"
                icon={X}
                onPress={() => handleResolve(item.id, 'no')}
              >
                Vote No
              </Button>
              <Button
                f={1}
                theme="active"
                icon={Check}
                onPress={() => handleResolve(item.id, 'yes')}
              >
                Vote Yes
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
        ListEmptyComponent={
          <YStack ai="center" jc="center" padding="$10" gap="$4">
            <Check size={48} color="$green10" opacity={0.5} />
            <Text textAlign="center" color="$colorSubtitle">
              No pending quantity requests. All roommates are in agreement!
            </Text>
          </YStack>
        }
      />
    </Container>
  )
}

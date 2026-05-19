import { useState, useEffect, useCallback } from 'react'
import { FlatList, Alert } from 'react-native'
import { itemService } from '../services/itemService'
import { useAuthStore } from '../store/authStore'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { Container, YStack, XStack, Text, Button, Card } from '../components/ui'
import { Check, X, AlertTriangle, ArrowRight } from '@tamagui/lucide-icons'

type Props = NativeStackScreenProps<RootStackParamList, 'PendingRequests'>

export default function PendingRequestsScreen({ route, navigation }: Props) {
  const { roomId } = route.params
  const user = useAuthStore((state) => state.user)
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = useCallback(async () => {
    try {
      const data = await itemService.getPendingRequests(roomId)
      setRequests(data)
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setLoading(false)
    }
  }, [roomId])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleResolve = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      await itemService.resolveChangeRequest(requestId, user!.id, status)
      setRequests(requests.filter(r => r.id !== requestId))
      Alert.alert('Success', `Request ${status}`)
      
      // If we approved, we might want to also update the item's overall status 
      // back to 'active' from 'discussion_pending'.
      // Note: The DB trigger handles updating the quantity!
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  const renderRequest = ({ item }: { item: any }) => (
    <Card elevation="$2" borderWidth={1} borderColor="$borderColor" padding="$4" marginBottom="$3">
      <YStack gap="$3">
        <XStack jc="space-between" ai="center">
          <Text fontWeight="bold" fontSize={16}>{item.shopping_items?.name}</Text>
          <Text color="$colorSubtitle" fontSize={12}>by {item.profiles?.name || 'Someone'}</Text>
        </XStack>

        <YStack bc="$backgroundStrong" p="$3" br="$4">
          <XStack ai="center" jc="center" gap="$3">
            <Text color="$colorSubtitle">{item.old_quantity || '?'}</Text>
            <ArrowRight size={16} color="$colorSubtitle" />
            <Text fontWeight="bold" fontSize={18} color="$blue10">{item.new_quantity}</Text>
          </XStack>
        </YStack>

        {item.reason && (
          <Text fontSize={14} color="$colorSubtitle" fontStyle="italic">
            "{item.reason}"
          </Text>
        )}

        <XStack gap="$3">
          <Button 
            f={1} 
            theme="red" 
            icon={X} 
            onPress={() => handleResolve(item.id, 'rejected')}
          >
            Reject
          </Button>
          <Button 
            f={1} 
            theme="active" 
            icon={Check} 
            onPress={() => handleResolve(item.id, 'approved')}
          >
            Approve
          </Button>
        </XStack>
      </YStack>
    </Card>
  )

  return (
    <Container>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequest}
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

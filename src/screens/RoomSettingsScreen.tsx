import { useState, useEffect, useCallback } from 'react'
import { Alert, FlatList, ScrollView } from 'react-native'
import { roomService } from '../services/roomService'
import { useAuthStore } from '../store/authStore'
import { useRoomStore } from '../store/roomStore'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { Container, YStack, XStack, Text, Button, Card } from '../components/ui'
import { Copy, RefreshCw, LogOut, Trash2, User, ShieldCheck, UserMinus } from '@tamagui/lucide-icons'
import * as Clipboard from 'expo-clipboard'

type Props = NativeStackScreenProps<RootStackParamList, 'RoomSettings'>

export default function RoomSettingsScreen({ route, navigation }: Props) {
  const { roomId } = route.params
  const user = useAuthStore((state) => state.user)
  const { rooms, regenerateInviteCode, leaveRoom, deleteRoom } = useRoomStore()
  const room = rooms.find(r => r.id === roomId)
  
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  const isOwner = room?.owner_id === user?.id

  const fetchMembers = useCallback(async () => {
    try {
      const data = await roomService.getRoomMembers(roomId)
      setMembers(data)
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setLoading(false)
    }
  }, [roomId])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const handleCopyCode = async () => {
    if (room?.invite_code) {
      await Clipboard.setStringAsync(room.invite_code)
      Alert.alert('Copied', 'Invite code copied to clipboard')
    }
  }

  const handleRegenerateCode = () => {
    Alert.alert(
      'Regenerate Code',
      'This will invalidate the current invite code. New members must use the new code. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Regenerate', 
          onPress: async () => {
            setProcessing(true)
            try {
              await regenerateInviteCode(roomId)
              Alert.alert('Success', 'Invite code regenerated')
            } catch (err: any) {
              Alert.alert('Error', err.message)
            } finally {
              setProcessing(false)
            }
          }
        }
      ]
    )
  }

  const handleLeaveRoom = () => {
    Alert.alert(
      'Leave Room',
      'Are you sure you want to leave this room?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: async () => {
            setProcessing(true)
            try {
              await leaveRoom(roomId, user!.id)
              navigation.popToTop()
            } catch (err: any) {
              Alert.alert('Error', err.message)
              setProcessing(false)
            }
          }
        }
      ]
    )
  }

  const handleDeleteRoom = () => {
    Alert.alert(
      'Delete Room',
      'CRITICAL: This will permanently delete the room and all shopping items for everyone. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Permanently', 
          style: 'destructive',
          onPress: async () => {
            setProcessing(true)
            try {
              await deleteRoom(roomId)
              navigation.popToTop()
            } catch (err: any) {
              Alert.alert('Error', err.message)
              setProcessing(false)
            }
          }
        }
      ]
    )
  }

  const handleRemoveMember = (member: any) => {
    Alert.alert(
      'Remove Member',
      `Remove ${member.profiles?.name || 'this member'} from the room?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true)
            try {
              await roomService.removeMember(roomId, member.user_id)
              setMembers((currentMembers) =>
                currentMembers.filter((currentMember) => currentMember.user_id !== member.user_id)
              )
              Alert.alert('Success', 'Member removed from the room')
            } catch (err: any) {
              Alert.alert('Error', err.message)
            } finally {
              setProcessing(false)
            }
          }
        }
      ]
    )
  }

  const renderMember = ({ item }: { item: any }) => (
    <XStack ai="center" jc="space-between" paddingVertical="$2">
      <XStack ai="center" gap="$3">
        <YStack bc="$backgroundStrong" p="$2" br="$10">
          <User size={16} />
        </YStack>
        <YStack>
          <Text fontWeight="bold">{item.profiles?.name || 'Unknown User'}</Text>
          <Text fontSize={12} color="$colorSubtitle">Joined {new Date(item.joined_at).toLocaleDateString()}</Text>
        </YStack>
      </XStack>
      <XStack ai="center" gap="$2">
        {item.role === 'owner' && (
          <XStack ai="center" gap="$1" bc="$blue2" px="$2" py="$1" br="$4">
            <ShieldCheck size={12} color="$blue10" />
            <Text fontSize={10} color="$blue10" fontWeight="bold">OWNER</Text>
          </XStack>
        )}
        {isOwner && item.user_id !== user?.id && item.role !== 'owner' && (
          <Button
            size="$2"
            theme="red"
            icon={UserMinus}
            onPress={() => handleRemoveMember(item)}
            disabled={processing}
          >
            Remove
          </Button>
        )}
      </XStack>
    </XStack>
  )

  if (!room) return null

  return (
    <Container padding="$0">
      <ScrollView>
        <YStack p="$4" gap="$6">
          <YStack gap="$2">
            <Text color="$colorSubtitle" fontWeight="bold">INVITE CODE</Text>
            <Card elevation="$2" borderWidth={1} borderColor="$borderColor" p="$4">
              <XStack ai="center" jc="space-between">
                <Text fontSize={24} fontWeight="bold" letterSpacing={2}>{room.invite_code}</Text>
                <XStack gap="$2">
                  <Button size="$3" circular icon={Copy} onPress={handleCopyCode} />
                  {isOwner && (
                    <Button 
                      size="$3" 
                      circular 
                      icon={RefreshCw} 
                      onPress={handleRegenerateCode} 
                      disabled={processing}
                    />
                  )}
                </XStack>
              </XStack>
            </Card>
          </YStack>

          <YStack gap="$2">
            <Text color="$colorSubtitle" fontWeight="bold">MEMBERS</Text>
            <Card elevation="$2" borderWidth={1} borderColor="$borderColor" p="$4">
              <FlatList
                data={members}
                keyExtractor={(item) => item.id}
                renderItem={renderMember}
                scrollEnabled={false}
              />
            </Card>
          </YStack>

          <YStack gap="$3" marginTop="$4">
            {!isOwner && (
              <Button 
                theme="red" 
                icon={LogOut} 
                onPress={handleLeaveRoom}
                disabled={processing}
              >
                Leave Room
              </Button>
            )}
            {isOwner && (
              <Button 
                theme="red" 
                variant="outlined"
                icon={Trash2} 
                onPress={handleDeleteRoom}
                disabled={processing}
              >
                Delete Room
              </Button>
            )}
          </YStack>
        </YStack>
      </ScrollView>
    </Container>
  )
}

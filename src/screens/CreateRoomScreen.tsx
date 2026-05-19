import { useState } from 'react'
import { Alert } from 'react-native'
import { useRoomStore } from '../store/roomStore'
import { useAuthStore } from '../store/authStore'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { Container, YStack, Text, Input, Button } from '../components/ui'
import { Plus } from '@tamagui/lucide-icons'

type Props = NativeStackScreenProps<RootStackParamList, 'CreateRoom'>

export default function CreateRoomScreen({ navigation }: Props) {
  const [name, setName] = useState('')
  const user = useAuthStore((state) => state.user)
  const { createRoom, loading } = useRoomStore()

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Please enter a room name')
      return
    }

    try {
      await createRoom(name, user!.id)
      const newRoom = useRoomStore.getState().currentRoom
      if (newRoom) {
        navigation.replace('RoomDetails', { roomId: newRoom.id, roomName: newRoom.name })
      } else {
        navigation.goBack()
      }
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  return (
    <Container>
      <YStack gap="$6" paddingVertical="$4">
        <YStack gap="$2">
          <Text fontWeight="bold">Room Name</Text>
          <Input
            placeholder="e.g. My Apartment, Vacation 2026"
            value={name}
            onChangeText={setName}
            size="$4"
          />
        </YStack>

        <Button 
          theme="active" 
          icon={Plus} 
          onPress={handleCreate} 
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Room'}
        </Button>
      </YStack>
    </Container>
  )
}

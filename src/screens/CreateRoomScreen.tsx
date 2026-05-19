import { useState } from 'react'
import { View, TextInput, Button, Alert, ActivityIndicator } from 'react-native'
import { useRoomStore } from '../store/roomStore'
import { useAuthStore } from '../store/authStore'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'

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
    <View style={{ padding: 20, gap: 12 }}>
      <TextInput
        placeholder="Room Name (e.g. My Apartment)"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      {loading ? (
        <ActivityIndicator />
      ) : (
        <Button title="Create Room" onPress={handleCreate} />
      )}
    </View>
  )
}

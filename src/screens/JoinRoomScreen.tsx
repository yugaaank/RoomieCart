import { useState } from 'react'
import { View, TextInput, Button, Alert, ActivityIndicator } from 'react-native'
import { useRoomStore } from '../store/roomStore'
import { useAuthStore } from '../store/authStore'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'

type Props = NativeStackScreenProps<RootStackParamList, 'JoinRoom'>

export default function JoinRoomScreen({ navigation }: Props) {
  const [code, setCode] = useState('')
  const user = useAuthStore((state) => state.user)
  const { joinRoom, loading } = useRoomStore()

  const handleJoin = async () => {
    if (!code.trim()) {
      Alert.alert('Please enter an invite code')
      return
    }

    try {
      await joinRoom(code.trim().toUpperCase(), user!.id)
      Alert.alert('Success', 'Joined room successfully')
      navigation.goBack()
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  return (
    <View style={{ padding: 20, gap: 12 }}>
      <TextInput
        placeholder="Invite Code"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      {loading ? (
        <ActivityIndicator />
      ) : (
        <Button title="Join Room" onPress={handleJoin} />
      )}
    </View>
  )
}

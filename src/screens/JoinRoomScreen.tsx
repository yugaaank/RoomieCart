import { useState } from 'react'
import { Alert } from 'react-native'
import { useRoomStore } from '../store/roomStore'
import { useAuthStore } from '../store/authStore'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { Container, YStack, Text, Input, Button } from '../components/ui'
import { Users } from '@tamagui/lucide-icons'

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
    <Container>
      <YStack gap="$6" paddingVertical="$4">
        <YStack gap="$2">
          <Text fontWeight="bold">Invite Code</Text>
          <Input
            placeholder="ENTER-CODE"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            size="$4"
          />
          <Text fontSize={14} color="$colorSubtitle">
            Ask the room owner for their 6-digit invite code.
          </Text>
        </YStack>

        <Button 
          theme="active" 
          icon={Users} 
          onPress={handleJoin} 
          disabled={loading}
        >
          {loading ? 'Joining...' : 'Join Room'}
        </Button>
      </YStack>
    </Container>
  )
}

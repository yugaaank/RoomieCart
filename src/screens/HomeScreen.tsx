import { useEffect } from 'react'
import { FlatList } from 'react-native'
import { useRoomStore } from '../store/roomStore'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { Container, Title, YStack, XStack, Text, Button, Card } from '../components/ui'
import { LogOut, User, Plus, Users } from '@tamagui/lucide-icons'

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>

export default function HomeScreen({ navigation }: Props) {
  const user = useAuthStore((state) => state.user)
  const { rooms, loading, fetchRooms, setCurrentRoom } = useRoomStore()

  useEffect(() => {
    if (user) {
      fetchRooms(user.id)
    }
  }, [user])

  const renderRoom = ({ item }: { item: any }) => (
    <Card 
      elevation="$2" 
      borderWidth={1}
      borderColor="$borderColor"
      padding="$4" 
      marginBottom="$3"
      onPress={() => {
        setCurrentRoom(item)
        navigation.navigate('RoomDetails', { roomId: item.id, roomName: item.name })
      }}
    >
      <XStack jc="space-between" ai="center">
        <YStack gap="$1">
          <Text fontSize={18} fontWeight="bold">{item.name}</Text>
          <Text color="$colorSubtitle" fontSize={14}>Code: {item.invite_code}</Text>
        </YStack>
        <Users size={20} color="$colorSubtitle" />
      </XStack>
    </Card>
  )

  return (
    <Container>
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={renderRoom}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <YStack ai="center" jc="center" padding="$10" gap="$4">
            <Users size={48} color="$colorSubtitle" opacity={0.5} />
            <Text textAlign="center" color="$colorSubtitle">
              No rooms found. Create or join one to start shopping together!
            </Text>
          </YStack>
        }
      />

      <YStack gap="$3" paddingTop="$4">
        <XStack gap="$3">
          <Button 
            flex={1} 
            icon={Plus} 
            theme="active"
            onPress={() => navigation.navigate('CreateRoom')}
          >
            Create
          </Button>
          <Button 
            flex={1} 
            icon={Users} 
            onPress={() => navigation.navigate('JoinRoom')}
          >
            Join
          </Button>
        </XStack>

        <XStack gap="$3">
          <Button 
            flex={1} 
            icon={User} 
            chromeless
            onPress={() => navigation.navigate('Profile')}
          >
            Profile
          </Button>
          <Button 
            flex={1} 
            icon={LogOut} 
            theme="red"
            chromeless
            onPress={() => supabase.auth.signOut()}
          >
            Logout
          </Button>
        </XStack>
      </YStack>
    </Container>
  )
}

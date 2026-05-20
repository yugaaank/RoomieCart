import { useEffect, useLayoutEffect } from 'react'
import { FlatList } from 'react-native'
import { useRoomStore } from '../store/roomStore'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { Container, YStack, XStack, Text, Button, Card } from '../components/ui'
import { User, Plus, Users, LogOut } from '@tamagui/lucide-icons'

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>

export default function HomeScreen({ navigation }: Props) {
  const user = useAuthStore((state) => state.user)
  const { rooms, loading, fetchRooms, setCurrentRoom } = useRoomStore()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button 
          size="$2" 
          circular 
          variant="ghost" 
          icon={User} 
          onPress={() => navigation.navigate('Profile')}
        />
      ),
    })
  }, [navigation])

  useEffect(() => {
    if (user) {
      fetchRooms(user.id)
    }
  }, [user])

  const renderRoom = ({ item }: { item: any }) => (
    <Card 
      elevation={2} 
      padding="$4" 
      marginBottom="$3"
      onPress={() => {
        setCurrentRoom(item)
        navigation.navigate('RoomDetails', { roomId: item.id, roomName: item.name })
      }}
    >
      <XStack jc="space-between" ai="center">
        <YStack gap="$1">
          <Text fontSize={18} fontWeight="700">{item.name}</Text>
          <Text color="$colorSubtitle" fontSize={13} fontWeight="500">Code: {item.invite_code}</Text>
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
            <Users size={48} color="$colorSubtitle" opacity={0.3} />
            <Text textAlign="center" color="$colorSubtitle" fontSize={15} fontWeight="500">
              No rooms found. Create or join one to start shopping together!
            </Text>
          </YStack>
        }
      />

      <YStack gap="$3" paddingTop="$4">
        <XStack gap="$3">
          <Button 
            flex={1} 
            variant="primary"
            icon={Plus} 
            onPress={() => navigation.navigate('CreateRoom')}
          >
            Create Room
          </Button>
          <Button 
            flex={1} 
            variant="outline"
            icon={Users} 
            onPress={() => navigation.navigate('JoinRoom')}
          >
            Join Room
          </Button>
        </XStack>
      </YStack>
    </Container>
  )
}

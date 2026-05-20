import { useState, useEffect, useLayoutEffect } from 'react'
import { FlatList } from 'react-native'
import { useRoomStore } from '../store/roomStore'
import { useAuthStore } from '../store/authStore'
import { profileService } from '../services/profileService'
import { roomService } from '../services/roomService'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { Container, YStack, XStack, Text, Button, Card } from '../components/ui'
import { User, Plus, Users } from '@tamagui/lucide-icons'
import { SvgXml } from 'react-native-svg'

const logoXml = `
<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 21V10L12 3L21 10V21H16V14H8V21H3Z" stroke="#466349" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>

export default function HomeScreen({ navigation }: Props) {
  const user = useAuthStore((state) => state.user)
  const [rooms, setRooms] = useState<any[]>([])
  const [userName, setUserName] = useState<string>('')
  const { setCurrentRoom } = useRoomStore()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <XStack ai="center" gap="$2">
          <SvgXml xml={logoXml} width={24} height={24} />
          <Text fontSize={18} fontWeight="700" color="$color">RoomieCart</Text>
        </XStack>
      ),
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
      fetchRoomsData()
      fetchProfile()
    }
  }, [user])

  const fetchRoomsData = async () => {
    const rawRooms = await roomService.getUserRooms(user!.id)
    const roomsWithMembers = await Promise.all(rawRooms.map(async (room) => {
      const members = await roomService.getRoomMembers(room.id)
      return { ...room, members: members.map(m => ({ id: m.user_id, name: m.profiles?.name })) }
    }))
    setRooms(roomsWithMembers)
  }

  const fetchProfile = async () => {
    try {
      const data = await profileService.getProfile(user!.id)
      setUserName(data.name || 'User')
    } catch (err) {
      setUserName('User')
    }
  }

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
        
        <XStack ai="center">
          {(item.members || []).slice(0, 3).map((member: any, i: number) => (
            <YStack 
              key={member.id} 
              width={24} 
              height={24} 
              borderRadius="$full" 
              backgroundColor="$primary" 
              alignItems="center" 
              justifyContent="center" 
              marginLeft={i > 0 ? -6 : 0}
              borderWidth={1.5}
              borderColor="$background"
            >
              <Text fontSize={10} fontWeight="bold" color="$onPrimary">
                {member.name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </YStack>
          ))}
          {(item.members?.length > 3) && (
            <YStack 
              width={24} 
              height={24} 
              borderRadius="$full" 
              backgroundColor="$backgroundStrong" 
              alignItems="center" 
              justifyContent="center" 
              marginLeft={-6}
              borderWidth={1.5}
              borderColor="$background"
            >
              <Text fontSize={10} color="$colorSubtitle">+{item.members.length - 3}</Text>
            </YStack>
          )}
        </XStack>
      </XStack>
    </Card>
  )

  return (
    <Container>
      <YStack padding="$4" gap="$2" marginBottom="$4">
        <Text fontSize={32} fontWeight="700" letterSpacing={-0.5} color="$color">Welcome Home, {userName}</Text>
        <Text color="$colorSubtitle" fontSize={16}>Manage your shared spaces with ease.</Text>
      </YStack>
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={renderRoom}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <YStack ai="center" jc="center" padding="$10" gap="$4">
            <Users size={48} color="$colorSubtitle" opacity={0.3} />
            <Text textAlign="center" color="$colorSubtitle" fontSize={15} fontWeight="500">
              No rooms found. Create or join one to start shopping together!
            </Text>
          </YStack>
        }
      />

      <YStack gap="$3" padding="$4" paddingBottom="$6">
        <Button 
          variant="primary"
          icon={Plus} 
          onPress={() => navigation.navigate('CreateRoom')}
        >
          Create Room
        </Button>
        <Button 
          variant="outline"
          icon={Users} 
          onPress={() => navigation.navigate('JoinRoom')}
        >
          Join Room
        </Button>
      </YStack>
    </Container>
  )
}

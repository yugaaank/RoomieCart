import { useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, Button, ActivityIndicator } from 'react-native'
import { useRoomStore } from '../store/roomStore'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'

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
    <TouchableOpacity
      style={{
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        backgroundColor: 'white',
      }}
      onPress={() => {
        setCurrentRoom(item)
        navigation.navigate('RoomDetails', { roomId: item.id, roomName: item.name })
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{item.name}</Text>
      <Text style={{ color: '#666' }}>Invite Code: {item.invite_code}</Text>
    </TouchableOpacity>
  )

  if (loading && rooms.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={renderRoom}
        ListEmptyComponent={
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text>No rooms found. Create or join one!</Text>
          </View>
        }
      />

      <View style={{ padding: 20, gap: 10 }}>
        <Button
          title="Create New Room"
          onPress={() => navigation.navigate('CreateRoom')}
        />
        <Button
          title="Join Room with Code"
          onPress={() => navigation.navigate('JoinRoom')}
        />
        <Button
          title="My Profile"
          color="#666"
          onPress={() => navigation.navigate('Profile')}
        />
        <Button
          title="Logout"
          color="red"
          onPress={() => supabase.auth.signOut()}
        />
      </View>
    </View>
  )
}

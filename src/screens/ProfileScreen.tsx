import { useState, useEffect } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { useRoomStore } from '../store/roomStore'
import { profileService } from '../services/profileService'
import { supabase } from '../lib/supabase'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { Container, YStack, XStack, Text, Button, Card, Switch, Avatar } from '../components/ui'
import { User as UserIcon, LogOut, Lock, Shield, ChevronRight, Sun, Bell, Plus, Home } from '@tamagui/lucide-icons'

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>

export default function ProfileScreen({ navigation }: Props) {
  const user = useAuthStore((state) => state.user)
  const manualTheme = useThemeStore((state) => state.manualTheme)
  const setManualTheme = useThemeStore((state) => state.setManualTheme)
  const { rooms, fetchRooms } = useRoomStore()
  const [name, setName] = useState('Alex Thompson')
  const [isPasswordSheetOpen, setIsPasswordSheetOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchRooms(user.id)
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const data = await profileService.getProfile(user!.id)
      setName(data.name || 'Alex Thompson')
    } catch (err: any) {
      console.error(err)
    }
  }

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => supabase.auth.signOut() }
    ])
  }

  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase()

  return (
    <Container padding="$0">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 24 }}>
        <YStack ai="center" gap="$3" marginTop="$4">
          <Avatar circular size="$8" borderWidth={2} borderColor="$borderColor" backgroundColor="$primary">
             <Text color="$onPrimary" fontSize={32} fontWeight="bold">{initials}</Text>
          </Avatar>
          <YStack ai="center">
            <Text fontSize={20} fontWeight="700">{name}</Text>
            <Text color="$colorSubtitle">{user?.email}</Text>
          </YStack>
        </YStack>

        <YStack gap="$4">
          <Card padding="$4" gap="$2" backgroundColor="$backgroundStrong">
            <Text fontWeight="600" color="$colorSubtitle" marginBottom="$2">Account Security</Text>
            <Button variant="ghost" justifyContent="space-between" icon={Lock} onPress={() => setIsPasswordSheetOpen(true)}>
              <XStack f={1} jc="space-between" ai="center">
                <Text color="$color">Change Password</Text>
                <ChevronRight size={16} color="$color"/>
              </XStack>
            </Button>
            <Button variant="ghost" justifyContent="space-between" icon={Shield}>
              <XStack f={1} jc="space-between" ai="center">
                <Text color="$color">Delete Account</Text>
                <ChevronRight size={16} color="$color"/>
              </XStack>
            </Button>
          </Card>

          <Card padding="$4" gap="$2" backgroundColor="$backgroundStrong">
            <Text fontWeight="600" color="$colorSubtitle" marginBottom="$2">Preferences</Text>
            <Button variant="ghost" justifyContent="space-between" icon={Bell}>
              <XStack f={1} jc="space-between" ai="center">
                <Text color="$color">Notification Preferences</Text>
                <ChevronRight size={16} color="$color"/>
              </XStack>
            </Button>
          </Card>

          <Card padding="$4" gap="$2" backgroundColor="$backgroundStrong">
            <Text fontWeight="600" color="$colorSubtitle" marginBottom="$2">Household</Text>
            {rooms.map(room => (
              <Button key={room.id} variant="ghost" justifyContent="flex-start" icon={Home} color="$color">{room.name}</Button>
            ))}
            <Button variant="ghost" justifyContent="flex-start" icon={Plus} onPress={() => navigation.navigate('JoinRoom')} color="$color">Join New Home</Button>
            <Button variant="ghost" justifyContent="flex-start" icon={Plus} onPress={() => navigation.navigate('CreateRoom')} color="$color">Create New Room</Button>
          </Card>
        </YStack>

        <Button 
          variant="destructive" 
          icon={LogOut} 
          onPress={handleLogout} 
          marginBottom="$4"
          backgroundColor="#ba1a1a"
          color="white"
        >
          Logout
        </Button>
      </ScrollView>
    </Container>
  )
}

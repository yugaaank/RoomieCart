import { useState, useEffect } from 'react'
import { Alert } from 'react-native'
import { useAuthStore } from '../store/authStore'
import { profileService } from '../services/profileService'
import { Profile } from '../types/database.types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { Container, YStack, Text, Input, Button, Card, XStack } from '../components/ui'
import { Save, User as UserIcon, Mail } from '@tamagui/lucide-icons'

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>

export default function ProfileScreen({ navigation }: Props) {
  const user = useAuthStore((state) => state.user)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const data = await profileService.getProfile(user!.id)
      setName(data.name || '')
    } catch (err: any) {
      Alert.alert('Error', 'Could not fetch profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty')
      return
    }

    setSaving(true)
    try {
      await profileService.updateProfile(user!.id, { name: name.trim() })
      Alert.alert('Success', 'Profile updated successfully')
    } catch (err: any) {
      Alert.alert('Error', 'Could not update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container>
      <YStack gap="$6" paddingVertical="$4">
        <Card elevation="$2" borderWidth={1} borderColor="$borderColor" padding="$4" gap="$4">
          <YStack gap="$4">
            <YStack gap="$2">
              <XStack ai="center" gap="$2">
                <Mail size={16} color="$colorSubtitle" />
                <Text fontWeight="bold" color="$colorSubtitle">Email Address</Text>
              </XStack>
              <Text fontSize={16} paddingLeft="$6">{user?.email}</Text>
            </YStack>

            <YStack gap="$2">
              <XStack ai="center" gap="$2">
                <UserIcon size={16} color="$colorSubtitle" />
                <Text fontWeight="bold" color="$colorSubtitle">Display Name</Text>
              </XStack>
              <Input
                style={{ marginLeft: 24 }}
                value={name}
                onChangeText={setName}
                placeholder="Your Name"
                size="$4"
              />
            </YStack>
          </YStack>
        </Card>

        <Button 
          theme="active" 
          icon={Save} 
          onPress={handleSave} 
          disabled={saving || loading}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </YStack>
    </Container>
  )
}

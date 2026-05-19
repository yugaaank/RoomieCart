import { useState, useEffect } from 'react'
import { Alert } from 'react-native'
import { useAuthStore } from '../store/authStore'
import { profileService } from '../services/profileService'
import { Profile } from '../types/database.types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { Container, YStack, Text, Input, Button, Card, XStack } from '../components/ui'
import { Save, User as UserIcon, Mail } from '@tamagui/lucide-icons'
import { MAX_PROFILE_NAME_LENGTH, sanitizeTextInput } from '../lib/validation'

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>

export default function ProfileScreen({ navigation }: Props) {
  const user = useAuthStore((state) => state.user)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    const sanitizedName = sanitizeTextInput(name)

    if (!sanitizedName) {
      setError('Name cannot be empty.')
      return
    }

    if (sanitizedName.length > MAX_PROFILE_NAME_LENGTH) {
      setError(`Name must be ${MAX_PROFILE_NAME_LENGTH} characters or fewer.`)
      return
    }

    setError(null)

    setSaving(true)
    try {
      await profileService.updateProfile(user!.id, { name: sanitizedName })
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
                onChangeText={(value) => {
                  setName(value)
                  if (error) {
                    setError(null)
                  }
                }}
                placeholder="Your Name"
                size="$4"
                maxLength={MAX_PROFILE_NAME_LENGTH}
              />
              {error && (
                <Text color="$red10" fontSize={13} paddingLeft="$6">
                  {error}
                </Text>
              )}
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

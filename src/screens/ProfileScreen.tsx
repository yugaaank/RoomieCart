import { useState, useEffect } from 'react'
import { Alert } from 'react-native'
import { useAuthStore } from '../store/authStore'
import { profileService } from '../services/profileService'
import { supabase } from '../lib/supabase'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { Container, YStack, Text, Input, Button, Card, XStack } from '../components/ui'
import { Save, User as UserIcon, Mail, LogOut } from '@tamagui/lucide-icons'
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

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: () => supabase.auth.signOut() 
        }
      ]
    )
  }

  return (
    <Container>
      <YStack f={1} gap="$6" paddingVertical="$4">
        <YStack gap="$4">
          <Card elevation={2} padding="$4" gap="$5">
            <YStack gap="$2.5">
              <XStack ai="center" gap="$2">
                <Mail size={14} color="$colorSubtitle" />
                <Text fontSize={12} fontWeight="700" color="$colorSubtitle" letterSpacing={0.5}>EMAIL ADDRESS</Text>
              </XStack>
              <Text fontSize={16} fontWeight="600" paddingLeft="$6">{user?.email}</Text>
            </YStack>

            <YStack gap="$2.5">
              <XStack ai="center" gap="$2">
                <UserIcon size={14} color="$colorSubtitle" />
                <Text fontSize={12} fontWeight="700" color="$colorSubtitle" letterSpacing={0.5}>DISPLAY NAME</Text>
              </XStack>
              <Input
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
                <Text color="$red10" fontSize={13} paddingLeft="$2">
                  {error}
                </Text>
              )}
            </YStack>
          </Card>

          <Button 
            variant="primary"
            icon={Save} 
            onPress={handleSave} 
            disabled={saving || loading}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </YStack>

        <YStack f={1} jc="flex-end" paddingBottom="$4">
          <Button 
            variant="outline"
            theme="red"
            icon={LogOut} 
            onPress={handleLogout}
            borderColor="$red8"
            color="$red10"
          >
            Logout
          </Button>
        </YStack>
      </YStack>
    </Container>
  )
}

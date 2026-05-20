import { useState } from 'react'
import { Alert } from 'react-native'
import { supabase } from '../lib/supabase'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { Container, YStack, XStack, Text, Input, Button, Card } from '../components/ui'
import { UserPlus, User, Mail, Lock } from '@tamagui/lucide-icons'
import { sanitizeTextInput, MAX_PROFILE_NAME_LENGTH } from '../lib/validation'

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>

export default function SignupScreen({ navigation }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const signup = async () => {
    const sanitizedName = sanitizeTextInput(name)
    const sanitizedEmail = email.trim()

    if (!sanitizedName) {
      Alert.alert('Error', 'Please enter your name.')
      return
    }

    if (!sanitizedEmail || !password) {
      Alert.alert('Error', 'Please enter your email and password.')
      return
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password,
      options: {
        data: {
          name: sanitizedName,
        }
      }
    })

    if (error) {
      Alert.alert('Signup Failed', error.message)
      setLoading(false)
      return
    }

    Alert.alert('Account created', 'You can now log in.')
    navigation.navigate('Login')
    setLoading(false)
  }

  return (
    <Container jc="center">
      <YStack gap="$8" padding="$4">
        <YStack gap="$2" ai="center">
          <Text fontSize={32} fontWeight="800" letterSpacing={-1}>Join RoomieCart</Text>
          <Text color="$colorSubtitle" fontWeight="500">Collaborate with your roommates</Text>
        </YStack>

        <Card elevation={2} padding="$5" gap="$5">
          <YStack gap="$4">
            <YStack gap="$2">
              <XStack ai="center" gap="$2">
                <User size={14} color="$colorSubtitle" />
                <Text fontSize={12} fontWeight="700" color="$colorSubtitle" letterSpacing={0.5}>DISPLAY NAME</Text>
              </XStack>
              <Input
                placeholder="How should roommates call you?"
                value={name}
                onChangeText={setName}
                size="$4"
                maxLength={MAX_PROFILE_NAME_LENGTH}
              />
            </YStack>

            <YStack gap="$2">
              <XStack ai="center" gap="$2">
                <Mail size={14} color="$colorSubtitle" />
                <Text fontSize={12} fontWeight="700" color="$colorSubtitle" letterSpacing={0.5}>EMAIL ADDRESS</Text>
              </XStack>
              <Input
                placeholder="email@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                size="$4"
              />
            </YStack>

            <YStack gap="$2">
              <XStack ai="center" gap="$2">
                <Lock size={14} color="$colorSubtitle" />
                <Text fontSize={12} fontWeight="700" color="$colorSubtitle" letterSpacing={0.5}>PASSWORD</Text>
              </XStack>
              <Input
                placeholder="Min 6 characters"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                size="$4"
              />
            </YStack>
          </YStack>

          <Button 
            variant="primary"
            size="$5" 
            onPress={signup} 
            disabled={loading}
            icon={loading ? undefined : UserPlus}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </Card>

        <YStack ai="center" gap="$2">
          <Text color="$colorSubtitle" fontWeight="500">Already have an account?</Text>
          <Button 
            variant="ghost"
            onPress={() => navigation.navigate('Login')}
            size="$3"
          >
            Back to Login
          </Button>
        </YStack>
      </YStack>
    </Container>
  )
}

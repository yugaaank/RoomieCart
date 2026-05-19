import { useState } from 'react'
import { Alert } from 'react-native'
import { supabase } from '../lib/supabase'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { Container, YStack, Title, Text, Input, Button } from '../components/ui'
import { UserPlus } from '@tamagui/lucide-icons'

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>

export default function SignupScreen({ navigation }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const signup = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
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
      <YStack gap="$6" padding="$4">
        <YStack gap="$2" ai="center">
          <Title fontSize={32}>Join RoomieCart</Title>
          <Text color="$colorSubtitle">Start collaborating with your roommates</Text>
        </YStack>

        <YStack gap="$4">
          <YStack gap="$2">
            <Text fontWeight="bold">Email</Text>
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
            <Text fontWeight="bold">Password</Text>
            <Input
              placeholder="Min 6 characters"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              size="$4"
            />
          </YStack>

          <Button 
            theme="active" 
            size="$5" 
            onPress={signup} 
            disabled={loading}
            icon={UserPlus}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </Button>
        </YStack>

        <YStack ai="center" gap="$2">
          <Text color="$colorSubtitle">Already have an account?</Text>
          <Button 
            chromeless 
            onPress={() => navigation.navigate('Login')}
          >
            Back to Login
          </Button>
        </YStack>
      </YStack>
    </Container>
  )
}

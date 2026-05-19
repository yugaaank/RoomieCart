import { useState } from 'react'
import { Alert } from 'react-native'
import { supabase } from '../lib/supabase'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { Container, YStack, Title, Text, Input, Button } from '../components/ui'
import { LogIn } from '@tamagui/lucide-icons'

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const login = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      Alert.alert('Login Failed', error.message)
    }
    setLoading(false)
  }

  return (
    <Container jc="center">
      <YStack gap="$6" padding="$4">
        <YStack gap="$2" ai="center">
          <Title fontSize={32}>RoomieCart</Title>
          <Text color="$colorSubtitle">Shared shopping made simple</Text>
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
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              size="$4"
            />
          </YStack>

          <Button 
            theme="active" 
            size="$5" 
            onPress={login} 
            disabled={loading}
            icon={LogIn}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </YStack>

        <YStack ai="center" gap="$2">
          <Text color="$colorSubtitle">Don't have an account?</Text>
          <Button 
            chromeless 
            onPress={() => navigation.navigate('Signup')}
          >
            Create an Account
          </Button>
        </YStack>
      </YStack>
    </Container>
  )
}

import { useState } from 'react'
import { Alert } from 'react-native'
import { supabase } from '../lib/supabase'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { Container, YStack, Text, Input, Button, XStack } from '../components/ui'
import { LogIn } from '@tamagui/lucide-icons'
import { SvgXml } from 'react-native-svg'

const logoXml = `
<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 21V10L12 3L21 10V21H16V14H8V21H3Z" stroke="#466349" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`

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
          <XStack ai="center" gap="$3">
            <SvgXml xml={logoXml} width={40} height={40} />
            <Text fontSize={36} fontWeight="700" color="$color">RoomieCart</Text>
          </XStack>
          <Text color="$colorSubtitle" fontSize={16}>Shared shopping made simple</Text>
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
            variant="primary" 
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
            variant="ghost" 
            onPress={() => navigation.navigate('Signup')}
          >
            Create an Account
          </Button>
        </YStack>
      </YStack>
    </Container>
  )
}

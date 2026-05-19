import { useState } from 'react'
import { View, TextInput, Button, Alert } from 'react-native'
import { supabase } from '../lib/supabase'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

type Props = NativeStackScreenProps<any>

export default function SignupScreen({ navigation }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const signup = async () => {
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    })

    if (error) {
      Alert.alert(error.message)
      return
    }

    Alert.alert('Account created')
    navigation.navigate('Login')
  }

  return (
    <View style={{ padding: 20, gap: 12 }}>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 12 }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, padding: 12 }}
      />

      <Button title="Signup" onPress={signup} />

      <Button
        title="Back to Login"
        onPress={() => navigation.navigate('Login')}
      />
    </View>
  )
}

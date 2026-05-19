import { useState } from 'react'
import { View, TextInput, Button, Alert } from 'react-native'
import { supabase } from '../lib/supabase'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

type Props = NativeStackScreenProps<any>

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const login = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      Alert.alert(error.message)
    }
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

      <Button title="Login" onPress={login} />

      <Button
        title="Go to Signup"
        onPress={() => navigation.navigate('Signup')}
      />
    </View>
  )
}

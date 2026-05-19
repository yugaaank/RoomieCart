import { useState, useEffect } from 'react'
import { View, Text, TextInput, Button, Alert, ActivityIndicator, StyleSheet } from 'react-native'
import { useAuthStore } from '../store/authStore'
import { profileService } from '../services/profileService'
import { Profile } from '../types/database.types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>

export default function ProfileScreen({ navigation }: Props) {
  const user = useAuthStore((state) => state.user)
  const [profile, setProfile] = useState<Profile | null>(null)
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
      setProfile(data)
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email}</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Display Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your Name"
        />
      </View>

      <View style={styles.buttonContainer}>
        {saving ? (
          <ActivityIndicator />
        ) : (
          <Button title="Save Changes" onPress={handleSave} />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#000',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 10,
  },
})

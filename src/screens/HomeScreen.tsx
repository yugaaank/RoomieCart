import { View, Button } from 'react-native'
import { supabase } from '../lib/supabase'

export default function HomeScreen() {
  return (
    <View style={{ padding: 20 }}>
      <Button
        title="Logout"
        onPress={() => supabase.auth.signOut()}
      />
    </View>
  )
}

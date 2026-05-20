import '@tamagui/native/setup-zeego'
import { useEffect } from 'react'
import { TamaguiProvider } from 'tamagui'
import tamaguiConfig from './tamagui.config'
import { supabase } from './src/lib/supabase'
import { useAuthStore } from './src/store/authStore'
import AppNavigator from './src/navigation/AppNavigator'

export default function App() {
  const setSession = useAuthStore((state) => state.setSession)
  const setLoading = useAuthStore((state) => state.setLoading)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <AppNavigator />
    </TamaguiProvider>
  )
}

import '@tamagui/native/setup-zeego'
import { useEffect, useMemo } from 'react'
import { useColorScheme } from 'react-native'
import { TamaguiProvider, Theme } from 'tamagui'
import tamaguiConfig from './tamagui.config'
import { supabase } from './src/lib/supabase'
import { useAuthStore } from './src/store/authStore'
import { useThemeStore } from './src/store/themeStore'
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
      <Theme name="light">
        <AppNavigator />
      </Theme>
    </TamaguiProvider>
  )
}

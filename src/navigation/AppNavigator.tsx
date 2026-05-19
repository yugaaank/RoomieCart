import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LoginScreen from '../screens/LoginScreen'
import SignupScreen from '../screens/SignupScreen'
import HomeScreen from '../screens/HomeScreen'
import CreateRoomScreen from '../screens/CreateRoomScreen'
import JoinRoomScreen from '../screens/JoinRoomScreen'
import RoomDetailsScreen from '../screens/RoomDetailsScreen'
import ProfileScreen from '../screens/ProfileScreen'
import PendingRequestsScreen from '../screens/PendingRequestsScreen'
import RoomSettingsScreen from '../screens/RoomSettingsScreen'
import { useAuthStore } from '../store/authStore'
import { View, ActivityIndicator } from 'react-native'

export type RootStackParamList = {
  Login: undefined
  Signup: undefined
  Home: undefined
  CreateRoom: undefined
  JoinRoom: undefined
  RoomDetails: { roomId: string; roomName: string }
  Profile: undefined
  PendingRequests: { roomId: string }
  RoomSettings: { roomId: string }
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function AppNavigator() {
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'My Rooms' }}
            />
            <Stack.Screen
              name="CreateRoom"
              component={CreateRoomScreen}
              options={{ title: 'Create Room' }}
            />
            <Stack.Screen
              name="JoinRoom"
              component={JoinRoomScreen}
              options={{ title: 'Join Room' }}
            />
            <Stack.Screen
              name="RoomDetails"
              component={RoomDetailsScreen}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: 'My Profile' }}
            />
            <Stack.Screen
              name="PendingRequests"
              component={PendingRequestsScreen}
              options={{ title: 'Pending Requests' }}
            />
            <Stack.Screen
              name="RoomSettings"
              component={RoomSettingsScreen}
              options={{ title: 'Room Settings' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
            />
            <Stack.Screen
              name="Signup"
              component={SignupScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

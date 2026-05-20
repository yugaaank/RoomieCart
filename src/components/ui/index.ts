import { styled, YStack, XStack, Text, Button, Input, Card } from 'tamagui'

export const Container = styled(YStack, {
  name: 'Container',
  flex: 1,
  backgroundColor: '$background',
  padding: '$4',
})

export const Header = styled(YStack, {
  name: 'Header',
  gap: '$2',
  marginBottom: '$4',
})

export const Title = styled(Text, {
  name: 'Title',
  fontSize: 24,
  fontWeight: 'bold',
  color: '$color',
})

export const Subtitle = styled(Text, {
  name: 'Subtitle',
  fontSize: 16,
  color: '$colorSubtitle',
})

export { YStack, XStack, Button, Input, Card, Text }

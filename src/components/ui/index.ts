import { styled, YStack, XStack, Text, Button as TButton, Input as TInput, Card as TCard } from 'tamagui'

export const Container = styled(YStack, {
  name: 'Container',
  flex: 1,
  backgroundColor: '$background',
  padding: '$4',
})

export const Card = styled(TCard, {
  name: 'Card',
  backgroundColor: '$background',
  borderRadius: '$4',
  borderWidth: 1,
  borderColor: '$borderColor',
  padding: '$4',
  elevation: 2,
  shadowColor: 'rgba(0,0,0,0.1)',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 4,
})

export const Button = styled(TButton, {
  name: 'Button',
  borderRadius: '$3',
  fontWeight: '600',
  fontSize: 14,
  height: 44,
  variants: {
    variant: {
      primary: {
        backgroundColor: '$color',
        color: '$background',
        pressStyle: { opacity: 0.9, scale: 0.98 },
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$borderColor',
        color: '$color',
        pressStyle: { backgroundColor: '$backgroundStrong', scale: 0.98 },
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '$color',
        pressStyle: { backgroundColor: '$backgroundStrong', scale: 0.98 },
      },
      destructive: {
        backgroundColor: '$red9',
        color: 'white',
        pressStyle: { opacity: 0.9, scale: 0.98 },
      }
    }
  } as const,
  defaultVariants: {
    variant: 'outline'
  }
})

export const Input = styled(TInput, {
  name: 'Input',
  backgroundColor: '$background',
  borderRadius: '$3',
  borderWidth: 1,
  borderColor: '$borderColor',
  height: 44,
  paddingHorizontal: '$4',
  fontSize: 14,
  color: '$color',
  focusStyle: {
    borderColor: '$blue10',
    borderWidth: 2,
  }
})

export const Badge = styled(YStack, {
  name: 'Badge',
  paddingHorizontal: '$2.5',
  paddingVertical: '$0.5',
  borderRadius: '$full',
  backgroundColor: '$backgroundStrong',
  ai: 'center',
  jc: 'center',
  variants: {
    variant: {
      outline: {
        borderWidth: 1,
        borderColor: '$borderColor',
        backgroundColor: 'transparent',
      },
      secondary: {
        backgroundColor: '$backgroundStrong',
      },
      destructive: {
        backgroundColor: '$red3',
        borderColor: '$red5',
        borderWidth: 1,
      }
    }
  } as const,
  defaultVariants: {
    variant: 'secondary'
  }
})

export { YStack, XStack, Text }

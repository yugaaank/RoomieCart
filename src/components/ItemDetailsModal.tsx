import { Sheet, YStack, XStack, Text, Button } from 'tamagui'
import { X, Info, MapPin, DollarSign, Tag, User } from '@tamagui/lucide-icons'
import { ShoppingItem } from '../types/database.types'

interface Props {
  visible: boolean
  item: ShoppingItem | null
  onClose: () => void
}

export default function ItemDetailsModal({ visible, item, onClose }: Props) {
  if (!item) return null

  return (
    <Sheet
      modal
      open={visible}
      onOpenChange={(open) => !open && onClose()}
      snapPoints={[50]}
      dismissOnSnapToBottom
      zIndex={100000}
      animation="medium"
    >
      <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} backgroundColor="rgba(0,0,0,0.5)" />
      <Sheet.Frame bc="$background" borderTopLeftRadius={24} borderTopRightRadius={24} padding="$4">
        <Sheet.Handle />
        <YStack ai="center" padding="$4" gap="$2" borderBottomWidth={1} borderColor="$borderColor">
          <Text fontSize={20} fontWeight="bold">{item.name}</Text>
          <Button position="absolute" right="$2" top="$2" size="$2" circular icon={X} chromeless onPress={onClose} />
        </YStack>
        
        <YStack padding="$5" gap="$4">
          <XStack ai="center" gap="$3">
            <Info size={18} color="$colorSubtitle" />
            <Text f={1}>Quantity: {item.quantity} {item.unit || ''}</Text>
          </XStack>
          <XStack ai="center" gap="$3">
            <Tag size={18} color="$colorSubtitle" />
            <Text f={1}>Category: {item.category || 'Uncategorized'}</Text>
          </XStack>
          {item.store && (
            <XStack ai="center" gap="$3">
              <MapPin size={18} color="$colorSubtitle" />
              <Text f={1}>Store: {item.store}</Text>
            </XStack>
          )}
          {item.estimated_price && (
            <XStack ai="center" gap="$3">
              <DollarSign size={18} color="$colorSubtitle" />
              <Text f={1}>Estimated: ${item.estimated_price}</Text>
            </XStack>
          )}
          <XStack ai="center" gap="$3">
            <User size={18} color="$colorSubtitle" />
            <Text f={1}>Added by: {item.profiles?.name || 'Unknown'}</Text>
          </XStack>
          {item.notes && (
            <YStack gap="$1">
              <Text fontSize={12} fontWeight="bold" color="$colorSubtitle">NOTES</Text>
              <Text>{item.notes}</Text>
            </YStack>
          )}
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}

import { Sheet, YStack, Button, Separator } from 'tamagui'
import { AlertCircle, Eye, Trash2 } from '@tamagui/lucide-icons'

interface ItemActionMenuProps {
  visible: boolean
  onClose: () => void
  onIssue: () => void
  onDetails: () => void
  onRemove: () => void
}

export function ItemActionMenu({ visible, onClose, onIssue, onDetails, onRemove }: ItemActionMenuProps) {
  return (
    <Sheet
      modal
      open={visible}
      onOpenChange={(open) => !open && onClose()}
      snapPoints={[35]}
      dismissOnSnapToBottom
      animation="medium"
      zIndex={100000}
    >
      <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} backgroundColor="rgba(0,0,0,0.5)" />
      <Sheet.Frame bc="$background" borderTopLeftRadius={24} borderTopRightRadius={24} padding="$4">
        <Sheet.Handle />
        <YStack gap="$2" marginTop="$4">
          <Button variant="ghost" icon={AlertCircle} justifyContent="flex-start" onPress={onIssue}>Open Change Request</Button>
          <Button variant="ghost" icon={Eye} justifyContent="flex-start" onPress={onDetails}>Show Details</Button>
          <Separator marginVertical="$2" />
          <Button variant="ghost" color="$red10" icon={Trash2} justifyContent="flex-start" onPress={onRemove}>Remove Item</Button>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}

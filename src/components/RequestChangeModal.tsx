import { useState } from 'react'
import { Modal } from 'react-native'
import { itemService } from '../services/itemService'
import { ShoppingItem } from '../types/database.types'
import { YStack, XStack, Text, Button, Input, Card } from './ui'
import { AlertTriangle, Send, X } from '@tamagui/lucide-icons'
import { Alert } from 'react-native'

interface Props {
  visible: boolean
  item: ShoppingItem | null
  userId: string
  onClose: () => void
  onSuccess: () => void
}

export default function RequestChangeModal({ visible, item, userId, onClose, onSuccess }: Props) {
  const [newQuantity, setNewQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  if (!item) return null

  const handleSubmit = async () => {
    if (!newQuantity.trim()) {
      Alert.alert('Error', 'Please enter a new quantity')
      return
    }

    setLoading(true)
    try {
      await itemService.createChangeRequest(item.id, userId, newQuantity.trim(), reason.trim())
      // Also update item status locally or let realtime handle it
      await itemService.updateItemStatus(item.id, 'discussion_pending')
      
      Alert.alert('Request Sent', 'Your roommates will be notified of the quantity change request.')
      onSuccess()
      onClose()
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <YStack f={1} bc="rgba(0,0,0,0.5)" jc="center" p="$4">
        <Card elevation="$4" borderWidth={1} borderColor="$borderColor" p="$5" gap="$4">
          <XStack jc="space-between" ai="center">
            <Text fontSize={20} fontWeight="bold">Change Quantity</Text>
            <Button size="$2" circular icon={X} chromeless onPress={onClose} />
          </XStack>

          <YStack gap="$2" p="$3" bc="$backgroundStrong" br="$4">
            <XStack ai="center" gap="$2">
              <AlertTriangle size={16} color="$yellow10" />
              <Text fontWeight="bold">{item.name}</Text>
            </XStack>
            <Text color="$colorSubtitle">Current: {item.quantity} {item.unit || ''}</Text>
          </YStack>

          <YStack gap="$3">
            <YStack gap="$1">
              <Text fontWeight="bold">New Quantity</Text>
              <Input
                placeholder="e.g. 2kg, 5 units"
                value={newQuantity}
                onChangeText={setNewQuantity}
                size="$4"
              />
            </YStack>

            <YStack gap="$1">
              <Text fontWeight="bold">Reason (Optional)</Text>
              <Input
                placeholder="Why the change?"
                value={reason}
                onChangeText={setReason}
                size="$4"
                height={80}
                multiline
                textAlignVertical="top"
              />
            </YStack>
          </YStack>

          <XStack gap="$3">
            <Button f={1} chromeless onPress={onClose}>Cancel</Button>
            <Button 
              f={1} 
              theme="active" 
              icon={Send} 
              onPress={handleSubmit} 
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </Button>
          </XStack>
        </Card>
      </YStack>
    </Modal>
  )
}

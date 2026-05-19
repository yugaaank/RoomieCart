import { useState, useEffect } from 'react'
import { Alert, Modal, ScrollView } from 'react-native'
import { itemService } from '../services/itemService'
import { ShoppingItem } from '../types/database.types'
import { YStack, XStack, Text, Button, Input, Card, Container } from './ui'
import { AlertTriangle, Send, X, ChevronDown, ChevronUp } from '@tamagui/lucide-icons'
import { 
  MAX_ITEM_NAME_LENGTH, 
  MAX_QUANTITY_VALUE, 
  MIN_REASON_LENGTH, 
  isValidQuantityValue, 
  sanitizeTextInput 
} from '../lib/validation'

const UNITS = ['pcs', 'kg', 'g', 'L', 'ml', 'pack', 'box', 'other']
const CATEGORIES = ['Produce', 'Dairy', 'Meat', 'Bakery', 'Frozen', 'Pantry', 'Cleaning', 'Personal Care', 'Other']
const PRIORITIES = ['low', 'medium', 'high']

interface Props {
  visible: boolean
  item: ShoppingItem | null
  userId: string
  roomMembers: any[]
  onClose: () => void
  onSuccess: () => void
}

export default function RequestChangeModal({ 
  visible, 
  item, 
  userId, 
  roomMembers, 
  onClose, 
  onSuccess 
}: Props) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [targetMemberIds, setTargetMemberIds] = useState<string[]>([])
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [notes, setNotes] = useState('')
  const [estimatedPrice, setEstimatedPrice] = useState('')
  const [store, setStore] = useState('')
  const [reason, setReason] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    if (item && visible) {
      setName(item.name)
      setQuantity(item.quantity)
      setUnit(item.unit || 'pcs')
      setTargetMemberIds(item.target_member_ids || [])
      setCategory(item.category || '')
      setPriority(item.priority || 'medium')
      setNotes(item.notes || '')
      setEstimatedPrice(item.estimated_price?.toString() || '')
      setStore(item.store || '')
      setReason('')
      setFormError(null)
    }
  }, [item, visible])

  if (!item) return null

  const toggleTargetMember = (memberUserId: string) => {
    setTargetMemberIds((currentIds) =>
      currentIds.includes(memberUserId)
        ? currentIds.filter((id) => id !== memberUserId)
        : [...currentIds, memberUserId]
    )
  }

  const handleSubmit = async () => {
    const sanitizedName = sanitizeTextInput(name)
    const sanitizedQuantity = sanitizeTextInput(quantity)
    const sanitizedReason = sanitizeTextInput(reason)
    const sanitizedPrice = estimatedPrice.trim()

    if (!sanitizedName) {
      setFormError('Item name is required.')
      return
    }

    if (!isValidQuantityValue(sanitizedQuantity)) {
      setFormError(`Quantity must be a number between 0 and ${MAX_QUANTITY_VALUE}.`)
      return
    }

    if (sanitizedPrice && isNaN(Number(sanitizedPrice))) {
      setFormError('Estimated price must be a number.')
      return
    }

    if (sanitizedReason.length < MIN_REASON_LENGTH) {
      setFormError(`Please provide a reason with at least ${MIN_REASON_LENGTH} characters.`)
      return
    }

    const newData = {
      name: sanitizedName,
      quantity: sanitizedQuantity,
      unit,
      target_member_ids: targetMemberIds,
      category: category || null,
      priority,
      notes: notes.trim() || null,
      estimated_price: sanitizedPrice ? Number(sanitizedPrice) : null,
      store: store.trim() || null
    }

    const oldData = {
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      target_member_ids: item.target_member_ids,
      category: item.category,
      priority: item.priority,
      notes: item.notes,
      estimated_price: item.estimated_price,
      store: item.store
    }

    const hasChanges = JSON.stringify(newData) !== JSON.stringify(oldData)

    if (!hasChanges) {
      setFormError('No changes detected.')
      return
    }

    setFormError(null)
    setLoading(true)
    try {
      await itemService.createChangeRequest(
        item.id,
        userId,
        oldData,
        newData,
        sanitizedReason
      )
      await itemService.updateItemStatus(item.id, 'discussion_pending')
      onSuccess()
      onClose()
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <YStack f={1} bc="rgba(0,0,0,0.5)" jc="flex-end">
        <Container bc="$background" borderTopLeftRadius="$6" borderTopRightRadius="$6" p="$0" maxHeight="90%">
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <YStack gap="$4">
              <XStack jc="space-between" ai="center">
                <YStack>
                  <Text fontSize={20} fontWeight="bold">Propose Changes</Text>
                  <Text color="$colorSubtitle">Update attributes for negotiation</Text>
                </YStack>
                <Button size="$2" circular icon={X} chromeless onPress={onClose} />
              </XStack>

              <YStack gap="$4">
                <YStack gap="$1">
                  <Text fontWeight="bold">Item Name</Text>
                  <Input value={name} onChangeText={setName} size="$4" />
                </YStack>

                <XStack gap="$3">
                  <YStack f={1} gap="$1">
                    <Text fontWeight="bold">Quantity</Text>
                    <Input value={quantity} onChangeText={setQuantity} keyboardType="numeric" size="$4" />
                  </YStack>
                  <YStack f={1} gap="$1">
                    <Text fontWeight="bold">Unit</Text>
                    <XStack gap="$1" flexWrap="wrap">
                      {UNITS.slice(0, 4).map(u => (
                        <Button 
                          key={u} 
                          size="$2" 
                          backgroundColor={unit === u ? '$blue9' : '$background'}
                          color={unit === u ? 'white' : '$color'}
                          onPress={() => setUnit(u)}
                          borderWidth={1}
                          borderColor={unit === u ? '$blue9' : '$borderColor'}
                        >
                          {u}
                        </Button>
                      ))}
                    </XStack>
                  </YStack>
                </XStack>

                <Button 
                  size="$3" 
                  chromeless 
                  onPress={() => setShowAdvanced(!showAdvanced)}
                  iconAfter={showAdvanced ? ChevronUp : ChevronDown}
                >
                  {showAdvanced ? 'Hide Advanced Attributes' : 'Edit Advanced Attributes'}
                </Button>

                {showAdvanced && (
                  <YStack gap="$4" bc="$backgroundStrong" p="$3" br="$4">
                    <YStack gap="$1">
                      <Text fontWeight="bold">Category</Text>
                      <XStack gap="$1" flexWrap="wrap">
                        {CATEGORIES.map(c => (
                          <Button 
                            key={c} 
                            size="$2" 
                            backgroundColor={category === c ? '$blue10' : '$background'}
                            color={category === c ? 'white' : '$color'}
                            onPress={() => setCategory(c)}
                            borderWidth={1}
                            borderColor={category === c ? '$blue10' : '$borderColor'}
                          >
                            {c}
                          </Button>
                        ))}
                      </XStack>
                    </YStack>

                    <YStack gap="$1">
                      <Text fontWeight="bold">Priority</Text>
                      <XStack gap="$2">
                        {PRIORITIES.map(p => (
                          <Button 
                            key={p} 
                            f={1} 
                            size="$2" 
                            backgroundColor={priority === p ? '$blue10' : '$background'}
                            color={priority === p ? 'white' : '$color'}
                            onPress={() => setPriority(p as any)}
                            borderWidth={1}
                            borderColor={priority === p ? '$blue10' : '$borderColor'}
                          >
                            {p.toUpperCase()}
                          </Button>
                        ))}
                      </XStack>
                    </YStack>

                    <XStack gap="$3">
                      <YStack f={1} gap="$1">
                        <Text fontWeight="bold">Est. Price ($)</Text>
                        <Input value={estimatedPrice} onChangeText={setEstimatedPrice} keyboardType="numeric" size="$4" placeholder="0.00" />
                      </YStack>
                      <YStack f={1} gap="$1">
                        <Text fontWeight="bold">Store</Text>
                        <Input value={store} onChangeText={setStore} size="$4" placeholder="Costco, Market..." />
                      </YStack>
                    </XStack>

                    <YStack gap="$1">
                      <Text fontWeight="bold">Personal Notes</Text>
                      <Input value={notes} onChangeText={setNotes} size="$4" placeholder="Brand, size, specifics..." />
                    </YStack>
                  </YStack>
                )}

                <YStack gap="$2">
                  <Text fontWeight="bold">Who is this for?</Text>
                  <XStack gap="$2" flexWrap="wrap">
                    <Button 
                      size="$2" 
                      backgroundColor={targetMemberIds.length === 0 ? '$blue9' : '$background'}
                      color={targetMemberIds.length === 0 ? 'white' : '$color'}
                      onPress={() => setTargetMemberIds([])}
                      borderWidth={1}
                      borderColor={targetMemberIds.length === 0 ? '$blue9' : '$borderColor'}
                    >
                      Everyone
                    </Button>
                    {roomMembers.map((member) => (
                      <Button 
                        key={member.user_id} 
                        size="$2" 
                        backgroundColor={targetMemberIds.includes(member.user_id) ? '$blue9' : '$background'}
                        color={targetMemberIds.includes(member.user_id) ? 'white' : '$color'}
                        onPress={() => toggleTargetMember(member.user_id)}
                        borderWidth={1}
                        borderColor={targetMemberIds.includes(member.user_id) ? '$blue9' : '$borderColor'}
                      >
                        {member.profiles?.name?.split(' ')[0] || 'User'}
                      </Button>
                    ))}
                  </XStack>
                </YStack>

                <YStack gap="$1">
                  <Text fontWeight="bold">Reason for Changes</Text>
                  <Input value={reason} onChangeText={setReason} size="$4" height={80} multiline textAlignVertical="top" placeholder="Explain why these updates are needed" />
                </YStack>
              </YStack>

              {formError && <Text color="$red10" fontSize={13}>{formError}</Text>}

              <XStack gap="$3" pt="$2">
                <Button f={1} chromeless onPress={onClose}>Cancel</Button>
                <Button f={1} theme="active" icon={Send} onPress={handleSubmit} disabled={loading}>{loading ? 'Submitting...' : 'Submit Request'}</Button>
              </XStack>
            </YStack>
          </ScrollView>
        </Container>
      </YStack>
    </Modal>
  )
}

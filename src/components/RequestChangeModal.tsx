import { useState, useEffect } from 'react'
import { Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { itemService } from '../services/itemService'
import { ShoppingItem } from '../types/database.types'
import { YStack, XStack, Text, Button, Input, Sheet } from 'tamagui'
import { Send, X } from '@tamagui/lucide-icons'
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
    <Sheet
      forceRemoveScrollEnabled={visible}
      modal
      open={visible}
      onOpenChange={(open) => !open && onClose()}
      snapPoints={[90]}
      dismissOnSnapToBottom
      zIndex={100000}
      animation="medium"
    >
      <Sheet.Overlay 
        animation="lazy" 
        enterStyle={{ opacity: 0 }} 
        exitStyle={{ opacity: 0 }} 
        backgroundColor="rgba(0,0,0,0.5)"
      />
      <Sheet.Frame bc="$background" borderTopLeftRadius={24} borderTopRightRadius={24}>
        <Sheet.Handle />
        
        <YStack p="$4" borderBottomWidth={1} borderColor="$borderColor" ai="center" position="relative">
          <YStack ai="center">
            <Text fontSize={20} fontWeight="bold">Propose Changes</Text>
            <Text color="$colorSubtitle" fontSize={14}>{item.name}</Text>
          </YStack>
          <Button 
            position="absolute" 
            right="$4" 
            top="$3" 
            size="$2" 
            circular 
            icon={X} 
            chromeless 
            onPress={onClose} 
          />
        </YStack>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Sheet.ScrollView 
            p="$5"
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            <YStack gap="$5">
              <YStack gap="$1.5">
                <Text fontSize={12} fontWeight="bold" color="$colorSubtitle" letterSpacing={1}>ITEM NAME</Text>
                <Input value={name} onChangeText={setName} size="$4" backgroundColor="$backgroundStrong" />
              </YStack>

              <XStack gap="$4">
                <YStack f={1} gap="$1.5">
                  <Text fontSize={12} fontWeight="bold" color="$colorSubtitle" letterSpacing={1}>QUANTITY</Text>
                  <Input value={quantity} onChangeText={setQuantity} keyboardType="numeric" size="$4" backgroundColor="$backgroundStrong" />
                </YStack>
                <YStack f={2} gap="$1.5">
                  <Text fontSize={12} fontWeight="bold" color="$colorSubtitle" letterSpacing={1}>UNIT</Text>
                  <Sheet.ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <XStack gap="$1">
                      {UNITS.map(u => (
                        <Button 
                          key={u} 
                          size="$2" 
                          backgroundColor={unit === u ? '$blue9' : '$backgroundStrong'}
                          color={unit === u ? 'white' : '$color'}
                          onPress={() => setUnit(u)}
                        >{u}</Button>
                      ))}
                    </XStack>
                  </Sheet.ScrollView>
                </YStack>
              </XStack>

              <YStack gap="$2.5">
                <Text fontSize={12} fontWeight="bold" color="$colorSubtitle" letterSpacing={1}>WHO IS THIS FOR?</Text>
                <Sheet.ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <XStack gap="$1.5">
                    <Button 
                      size="$2.5" 
                      backgroundColor={targetMemberIds.length === 0 ? '$blue9' : '$backgroundStrong'}
                      color={targetMemberIds.length === 0 ? 'white' : '$color'}
                      onPress={() => setTargetMemberIds([])}
                    >Everyone</Button>
                    {roomMembers.map((member) => (
                      <Button 
                        key={member.user_id} 
                        size="$2.5" 
                        backgroundColor={targetMemberIds.includes(member.user_id) ? '$blue9' : '$backgroundStrong'}
                        color={targetMemberIds.includes(member.user_id) ? 'white' : '$color'}
                        onPress={() => toggleTargetMember(member.user_id)}
                      >
                        {member.profiles?.name?.split(' ')[0] || 'User'}
                      </Button>
                    ))}
                  </XStack>
                </Sheet.ScrollView>
              </YStack>

              <YStack gap="$4" bc="$backgroundStrong" p="$4" br="$5">
                <Text fontSize={12} fontWeight="bold" color="$colorSubtitle" letterSpacing={1}>EXTRA DETAILS</Text>
                
                <YStack gap="$2.5">
                  <Text fontSize={11} fontWeight="bold">CATEGORY</Text>
                  <Sheet.ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <XStack gap="$1.5">
                      {CATEGORIES.map(c => (
                        <Button 
                          key={c} 
                          size="$2" 
                          backgroundColor={category === c ? '$blue10' : '$background'}
                          color={category === c ? 'white' : '$color'}
                          onPress={() => setCategory(c)}
                          borderWidth={1}
                          borderColor={category === c ? '$blue10' : '$borderColor'}
                        >{c}</Button>
                      ))}
                    </XStack>
                  </Sheet.ScrollView>
                </YStack>

                <XStack gap="$4">
                  <YStack f={1} gap="$2">
                    <Text fontSize={11} fontWeight="bold">PRIORITY</Text>
                    <XStack gap="$1.5">
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
                        >{p.charAt(0).toUpperCase()}</Button>
                      ))}
                    </XStack>
                  </YStack>
                  <YStack f={1} gap="$2">
                    <Text fontSize={11} fontWeight="bold">EST. PRICE ($)</Text>
                    <Input value={estimatedPrice} onChangeText={setEstimatedPrice} keyboardType="numeric" size="$3" placeholder="0.00" backgroundColor="$background" />
                  </YStack>
                </XStack>

                <YStack gap="$2">
                  <Text fontSize={11} fontWeight="bold">STORE</Text>
                  <Input value={store} onChangeText={setStore} size="$3" placeholder="e.g. Costco" backgroundColor="$background" />
                </YStack>

                <YStack gap="$2">
                  <Text fontSize={11} fontWeight="bold">NOTES</Text>
                  <Input value={notes} onChangeText={setNotes} size="$3" placeholder="Brand, specifics..." backgroundColor="$background" />
                </YStack>
              </YStack>

              <YStack gap="$2">
                <Text fontSize={12} fontWeight="bold" color="$colorSubtitle" letterSpacing={1}>REASON FOR CHANGE</Text>
                <Input value={reason} onChangeText={setReason} size="$4" height={80} multiline textAlignVertical="top" placeholder="Explain why these updates are needed (min 10 chars)" backgroundColor="$backgroundStrong" />
              </YStack>

              {formError && <Text color="$red10" fontSize={13} textAlign="center">{formError}</Text>}

              <Button 
                theme="active" 
                size="$5" 
                fontWeight="bold"
                icon={loading ? undefined : Send} 
                onPress={handleSubmit} 
                disabled={loading}
                borderRadius="$4"
              >
                {loading ? 'Submitting...' : 'Submit Proposal'}
              </Button>
            </YStack>
          </Sheet.ScrollView>
        </KeyboardAvoidingView>
      </Sheet.Frame>
    </Sheet>
  )
}

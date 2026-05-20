import { useState } from 'react'
import { KeyboardAvoidingView, Platform } from 'react-native'
import { YStack, XStack, Text, Button, Input, Sheet } from 'tamagui'
import { Plus, X } from '@tamagui/lucide-icons'
import { 
  MAX_ITEM_NAME_LENGTH, 
  MAX_QUANTITY_VALUE, 
  isValidQuantityValue, 
  sanitizeTextInput 
} from '../lib/validation'

const UNITS = ['pcs', 'kg', 'g', 'L', 'ml', 'pack', 'box', 'other']
const CATEGORIES = ['Produce', 'Dairy', 'Meat', 'Bakery', 'Frozen', 'Pantry', 'Cleaning', 'Personal Care', 'Other']
const PRIORITIES = ['low', 'medium', 'high']

interface Props {
  visible: boolean
  onClose: () => void
  onAdd: (itemData: any) => Promise<void>
  members: any[]
}

export default function AddItemSheet({ visible, onClose, onAdd, members }: Props) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('pcs')
  const [targetMemberIds, setTargetMemberIds] = useState<string[]>([])
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [notes, setNotes] = useState('')
  const [estimatedPrice, setEstimatedPrice] = useState('')
  const [store, setStore] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleTargetMember = (memberUserId: string) => {
    setTargetMemberIds((currentIds) =>
      currentIds.includes(memberUserId)
        ? currentIds.filter((id) => id !== memberUserId)
        : [...currentIds, memberUserId]
    )
  }

  const handleAdd = async () => {
    const sanitizedName = sanitizeTextInput(name)
    const sanitizedQuantity = sanitizeTextInput(quantity)

    if (!sanitizedName) {
      setError('Item name is required.')
      return
    }

    if (!isValidQuantityValue(sanitizedQuantity)) {
      setError(`Quantity must be a number between 0 and ${MAX_QUANTITY_VALUE}.`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onAdd({
        name: sanitizedName,
        quantity: sanitizedQuantity,
        unit,
        targetMemberIds,
        category: category || undefined,
        priority,
        notes: notes.trim() || undefined,
        estimated_price: estimatedPrice ? parseFloat(estimatedPrice) : undefined,
        store: store.trim() || undefined
      })
      
      // Reset and close
      setName('')
      setQuantity('1')
      setUnit('pcs')
      setTargetMemberIds([])
      setCategory('')
      setPriority('medium')
      setNotes('')
      setEstimatedPrice('')
      setStore('')
      onClose()
    } catch (err: any) {
      setError(err.message)
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
      snapPoints={[85]}
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
          <Text fontSize={20} fontWeight="bold">Add New Item</Text>
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
                <Input 
                  placeholder="e.g. Milk, Eggs..." 
                  value={name} 
                  onChangeText={setName} 
                  size="$4"
                  backgroundColor="$backgroundStrong"
                />
              </YStack>

              <XStack gap="$4">
                <YStack f={1} gap="$1.5">
                  <Text fontSize={12} fontWeight="bold" color="$colorSubtitle" letterSpacing={1}>QUANTITY</Text>
                  <Input 
                    placeholder="1" 
                    value={quantity} 
                    onChangeText={setQuantity} 
                    keyboardType="numeric" 
                    size="$4" 
                    backgroundColor="$backgroundStrong"
                  />
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
                    {members.map(m => (
                      <Button 
                        key={m.user_id} 
                        size="$2.5" 
                        backgroundColor={targetMemberIds.includes(m.user_id) ? '$blue9' : '$backgroundStrong'}
                        color={targetMemberIds.includes(m.user_id) ? 'white' : '$color'}
                        onPress={() => toggleTargetMember(m.user_id)}
                      >
                        {m.profiles?.name?.split(' ')[0]}
                      </Button>
                    ))}
                  </XStack>
                </Sheet.ScrollView>
              </YStack>

              <YStack gap="$4" bc="$backgroundStrong" p="$4" br="$5">
                <Text fontSize={12} fontWeight="bold" color="$colorSubtitle" letterSpacing={1}>EXTRA DETAILS (OPTIONAL)</Text>
                
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
                    <Text fontSize={11} fontWeight="bold">EST. PRICE</Text>
                    <Input 
                      size="$3" 
                      value={estimatedPrice} 
                      onChangeText={setEstimatedPrice} 
                      keyboardType="numeric" 
                      placeholder="$0.00" 
                      backgroundColor="$background"
                    />
                  </YStack>
                </XStack>

                <YStack gap="$2">
                  <Text fontSize={11} fontWeight="bold">STORE</Text>
                  <Input 
                    size="$3" 
                    value={store} 
                    onChangeText={setStore} 
                    placeholder="e.g. Costco" 
                    backgroundColor="$background"
                  />
                </YStack>

                <YStack gap="$2">
                  <Text fontSize={11} fontWeight="bold">NOTES</Text>
                  <Input 
                    size="$3" 
                    value={notes} 
                    onChangeText={setNotes} 
                    placeholder="Brand, size specifics..." 
                    backgroundColor="$background"
                  />
                </YStack>
              </YStack>

              {error && <Text color="$red10" fontSize={13} textAlign="center">{error}</Text>}

              <Button 
                theme="active" 
                size="$5" 
                fontWeight="bold"
                icon={loading ? undefined : Plus} 
                onPress={handleAdd}
                disabled={loading}
                borderRadius="$4"
              >
                {loading ? 'Adding...' : 'Add to List'}
              </Button>
            </YStack>
          </Sheet.ScrollView>
        </KeyboardAvoidingView>
      </Sheet.Frame>
    </Sheet>
  )
}

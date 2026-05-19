export const MAX_ITEM_NAME_LENGTH = 80
export const MAX_ROOM_NAME_LENGTH = 60
export const MAX_PROFILE_NAME_LENGTH = 40
export const MAX_QUANTITY_VALUE = 999
export const MIN_REASON_LENGTH = 10

export function sanitizeTextInput(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

export function isValidQuantityValue(value: string) {
  const sanitizedValue = sanitizeTextInput(value)

  if (!/^\d+(\.\d+)?$/.test(sanitizedValue)) {
    return false
  }

  const numericValue = Number(sanitizedValue)
  return numericValue > 0 && numericValue <= MAX_QUANTITY_VALUE
}

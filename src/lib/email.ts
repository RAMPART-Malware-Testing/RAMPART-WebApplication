const EMAIL_PATTERN = /^[^@\s]{1,64}@[^@\s]{1,190}\.[A-Za-z]{2,}$/

export function validateEmailInput(raw: string): { value: string } | { error: string } {
  if (/[^\x00-\x7F]/.test(raw)) {
    return { error: 'อีเมลต้องเป็นตัวอักษรอังกฤษ/ตัวเลขเท่านั้น (ตรวจพบอักขระภาษาอื่นปนอยู่)' }
  }

  const value = raw.trim().toLowerCase()
  if (value.split('@').length !== 2 || !EMAIL_PATTERN.test(value)) {
    return { error: 'รูปแบบอีเมลไม่ถูกต้อง (ตัวอย่างที่ถูกต้อง: yourname@gmail.com)' }
  }

  return { value }
}

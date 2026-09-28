export const PASSWORD_MIN_LENGTH = 8

export const PASSWORD_RULES: { test: (value: string) => boolean; message: string }[] = [
  { test: (v) => v.length >= PASSWORD_MIN_LENGTH, message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร' },
  { test: (v) => /[A-Z]/.test(v), message: 'รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว' },
  { test: (v) => /[a-z]/.test(v), message: 'รหัสผ่านต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว' },
  { test: (v) => /[0-9]/.test(v), message: 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว' },
  { test: (v) => /[!@#$%^&*(),.?":{}|<>]/.test(v), message: 'รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว' },
]

export function validatePassword(value: string): string {
  return PASSWORD_RULES.find((rule) => !rule.test(value))?.message ?? ''
}

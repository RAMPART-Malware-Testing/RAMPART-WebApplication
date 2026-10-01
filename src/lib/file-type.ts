export const NO_FILE_TYPE_LABEL = 'ไม่มี'

export function hasFileType(value?: string | null): boolean {
  return Boolean((value ?? '').trim())
}

export function fileTypeLabel(value?: string | null): string {
  const trimmed = (value ?? '').trim()
  return trimmed ? trimmed.toUpperCase() : NO_FILE_TYPE_LABEL
}

export function translateToolNote(note: string): string {
  if (note.includes('failed attempts')) {
    return 'ระบบพยายามเชื่อมต่อซ้ำหลายครั้งแต่ไม่สำเร็จ (อาจติด rate limit)'
  }
  if (note.includes('status checks with no result')) {
    return 'เครื่องมือนี้ใช้เวลานานเกินไป ระบบจึงข้ามการวิเคราะห์นี้ไป'
  }
  return 'เครื่องมือนี้พบปัญหาระหว่างวิเคราะห์และถูกข้ามไป'
}

export const TOOL_NOTE_LABELS: Record<string, string> = {
  virustotal: 'VirusTotal',
  mobsf: 'MobSF',
  cape: 'CAPE Sandbox',
}

export type TaskStatus =
  | "waiting"
  | "running"
  | "completed"
  | "failed"
  | "skipped"

export interface PipelineTask {
  id: string
  title: string
  subtitle?: string
  status: TaskStatus
  startedAt?: string
  finishedAt?: string
  message?: string
}

export interface VirusTotalResult {
  status: TaskStatus
  detectionCount: number
  totalEngines: number
  startedAt?: string
  finishedAt?: string
  message?: string
}

export interface MobSFResult {
  status: TaskStatus
  permissions?: number
  activities?: number
  services?: number
  receivers?: number
  riskScore?: number
  startedAt?: string
  finishedAt?: string
  message?: string
}

export interface CAPEResult {
  status: TaskStatus
  network?: number
  registry?: number
  files?: number
  processes?: number
  behaviorReport?: string
  startedAt?: string
  finishedAt?: string
  message?: string
}

export interface MLResult {
  status: TaskStatus
  prediction?: "Benign" | "Malware"
  confidence?: number
  // RampartAI /predict fields (percentages 0-100)
  modelConfidence?: number
  benignProbability?: number
  malwareProbability?: number
  startedAt?: string
  finishedAt?: string
  message?: string
}

export interface GeminiResult {
  status: TaskStatus
  summary?: string
  threatAssessment?: string
  behavior?: string
  recommendation?: string
  overallRisk?: "Low" | "Medium" | "High" | "Critical"
  startedAt?: string
  finishedAt?: string
  message?: string
}

export interface AnalysisResponse {
  fileId: string
  fileName: string
  overallStatus: "analyzing" | "completed" | "stopped"
  finalResult?: "Benign" | "Malware"
  virusTotal: VirusTotalResult
  mobsf: MobSFResult
  cape: CAPEResult
  ml: MLResult
  gemini: GeminiResult
}

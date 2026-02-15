'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import NavbarComponent from '@/components/NavbarComponent'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: 'uploading' | 'analyzing' | 'completed' | 'failed'
  progress: number
  uploadedFileId?: string
  error?: string
  analysisResult?: {
    riskLevel: 'low' | 'medium' | 'high'
    malwareType?: string
    score: number
  }
}

export default function ScanFilesPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [analysisMode, setAnalysisMode] = useState<'quick' | 'deep'>('quick')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // =============================
  // 1️⃣ GET ACCESS TOKEN + URI
  // =============================
  async function getAccessToken(): Promise<{ token: string; uri: string }> {
    const res = await fetch('/api/auth/access', {
      method: 'GET',
      credentials: 'include'
    })

    if (!res.ok) throw new Error('Unauthorized')

    const data = await res.json()

    if (!data.token || !data.uri) {
      throw new Error('Invalid auth response')
    }

    return {
      token: data.token,
      uri: data.uri
    }
  }

  // =============================
  // 2️⃣ UPLOAD FILE (WITH PROGRESS)
  // =============================
  async function uploadFile(file: File, fileId: string) {
    try {
      const { token, uri } = await getAccessToken()

      const formData = new FormData()
      formData.append('file', file)
      formData.append('analysis_mode', analysisMode)

      console.log("Uploading to:", `${uri}/api/analy/upload`)
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${uri}/api/analy/upload`)

      xhr.setRequestHeader('X-Access-Token', token)

      // Progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100)

          setUploadedFiles(prev =>
            prev.map(f =>
              f.id === fileId
                ? { ...f, progress: percent }
                : f
            )
          )
        }
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          console.log(response)
//           {
//   "success": true,
//   "message": "File already uploaded",
//   "file_id": "4696320f8515484d12463c4f03abb54042545e3b6f0c9c5df66bc8c5a2656ddf",
//   "filename": "4696320f8515484d12463c4f03abb54042545e3b6f0c9c5df66bc8c5a2656ddf.zip",
//   "task_id": "9ee3a42e-482d-4ec9-a917-1af6abb51029",
//   "status": "processing"
// }

          setUploadedFiles(prev =>
            prev.map(f =>
              f.id === fileId
                ? {
                    ...f,
                    status: 'analyzing',
                    progress: 100,
                    uploadedFileId: response.file_id
                  }
                : f
            )
          )

          // pollAnalysisStatus(response.file_id, fileId, uri, token)
        } else {
          throw new Error('Upload failed')
        }
      }

      xhr.onerror = () => {
        throw new Error('Network error')
      }

      xhr.send(formData)

    } catch (error) {
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === fileId
            ? {
                ...f,
                status: 'failed',
                error: error instanceof Error ? error.message : 'Upload failed'
              }
            : f
        )
      )
    }
  }

  // =============================
  // 3️⃣ POLL ANALYSIS STATUS
  // =============================
  async function pollAnalysisStatus(
    uploadedFileId: string,
    fileId: string,
    uri: string,
    token: string
  ) {
    // const interval = setInterval(async () => {
    //   try {
    //     const res = await fetch(`${uri}/api/analy/status/${uploadedFileId}`, {
    //       headers: {
    //         'X-Access-Token': token
    //       }
    //     })

    //     if (!res.ok) return

    //     const data = await res.json()

    //     if (data.status === 'completed') {
    //       clearInterval(interval)

    //       setUploadedFiles(prev =>
    //         prev.map(f =>
    //           f.id === fileId
    //             ? {
    //                 ...f,
    //                 status: 'completed',
    //                 analysisResult: data.result
    //               }
    //             : f
    //         )
    //       )
    //     }

    //   } catch (err) {
    //     clearInterval(interval)
    //   }
    // }, 5000) // poll ทุก 5 วิ
  }

  // =============================
  // HANDLE FILES
  // =============================
  const handleFiles = (files: File[]) => {
    const maxSize = 1024 * 1024 * 1024 // 1GB

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`ไฟล์ ${file.name} ใหญ่เกิน 1GB`)
        return false
      }
      return true
    })

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.name.split('.').pop() || 'unknown',
      status: 'uploading',
      progress: 0
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])

    newFiles.forEach((fileObj, index) => {
      uploadFile(validFiles[index], fileObj.id)
    })
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }

  // =============================
  // UI BELOW (เหมือนเดิมเกือบทั้งหมด)
  // =============================

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <NavbarComponent />

      <div className="max-w-3xl mx-auto space-y-6">

        <div className="bg-white/5 p-6 rounded-xl">
          <h3 className="text-white mb-4">โหมดการวิเคราะห์</h3>

          <button
            onClick={() => setAnalysisMode('quick')}
            className="mr-4 text-cyan-400"
          >
            Quick
          </button>

          <button
            onClick={() => setAnalysisMode('deep')}
            className="text-blue-400"
          >
            Deep
          </button>
        </div>

        <div className="bg-white/5 p-6 rounded-xl">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-cyan-500 px-6 py-3 rounded text-white"
          >
            เลือกไฟล์
          </button>

          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {uploadedFiles.map(file => (
          <div key={file.id} className="bg-white/5 p-4 rounded">
            <div className="text-white">{file.name}</div>
            <div className="text-sm text-gray-400">{file.status}</div>

            <div className="w-full bg-gray-700 h-2 mt-2 rounded">
              <div
                className="bg-cyan-500 h-2 rounded"
                style={{ width: `${file.progress}%` }}
              />
            </div>

            {file.analysisResult && (
              <div className="text-green-400 mt-2">
                Risk: {file.analysisResult.riskLevel} |
                Score: {file.analysisResult.score}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

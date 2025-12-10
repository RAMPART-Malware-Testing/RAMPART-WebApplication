'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import NavbarComponent from '@/components/NavbarComponent'
import { UploadService } from '@/services/uploadService'

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
  const [isDragging, setIsDragging] = useState(false)
  const [analysisMode, setAnalysisMode] = useState<'quick' | 'deep'>('quick')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(file => {
      const maxSize = 1024 * 1024 * 1024 // 1GB
      if (!UploadService.validateFileSize(file, 1)) {
        alert(`ไฟล์ ${file.name} มีขนาดใหญ่เกินไป (สูงสุด 1GB)`)
        return false
      }

      // Validate file extension
      if (!UploadService.validateFileExtension(file, acceptedFileTypes)) {
        alert(`ไฟล์ ${file.name} ไม่รองรับประเภทไฟล์นี้`)
        return false
      }

      return true
    })

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type || getFileExtension(file.name),
      status: 'uploading',
      progress: 0
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])

    // Upload files to server
    newFiles.forEach((uploadedFile, index) => {
      uploadFileToServer(files[index], uploadedFile.id)
    })
  }

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || 'unknown'
  }

  const uploadFileToServer = async (file: File, fileId: string) => {
    try {
      // Get access token from localStorage or session
      const accessToken = localStorage.getItem('accessToken') || undefined

      // Upload file with progress tracking
      const response = await UploadService.uploadFile(file, {
        accessToken,
        onProgress: (progress) => {
          setUploadedFiles(prev =>
            prev.map(f =>
              f.id === fileId
                ? { ...f, progress: progress.percentage }
                : f
            )
          )
        }
      })

      // Upload completed successfully
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

      // Start analysis process
      simulateAnalysisProcess(fileId)

    } catch (error) {
      console.error('Upload error:', error)

      // Update file status to failed
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

      // Show error to user
      alert(`การอัพโหลดไฟล์ ${file.name} ล้มเหลว: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const simulateAnalysisProcess = (fileId: string) => {
    // Simulate analysis progress
    setTimeout(() => {
      const riskLevels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high']
      const malwareTypes = ['Trojan', 'Ransomware', 'Spyware', 'Adware', 'Worm', 'Clean']
      
      setUploadedFiles(prev => 
        prev.map(file => 
          file.id === fileId 
            ? { 
                ...file, 
                status: 'completed',
                analysisResult: {
                  riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
                  malwareType: malwareTypes[Math.floor(Math.random() * malwareTypes.length)],
                  score: Math.floor(Math.random() * 10) + 1
                }
              }
            : file
        )
      )
    }, 3000)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading': return 'text-yellow-400'
      case 'analyzing': return 'text-blue-400'
      case 'completed': return 'text-green-400'
      case 'failed': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusText = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading': return 'กำลังอัพโหลด'
      case 'analyzing': return 'กำลังวิเคราะห์'
      case 'completed': return 'วิเคราะห์เสร็จสิ้น'
      case 'failed': return 'ล้มเหลว'
      default: return 'รอดำเนินการ'
    }
  }

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/20'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const acceptedFileTypes = [
    '.exe', '.dll', '.msi', '.apk', '.jar', 
    '.pdf', '.doc', '.docx', '.xls', '.xlsx',
    '.ps1', '.bat', '.cmd', '.vbs', '.js',
    '.zip', '.rar', '.7z', '.tar', '.gz'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0f172a] to-[#1e293b] p-6">
      {/* Header */}
      <NavbarComponent/>  

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="xl:col-span-2 space-y-6">
          {/* Analysis Mode Selection */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-semibold mb-4">โหมดการวิเคราะห์</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setAnalysisMode('quick')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  analysisMode === 'quick'
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-white/10 bg-white/5 hover:border-cyan-500/30'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    analysisMode === 'quick' ? 'bg-cyan-500/20' : 'bg-white/5'
                  }`}>
                    <i className="fas fa-bolt text-cyan-400"></i>
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-semibold">วิเคราะห์ด่วน</h4>
                    <p className="text-blue-200/60 text-sm">เสร็จใน 2-3 นาที</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setAnalysisMode('deep')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  analysisMode === 'deep'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/10 bg-white/5 hover:border-blue-500/30'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    analysisMode === 'deep' ? 'bg-blue-500/20' : 'bg-white/5'
                  }`}>
                    <i className="fas fa-microscope text-blue-400"></i>
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-semibold">วิเคราะห์ลึก</h4>
                    <p className="text-blue-200/60 text-sm">เสร็จใน 10-15 นาที</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Upload Area */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                isDragging
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-white/10 hover:border-cyan-500/30'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="w-20 h-20 mx-auto mb-4 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20">
                <i className="fas fa-cloud-upload-alt text-cyan-400 text-2xl"></i>
              </div>
              
              <h3 className="text-white font-semibold text-lg mb-2">
                ลากและวางไฟล์ที่นี่
              </h3>
              
              <p className="text-blue-200/60 text-sm mb-4">
                หรือคลิกเพื่อเลือกไฟล์จากคอมพิวเตอร์ของคุณ
              </p>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-2xl hover:shadow-cyan-500/25 hover:scale-105 transition-all duration-300"
              >
                <i className="fas fa-folder-open mr-2"></i>
                เลือกไฟล์
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInput}
                multiple
                accept={acceptedFileTypes.join(',')}
                className="hidden"
              />

              <p className="text-blue-200/40 text-xs mt-4">
                รองรับไฟล์: {acceptedFileTypes.join(', ')} (สูงสุด 1GB ต่อไฟล์)
              </p>
            </div>
          </div>

          {/* File List */}
          {uploadedFiles.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-4">ไฟล์ที่อัพโหลด</h3>
              <div className="space-y-3">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                        <i className="fas fa-file text-cyan-400"></i>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-white font-medium truncate">
                            {file.name}
                          </p>
                          <span className="text-blue-200/60 text-xs bg-white/5 px-2 py-1 rounded">
                            {file.type}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-blue-200/60">
                          <span>{formatFileSize(file.size)}</span>
                          <span className={`${getStatusColor(file.status)}`}>
                            {getStatusText(file.status)}
                          </span>
                          {file.status === 'uploading' && (
                            <span className="text-cyan-400 font-medium">
                              {file.progress}%
                            </span>
                          )}
                        </div>

                        {/* Error Message */}
                        {file.error && (
                          <div className="text-xs text-red-400 mt-1 p-2 bg-red-500/10 rounded border border-red-500/20">
                            <i className="fas fa-exclamation-circle mr-1"></i>
                            {file.error}
                          </div>
                        )}

                        {/* Progress Bar */}
                        {file.status !== 'failed' && (
                          <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                file.status === 'uploading'
                                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                                  : file.status === 'analyzing'
                                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse'
                                  : 'bg-gradient-to-r from-green-500 to-emerald-500'
                              }`}
                              style={{ width: `${file.progress}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Analysis Result */}
                    {file.analysisResult && (
                      <div className={`px-3 py-2 rounded-lg border text-xs font-medium ${getRiskColor(file.analysisResult.riskLevel)}`}>
                        <div className="text-center">
                          <div className="font-bold">{file.analysisResult.malwareType}</div>
                          <div>Risk: {file.analysisResult.riskLevel}</div>
                          <div>Score: {file.analysisResult.score}/10</div>
                        </div>
                      </div>
                    )}

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFile(file.id)}
                      className="ml-4 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-300"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Information */}
        <div className="space-y-6">
          {/* Analysis Information */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
              <i className="fas fa-info-circle text-cyan-400"></i>
              <span>ข้อมูลการวิเคราะห์</span>
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-blue-200/60">โหมดปัจจุบัน</span>
                <span className="text-white font-medium capitalize">{analysisMode}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-blue-200/60">เวลาที่ใช้</span>
                <span className="text-white font-medium">
                  {analysisMode === 'quick' ? '2-3 นาที' : '10-15 นาที'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-blue-200/60">ไฟล์ในคิว</span>
                <span className="text-white font-medium">{uploadedFiles.length}</span>
              </div>
            </div>
          </div>

          {/* Supported File Types */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
              <i className="fas fa-check-circle text-green-400"></i>
              <span>ประเภทไฟล์ที่รองรับ</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              {acceptedFileTypes.map((type, index) => (
                <div
                  key={type}
                  className="flex items-center space-x-2 p-2 bg-white/5 rounded-lg"
                >
                  <i className="fas fa-file text-cyan-400 text-xs"></i>
                  <span className="text-blue-200/60 text-sm">{type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-semibold mb-4">การดำเนินการด่วน</h3>
            
            <div className="space-y-3">
              <Link href="/profile?m=report" className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl py-3 px-4 transition-all duration-300 flex items-center justify-center space-x-2">
                <i className="fas fa-history"></i>
                <span>ประวัติการวิเคราะห์</span>
              </Link>
              
              <Link href="/reports" className="w-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl py-3 px-4 transition-all duration-300 flex items-center justify-center space-x-2">
                <i className="fas fa-chart-bar"></i>
                <span>ดูรายงานทั้งหมด</span>
              </Link>
              
              <Link 
                href="/dashboard"
                className="block w-full bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-xl py-3 px-4 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <i className="fas fa-tachometer-alt"></i>
                <span>กลับไปหน้า Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
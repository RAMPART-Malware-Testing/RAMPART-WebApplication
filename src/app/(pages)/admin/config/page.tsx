'use client'

import { useState, useEffect } from 'react'
import { useAdminConfig, useUpdateConfig } from '@/hooks/queries/useAdminConfig'
import Link from 'next/link'
import GeometricLoader from '@/components/GeometricLoader'

export default function AdminConfigPage() {
  const { data: config, isLoading, refetch } = useAdminConfig()
  const updateConfig = useUpdateConfig()
  const [enableVtHashCheck, setEnableVtHashCheck] = useState(true)

  useEffect(() => {
    if (config && config.VIRUSTOTAL_HASH_CHECK_ENABLED !== undefined) {
      setEnableVtHashCheck(config.VIRUSTOTAL_HASH_CHECK_ENABLED)
    }
  }, [config])

  const handleUpdateConfig = async () => {
    const result = await updateConfig.mutateAsync({
      key: 'VIRUSTOTAL_HASH_CHECK_ENABLED',
      value: enableVtHashCheck,
    })

    if (result.success) {
      alert('อัปเดตการตั้งค่าสำเร็จ')
      refetch()
    } else {
      alert(result.message || 'อัปเดตการตั้งค่าไม่สำเร็จ')
    }
  }

  if (isLoading) return <GeometricLoader loadingText="กำลังโหลดข้อมูล..." />

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <i className="fas fa-cog text-cyan-400" />
            การตั้งค่าระบบ
          </h1>
          <p className="text-slate-400">จัดการการตั้งค่าระบบและพฤติกรรมของเครื่องมือวิเคราะห์</p>
        </div>
        <Link
          href="/admin"
          className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium transition flex items-center gap-2"
        >
          <i className="fas fa-arrow-left" />
          กลับสู่หน้าหลัก
        </Link>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <i className="fas fa-virus text-purple-400" />
            VirusTotal Hash Check
          </h3>
          <p className="text-slate-400 text-sm mt-1">ควบคุมการตรวจสอบ hash ผ่าน VirusTotal ก่อนส่งไฟล์ไปวิเคราะห์</p>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="mt-1">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${enableVtHashCheck ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                <i className={`fas fa-${enableVtHashCheck ? 'check-circle' : 'times-circle'} ${enableVtHashCheck ? 'text-emerald-400' : 'text-rose-400'} text-xl`} />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-white font-medium mb-2">
                {enableVtHashCheck ? 'เปิดใช้งานการตรวจสอบ hash' : 'ปิดใช้งานการตรวจสอบ hash'}
              </h4>
              <p className="text-slate-400 text-sm mb-4">
                {enableVtHashCheck
                  ? 'ระบบจะตรวจสอบ hash ของไฟล์กับ VirusTotal ก่อนส่งไปวิเคราะห์ ถ้าพบในระบบจะข้ามเครื่องมืออื่นๆ ทันที'
                  : 'ระบบจะข้ามการตรวจสอบ hash กับ VirusTotal ทั้งหมด ไฟล์ทุกไฟล์จะถูกส่งไปวิเคราะห์ด้วยเครื่องมือทั้งหมด'}
              </p>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="vtHashCheck"
                    value="true"
                    checked={enableVtHashCheck === true}
                    onChange={() => setEnableVtHashCheck(true)}
                    className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 border-gray-600 bg-white/10"
                  />
                  <span className="text-white">เปิดใช้งาน</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="vtHashCheck"
                    value="false"
                    checked={enableVtHashCheck === false}
                    onChange={() => setEnableVtHashCheck(false)}
                    className="w-4 h-4 text-rose-500 focus:ring-rose-500 border-gray-600 bg-white/10"
                  />
                  <span className="text-white">ปิดใช้งาน</span>
                </label>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleUpdateConfig}
              disabled={updateConfig.isPending}
              className={`px-6 py-2.5 rounded-xl font-medium transition flex items-center gap-2 ${
                updateConfig.isPending
                  ? 'bg-cyan-500/50 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-white'
              }`}
            >
              {updateConfig.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  กำลังอัปเดต...
                </>
              ) : (
                <>
                  <i className="fas fa-save" />
                  บันทึกการตั้งค่า
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

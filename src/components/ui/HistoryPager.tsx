interface HistoryPagerProps {
  page: number
  totalPages: number
  isFetching?: boolean
  onChange: (page: number) => void
}

export function HistoryPager({ page, totalPages, isFetching, onChange }: HistoryPagerProps) {
  return (
    <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/10">
      <button
        type="button"
        disabled={page <= 1 || isFetching}
        onClick={() => onChange(page - 1)}
        className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition"
      >
        ← ก่อนหน้า
      </button>

      <span className="text-slate-400 text-sm">
        หน้า {page} / {totalPages}
      </span>

      <button
        type="button"
        disabled={page >= totalPages || isFetching}
        onClick={() => onChange(page + 1)}
        className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition"
      >
        ถัดไป →
      </button>
    </div>
  )
}

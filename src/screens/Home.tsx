"use client"

import { useNavigate } from "react-router-dom"
import { Eye, Video, ChevronRight } from "lucide-react"

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
          <img src="/logo.png" alt="Honrly" className="w-14 h-14 object-contain mb-3" />
          <h1 className="text-2xl font-semibold tracking-tight">Honrly</h1>
          <p className="text-sm text-slate-500 mt-1">Local-first interview integrity</p>
        </div>

        <div className="space-y-3">
          <LaunchOption
            icon={<Eye className="w-5 h-5" />}
            title="Self-Monitor"
            subtitle="Detect cheating tools on this device"
            onClick={() => navigate("/monitor")}
          />
          <LaunchOption
            icon={<Video className="w-5 h-5" />}
            title="Video Call"
            subtitle="Preview and connect a monitored call"
            onClick={() => navigate("/video")}
          />
        </div>
      </div>
    </div>
  )
}

function LaunchOption({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group w-full flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-violet-300 hover:shadow-md transition-all"
    >
      <div className="w-11 h-11 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900">{title}</p>
        <p className="text-sm text-slate-500 truncate">{subtitle}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-violet-500 transition-colors flex-shrink-0" />
    </button>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  MonitorUp,
  Link as LinkIcon,
  ArrowLeft,
  ShieldAlert,
  AppWindow,
  ChevronDown,
} from "lucide-react"
import { invoke } from "@tauri-apps/api/core"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import VideoCall from "@/components/ui/VideoCall"

type Provider = "daily" | "self-hosted"

interface Process {
  name: string
  pid: number
}

const SUSPICIOUS_KEYWORDS = ["cluely", "interview coder", "interviewcoder"]

interface Participant {
  name: string
  you?: boolean
  apps: string[]
  flagged: string[]
  online: boolean
}

// Sample data showing how a remote participant's monitored apps would appear.
const REMOTE_PARTICIPANTS: Participant[] = [
  { name: "Candidate", apps: ["Chrome", "VS Code", "Cluely"], flagged: ["Cluely"], online: true },
  { name: "Interviewer", apps: ["Chrome", "Slack", "Notes"], flagged: [], online: true },
  { name: "Observer", apps: [], flagged: [], online: false },
]

export default function VideoCallScreen() {
  const navigate = useNavigate()
  const [provider, setProvider] = useState<Provider>("daily")
  const [roomUrl, setRoomUrl] = useState("")
  const [connectedUrl, setConnectedUrl] = useState<string | null>(null)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [myApps, setMyApps] = useState<string[]>([])
  const [myFlagged, setMyFlagged] = useState<string[]>([])
  const [scanError, setScanError] = useState(false)

  useEffect(() => {
    const scan = async () => {
      try {
        const procs = (await invoke("list_processes")) as Process[]
        setScanError(false)

        const apps = new Set<string>()
        const flagged = new Set<string>()
        for (const p of procs) {
          const lower = p.name.toLowerCase()
          for (const kw of SUSPICIOUS_KEYWORDS) {
            if (lower.includes(kw)) flagged.add(kw === "cluely" ? "Cluely" : "Interview Coder")
          }
          const match = p.name.match(/\/Applications\/([^/]+)\.app/)
          if (match) apps.add(match[1])
        }
        setMyApps(Array.from(apps).sort())
        setMyFlagged(Array.from(flagged))
      } catch {
        setScanError(true)
      }
    }
    scan()
    const id = setInterval(scan, 3000)
    return () => clearInterval(id)
  }, [])

  const connect = () => {
    const url = roomUrl.trim()
    if (!url) return
    setConnectedUrl(url)
  }
  const disconnect = () => setConnectedUrl(null)

  const me: Participant = {
    name: "You",
    you: true,
    apps: myApps,
    flagged: myFlagged,
    online: !scanError,
  }
  const participants = [me, ...REMOTE_PARTICIPANTS]

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Home
            </Button>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Honrly" className="w-7 h-7 object-contain" />
              <span className="font-semibold tracking-tight">Video Call</span>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 ${
              connectedUrl
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                : "bg-slate-100 text-slate-600 border border-slate-200"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${connectedUrl ? "bg-emerald-500" : "bg-slate-400"}`} />
            {connectedUrl ? "Live" : "Preview"}
          </span>
        </div>
      </header>

      <main className="flex-1 flex min-h-0">
        {/* Left: call area */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 p-6">
          {/* Connection bar */}
          <Card className="border border-slate-200 shadow-sm">
            <CardContent className="p-3 flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="flex rounded-lg overflow-hidden border border-slate-200 self-start">
                <button
                  onClick={() => setProvider("daily")}
                  className={`px-3.5 py-2 text-sm font-medium transition-colors ${
                    provider === "daily" ? "bg-violet-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Daily.co
                </button>
                <button
                  onClick={() => setProvider("self-hosted")}
                  className={`px-3.5 py-2 text-sm font-medium transition-colors ${
                    provider === "self-hosted" ? "bg-violet-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Self-hosted
                </button>
              </div>

              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={roomUrl}
                  onChange={(e) => setRoomUrl(e.target.value)}
                  placeholder={
                    provider === "daily"
                      ? "https://your-team.daily.co/room-name"
                      : "https://meet.your-domain.com/room"
                  }
                  className="pl-9 bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                />
              </div>

              {connectedUrl ? (
                <Button onClick={disconnect} variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                  <PhoneOff className="w-4 h-4 mr-2" />
                  Leave
                </Button>
              ) : (
                <Button onClick={connect} disabled={!roomUrl.trim()} className="bg-violet-600 hover:bg-violet-700 text-white">
                  <Video className="w-4 h-4 mr-2" />
                  Connect
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Stage */}
          <div className="flex-1 min-h-[360px] rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex">
            {connectedUrl ? (
              provider === "daily" ? (
                <VideoCall roomUrl={connectedUrl} />
              ) : (
                <iframe
                  title="Self-hosted video call"
                  src={connectedUrl}
                  className="w-full h-full border-0"
                  allow="camera; microphone; fullscreen; display-capture; autoplay"
                />
              )
            ) : (
              <MockStage micOn={micOn} camOn={camOn} participants={participants} />
            )}
          </div>

          {/* Controls */}
          {!connectedUrl && (
            <div className="flex items-center justify-center gap-2.5">
              <ControlButton active={micOn} onClick={() => setMicOn((v) => !v)} label={micOn ? "Mute" : "Unmute"}>
                {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </ControlButton>
              <ControlButton active={camOn} onClick={() => setCamOn((v) => !v)} label={camOn ? "Stop video" : "Start video"}>
                {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </ControlButton>
              <ControlButton active={false} disabled label="Share screen">
                <MonitorUp className="w-5 h-5" />
              </ControlButton>
            </div>
          )}
        </div>

        {/* Right: participants + their apps */}
        <ParticipantsPanel participants={participants} scanError={scanError} />
      </main>
    </div>
  )
}

function ParticipantsPanel({ participants, scanError }: { participants: Participant[]; scanError: boolean }) {
  const flaggedCount = participants.reduce((n, p) => n + (p.flagged.length > 0 ? 1 : 0), 0)

  return (
    <aside className="hidden lg:flex w-80 flex-shrink-0 flex-col border-l border-slate-200 bg-white">
      <div className="px-5 h-16 flex items-center justify-between border-b border-slate-200">
        <div>
          <h2 className="font-semibold text-slate-900 leading-tight">Participants</h2>
          <p className="text-xs text-slate-500 leading-tight">{participants.length} in call</p>
        </div>
        {flaggedCount > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100 rounded-full px-2 py-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            {flaggedCount} flagged
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {participants.map((p) => (
          <ParticipantRow key={p.name} p={p} />
        ))}
      </div>

      {scanError && (
        <div className="px-5 py-3 border-t border-slate-200 text-xs text-slate-400">
          Live device scan unavailable — run the desktop app to monitor your apps.
        </div>
      )}
    </aside>
  )
}

function ParticipantRow({ p }: { p: Participant }) {
  const [open, setOpen] = useState(p.flagged.length > 0)
  const hasFlag = p.flagged.length > 0

  return (
    <div className={`rounded-lg border ${hasFlag ? "border-rose-200 bg-rose-50/40" : "border-slate-200 bg-white"}`}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-3 p-3 text-left">
        <div
          className={`relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
            hasFlag ? "bg-rose-100 text-rose-700" : "bg-violet-100 text-violet-700"
          }`}
        >
          {p.name.charAt(0)}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
              p.online ? "bg-emerald-500" : "bg-slate-300"
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-slate-900 text-sm truncate">{p.name}</span>
            {p.you && (
              <span className="text-[10px] font-semibold bg-violet-600 text-white px-1.5 py-0.5 rounded">YOU</span>
            )}
          </div>
          <p className={`text-xs truncate ${hasFlag ? "text-rose-600 font-medium" : "text-slate-500"}`}>
            {hasFlag
              ? `${p.flagged.join(", ")} detected`
              : p.online
                ? `${p.apps.length} app${p.apps.length === 1 ? "" : "s"}`
                : "Offline"}
          </p>
        </div>
        {hasFlag ? (
          <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0" />
        ) : p.online ? (
          <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        ) : null}
      </button>

      {open && p.online && (
        <div className="px-3 pb-3 pt-0 space-y-1">
          {p.flagged.map((f) => (
            <div key={f} className="flex items-center gap-2 text-xs text-rose-700 bg-rose-100 rounded px-2 py-1.5">
              <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-medium">{f}</span>
            </div>
          ))}
          {p.apps.filter((a) => !p.flagged.includes(a)).length === 0 && p.flagged.length === 0 ? (
            <p className="text-xs text-slate-400 px-1 py-1">No applications detected.</p>
          ) : (
            p.apps
              .filter((a) => !p.flagged.includes(a))
              .map((a) => (
                <div key={a} className="flex items-center gap-2 text-xs text-slate-600 px-2 py-1">
                  <AppWindow className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{a}</span>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  )
}

function MockStage({
  micOn,
  camOn,
  participants,
}: {
  micOn: boolean
  camOn: boolean
  participants: Participant[]
}) {
  return (
    <div className="w-full h-full p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-fr">
      {participants.map((p) => (
        <div
          key={p.name}
          className={`relative rounded-lg border flex items-center justify-center overflow-hidden ${
            p.flagged.length > 0 ? "bg-rose-50 border-rose-200" : "bg-slate-100 border-slate-200"
          }`}
        >
          {p.you && !camOn ? (
            <div className="flex flex-col items-center text-slate-400">
              <VideoOff className="w-7 h-7 mb-2" />
              <span className="text-sm">Camera off</span>
            </div>
          ) : (
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold ${
                p.flagged.length > 0 ? "bg-rose-100 text-rose-700" : "bg-violet-100 text-violet-700"
              }`}
            >
              {p.name.charAt(0)}
            </div>
          )}

          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
            <span className="text-xs font-medium bg-white/90 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
              {p.name}
            </span>
            {p.you && !micOn && (
              <span className="bg-rose-500 text-white p-1 rounded">
                <MicOff className="w-3 h-3" />
              </span>
            )}
          </div>

          {p.flagged.length > 0 && (
            <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 text-[10px] font-semibold bg-rose-600 text-white px-2 py-0.5 rounded-full">
              <ShieldAlert className="w-3 h-3" />
              Flagged
            </span>
          )}
          {p.you && p.flagged.length === 0 && (
            <span className="absolute top-2.5 right-2.5 text-[10px] font-semibold bg-violet-600 text-white px-2 py-0.5 rounded-full">
              YOU
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function ControlButton({
  children,
  active,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode
  active: boolean
  onClick?: () => void
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`w-11 h-11 rounded-full flex items-center justify-center border transition-colors ${
        disabled
          ? "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"
          : active
            ? "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
            : "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
      }`}
    >
      {children}
    </button>
  )
}

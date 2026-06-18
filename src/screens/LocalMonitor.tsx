"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import { Search, Shield, AlertTriangle, Activity, Cpu, RefreshCw, Settings, Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { invoke } from "@tauri-apps/api/core"

interface Process {
  name: string
  pid: number
}

interface AppProcess extends Process {
  cleanName: string
  fullAppName: string
  processCount: number
}

interface LocalMonitorProps {
  embedded?: boolean
}

export default function LocalMonitor({ embedded = false }: LocalMonitorProps) {
  const navigate = useNavigate()
  const [processes, setProcesses] = useState<Process[]>([])
  const [search, setSearch] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [customApps, setCustomApps] = useState<string[]>([])
  const [newCustomApp, setNewCustomApp] = useState("")
  const [showCustomAppsManager, setShowCustomAppsManager] = useState(false)

  useEffect(() => {
    setCustomApps([])
  }, [])

  const fetchProcesses = async () => {
    try {
      setError("")
      console.log("🔍 Fetching local system processes...")

      const res = (await invoke("list_processes")) as Process[]
      console.log(`✅ Retrieved ${res.length} processes from system`)

      setProcesses(res)
    } catch (err) {
      console.error("🔥 Error fetching local processes:", err)
      setError("Failed to fetch system processes. Make sure the application has proper permissions.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    console.log("🔄 Manual refresh triggered")
    setRefreshing(true)
    await fetchProcesses()
  }

  const addCustomSuspiciousApp = () => {
    if (!newCustomApp.trim()) return

    const appName = newCustomApp.trim().toLowerCase()
    if (customApps.includes(appName)) return

    setCustomApps([...customApps, appName])
    setNewCustomApp("")
  }

  const removeCustomSuspiciousApp = (appToRemove: string) => {
    setCustomApps(customApps.filter((app) => app !== appToRemove))
  }

  useEffect(() => {
    console.log("🚀 LocalMonitor mounted, starting process monitoring...")
    fetchProcesses()

    const interval = setInterval(() => {
      console.log("⏰ Auto-refresh triggered")
      fetchProcesses()
    }, 3000)

    return () => {
      console.log("🛑 LocalMonitor unmounted, stopping auto-refresh")
      clearInterval(interval)
    }
  }, [])

  const filtered = processes.filter(
    (proc) => proc.name.toLowerCase().includes(search.toLowerCase()) || proc.pid.toString().includes(search),
  )

  // Built-in watchlist of known AI cheating tools. Matching is intentionally
  // broad so it works across macOS (full command paths), Linux and Windows
  // (executable names). Add your own entries via the Custom Apps panel.
  const SUSPICIOUS_KEYWORDS = ["cluely", "interview coder", "interviewcoder"]

  const isSuspiciousProcess = (proc: Process) => {
    const name = proc.name.toLowerCase()

    const isDefaultSuspicious = SUSPICIOUS_KEYWORDS.some((kw) => name.includes(kw))
    const isCustomSuspicious = customApps.some((app) => name.includes(app.toLowerCase()))

    return isDefaultSuspicious || isCustomSuspicious
  }

  const suspicious = filtered.filter(isSuspiciousProcess)

  const uniqueSuspicious = suspicious.reduce(
    (acc, proc) => {
      const lower = proc.name.toLowerCase()
      let appName = ""

      if (lower.includes("cluely")) appName = "Cluely"
      else if (lower.includes("interview coder") || lower.includes("interviewcoder")) appName = "Interview Coder"
      else {
        const matchedCustom = customApps.find((custom) => lower.includes(custom))
        if (matchedCustom) {
          appName = matchedCustom.charAt(0).toUpperCase() + matchedCustom.slice(1)
        } else {
          return acc
        }
      }

      if (!acc.find((sus) => sus.cleanName === appName)) {
        acc.push({
          ...proc,
          cleanName: appName,
          processCount: suspicious.filter((p) => p.name.toLowerCase().includes(appName.toLowerCase())).length,
        })
      }

      return acc
    },
    [] as (Process & { cleanName: string; processCount: number })[],
  )

  const isApp = (proc: Process) => {
    const appMatch = proc.name.match(/\/Applications\/([^/]+\.app)/)
    return appMatch !== null
  }

  const apps = filtered.filter((proc) => isApp(proc) && !isSuspiciousProcess(proc))
  const normalNonApps = filtered.filter((proc) => !isSuspiciousProcess(proc) && !isApp(proc))

  const uniqueApps = apps.reduce((acc, proc) => {
    const appMatch = proc.name.match(/\/Applications\/([^/]+\.app)/)
    if (!appMatch) return acc

    const fullAppName = appMatch[1]
    const cleanAppName = fullAppName.replace(".app", "")

    if (!acc.find((app) => app.cleanName === cleanAppName)) {
      acc.push({
        ...proc,
        cleanName: cleanAppName,
        fullAppName: fullAppName,
        processCount: apps.filter((p) => {
          const pMatch = p.name.match(/\/Applications\/([^/]+\.app)/)
          return pMatch && pMatch[1].replace(".app", "") === cleanAppName
        }).length,
      })
    }
    return acc
  }, [] as AppProcess[])

  if (error && !processes.length) {
    if (embedded) {
      return (
        <div className="flex items-center justify-center p-6">
          <Card className="bg-white border border-slate-200 shadow-sm max-w-md w-full">
            <CardContent className="p-8 text-center space-y-4">
              <AlertTriangle className="w-16 h-16 text-red-600 mx-auto" />
              <h2 className="text-xl font-bold text-slate-900">System Monitor Error</h2>
              <p className="text-slate-600">{error}</p>
              <Button onClick={handleRefresh} disabled={refreshing} variant="outline" className="border-slate-300 text-slate-700">
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }
    return (
      <div ref={containerRef} className="flex h-screen bg-white overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="bg-white border border-slate-200 shadow-sm max-w-md w-full">
            <CardContent className="p-8 text-center space-y-4">
              <AlertTriangle className="w-16 h-16 text-red-600 mx-auto" />
              <h2 className="text-xl font-bold text-slate-900">System Monitor Error</h2>
              <p className="text-slate-600">{error}</p>
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-left">
                <h4 className="text-sm font-medium text-red-900 mb-1">Troubleshooting:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Make sure the Tauri backend is running</li>
                  <li>• Check if the app has system permissions</li>
                  <li>• Verify the list_processes command is implemented</li>
                </ul>
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleRefresh} disabled={refreshing} variant="outline" className="border-slate-300 text-slate-700">
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </Button>
                <Button onClick={() => navigate("/")} variant="outline" className="border-slate-300 text-slate-700">
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const content = (
    <div ref={containerRef} className={embedded ? "w-full h-full overflow-y-auto bg-slate-50 p-6" : "flex-1 overflow-y-auto bg-slate-50 p-6"}>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 border-t-slate-600"></div>
          <span className="ml-4 text-slate-600">Scanning system processes...</span>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white border border-slate-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center flex-shrink-0">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{processes.length}</p>
                        <p className="text-sm text-slate-600">Total Processes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-slate-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center flex-shrink-0">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{uniqueApps.length}</p>
                        <p className="text-sm text-slate-600">Running Apps</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-slate-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{normalNonApps.length}</p>
                        <p className="text-sm text-slate-600">System Processes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`bg-white border shadow-sm ${suspicious.length > 0 ? "border-rose-200" : "border-slate-200"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${suspicious.length > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-400"}`}>
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{suspicious.length}</p>
                        <p className="text-sm text-slate-600">Suspicious</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search */}
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search processes by name or PID..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-slate-400"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Custom Apps Manager */}
              {showCustomAppsManager && (
                <Card className="bg-white border border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-slate-900">
                      <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Manage Custom Suspicious Apps
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setShowCustomAppsManager(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Enter app name to flag as suspicious"
                        value={newCustomApp}
                        onChange={(e) => setNewCustomApp(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addCustomSuspiciousApp()
                          }
                        }}
                        className="bg-white border-slate-200 text-slate-900 placeholder-slate-400"
                      />
                      <Button onClick={addCustomSuspiciousApp} disabled={!newCustomApp.trim()} className="bg-violet-600 hover:bg-violet-700 text-white">
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>

                    {customApps.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-slate-700">Current Custom Apps:</h4>
                        <div className="flex flex-wrap gap-2">
                          {customApps.map((app, index) => (
                            <Badge key={index} variant="outline" className="border-slate-300 text-slate-700 bg-white">
                              {app}
                              <button onClick={() => removeCustomSuspiciousApp(app)} className="ml-1 text-slate-500 hover:text-slate-700">
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-sm text-slate-600">Apps added here will be flagged as suspicious when detected in the process list.</p>
                  </CardContent>
                </Card>
              )}

              {/* Error Alert */}
              {error && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-900">{error} Data may be outdated.</AlertDescription>
                </Alert>
              )}

              {/* Suspicious Processes Alert */}
              {suspicious.length > 0 && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-900">
                    {suspicious.length} suspicious process{suspicious.length > 1 ? "es" : ""} detected! Cluely or related applications found on your system.
                  </AlertDescription>
                </Alert>
              )}

              {/* Process Lists */}
              <div className="space-y-6">
                {/* Suspicious Processes */}
                {suspicious.length > 0 && (
                  <Card className="bg-white border border-red-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="w-5 h-5" />
                        Suspicious Processes Detected
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {uniqueSuspicious.map((proc, idx) => (
                        <div key={`suspicious-${idx}`} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-red-900 truncate">{proc.cleanName}</p>
                              <div className="flex items-center gap-2 text-sm text-red-700">
                                <span>PID: {proc.pid}</span>
                                {proc.processCount > 1 && (
                                  <>
                                    <span>•</span>
                                    <span>{proc.processCount} processes</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <Badge variant="destructive" className="ml-2 bg-red-600 text-white">
                              ALERT
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Grid for Apps and System Processes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Running Apps */}
                  <Card className="bg-white border border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-slate-900">
                        <Activity className="w-5 h-5 text-slate-600" />
                        Applications ({uniqueApps.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {uniqueApps.length === 0 ? (
                        <div className="text-center py-8 text-slate-600">No applications found matching your search.</div>
                      ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {uniqueApps.map((proc, idx) => (
                            <div key={`app-${idx}`} className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-900 truncate">{proc.cleanName}</p>
                                  <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <span>PID: {proc.pid}</span>
                                    {proc.processCount > 1 && (
                                      <>
                                        <span>•</span>
                                        <span>{proc.processCount} processes</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-700 border-slate-300">
                                  APP
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* System Processes */}
                  <Card className="bg-white border border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-slate-900">
                        <Shield className="w-5 h-5 text-slate-600" />
                        System Processes ({normalNonApps.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {normalNonApps.length === 0 ? (
                        <div className="text-center py-8 text-slate-600">No system processes found matching your search.</div>
                      ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {normalNonApps.map((proc, idx) => (
                            <div key={`normal-${idx}`} className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-900 truncate">{proc.name}</p>
                                  <p className="text-sm text-slate-600">PID: {proc.pid}</p>
                                </div>
                                <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-700 border-slate-300">
                                  SAFE
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-slate-400 text-xs py-4">
                {filtered.length} of {processes.length} processes • refreshing every 3s
              </div>
            </div>
          )}
    </div>
  )

  // If embedded, return just the content
  if (embedded) {
    return content
  }

  // Otherwise return full layout with header
  return (
    <div ref={containerRef} className="flex h-screen bg-slate-50 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <img src="/logo.png" alt="Honrly" className="w-8 h-8 object-contain flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-slate-900 leading-tight">Self-Monitor</h1>
                <p className="text-sm text-slate-500 leading-tight">Real-time local process monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm" className="border-slate-300 text-slate-700">
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
              <Button onClick={() => setShowCustomAppsManager(!showCustomAppsManager)} variant="outline" size="sm" className="border-slate-300 text-slate-700">
                <Settings className="w-4 h-4 mr-2" />
                Custom Apps
              </Button>
              <Button onClick={() => navigate("/")} variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                Home
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        {content}
      </div>
    </div>
  )
}

"use client"

import { useEffect, useRef } from "react"
import DailyIframe, { DailyCall } from "@daily-co/daily-js"

interface VideoCallProps {
  roomUrl: string
}

export default function VideoCall({ roomUrl }: VideoCallProps) {
  const callFrameRef = useRef<HTMLDivElement | null>(null)
  const dailyCallRef = useRef<DailyCall | null>(null)

  useEffect(() => {
    if (!callFrameRef.current || !roomUrl) {
      console.warn("VideoCall: Ref not ready or missing roomUrl")
      return
    }

    // Prevent duplicate frame creation on hot reload
    if (dailyCallRef.current) {
      console.warn("VideoCall: Daily call already initialized")
      return
    }

    console.log("VideoCall: Joining Daily room:", roomUrl)

    requestAnimationFrame(() => {
      const frame = DailyIframe.createFrame(callFrameRef.current!, {
        showLeaveButton: true,
        iframeStyle: {
          width: "100%",
          height: "100%",
          border: "0",
          borderRadius: "12px",
        },
        activeSpeakerMode: false,
        layoutConfig: {
          grid: {
            minTilesPerPage: 4,
            maxTilesPerPage: 16,
          },
        },
      })

      frame.on("error", (e) => {
        console.error("Daily iframe error:", e)
      })

      dailyCallRef.current = frame
      frame.join({ url: roomUrl })
    })

    return () => {
      if (dailyCallRef.current) {
        console.log("VideoCall: Leaving and destroying Daily call")
        dailyCallRef.current.leave()
        dailyCallRef.current.destroy()
        dailyCallRef.current = null
      }
    }
  }, [roomUrl])

  return (
    <div
      ref={callFrameRef}
      className="flex-1 min-w-0 min-h-0 w-full"
      style={{
        borderRadius: "12px",
        overflow: "hidden",
        background: "#000",
      }}
    />
  )
}

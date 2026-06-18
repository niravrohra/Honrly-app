"use client"

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Home from "./screens/Home"
import LocalMonitor from "./screens/LocalMonitor"
import VideoCallScreen from "./screens/VideoCallScreen"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/monitor" element={<LocalMonitor />} />
        <Route path="/video" element={<VideoCallScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App

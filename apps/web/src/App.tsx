import { Routes, Route, Navigate } from 'react-router-dom'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Dashboard } from '@/pages/Dashboard'
import { Workspace } from '@/pages/Workspace'
import { Settings } from '@/pages/Settings'
import { TopNav } from '@/components/layout/TopNav'

export default function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-screen w-screen overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/workspace/:projectId" element={<Workspace />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </DndProvider>
  )
}

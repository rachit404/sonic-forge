import { Layers, Sliders, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'
import { useUIStore } from '@/stores/uiStore'
import type { PanelView } from '@/types'

const panels: { id: PanelView; icon: React.ReactNode; label: string }[] = [
  { id: 'timeline', icon: <Layers size={18} />, label: 'Timeline' },
  { id: 'mixer', icon: <Sliders size={18} />, label: 'Mixer' },
  { id: 'generation', icon: <Sparkles size={18} />, label: 'AI Generate' },
]

export function WorkspaceSidebar() {
  const { activePanel, setActivePanel } = useUIStore()

  return (
    <aside className="w-14 bg-surface-raised border-r border-white/5 flex flex-col items-center py-3 gap-2 shrink-0">
      {panels.map((panel) => (
        <button
          key={panel.id}
          onClick={() => setActivePanel(panel.id)}
          title={panel.label}
          className={clsx(
            'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
            activePanel === panel.id
              ? 'bg-accent/20 text-accent'
              : 'text-gray-500 hover:text-white hover:bg-white/5',
          )}
        >
          {panel.icon}
        </button>
      ))}
    </aside>
  )
}

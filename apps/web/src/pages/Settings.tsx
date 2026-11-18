export function Settings() {
  return (
    <div className="h-full bg-surface p-8 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>
        
        <section className="bg-surface-raised rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Storage</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Projects folder</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="~/sonicforge-projects"
                  className="flex-1 bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent"
                  readOnly
                />
                <button className="px-4 py-2 bg-surface-overlay hover:bg-accent/20 border border-white/10 rounded-lg text-sm transition-colors">
                  Browse
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-surface-raised rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">AI Models</h2>
          <p className="text-sm text-gray-400">Model management coming in Step 6.</p>
        </section>

        <section className="bg-surface-raised rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">API Keys</h2>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Hugging Face API Key (optional)</label>
            <input
              type="password"
              placeholder="hf_..."
              className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent"
            />
            <p className="text-xs text-gray-600 mt-1">
              Stored securely on the backend. Unlocks faster cloud inference.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

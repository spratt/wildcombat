import { useState } from 'react'
import './App.css'
import CharacterViewerTab from './components/CharacterViewerTab'
import PartyTab from './components/PartyTab'
import EnemiesTab from './components/EnemiesTab'
import SimulateTab from './components/SimulateTab'

function App() {
  const [activeTab, setActiveTab] = useState('character-viewer')

  const tabs = [
    { id: 'character-viewer', label: 'Character Viewer', component: CharacterViewerTab },
    { id: 'party', label: 'Party', component: PartyTab },
    { id: 'enemies', label: 'Enemies', component: EnemiesTab },
    { id: 'simulate', label: 'Simulate!', component: SimulateTab }
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || CharacterViewerTab

  return (
    <>
      <h1>Wildcombat - A Wildsea Combat Simulator</h1>
      
      <div className="tabs">
        <div className="tab-list">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <ActiveComponent />
    </>
  )
}

export default App
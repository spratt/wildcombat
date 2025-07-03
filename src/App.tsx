import { useState, useEffect, FC } from 'react'
import './App.css'
import PartyTab from './components/PartyTab'
import EnemiesTab from './components/EnemiesTab'
import SimulateTab from './components/SimulateTab'

type TabId = 'party' | 'enemies' | 'simulate'

interface Tab {
  id: TabId
  label: string
  component: FC
}

function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    // Load saved tab from localStorage, default to 'party' if not found
    try {
      const savedTab = localStorage.getItem('wildcombat-active-tab')
      // Type guard to ensure saved tab is a valid TabId
      if (savedTab === 'party' || savedTab === 'enemies' || savedTab === 'simulate') {
        return savedTab
      }
      return 'party'
    } catch (error) {
      console.error('Error loading saved tab:', error)
      return 'party'
    }
  })

  const tabs: Tab[] = [
    { id: 'party', label: 'Party', component: PartyTab },
    { id: 'enemies', label: 'Enemies', component: EnemiesTab },
    { id: 'simulate', label: 'Simulate!', component: SimulateTab }
  ]

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('wildcombat-active-tab', activeTab)
    } catch (error) {
      console.error('Error saving active tab:', error)
    }
  }, [activeTab])

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || PartyTab

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
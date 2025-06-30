import { useState } from 'react'
import './App.css'
import CharacterSelector from './components/CharacterSelector'
import Character from './components/Character'

function App() {
  const [selectedCharacter, setSelectedCharacter] = useState(null)

  return (
    <>
      <h1>Wildsea Character Viewer</h1>
      <CharacterSelector onCharacterSelect={setSelectedCharacter} />
      <Character characterData={selectedCharacter} />
    </>
  )
}

export default App
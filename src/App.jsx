import { useState } from 'react'
import './App.css'
import CharacterSelector from './components/CharacterSelector'
import CharacterUpload from './components/CharacterUpload'
import Character from './components/Character'

function App() {
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [uploadedCharacter, setUploadedCharacter] = useState(null)

  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character);
    setUploadedCharacter(null);
  };

  const handleCharacterUpload = (character) => {
    setUploadedCharacter(character);
    setSelectedCharacter(null);
  };

  const displayCharacter = uploadedCharacter || selectedCharacter;

  return (
    <>
      <h1>Wildsea Character Viewer</h1>
      <div className="character-input-section">
        <CharacterSelector onCharacterSelect={handleCharacterSelect} />
        <div className="input-divider">or</div>
        <CharacterUpload onCharacterUpload={handleCharacterUpload} />
      </div>
      <Character characterData={displayCharacter} />
    </>
  )
}

export default App
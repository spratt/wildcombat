import { useState } from 'react'
import './App.css'
import CharacterSelector from './components/CharacterSelector'
import CharacterUpload from './components/CharacterUpload'
import SavedCharacters from './components/SavedCharacters'
import SaveCharacterButton from './components/SaveCharacterButton'
import Character from './components/Character'

function App() {
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [uploadedCharacter, setUploadedCharacter] = useState(null)
  const [savedCharacter, setSavedCharacter] = useState(null)

  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character);
    setUploadedCharacter(null);
    setSavedCharacter(null);
  };

  const handleCharacterUpload = (character) => {
    setUploadedCharacter(character);
    setSelectedCharacter(null);
    setSavedCharacter(null);
  };

  const handleSavedCharacterSelect = (character) => {
    setSavedCharacter(character);
    setSelectedCharacter(null);
    setUploadedCharacter(null);
  };

  const displayCharacter = savedCharacter || uploadedCharacter || selectedCharacter;

  return (
    <>
      <h1>Wildsea Character Viewer</h1>
      <div className="character-input-section">
        <CharacterSelector onCharacterSelect={handleCharacterSelect} />
        <div className="input-divider">or</div>
        <CharacterUpload onCharacterUpload={handleCharacterUpload} />
        <div className="input-divider">or</div>
        <SavedCharacters onCharacterSelect={handleSavedCharacterSelect} />
      </div>
      {displayCharacter && (
        <SaveCharacterButton characterData={displayCharacter} />
      )}
      <Character characterData={displayCharacter} />
    </>
  )
}

export default App
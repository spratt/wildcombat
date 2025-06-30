import { useState } from 'react'
import './App.css'
import CombinedCharacterSelector from './components/CombinedCharacterSelector'
import CharacterUpload from './components/CharacterUpload'
import SaveCharacterButton from './components/SaveCharacterButton'
import ExportCharacterButton from './components/ExportCharacterButton'
import Character from './components/Character'

function App() {
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [uploadedCharacter, setUploadedCharacter] = useState(null)
  const [savedCharactersRefresh, setSavedCharactersRefresh] = useState(0)

  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character);
    setUploadedCharacter(null);
  };

  const handleCharacterUpload = (character) => {
    setUploadedCharacter(character);
    setSelectedCharacter(null);
  };

  const handleCharacterSaved = () => {
    setSavedCharactersRefresh(prev => prev + 1);
  };

  const displayCharacter = uploadedCharacter || selectedCharacter;

  return (
    <>
      <h1>Wildsea Character Viewer</h1>
      <div className="character-input-section">
        <CombinedCharacterSelector 
          onCharacterSelect={handleCharacterSelect}
          refreshTrigger={savedCharactersRefresh}
        />
        <div className="input-divider">or</div>
        <CharacterUpload onCharacterUpload={handleCharacterUpload} />
      </div>
      {displayCharacter && (
        <div className="character-actions">
          <SaveCharacterButton 
            characterData={displayCharacter} 
            onSave={handleCharacterSaved}
          />
          <ExportCharacterButton characterData={displayCharacter} />
        </div>
      )}
      <Character characterData={displayCharacter} />
    </>
  )
}

export default App
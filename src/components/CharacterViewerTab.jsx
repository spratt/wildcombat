import { useState } from 'react'
import CombinedCharacterSelector from './CombinedCharacterSelector'
import CharacterUpload from './CharacterUpload'
import SaveCharacterButton from './SaveCharacterButton'
import ExportCharacterButton from './ExportCharacterButton'
import Character from './Character'

const CharacterViewerTab = () => {
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
    <div className="tab-content">
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
    </div>
  );
};

export default CharacterViewerTab;
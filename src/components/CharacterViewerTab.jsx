import { useState } from 'react'
import CombinedCharacterSelector from './CombinedCharacterSelector'
import CharacterUpload from './CharacterUpload'
import SaveCharacterButton from './SaveCharacterButton'
import ExportCharacterButton from './ExportCharacterButton'
import HealAllAspectsButton from './HealAllAspectsButton'
import Character from './Character'

const CharacterViewerTab = () => {
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [uploadedCharacter, setUploadedCharacter] = useState(null)
  const [healedCharacter, setHealedCharacter] = useState(null)
  const [savedCharactersRefresh, setSavedCharactersRefresh] = useState(0)

  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character);
    setUploadedCharacter(null);
    setHealedCharacter(null);
  };

  const handleCharacterUpload = (character) => {
    setUploadedCharacter(character);
    setSelectedCharacter(null);
    setHealedCharacter(null);
  };

  const handleCharacterSaved = () => {
    setSavedCharactersRefresh(prev => prev + 1);
  };

  const handleCharacterHealed = (healedChar) => {
    setHealedCharacter(healedChar);
  };

  const displayCharacter = healedCharacter || uploadedCharacter || selectedCharacter;

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
          <HealAllAspectsButton 
            characterData={displayCharacter}
            onCharacterHealed={handleCharacterHealed}
          />
        </div>
      )}
      <Character characterData={displayCharacter} />
    </div>
  );
};

export default CharacterViewerTab;
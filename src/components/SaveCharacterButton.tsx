import React, { useState } from 'react';
import { Character } from '../types';

interface SaveCharacterButtonProps {
  characterData: Character | null;
  onSave?: () => void;
}

const SaveCharacterButton: React.FC<SaveCharacterButtonProps> = ({ characterData, onSave }) => {
  const [saveStatus, setSaveStatus] = useState<string>('');

  const saveCharacter = () => {
    if (!characterData || !characterData.name) {
      setSaveStatus('No character to save');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    try {
      // Get existing saved characters
      const existingSaved = localStorage.getItem('wildcombat-saved-characters');
      const savedCharacters = existingSaved ? JSON.parse(existingSaved) : [];

      // Remove any existing character with the same name
      const filteredCharacters = savedCharacters.filter((char: Character) => char.name !== characterData.name);

      // Create new save entry
      const saveEntry = {
        id: `${characterData.name}-${Date.now()}`,
        name: characterData.name,
        data: characterData,
        savedAt: new Date().toISOString()
      };

      // Add to saved characters (replacing any existing one with same name)
      const updatedCharacters = [...filteredCharacters, saveEntry];
      localStorage.setItem('wildcombat-saved-characters', JSON.stringify(updatedCharacters));

      setSaveStatus('Character saved!');
      setTimeout(() => setSaveStatus(''), 3000);

      // Notify parent component to refresh saved characters list
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error saving character:', error);
      setSaveStatus('Error saving character');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  if (!characterData) {
    return null;
  }

  return (
    <div className="save-character-section">
      <button 
        className="save-button"
        onClick={saveCharacter}
        disabled={!characterData.name}
      >
        Save Character to Browser
      </button>
      {saveStatus && (
        <span className={`save-status ${saveStatus.includes('Error') ? 'error' : 'success'}`}>
          {saveStatus}
        </span>
      )}
    </div>
  );
};

export default SaveCharacterButton;
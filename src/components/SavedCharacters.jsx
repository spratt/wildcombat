import { useState, useEffect } from 'react';

const SavedCharacters = ({ onCharacterSelect, refreshTrigger }) => {
  const [savedCharacters, setSavedCharacters] = useState([]);
  const [selectedSaved, setSelectedSaved] = useState('');

  useEffect(() => {
    loadSavedCharacters();
  }, [refreshTrigger]);

  const loadSavedCharacters = () => {
    try {
      const saved = localStorage.getItem('wildcombat-saved-characters');
      if (saved) {
        const characters = JSON.parse(saved);
        setSavedCharacters(characters);
      }
    } catch (error) {
      console.error('Error loading saved characters:', error);
    }
  };

  const handleChange = (event) => {
    const selected = event.target.value;
    setSelectedSaved(selected);
    
    if (selected) {
      const character = savedCharacters.find(c => c.id === selected);
      if (character) {
        onCharacterSelect(character.data);
      }
    } else {
      onCharacterSelect(null);
    }
  };

  const deleteCharacter = (id, event) => {
    event.stopPropagation();
    const updatedCharacters = savedCharacters.filter(c => c.id !== id);
    setSavedCharacters(updatedCharacters);
    localStorage.setItem('wildcombat-saved-characters', JSON.stringify(updatedCharacters));
    
    if (selectedSaved === id) {
      setSelectedSaved('');
      onCharacterSelect(null);
    }
  };

  if (savedCharacters.length === 0) {
    return (
      <div className="saved-characters">
        <label>No saved characters</label>
      </div>
    );
  }

  return (
    <div className="saved-characters">
      <label htmlFor="saved-character-select">Saved characters: </label>
      <div className="saved-character-controls">
        <select 
          id="saved-character-select" 
          value={selectedSaved} 
          onChange={handleChange}
        >
          <option value="">-- Choose a saved character --</option>
          {savedCharacters.map(char => (
            <option key={char.id} value={char.id}>
              {char.name} (saved {new Date(char.savedAt).toLocaleDateString()})
            </option>
          ))}
        </select>
        {selectedSaved && (
          <button 
            className="delete-button"
            onClick={(e) => deleteCharacter(selectedSaved, e)}
            title="Delete saved character"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default SavedCharacters;
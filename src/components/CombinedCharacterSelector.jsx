import { useState, useEffect } from 'react';

const CombinedCharacterSelector = ({ onCharacterSelect, refreshTrigger }) => {
  const [preloadedCharacters, setPreloadedCharacters] = useState([]);
  const [savedCharacters, setSavedCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPreloadedCharacters();
  }, []);

  useEffect(() => {
    loadSavedCharacters();
  }, [refreshTrigger]);

  const loadPreloadedCharacters = () => {
    // In a real app, you might have an API endpoint to list characters
    // For now, we'll hardcode the known character files
    const characterFiles = ['cap.json', 'cosmia.json', 'kari.json', 'phil.json'];
    
    Promise.all(
      characterFiles.map(async (filename) => {
        try {
          const response = await fetch(`/characters/${filename}`);
          if (!response.ok) throw new Error(`Failed to load ${filename}`);
          const data = await response.json();
          return { 
            id: `preloaded-${filename}`, 
            name: data.name, 
            data, 
            type: 'preloaded',
            displayName: data.name
          };
        } catch (err) {
          console.error(`Error loading ${filename}:`, err);
          return null;
        }
      })
    )
    .then(results => {
      const validCharacters = results.filter(Boolean);
      setPreloadedCharacters(validCharacters);
      setLoading(false);
    })
    .catch(err => {
      setError(err.message);
      setLoading(false);
    });
  };

  const loadSavedCharacters = () => {
    try {
      const saved = localStorage.getItem('wildcombat-saved-characters');
      if (saved) {
        const characters = JSON.parse(saved);
        const formattedCharacters = characters.map(char => ({
          ...char,
          type: 'saved',
          displayName: `${char.name} (saved ${new Date(char.savedAt).toLocaleDateString()})`
        }));
        setSavedCharacters(formattedCharacters);
      } else {
        setSavedCharacters([]);
      }
    } catch (error) {
      console.error('Error loading saved characters:', error);
      setSavedCharacters([]);
    }
  };

  const handleChange = (event) => {
    const selected = event.target.value;
    setSelectedCharacter(selected);
    
    if (selected) {
      // Find character in either preloaded or saved characters
      let character = preloadedCharacters.find(c => c.id === selected);
      if (!character) {
        character = savedCharacters.find(c => c.id === selected);
      }
      
      if (character) {
        onCharacterSelect(character.data);
      }
    } else {
      onCharacterSelect(null);
    }
  };

  const deleteCharacter = (id, event) => {
    event.stopPropagation();
    
    // Only allow deleting saved characters
    const characterToDelete = savedCharacters.find(c => c.id === id);
    if (!characterToDelete) return;
    
    const updatedCharacters = savedCharacters.filter(c => c.id !== id);
    setSavedCharacters(updatedCharacters);
    
    // Update localStorage (convert back to original format)
    const storageFormat = updatedCharacters.map(char => ({
      id: char.id,
      name: char.name,
      data: char.data,
      savedAt: char.savedAt
    }));
    localStorage.setItem('wildcombat-saved-characters', JSON.stringify(storageFormat));
    
    if (selectedCharacter === id) {
      setSelectedCharacter('');
      onCharacterSelect(null);
    }
  };

  if (loading) return <div>Loading characters...</div>;
  if (error) return <div>Error loading characters: {error}</div>;

  const allCharacters = [...preloadedCharacters, ...savedCharacters];
  const selectedCharacterData = allCharacters.find(c => c.id === selectedCharacter);
  const canDelete = selectedCharacterData && selectedCharacterData.type === 'saved';

  return (
    <div className="combined-character-selector">
      <label htmlFor="character-select">Select a character: </label>
      <div className="character-selector-controls">
        <select 
          id="character-select" 
          value={selectedCharacter} 
          onChange={handleChange}
        >
          <option value="">-- Choose a character --</option>
          {preloadedCharacters.length > 0 && (
            <optgroup label="Pre-loaded Characters">
              {preloadedCharacters.map(char => (
                <option key={char.id} value={char.id}>
                  {char.displayName}
                </option>
              ))}
            </optgroup>
          )}
          {savedCharacters.length > 0 && (
            <optgroup label="Saved Characters">
              {savedCharacters.map(char => (
                <option key={char.id} value={char.id}>
                  {char.displayName}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        {canDelete && (
          <button 
            className="delete-button"
            onClick={(e) => deleteCharacter(selectedCharacter, e)}
            title="Delete saved character"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default CombinedCharacterSelector;
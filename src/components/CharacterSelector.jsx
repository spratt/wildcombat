import { useState, useEffect } from 'react';

const CharacterSelector = ({ onCharacterSelect }) => {
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // In a real app, you might have an API endpoint to list characters
    // For now, we'll hardcode the known character files
    const characterFiles = ['cap.json', 'cosmia.json', 'kari.json', 'phil.json'];
    
    Promise.all(
      characterFiles.map(async (filename) => {
        try {
          const response = await fetch(`/characters/${filename}`);
          if (!response.ok) throw new Error(`Failed to load ${filename}`);
          const data = await response.json();
          return { filename, name: data.name, data };
        } catch (err) {
          console.error(`Error loading ${filename}:`, err);
          return null;
        }
      })
    )
    .then(results => {
      const validCharacters = results.filter(Boolean);
      setCharacters(validCharacters);
      setLoading(false);
    })
    .catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, []);

  const handleChange = (event) => {
    const selected = event.target.value;
    setSelectedCharacter(selected);
    
    const character = characters.find(c => c.filename === selected);
    if (character) {
      onCharacterSelect(character.data);
    } else {
      onCharacterSelect(null);
    }
  };

  if (loading) return <div>Loading characters...</div>;
  if (error) return <div>Error loading characters: {error}</div>;

  return (
    <div className="character-selector">
      <label htmlFor="character-select">Select a character: </label>
      <select 
        id="character-select" 
        value={selectedCharacter} 
        onChange={handleChange}
      >
        <option value="">-- Choose a character --</option>
        {characters.map(char => (
          <option key={char.filename} value={char.filename}>
            {char.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CharacterSelector;
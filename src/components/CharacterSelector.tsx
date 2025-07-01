import React, { useState, useEffect } from 'react';
import { Character } from '../types';

interface CharacterFile {
  filename: string;
  name: string;
  data: Character;
}

interface CharacterSelectorProps {
  onCharacterSelect: (character: Character | null) => void;
}

const CharacterSelector: React.FC<CharacterSelectorProps> = ({ onCharacterSelect }) => {
  const [characters, setCharacters] = useState<CharacterFile[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, you might have an API endpoint to list characters
    // For now, we'll hardcode the known character files
    const characterFiles = [
      'cap.json', 'cosmia.json', 'kari.json', 'phil.json',
      'felix.json', 'nova.json', 'thresh.json', 'zara.json'
    ];
    
    Promise.all(
      characterFiles.map(async (filename): Promise<CharacterFile | null> => {
        try {
          const response = await fetch(`./characters/${filename}`);
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
      const validCharacters = results.filter((char): char is CharacterFile => char !== null);
      setCharacters(validCharacters);
      setLoading(false);
    })
    .catch(err => {
      setError((err as Error).message);
      setLoading(false);
    });
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
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
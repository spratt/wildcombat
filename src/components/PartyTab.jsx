import { useState } from 'react';
import CombinedCharacterSelector from './CombinedCharacterSelector';

const PartyTab = () => {
  const [partyCharacters, setPartyCharacters] = useState([]);
  const [savedCharactersRefresh, setSavedCharactersRefresh] = useState(0);

  const handleCharacterSelect = (character) => {
    if (!character) return;
    
    // Check if character is already in party
    const isAlreadyInParty = partyCharacters.some(char => char.name === character.name);
    if (isAlreadyInParty) {
      alert('Character is already in the party!');
      return;
    }
    
    // Add character to party with unique ID
    const partyCharacter = {
      ...character,
      partyId: `${character.name}-${Date.now()}`
    };
    setPartyCharacters(prev => [...prev, partyCharacter]);
  };

  const removeCharacterFromParty = (partyId) => {
    setPartyCharacters(prev => prev.filter(char => char.partyId !== partyId));
  };

  return (
    <div className="tab-content">
      <h2>Party Management</h2>
      
      {/* Character Selection */}
      <div className="party-section">
        <h3>Add Character to Party</h3>
        <CombinedCharacterSelector 
          onCharacterSelect={handleCharacterSelect}
          refreshTrigger={savedCharactersRefresh}
        />
      </div>

      {/* Party Stats */}
      <div className="party-section">
        <h3>Party Stats</h3>
        <div className="party-stats">
          <div className="stat">
            <span className="stat-label">Characters in Party:</span>
            <span className="stat-value">{partyCharacters.length}</span>
          </div>
        </div>
      </div>

      {/* Party Characters */}
      <div className="party-section">
        <h3>Characters</h3>
        {partyCharacters.length === 0 ? (
          <div className="empty-party">
            <p>No characters in party. Select a character above to add them.</p>
          </div>
        ) : (
          <div className="party-characters">
            {partyCharacters.map(character => (
              <div key={character.partyId} className="party-character">
                <span className="character-name">{character.name}</span>
                <button 
                  className="remove-character-button"
                  onClick={() => removeCharacterFromParty(character.partyId)}
                  title="Remove from party"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PartyTab;
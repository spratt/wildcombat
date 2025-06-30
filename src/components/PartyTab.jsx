import { useState, useEffect } from 'react';
import CombinedCharacterSelector from './CombinedCharacterSelector';

// Helper function to calculate unchecked aspect tracks (hit points)
const calculateHitPoints = (character) => {
  if (!character.aspects || !Array.isArray(character.aspects)) {
    return 0;
  }
  
  return character.aspects.reduce((total, aspect) => {
    if (!aspect.value || !Array.isArray(aspect.value)) {
      return total;
    }
    
    // Count unchecked bubbles (0 values)
    const uncheckedBubbles = aspect.value.filter(bubble => bubble === 0).length;
    return total + uncheckedBubbles;
  }, 0);
};

const PartyTab = () => {
  const [partyCharacters, setPartyCharacters] = useState([]);
  const [savedCharactersRefresh, setSavedCharactersRefresh] = useState(0);
  const [saveStatus, setSaveStatus] = useState('');
  const [healStatus, setHealStatus] = useState('');

  // Load party from localStorage on component mount
  useEffect(() => {
    try {
      const savedParty = localStorage.getItem('wildcombat-party');
      if (savedParty) {
        const partyData = JSON.parse(savedParty);
        setPartyCharacters(partyData);
      }
    } catch (error) {
      console.error('Error loading saved party:', error);
    }
  }, []);

  const handleCharacterSelect = (character) => {
    if (!character) return;
    
    // Check if character is already in party
    const isAlreadyInParty = partyCharacters.some(char => char.name === character.name);
    if (isAlreadyInParty) {
      alert('Character is already in the party!');
      return;
    }
    
    // Add character to party with unique ID and hit points
    const hitPoints = calculateHitPoints(character);
    const partyCharacter = {
      ...character,
      partyId: `${character.name}-${Date.now()}`,
      hitPoints: hitPoints
    };
    setPartyCharacters(prev => [...prev, partyCharacter]);
  };

  const removeCharacterFromParty = (partyId) => {
    setPartyCharacters(prev => prev.filter(char => char.partyId !== partyId));
  };

  // Calculate total party hit points
  const totalPartyHitPoints = partyCharacters.reduce((total, character) => {
    return total + character.hitPoints;
  }, 0);

  // Save party to localStorage
  const saveParty = () => {
    try {
      localStorage.setItem('wildcombat-party', JSON.stringify(partyCharacters));
      setSaveStatus('Party saved!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving party:', error);
      setSaveStatus('Error saving party');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // Heal all characters in the party
  const healParty = () => {
    if (partyCharacters.length === 0) {
      setHealStatus('No characters to heal');
      setTimeout(() => setHealStatus(''), 3000);
      return;
    }

    try {
      const healedParty = partyCharacters.map(character => {
        // Heal all aspects for this character
        const healedAspects = character.aspects ? character.aspects.map(aspect => {
          if (!aspect.value || !Array.isArray(aspect.value)) {
            return aspect;
          }
          
          // Heal marked bubbles (1 -> 0) but leave burned bubbles (2) unchanged
          const healedValue = aspect.value.map(bubble => {
            if (bubble === 1) return 0; // Heal marked bubbles
            return bubble; // Keep unchecked (0) and burned (2) bubbles unchanged
          });
          
          return {
            ...aspect,
            value: healedValue
          };
        }) : character.aspects;

        // Recalculate hit points for healed character
        const healedCharacter = {
          ...character,
          aspects: healedAspects
        };
        const newHitPoints = calculateHitPoints(healedCharacter);

        return {
          ...healedCharacter,
          hitPoints: newHitPoints
        };
      });

      setPartyCharacters(healedParty);
      setHealStatus('Party healed!');
      setTimeout(() => setHealStatus(''), 3000);
    } catch (error) {
      console.error('Error healing party:', error);
      setHealStatus('Error healing party');
      setTimeout(() => setHealStatus(''), 3000);
    }
  };

  return (
    <div className="tab-content">
      <h2>Party Management</h2>
      
      {/* Character Selection */}
      <div className="party-section">
        <h3>Build & Save Party</h3>
        <CombinedCharacterSelector 
          onCharacterSelect={handleCharacterSelect}
          refreshTrigger={savedCharactersRefresh}
        />
        
        {partyCharacters.length > 0 && (
          <div className="party-save-section">
            <button 
              className="save-party-button"
              onClick={saveParty}
            >
              Save Party
            </button>
            {saveStatus && (
              <span className={`party-save-status ${saveStatus.includes('Error') ? 'error' : 'success'}`}>
                {saveStatus}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Party Stats */}
      <div className="party-section">
        <h3>Party Stats</h3>
        <div className="party-stats">
          <div className="stat">
            <span className="stat-label">Characters in Party:</span>
            <span className="stat-value">{partyCharacters.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Total Hit Points:</span>
            <span className="stat-value">{totalPartyHitPoints}</span>
          </div>
        </div>
      </div>

      {/* Party Operations */}
      {partyCharacters.length > 0 && (
        <div className="party-section">
          <h3>Party Operations</h3>
          <div className="party-operations">
            <button 
              className="heal-party-button"
              onClick={healParty}
            >
              Heal Party
            </button>
            {healStatus && (
              <span className={`party-heal-status ${healStatus.includes('Error') ? 'error' : 'success'}`}>
                {healStatus}
              </span>
            )}
          </div>
        </div>
      )}

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
                <div className="character-info">
                  <span className="character-name">{character.name}</span>
                  <span className="character-hp">HP: {character.hitPoints}</span>
                </div>
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
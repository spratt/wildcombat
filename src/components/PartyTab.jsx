import { useState, useEffect } from 'react';
import CombinedCharacterSelector from './CombinedCharacterSelector';
import CharacterUpload from './CharacterUpload';
import SaveCharacterButton from './SaveCharacterButton';
import ExportCharacterButton from './ExportCharacterButton';
import HealAllAspectsButton from './HealAllAspectsButton';
import Character from './Character';

// Helper function to calculate unchecked aspect tracks (hit points)
const calculateHitPoints = (character) => {
  if (!character.aspects || !Array.isArray(character.aspects)) {
    return 0;
  }
  
  return character.aspects.reduce((total, aspect) => {
    // Use aspect.value or default to [0] if missing
    const aspectValue = aspect.value || [0];
    if (!Array.isArray(aspectValue)) {
      return total;
    }
    
    // Count unchecked bubbles (0 values)
    const uncheckedBubbles = aspectValue.filter(bubble => bubble === 0).length;
    return total + uncheckedBubbles;
  }, 0);
};

// Helper function to calculate attack skill and score
const calculateAttackStats = (character) => {
  if (!character.skills) {
    return { skill: 'BREAK', score: 1 };
  }
  
  const attackSkills = ['BREAK', 'HACK', 'HUNT'];
  let bestSkill = 'BREAK';
  let maxFilledBubbles = 0;
  
  attackSkills.forEach(skillName => {
    const skill = character.skills[skillName];
    if (skill && Array.isArray(skill)) {
      const filledBubbles = skill.filter(bubble => bubble === 1).length;
      if (filledBubbles > maxFilledBubbles) {
        maxFilledBubbles = filledBubbles;
        bestSkill = skillName;
      }
    }
  });
  
  return {
    skill: bestSkill,
    score: 1 + maxFilledBubbles
  };
};

// Helper function to calculate defense skill and score
const calculateDefenseStats = (character) => {
  if (!character.skills) {
    return { skill: 'BRACE', score: 1 };
  }
  
  const defenseSkills = ['BRACE', 'FLOURISH', 'VAULT'];
  let bestSkill = 'BRACE';
  let maxFilledBubbles = 0;
  
  defenseSkills.forEach(skillName => {
    const skill = character.skills[skillName];
    if (skill && Array.isArray(skill)) {
      const filledBubbles = skill.filter(bubble => bubble === 1).length;
      if (filledBubbles > maxFilledBubbles) {
        maxFilledBubbles = filledBubbles;
        bestSkill = skillName;
      }
    }
  });
  
  return {
    skill: bestSkill,
    score: 1 + maxFilledBubbles
  };
};

const PartyTab = () => {
  const [partyCharacters, setPartyCharacters] = useState([]);
  const [savedCharactersRefresh, setSavedCharactersRefresh] = useState(0);
  const [healStatus, setHealStatus] = useState('');
  
  // Character viewer state
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [uploadedCharacter, setUploadedCharacter] = useState(null);
  const [healedCharacter, setHealedCharacter] = useState(null);

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

  // Load last viewed character on component mount
  useEffect(() => {
    try {
      const savedCharacter = localStorage.getItem('wildcombat-last-character');
      if (savedCharacter) {
        const characterData = JSON.parse(savedCharacter);
        setSelectedCharacter(characterData);
      }
    } catch (error) {
      console.error('Error loading last character:', error);
    }
  }, []);

  // Fallback: Load first party character if no character is selected and party exists
  useEffect(() => {
    if (!selectedCharacter && !uploadedCharacter && !healedCharacter && partyCharacters.length > 0) {
      const firstPartyCharacter = partyCharacters[0];
      setSelectedCharacter(firstPartyCharacter);
      
      // Save fallback character to localStorage
      try {
        localStorage.setItem('wildcombat-last-character', JSON.stringify(firstPartyCharacter));
      } catch (error) {
        console.error('Error saving fallback character:', error);
      }
    }
  }, [partyCharacters, selectedCharacter, uploadedCharacter, healedCharacter]);


  // Character viewer handlers
  const handleCharacterViewerSelect = (character) => {
    setSelectedCharacter(character);
    setUploadedCharacter(null);
    setHealedCharacter(null);
    
    // Save to localStorage
    try {
      if (character) {
        localStorage.setItem('wildcombat-last-character', JSON.stringify(character));
      }
    } catch (error) {
      console.error('Error saving last character:', error);
    }
  };

  const handleCharacterUpload = (character) => {
    setUploadedCharacter(character);
    setSelectedCharacter(null);
    setHealedCharacter(null);
    
    // Save to localStorage
    try {
      if (character) {
        localStorage.setItem('wildcombat-last-character', JSON.stringify(character));
      }
    } catch (error) {
      console.error('Error saving last character:', error);
    }
  };

  const handleCharacterSaved = () => {
    setSavedCharactersRefresh(prev => prev + 1);
  };

  const handleCharacterHealed = (healedChar) => {
    setHealedCharacter(healedChar);
    
    // Save to localStorage
    try {
      if (healedChar) {
        localStorage.setItem('wildcombat-last-character', JSON.stringify(healedChar));
      }
    } catch (error) {
      console.error('Error saving last character:', error);
    }
  };

  const displayCharacter = healedCharacter || uploadedCharacter || selectedCharacter;

  // Party handlers
  const handleCharacterSelect = (character) => {
    if (!character) return;
    
    // Check if character is already in party
    const isAlreadyInParty = partyCharacters.some(char => char.name === character.name);
    if (isAlreadyInParty) {
      alert('Character is already in the party!');
      return;
    }
    
    // Add character to party with unique ID and combat stats
    const hitPoints = calculateHitPoints(character);
    const attackStats = calculateAttackStats(character);
    const defenseStats = calculateDefenseStats(character);
    
    const partyCharacter = {
      ...character,
      partyId: `${character.name}-${Date.now()}`,
      hitPoints: hitPoints,
      attackSkill: attackStats.skill,
      attackScore: attackStats.score,
      defenseSkill: defenseStats.skill,
      defenseScore: defenseStats.score
    };
    const newParty = [...partyCharacters, partyCharacter];
    setPartyCharacters(newParty);
    
    // Save to localStorage
    try {
      localStorage.setItem('wildcombat-party', JSON.stringify(newParty));
    } catch (error) {
      console.error('Error saving party:', error);
    }
  };

  const removeCharacterFromParty = (partyId) => {
    const newParty = partyCharacters.filter(char => char.partyId !== partyId);
    setPartyCharacters(newParty);
    
    // Save to localStorage
    try {
      localStorage.setItem('wildcombat-party', JSON.stringify(newParty));
    } catch (error) {
      console.error('Error saving party:', error);
    }
  };

  // Calculate total party stats
  const totalPartyHitPoints = partyCharacters.reduce((total, character) => {
    return total + character.hitPoints;
  }, 0);
  
  const totalPartyAttackScore = partyCharacters.reduce((total, character) => {
    return total + (character.attackScore || 1);
  }, 0);
  
  const totalPartyDefenseScore = partyCharacters.reduce((total, character) => {
    return total + (character.defenseScore || 1);
  }, 0);


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

        // Recalculate all stats for healed character
        const healedCharacter = {
          ...character,
          aspects: healedAspects
        };
        const newHitPoints = calculateHitPoints(healedCharacter);
        const attackStats = calculateAttackStats(healedCharacter);
        const defenseStats = calculateDefenseStats(healedCharacter);

        return {
          ...healedCharacter,
          hitPoints: newHitPoints,
          attackSkill: attackStats.skill,
          attackScore: attackStats.score,
          defenseSkill: defenseStats.skill,
          defenseScore: defenseStats.score
        };
      });

      setPartyCharacters(healedParty);
      setHealStatus('Party healed!');
      setTimeout(() => setHealStatus(''), 3000);
      
      // Save healed party to localStorage
      localStorage.setItem('wildcombat-party', JSON.stringify(healedParty));
    } catch (error) {
      console.error('Error healing party:', error);
      setHealStatus('Error healing party');
      setTimeout(() => setHealStatus(''), 3000);
    }
  };

  return (
    <div className="tab-content">
      <h2>Party Management</h2>
      
      <div className="party-layout">
        {/* Character Viewer Column */}
        <div className="character-viewer-column">
          <div className="character-viewer-section">
            <h3>Character Viewer</h3>
            
            <div className="character-input-section">
              <CombinedCharacterSelector 
                onCharacterSelect={handleCharacterViewerSelect}
                refreshTrigger={savedCharactersRefresh}
              />
              <div className="input-divider">or</div>
              <CharacterUpload onCharacterUpload={handleCharacterUpload} />
            </div>
            
            {displayCharacter && (
              <div className="character-actions">
                <button 
                  className="add-to-party-button"
                  onClick={() => handleCharacterSelect(displayCharacter)}
                >
                  Add to Party
                </button>
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
        </div>

        {/* Party Management Column */}
        <div className="party-management-column">
          <div className="party-section">
            <h3>Party</h3>
        
        {partyCharacters.length > 0 && (
          <div className="party-actions-section">
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
          <div className="stat">
            <span className="stat-label">Total Attack Score:</span>
            <span className="stat-value">{totalPartyAttackScore}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Total Defense Score:</span>
            <span className="stat-value">{totalPartyDefenseScore}</span>
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
                <div className="character-info">
                  <span className="character-name">{character.name}</span>
                  <div className="character-stats">
                    <span className="character-hp">HP: {character.hitPoints}</span>
                    <span className="character-attack">ATK: {character.attackScore} ({character.attackSkill})</span>
                    <span className="character-defense">DEF: {character.defenseScore} ({character.defenseSkill})</span>
                  </div>
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
      </div>
    </div>
  );
};

export default PartyTab;
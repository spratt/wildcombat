import { useState } from 'react';

const HealAllAspectsButton = ({ characterData, onCharacterHealed }) => {
  const [healStatus, setHealStatus] = useState('');

  const healAllAspects = () => {
    if (!characterData || !characterData.aspects) {
      setHealStatus('No character to heal');
      setTimeout(() => setHealStatus(''), 3000);
      return;
    }

    try {
      // Create healed character data
      const healedCharacter = {
        ...characterData,
        aspects: characterData.aspects.map(aspect => {
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
        })
      };

      setHealStatus('All aspects healed!');
      setTimeout(() => setHealStatus(''), 3000);

      // Notify parent component with healed character
      if (onCharacterHealed) {
        onCharacterHealed(healedCharacter);
      }
    } catch (error) {
      console.error('Error healing character:', error);
      setHealStatus('Error healing character');
      setTimeout(() => setHealStatus(''), 3000);
    }
  };

  if (!characterData) {
    return null;
  }

  return (
    <div className="heal-character-section">
      <button 
        className="heal-button"
        onClick={healAllAspects}
        disabled={!characterData.aspects}
      >
        Heal All Aspects
      </button>
      {healStatus && (
        <span className={`heal-status ${healStatus.includes('Error') ? 'error' : 'success'}`}>
          {healStatus}
        </span>
      )}
    </div>
  );
};

export default HealAllAspectsButton;
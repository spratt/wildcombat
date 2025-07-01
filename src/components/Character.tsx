import React, { useState, useEffect } from 'react';
import Ajv from 'ajv';
import characterSchema from '../character-schema.json';
import { Character as CharacterType } from '../types';

// Helper function to render a track as bubbles
const renderTrack = (track: number[]): string => {
  if (!Array.isArray(track)) return '';
  return track.map(bubble => {
    if (bubble === 1) return '⦿';
    if (bubble === 2) return '⦻';
    return '⦾';
  }).join('-');
};

// Helper function to calculate unchecked aspect tracks (hit points)
const calculateHitPoints = (character: CharacterType | null): number => {
  if (!character || !character.aspects || !Array.isArray(character.aspects)) {
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

// Standard lists for Wildsea
const EDGES = ['GRACE', 'INSTINCT', 'IRON', 'SHARPS', 'TEETH', 'TIDES', 'VEILS'] as const;

const SKILLS = [
  'BRACE', 'BREAK', 'CONCOCT', 'COOK', 'DELVE', 'FLOURISH', 'HACK', 'HARVEST',
  'HUNT', 'OUTWIT', 'RATTLE', 'SCAVENGE', 'SENSE', 'STUDY', 'SWAY', 'TEND',
  'VAULT', 'WAVEWALK'
] as const;

const LANGUAGES = [
  'LOW_SOUR', 'CHTHONIC', 'SAPREKK', 'GAUDIMM', 'KNOCK', 'BRASSTONGUE',
  'RAKA_SPIT', 'LYRE_BITE', 'OLD_HAND', 'SIGNALLING', 'HIGHVIN'
] as const;

// Helper function to get all skills with defaults
const getAllSkills = (characterSkills: Record<string, number[]>): Record<string, number[]> => {
  const skills: Record<string, number[]> = {};
  SKILLS.forEach(skill => {
    skills[skill] = characterSkills[skill] || [0, 0, 0];
  });
  return skills;
};

// Helper function to get all languages with defaults
const getAllLanguages = (characterLanguages: Record<string, number[]>): Record<string, number[]> => {
  const languages: Record<string, number[]> = {};
  LANGUAGES.forEach(language => {
    languages[language] = characterLanguages[language] || [0, 0, 0];
  });
  return languages;
};

interface CharacterProps {
  characterData: string | CharacterType | null;
}

interface ValidationError {
  instancePath?: string;
  message: string;
}

const Character: React.FC<CharacterProps> = ({ characterData }) => {
  const [validationError, setValidationError] = useState<ValidationError[] | null>(null);
  const [character, setCharacter] = useState<CharacterType | null>(null);

  useEffect(() => {
    if (!characterData) {
      setCharacter(null);
      setValidationError(null);
      return;
    }

    try {
      const data = typeof characterData === 'string' ? JSON.parse(characterData) : characterData;
      
      // Validate against schema
      const ajv = new Ajv({ allErrors: true });
      const validate = ajv.compile(characterSchema);
      const valid = validate(data);

      if (!valid) {
        setValidationError(validate.errors as ValidationError[]);
        setCharacter(null);
      } else {
        setCharacter(data);
        setValidationError(null);
      }
    } catch (error) {
      setValidationError([{ message: `JSON Parse Error: ${(error as Error).message}` }]);
      setCharacter(null);
    }
  }, [characterData]);

  if (!characterData) {
    return <div className="character-sheet">No character selected</div>;
  }

  if (validationError) {
    return (
      <div className="character-sheet error">
        <h2>Validation Error</h2>
        <ul>
          {validationError.map((error, index) => (
            <li key={index}>
              {error.instancePath || '/'}: {error.message}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!character) {
    return <div className="character-sheet">Loading...</div>;
  }

  const hitPoints = calculateHitPoints(character);

  return (
    <div className="character-sheet">
      <div className="character-header">
        <div className="character-title-section">
          <h1>{character.name}</h1>
          <div className="character-hp-display">
            <span className="hp-label">Hit Points:</span>
            <span className="hp-value">{hitPoints}</span>
          </div>
        </div>
        {character.portrait && (
          <img src={character.portrait} alt={character.name} className="character-portrait" />
        )}
      </div>

      <div className="character-background">
        <h2>Background</h2>
        <p><strong>Bloodline:</strong> {
          typeof character.background === 'object' && character.background?.bloodline 
            ? character.background.bloodline 
            : character.bloodline
        }</p>
        <p><strong>Origin:</strong> {
          typeof character.background === 'object' && character.background?.origin 
            ? character.background.origin 
            : character.origin
        }</p>
        <p><strong>Post:</strong> {
          typeof character.background === 'object' && character.background?.post 
            ? character.background.post 
            : character.post
        }</p>
        {((typeof character.background === 'object' && character.background?.notes) || 
          (typeof character.background === 'string' && character.background)) && (
          <div className="background-notes">
            <strong>Notes:</strong>
            <p>{
              typeof character.background === 'object' 
                ? character.background.notes 
                : character.background
            }</p>
          </div>
        )}
      </div>

      <div className="character-edges">
        <h2>Edges</h2>
        <div className="edges-list">
          {EDGES.map(edge => (
            <span key={edge} className={`edge ${
              Array.isArray(character.edges) 
                ? character.edges.includes(edge)
                : character.edges?.[edge]
              ? 'selected' : 'unselected'
            }`}>
              {edge}
            </span>
          ))}
        </div>
      </div>

      <div className="character-skills">
        <h2>Skills</h2>
        <div className="skills-grid">
          {character.skills && Object.entries(character.skills).map(([skillName, skillValue]) => (
            <div key={skillName} className="skill">
              <span className="skill-name">{skillName}</span>
              <span className="skill-values">
                {skillValue?.map((value, index) => (
                  <span key={index}>{value === 1 ? '⦿' : '⦾'}</span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="character-languages">
        <h2>Languages</h2>
        <div className="languages-grid">
          {character.languages && Object.entries(character.languages).map(([languageName, languageValue]) => (
            <div key={languageName} className="language">
              <span className="language-name">{languageName}</span>
              <span className="language-values">
                {languageValue?.map((value, index) => (
                  <span key={index}>{value === 1 ? '⦿' : '⦾'}</span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="character-drives">
        <h2>Drives</h2>
        <div className="drives-list">
          {Array.isArray(character.drives) ? (
            character.drives.map((drive, index) => (
              <div key={index} className="drive">
                <span className="drive-name">{typeof drive === 'object' ? drive.name : drive}</span>
                {typeof drive === 'object' && drive.description && <p className="drive-description">{drive.description}</p>}
              </div>
            ))
          ) : character.drives ? (
            character.drives.split('\n').map((drive, index) => (
              <div key={index} className="drive">
                <span className="drive-name">{drive}</span>
              </div>
            ))
          ) : null}
        </div>
      </div>

      <div className="character-mires">
        <h2>Mires</h2>
        <div className="mires-list">
          {character.mires?.map((mire, index) => (
            <div key={index} className="mire">
              <span className="mire-label">{mire.name}</span>
              <span className="mire-value">{mire.mark === 1 ? '⦿' : '⦾'}</span>
              {mire.description && <p className="mire-description">{mire.description}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="character-resources">
        <h2>Resources</h2>
        <div className="resources-grid">
          {character.charts && character.charts.length > 0 && (
            <div className="resource">
              <h3>Charts</h3>
              <ul>
                {character.charts.map((chart, index) => (
                  <li key={index}>{chart}</li>
                ))}
              </ul>
            </div>
          )}
          {character.cargo && character.cargo.length > 0 && (
            <div className="resource">
              <h3>Cargo</h3>
              <ul>
                {character.cargo.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {character.specimens && character.specimens.length > 0 && (
            <div className="resource">
              <h3>Specimens</h3>
              <ul>
                {character.specimens.map((specimen, index) => (
                  <li key={index}>{specimen}</li>
                ))}
              </ul>
            </div>
          )}
          {character.whispers && character.whispers.length > 0 && (
            <div className="resource">
              <h3>Whispers</h3>
              <ul>
                {character.whispers.map((whisper, index) => (
                  <li key={index}>{whisper}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="character-aspects">
        <h2>Aspects</h2>
        {character.aspects?.map((aspect, index) => (
          <div key={index} className="aspect">
            <div className="aspect-header">
              <span className="aspect-name">{aspect.name}</span>
              <span className="aspect-value">{renderTrack(aspect.value || [0])}</span>
            </div>
            {aspect.description && <p className="aspect-details">{aspect.description}</p>}
            {aspect.ability && <p className="aspect-ability"><strong>Ability:</strong> {aspect.ability}</p>}
          </div>
        ))}
      </div>

      {character.temporaryTracks && character.temporaryTracks.length > 0 && (
        <div className="character-temporary-tracks">
          <h2>Temporary Tracks</h2>
          {character.temporaryTracks.map((track, index) => (
            <div key={index} className="temporary-track">
              <div className="track-header">
                <span className="track-name">{track.name}</span>
                <span className="track-value">{renderTrack(track.value)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {character.milestones && character.milestones.length > 0 && (
        <div className="character-milestones">
          <h2>Milestones</h2>
          <div className="milestones-sections">
            {character.milestones.filter(m => m.type === 'minor').length > 0 && (
              <div className="minor-milestones">
                <h3>Minor Milestones</h3>
                <ul>
                  {character.milestones
                    .filter(m => m.type === 'minor')
                    .map((milestone, index) => (
                      <li key={index}>{milestone.description}</li>
                    ))}
                </ul>
              </div>
            )}
            {character.milestones.filter(m => m.type === 'major').length > 0 && (
              <div className="major-milestones">
                <h3>Major Milestones</h3>
                <ul>
                  {character.milestones
                    .filter(m => m.type === 'major')
                    .map((milestone, index) => (
                      <li key={index}>{milestone.description}</li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Character;
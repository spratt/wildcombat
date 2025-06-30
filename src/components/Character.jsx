import { useState, useEffect } from 'react';
import Ajv from 'ajv';
import characterSchema from '../character-schema.json';

// Helper function to render a track as bubbles
const renderTrack = (track) => {
  if (!Array.isArray(track)) return '';
  return track.map(bubble => {
    if (bubble === 1) return '⦿';
    if (bubble === 2) return '⦻';
    return '⦾';
  }).join('-');
};

const Character = ({ characterData }) => {
  const [validationError, setValidationError] = useState(null);
  const [character, setCharacter] = useState(null);

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
        setValidationError(validate.errors);
        setCharacter(null);
      } else {
        setCharacter(data);
        setValidationError(null);
      }
    } catch (error) {
      setValidationError([{ message: `JSON Parse Error: ${error.message}` }]);
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

  return (
    <div className="character-sheet">
      <div className="character-header">
        <h1>{character.name}</h1>
        {character.portrait && (
          <img src={character.portrait} alt={character.name} className="character-portrait" />
        )}
      </div>

      <div className="character-background">
        <h2>Background</h2>
        <p><strong>Bloodline:</strong> {character.background.bloodline}</p>
        <p><strong>Origin:</strong> {character.background.origin}</p>
        <p><strong>Post:</strong> {character.background.post}</p>
        {character.background.notes && (
          <div className="background-notes">
            <strong>Notes:</strong>
            <p>{character.background.notes}</p>
          </div>
        )}
      </div>

      <div className="character-edges">
        <h2>Edges</h2>
        <div className="edges-list">
          {Object.entries(character.edges).map(([edge, value]) => (
            value && <span key={edge} className="edge">{edge}</span>
          ))}
        </div>
      </div>

      <div className="character-skills">
        <h2>Skills</h2>
        <div className="skills-grid">
          {Object.entries(character.skills).map(([skill, values]) => (
            <div key={skill} className="skill">
              <span className="skill-name">{skill}</span>
              <span className="skill-values">{renderTrack(values)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="character-languages">
        <h2>Languages</h2>
        <div className="languages-grid">
          {Object.entries(character.languages).map(([language, values]) => (
            <div key={language} className="language">
              <span className="language-name">{language}</span>
              <span className="language-values">{renderTrack(values)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="character-drives">
        <h2>Drives</h2>
        <p className="drives-text">{character.drives}</p>
      </div>

      <div className="character-mires">
        <h2>Mires</h2>
        <ul>
          {character.mires.map((mire, index) => (
            <li key={index}>
              {mire.label} {renderTrack(mire.value)}
            </li>
          ))}
        </ul>
      </div>

      <div className="character-resources">
        <h2>Resources</h2>
        <div className="resources-grid">
          {Object.entries(character.resources).map(([resource, value]) => (
            value && (
              <div key={resource} className="resource">
                <h3>{resource.charAt(0).toUpperCase() + resource.slice(1)}</h3>
                <p>{value}</p>
              </div>
            )
          ))}
        </div>
      </div>

      <div className="character-aspects">
        <h2>Aspects</h2>
        {character.aspects.map((aspect, index) => (
          <div key={index} className="aspect">
            <div className="aspect-header">
              <span className="aspect-name">{aspect.name}</span>
              {aspect.value && <span className="aspect-value">{renderTrack(aspect.value)}</span>}
            </div>
            {aspect.details && <p className="aspect-details">{aspect.details}</p>}
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
                {track.value && <span className="track-value">{renderTrack(track.value)}</span>}
              </div>
              {track.details && <p className="track-details">{track.details}</p>}
            </div>
          ))}
        </div>
      )}

      {character.minorMilestones && character.minorMilestones.length > 0 && (
        <div className="character-milestones">
          <h2>Minor Milestones</h2>
          <ul>
            {character.minorMilestones.map((milestone, index) => (
              <li key={index}>{milestone.label}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Character;
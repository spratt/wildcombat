import React, { useState } from 'react';
import { Character } from '../types';

interface ExportCharacterButtonProps {
  characterData: Character | null;
}

const ExportCharacterButton: React.FC<ExportCharacterButtonProps> = ({ characterData }) => {
  const [exportStatus, setExportStatus] = useState<string>('');

  const exportCharacter = () => {
    if (!characterData || !characterData.name) {
      setExportStatus('No character to export');
      setTimeout(() => setExportStatus(''), 3000);
      return;
    }

    try {
      // Create JSON string with proper formatting
      const jsonString = JSON.stringify(characterData, null, 2);
      
      // Create blob and download link
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${characterData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setExportStatus('Character exported!');
      setTimeout(() => setExportStatus(''), 3000);
    } catch (error) {
      console.error('Error exporting character:', error);
      setExportStatus('Error exporting character');
      setTimeout(() => setExportStatus(''), 3000);
    }
  };

  if (!characterData) {
    return null;
  }

  return (
    <div className="export-character-section">
      <button 
        className="export-button"
        onClick={exportCharacter}
        disabled={!characterData.name}
      >
        Export Character JSON
      </button>
      {exportStatus && (
        <span className={`export-status ${exportStatus.includes('Error') ? 'error' : 'success'}`}>
          {exportStatus}
        </span>
      )}
    </div>
  );
};

export default ExportCharacterButton;
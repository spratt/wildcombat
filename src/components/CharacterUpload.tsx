import React, { useState } from 'react';
import { Character } from '../types';

interface CharacterUploadProps {
  onCharacterUpload: (character: Character) => void;
}

const CharacterUpload: React.FC<CharacterUploadProps> = ({ onCharacterUpload }) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = (file: File | null) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
      setUploadError('Please upload a JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        setUploadError(null);
        onCharacterUpload(data);
      } catch (error) {
        setUploadError(`Invalid JSON file: ${(error as Error).message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileUpload(file);
  };

  return (
    <div className="character-upload">
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="upload-content">
          <p>Drop a character JSON file here, or</p>
          <input
            type="file"
            accept=".json"
            onChange={handleFileInput}
            className="file-input"
            id="character-file"
          />
          <label htmlFor="character-file" className="file-label">
            Choose File
          </label>
        </div>
      </div>
      {uploadError && (
        <div className="upload-error">
          {uploadError}
        </div>
      )}
    </div>
  );
};

export default CharacterUpload;
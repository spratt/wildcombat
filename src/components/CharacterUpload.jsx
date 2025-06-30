import { useState } from 'react';

const CharacterUpload = ({ onCharacterUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleFileUpload = (file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
      setUploadError('Please upload a JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const data = JSON.parse(content);
        setUploadError(null);
        onCharacterUpload(data);
      } catch (error) {
        setUploadError(`Invalid JSON file: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
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
import { ChangeEvent, DragEvent, MouseEvent, useRef, useState } from 'react';
import { Icon } from './Icon';

interface FileDropzoneProps {
  onFileSelected: (file: File) => Promise<void> | void;
  onExampleLoad: () => Promise<void> | void;
  isLoading: boolean;
}

export function FileDropzone({ onFileSelected, onExampleLoad, isLoading }: FileDropzoneProps): JSX.Element {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetDragState = () => setIsDragActive(false);

  const handleFileInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    await onFileSelected(file);
    resetDragState();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) {
      return;
    }

    await onFileSelected(files[0]);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  };

  const handleExampleLoadClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (!isLoading) {
      await onExampleLoad();
    }
  };

  const openFilePicker = (event: MouseEvent<HTMLDivElement>) => {
    if (isLoading) {
      event.preventDefault();
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <div className="sidebar-section">
      <div className="file-selection-box">
        <div
          className={`file-drop-area${isDragActive ? ' drag-over' : ''}`}
          id="fileDropArea"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFilePicker}
          aria-busy={isLoading}
        >
          <div className="drop-zone-content">
            <h3>Drop your FIT file here</h3>
            <p>
              or{' '}
              <button
                type="button"
                className="file-select-button"
                id="fileSelectButton"
                onClick={(event) => {
                  event.stopPropagation();
                  if (!isLoading) {
                    fileInputRef.current?.click();
                  }
                }}
              >
                choose a file
              </button>
            </p>
            <p className="file-types">Accepts .fit files</p>
          </div>
          <input
            type="file"
            id="fitFile"
            accept=".fit"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileInputChange}
            onClick={resetDragState}
          />
        </div>

        <div className="example-file-link">
          <a href="#" id="loadExampleFile" onClick={handleExampleLoadClick} aria-disabled={isLoading}>
            <Icon name="file-lines" />
            Load example FIT file
          </a>
        </div>
      </div>
    </div>
  );
}

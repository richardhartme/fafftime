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

  const dropAreaClasses = [
    'relative cursor-pointer rounded-lg border-2 border-dashed border-blue-600 bg-white p-5 text-center transition-all duration-300 ease-in-out hover:border-blue-700 hover:bg-blue-50',
    isDragActive ? 'scale-105 border-blue-800 bg-blue-100' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="w-full">
      <div className="mb-5 w-full rounded-lg border-2 border-blue-600 bg-blue-50 p-5 shadow-md">
        <div
          className={dropAreaClasses}
          id="fileDropArea"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFilePicker}
          aria-busy={isLoading}
        >
          <div className="pointer-events-none">
            <h3 className="m-0 mb-2.5 text-[1.2rem] text-gray-800">Drop your FIT file here</h3>
            <p className="my-2 text-gray-600">
              or{' '}
              <button
                type="button"
                className="pointer-events-auto rounded border-none bg-blue-600 px-4 py-2 text-[0.9rem] text-white transition-colors duration-200 hover:bg-blue-800"
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
            <p className="text-xs text-gray-400">Accepts .fit files</p>
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

        <div className="mt-5 text-[0.9em]">
          <a
            href="#"
            id="loadExampleFile"
            onClick={handleExampleLoadClick}
            aria-disabled={isLoading}
            className="block rounded border border-gray-300 bg-gray-50 px-2.5 py-1.5 text-blue-600 transition-colors duration-200 hover:bg-gray-100"
          >
            <Icon name="file-lines" />
            Load example FIT file
          </a>
        </div>
      </div>
    </div>
  );
}

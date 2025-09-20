import { ChangeEvent, DragEvent, MouseEvent, useRef, useState } from 'react';

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

  const handleExampleLoadClick = async (event: MouseEvent<HTMLButtonElement>) => {
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
    'group relative cursor-pointer rounded-2xl border-2 border-dashed border-blue-400/80 bg-white/80 p-8 text-center transition',
    'hover:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500',
    isDragActive ? 'is-dragover border-blue-500 ring-2 ring-blue-500' : '',
  ].filter(Boolean).join(' ');

  const overlayClasses = [
    'pointer-events-none absolute inset-0 rounded-2xl opacity-0 ring-2 ring-blue-500 transition',
    isDragActive ? 'opacity-100' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="w-full">
      <section className="max-w-xl rounded-2xl border border-blue-300 bg-blue-50/60 p-5 shadow-sm backdrop-blur">
        <h2 className="sr-only">Upload FIT file</h2>

        <div
          id="fit-dropzone"
          className={dropAreaClasses}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFilePicker}
          aria-busy={isLoading}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (isLoading) {
              return;
            }
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            id="fit-file"
            ref={fileInputRef}
            type="file"
            accept=".fit"
            className="sr-only"
            onChange={handleFileInputChange}
            onClick={resetDragState}
            disabled={isLoading}
          />

          <p className="text-xl font-semibold text-zinc-900">Drop your FIT file here</p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="text-sm text-zinc-500">or</span>
            <label
              htmlFor="fit-file"
              className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              onClick={(event) => {
                event.stopPropagation();
                if (isLoading) {
                  event.preventDefault();
                }
              }}
            >
              choose a file
            </label>
          </div>

          <p className="mt-3 text-xs text-zinc-500">Accepts .fit files</p>

          <div aria-hidden="true" className={overlayClasses}></div>
        </div>

        <div className="mt-4"></div>

        <button
          type="button"
          onClick={handleExampleLoadClick}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          <svg
            className="h-4 w-4 text-blue-600"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" className="opacity-80" />
          </svg>
          Load example FIT file
        </button>
      </section>
    </div>
  );
}

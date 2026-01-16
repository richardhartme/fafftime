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
    'group relative cursor-pointer rounded-xl border-2 border-dashed border-blue-300 bg-gradient-to-b from-white to-blue-50/30 p-6 text-center transition-all duration-200',
    'hover:border-blue-400 hover:bg-gradient-to-b hover:from-white hover:to-blue-50/60 hover:shadow-sm',
    'focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20',
    isDragActive ? 'is-dragover border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20 scale-[1.02]' : '',
  ].filter(Boolean).join(' ');

  const overlayClasses = [
    'pointer-events-none absolute inset-0 rounded-xl opacity-0 ring-2 ring-blue-500 transition-opacity duration-200',
    isDragActive ? 'opacity-100' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="w-full">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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

          {/* Upload icon */}
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-transform group-hover:scale-110">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17,8 12,3 7,8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          <p className="text-base font-semibold text-slate-800">Drop your FIT file here</p>

          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-sm text-slate-400">or</span>
            <label
              htmlFor="fit-file"
              className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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

          <p className="mt-2 text-xs text-slate-400">Accepts .fit files from Garmin devices</p>

          <div aria-hidden="true" className={overlayClasses}></div>
        </div>

        <button
          type="button"
          onClick={handleExampleLoadClick}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          disabled={isLoading}
        >
          <svg
            className="h-4 w-4 text-blue-600"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" className="opacity-60" />
          </svg>
          Load example FIT file
        </button>
      </section>
    </div>
  );
}

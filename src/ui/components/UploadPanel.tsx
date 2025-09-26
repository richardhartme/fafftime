import { useEffect, useState } from 'react';
import { ParsedFileState } from '../../types/analysis';
import { FileDropzone } from './FileDropzone';
import { Icon } from './Icon';

interface UploadPanelProps {
  parsedFile: ParsedFileState | null;
  onFileSelected: (file: File) => Promise<void> | void;
  onExampleLoad: () => Promise<void> | void;
  isLoading: boolean;
}

export function UploadPanel({ parsedFile, onFileSelected, onExampleLoad, isLoading }: UploadPanelProps): JSX.Element {
  const [isDropzoneOpen, setIsDropzoneOpen] = useState<boolean>(() => !parsedFile);

  useEffect(() => {
    if (!parsedFile) {
      setIsDropzoneOpen(true);
      return;
    }

    setIsDropzoneOpen(false);
  }, [parsedFile]);

  const handleAnalyseAnotherClick = () => {
    setIsDropzoneOpen(true);
  };

  if (!parsedFile || isDropzoneOpen) {
    return (
      <FileDropzone
        onFileSelected={onFileSelected}
        onExampleLoad={onExampleLoad}
        isLoading={isLoading}
      />
    );
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-blue-300 bg-blue-50/60 p-5 shadow-sm">
      <header className="flex items-start gap-3">
        <div className="rounded-full bg-blue-500/15 p-2 text-blue-700">
          <Icon name="file" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-blue-900">
            Loaded FIT File
          </h2>
          <p className="mt-1 truncate text-sm text-blue-900/80" title={parsedFile.fileName}>
            {parsedFile.fileName}
          </p>
        </div>
      </header>

      <button
        type="button"
        onClick={handleAnalyseAnotherClick}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-800 shadow-sm transition hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <Icon name="rotate-left" />
        Analyse Another FIT File
      </button>
    </section>
  );
}

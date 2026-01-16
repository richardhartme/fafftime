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
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-slate-800">
            Loaded FIT File
          </h2>
          <p className="mt-0.5 truncate text-sm text-slate-600" title={parsedFile.fileName}>
            {parsedFile.fileName}
          </p>
        </div>
      </header>

      <button
        type="button"
        onClick={handleAnalyseAnotherClick}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      >
        <Icon name="rotate-left" />
        Analyse Another FIT File
      </button>
    </section>
  );
}

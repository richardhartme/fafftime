import { useRef, MouseEvent } from 'react';
import logoImage from '../../assets/images/logo.png';

interface HeroSectionProps {
  onFileSelected: (file: File) => Promise<void> | void;
  onExampleLoad: () => Promise<void> | void;
  isLoading: boolean;
}

export function HeroSection({ onFileSelected, onExampleLoad, isLoading }: HeroSectionProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await onFileSelected(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExampleLoadClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!isLoading) {
      await onExampleLoad();
    }
  };

  const openFilePicker = () => {
    if (!isLoading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-blue-50/30">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-indigo-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-sky-100/40 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 mx-auto max-w-6xl px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={logoImage}
              alt="FaffTime logo"
              className="w-auto h-10"
            />
            <span className="text-xl font-semibold text-slate-900 tracking-tight">FaffTime</span>
          </div>
          <div className="hidden sm:flex items-center gap-8">
            <a href="https://github.com/Hates/fafftime" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              GitHub
            </a>
            <a href="mailto:info@fafftime.com?subject=Faff%20Time%20Feedback" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Feedback
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-12 pb-8 sm:pt-20 sm:pb-12">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Headline */}
          <h1 className="mt-2 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-slate-900 opacity-0 animate-fade-up animate-delay-100">
            Find your <span className="text-blue-600 italic">faff time</span> and
            <br className="hidden sm:block" />
            {' '}ride smarter
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed opacity-0 animate-fade-up animate-delay-200">
            Discover where you spent time stopped instead of riding. Upload your Garmin FIT file and uncover opportunities to improve your ultra-cycling performance.
          </p>

          {/* Definition */}
          <p className="mt-4 text-sm text-slate-500 opacity-0 animate-fade-up animate-delay-300">
            <span className="font-semibold text-slate-700">faff about</span> — to spend your time doing things that are not important instead of the thing that you should be doing
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-up animate-delay-400">
            <input
              ref={fileInputRef}
              type="file"
              accept=".fit"
              className="sr-only"
              onChange={handleFileInputChange}
              disabled={isLoading}
            />
            <button
              onClick={openFilePicker}
              disabled={isLoading}
              className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analysing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17,8 12,3 7,8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Upload FIT File
                </>
              )}
            </button>
            <button
              onClick={handleExampleLoadClick}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" className="opacity-60" />
              </svg>
              Try Example
            </button>
          </div>

          {/* Trust indicators */}
          <p className="mt-6 text-xs text-slate-400 opacity-0 animate-fade-up animate-delay-500">
            Your files are processed locally in your browser. Nothing is uploaded to any server.
          </p>
        </div>

        {/* Preview Card */}
        <div className="mt-16 sm:mt-20 opacity-0 animate-fade-up animate-delay-600">
          <div className="relative mx-auto max-w-4xl">
            {/* Floating card shadow/glow effect */}
            <div className="absolute inset-0 -bottom-4 bg-gradient-to-b from-blue-500/5 to-blue-500/10 rounded-3xl blur-2xl transform scale-[0.97]" />

            {/* Card */}
            <figure className="relative rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-200/50 overflow-hidden animate-float">
              {/* Browser chrome */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400/80"></span>
                  <span className="h-3 w-3 rounded-full bg-amber-400/80"></span>
                  <span className="h-3 w-3 rounded-full bg-green-400/80"></span>
                </div>
                <div className="flex-1 mx-4">
                  <div className="mx-auto max-w-xs rounded-md bg-slate-100 px-3 py-1.5 text-center text-xs text-slate-500">
                    fafftime.com/analysis
                  </div>
                </div>
                <div className="w-14"></div>
              </div>

              {/* Screenshot */}
              <div className="overflow-hidden bg-slate-50">
                <img
                  src="screenshot.png"
                  alt="Example analysis showing slow periods during an ultra-cycling ride"
                  className="block h-auto w-full"
                  loading="lazy"
                />
              </div>
            </figure>
          </div>
        </div>
      </div>

      {/* Bottom fade for smooth transition */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </div>
  );
}

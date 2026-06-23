import React, { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2, ExternalLink, FileText, AlertTriangle, RotateCcw } from 'lucide-react';
import './PDFViewer.css';

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  fileSize?: string;
  onClose: () => void;
  isOpen: boolean;
  isDarkMode?: boolean;
}

const getFileType = (name: string, url: string) => {
  const lowercaseName = name.toLowerCase();
  const lowercaseUrl = url.toLowerCase();
  
  if (
    lowercaseName.endsWith('.jpg') ||
    lowercaseName.endsWith('.jpeg') ||
    lowercaseName.endsWith('.png') ||
    lowercaseName.endsWith('.gif') ||
    lowercaseName.endsWith('.webp') ||
    lowercaseName.endsWith('.svg') ||
    lowercaseUrl.includes('image/')
  ) {
    return 'image';
  }
  
  if (lowercaseName.endsWith('.pdf') || lowercaseUrl.includes('.pdf')) {
    return 'pdf';
  }
  
  if (
    lowercaseName.endsWith('.doc') ||
    lowercaseName.endsWith('.docx') ||
    lowercaseName.endsWith('.xls') ||
    lowercaseName.endsWith('.xlsx') ||
    lowercaseName.endsWith('.ppt') ||
    lowercaseName.endsWith('.pptx')
  ) {
    return 'office';
  }
  
  return 'other';
};

const PDFViewer: React.FC<PDFViewerProps> = ({
  fileUrl,
  fileName,
  fileSize,
  onClose,
  isOpen,
  isDarkMode = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewerKey, setViewerKey] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);

  const fileType = getFileType(fileName, fileUrl);
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  let finalUrl = fileUrl;
  if (fileType === 'office') {
    finalUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
  } else if (fileType === 'pdf' && isMobile) {
    // Android Chrome intercepts PDF iframes with native handler — use Google Docs Viewer instead
    finalUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
  }

  // Reset state when a new file opens
  useEffect(() => {
    if (isOpen && fileUrl) {
      setIsLoading(true);
      setError(false);
      setViewerKey(k => k + 1);
    }
  }, [fileUrl, isOpen]);

  // Reset fullscreen when closed
  useEffect(() => {
    if (!isOpen) setIsFullscreen(false);
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      window.scrollTo({ top: scrollY, left: scrollX, behavior: 'instant' });
    };
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) setIsFullscreen(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isFullscreen, onClose]);

  const handleRetry = () => {
    setError(false);
    setIsLoading(true);
    setViewerKey(k => k + 1);
  };

  // Backdrop click to close (only when not fullscreen)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (!isFullscreen && e.target === overlayRef.current) onClose();
  };

  if (!isOpen) return null;

  const dk = isDarkMode;

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className={`pdf-overlay ${isFullscreen ? 'pdf-overlay--fullscreen' : ''}`}
    >
      <div
        className={`pdf-modal ${isFullscreen ? 'pdf-modal--fullscreen' : ''} pdf-modal--enter ${
          dk ? 'pdf-modal--dark' : 'pdf-modal--light'
        }`}
      >
        {/* Top accent stripe */}
        <div className="pdf-accent" />

        {/* ── Header ────────────────────────────────────────── */}
        <header className={`pdf-header ${dk ? 'pdf-header--dark' : 'pdf-header--light'}`}>
          {/* Left: icon + meta */}
          <div className="pdf-header__meta">
            <div className={`pdf-header__icon ${dk ? 'pdf-header__icon--dark' : ''}`}>
              <FileText size={18} strokeWidth={2} />
            </div>
            <div className="pdf-header__text">
              <span className={`pdf-header__name ${dk ? 'text-white' : 'text-slate-900'}`}>
                {fileName}
              </span>
              {fileSize && (
                <span className={`pdf-header__size ${dk ? 'text-slate-400' : 'text-slate-500'}`}>
                  {fileSize}
                </span>
              )}
            </div>
          </div>

          {/* Right: controls */}
          <div className="pdf-header__controls">
            {/* Open in browser — hidden on xs, visible from sm */}
            <button
              onClick={() => window.open(fileUrl, '_blank')}
              title="Open in browser tab"
              className={`pdf-btn pdf-btn--primary ${dk ? 'pdf-btn--primary-dark' : ''}`}
            >
              <ExternalLink size={15} strokeWidth={2.2} />
              <span className="pdf-btn__label">Open</span>
            </button>

            {/* Fullscreen toggle */}
            <button
              onClick={() => setIsFullscreen(f => !f)}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              className={`pdf-btn pdf-btn--icon ${dk ? 'pdf-btn--icon-dark' : 'pdf-btn--icon-light'}`}
            >
              {isFullscreen
                ? <Minimize2 size={16} strokeWidth={2.2} />
                : <Maximize2 size={16} strokeWidth={2.2} />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              title="Close"
              className={`pdf-btn pdf-btn--close ${dk ? 'pdf-btn--close-dark' : 'pdf-btn--close-light'}`}
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        </header>

        {/* ── Body ──────────────────────────────────────────── */}
        <div className={`pdf-body ${dk ? 'pdf-body--dark' : 'pdf-body--light'}`}>
          {/* Loading overlay */}
          {isLoading && !error && (
            <div className={`pdf-loading ${dk ? 'pdf-loading--dark' : 'pdf-loading--light'}`}>
              <div className="pdf-loading__spinner">
                <div className={`pdf-loading__ring ${dk ? 'pdf-loading__ring--dark' : 'pdf-loading__ring--light'}`} />
              </div>
              <p className={`pdf-loading__text ${dk ? 'text-slate-400' : 'text-slate-500'}`}>
                Loading document…
              </p>
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className={`pdf-error ${dk ? 'pdf-error--dark' : 'pdf-error--light'}`}>
              <div className={`pdf-error__icon-wrap ${dk ? 'pdf-error__icon-wrap--dark' : 'pdf-error__icon-wrap--light'}`}>
                <AlertTriangle size={28} strokeWidth={1.8} className={dk ? 'text-amber-400' : 'text-amber-500'} />
              </div>
              <h3 className={`pdf-error__title ${dk ? 'text-white' : 'text-slate-900'}`}>
                Unable to load document
              </h3>
              <p className={`pdf-error__desc ${dk ? 'text-slate-400' : 'text-slate-500'}`}>
                The file couldn't be displayed inline. Try opening it in a new tab.
              </p>
              <div className="pdf-error__actions">
                <button
                  onClick={() => window.open(fileUrl, '_blank')}
                  className="pdf-btn pdf-btn--primary"
                >
                  <ExternalLink size={15} strokeWidth={2.2} />
                  Open in browser
                </button>
                <button
                  onClick={handleRetry}
                  className={`pdf-btn pdf-btn--icon ${dk ? 'pdf-btn--icon-dark' : 'pdf-btn--icon-light'} gap-1.5`}
                >
                  <RotateCcw size={14} strokeWidth={2.2} />
                  <span className="text-sm font-medium">Retry</span>
                </button>
              </div>
            </div>
          )}

          {/* Render image preview directly */}
          {fileType === 'image' && (
            <div className="w-full h-full flex items-center justify-center p-4 md:p-8 bg-slate-950/5 dark:bg-slate-950/20 overflow-auto">
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg border border-slate-200/10"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setError(true);
                }}
              />
            </div>
          )}

          {/* Render PDF or Office Document / Web pages inside iframe */}
          {fileType !== 'image' && (
            <iframe
              key={viewerKey}
              src={finalUrl}
              title={fileName}
              className="pdf-iframe"
              allow="fullscreen"
              loading="eager"
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={() => setIsLoading(false)}
              onError={() => { setIsLoading(false); setError(true); }}
            />
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────── */}
        <footer className={`pdf-footer ${dk ? 'pdf-footer--dark' : 'pdf-footer--light'}`}>
          <span className={`pdf-footer__name ${dk ? 'text-slate-400' : 'text-slate-500'}`}>
            {fileName}
            {fileSize && <span className="pdf-footer__sep">·</span>}
            {fileSize && <span>{fileSize}</span>}
          </span>
          <button
            onClick={() => window.open(fileUrl, '_blank')}
            className={`pdf-footer__open ${dk ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
          >
            <ExternalLink size={12} strokeWidth={2.2} />
            Open in browser
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PDFViewer;

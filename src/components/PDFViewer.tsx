import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Maximize2, Minimize2 } from 'lucide-react';

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  onClose: () => void;
  isOpen: boolean;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ fileUrl, fileName, onClose, isOpen }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(false);
      // Reset fullscreen when opening new file
      setIsFullscreen(false);
      
      // Enhanced mobile viewport and body style management
      if (typeof window !== 'undefined') {
        // Add mobile-specific class for CSS-based styling
        document.body.classList.add('mobile-pdf-viewer-open');
        
        // Prevent body scroll and mobile issues
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.height = '100%';
        document.body.style.width = '100%';
        document.body.style.touchAction = 'none';
        
        // Add mobile viewport meta to prevent zoom issues
        let viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
          viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
      }

      return () => {
        // Enhanced cleanup - remove CSS class and reset styles
        document.body.classList.remove('mobile-pdf-viewer-open');
        document.body.style.cssText = '';
        
        // Reset viewport
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
          viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0');
        }
        
        // Force a repaint to fix any layout issues
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 100);
      };
    }
  }, [isOpen, fileUrl]);

  const handleClose = () => {
    // Enhanced mobile cleanup with viewport restoration
    if (typeof window !== 'undefined') {
      // Reset body styles completely
      document.body.style.cssText = '';
      document.body.classList.remove('overflow-hidden', 'mobile-pdf-viewer-open');
      
      // Add layout fix class for mobile
      if (window.innerWidth <= 768) {
        document.body.classList.add('layout-fix');
        document.documentElement.classList.add('layout-fix');
        
        // Remove after layout stabilizes
        setTimeout(() => {
          document.body.classList.remove('layout-fix');
          document.documentElement.classList.remove('layout-fix');
        }, 500);
      }
      
      // Force mobile viewport reset
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        // Force re-render by temporarily changing viewport
        setTimeout(() => {
          viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0');
        }, 100);
      }
      
      // Additional mobile layout fixes
      document.documentElement.style.cssText = '';
      
      // Force layout recalculation on mobile
      if (window.innerWidth <= 768) {
        window.scrollTo(0, 0);
        document.body.offsetHeight; // Force reflow
        
        // Force main content reflow
        const mainContent = document.querySelector('.main-content, main, #root > div');
        if (mainContent) {
          mainContent.classList.add('main-content');
        }
      }
    }
    
    onClose();
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setError(true);
    setIsLoading(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const openInNewTab = () => {
    const viewUrl = fileUrl.replace('/preview', '/view');
    window.open(viewUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleBackdropClick}
    >
      <div 
        className={`bg-white rounded-lg shadow-2xl transition-all duration-300 transform flex flex-col ${
          isFullscreen 
            ? 'w-full h-full rounded-none' 
            : 'w-[95vw] h-[95vh] max-w-6xl max-h-[95vh] sm:w-[90vw] sm:h-[90vh]'
        } ${isOpen ? 'scale-100' : 'scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Enhanced Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg flex-shrink-0">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
                {fileName}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">PDF Preview</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            
            {/* Open in Google Drive */}
            <button
              onClick={openInNewTab}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              title="Open in Google Drive"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Drive</span>
            </button>
            
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative bg-gray-50 rounded-b-lg overflow-hidden">
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="flex flex-col items-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                <p className="text-sm text-gray-600">Loading PDF...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="text-center space-y-3 p-6">
                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <X className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Unable to load PDF</h3>
                <p className="text-sm text-gray-600 max-w-sm">
                  The document couldn't be loaded. Try opening it in Google Drive.
                </p>
                <button
                  onClick={openInNewTab}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Open in Google Drive
                </button>
              </div>
            </div>
          )}

          {/* Enhanced Iframe */}
          <iframe
            src={fileUrl}
            className="w-full h-full border-0 bg-white"
            title={fileName}
            allow="autoplay; clipboard-read; clipboard-write"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            sandbox="allow-same-origin allow-scripts allow-forms allow-downloads"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            style={{
              minHeight: '400px',
              WebkitOverflowScrolling: 'touch',
              transform: 'translateZ(0)',
              isolation: 'isolate',
            }}
          />

          {/* Mobile Close Button */}
          <button
            onClick={handleClose}
            className="absolute bottom-4 right-4 sm:hidden w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center z-20 transition-all duration-200"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
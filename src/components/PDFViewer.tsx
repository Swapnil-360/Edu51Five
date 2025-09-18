import React, { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import './PDFViewer.css';

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  onClose: () => void;
  isOpen: boolean;
}

// Utility to detect mobile
const isMobileDevice = () => {
  return /android|iPad|iPhone|iPod|blackberry|iemobile|opera mini/i.test(navigator.userAgent) || window.innerWidth <= 768 || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
};

// Calculate optimal dimensions based on screen size and aspect ratio
const getOptimalDimensions = (isFullscreen: boolean, isMobile: boolean) => {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  if (isFullscreen) {
    return {
      width: '100%',
      height: '100%',
      maxWidth: '100vw',
      maxHeight: '100vh',
    };
  }
  
  if (isMobile) {
    // Mobile: Optimize for centered viewport positioning
    const optimalWidth = Math.min(screenWidth * 0.95, 500);
    const optimalHeight = Math.min(screenHeight * 0.82, 650); // Slightly reduced for better centering
    return {
      width: `${optimalWidth}px`,
      height: `${optimalHeight}px`,
      maxWidth: '95vw',
      maxHeight: '82vh', // Reduced from 85vh for better viewport centering
    };
  } else {
    // Desktop: Optimize for productivity
    const optimalWidth = Math.min(screenWidth * 0.8, 1000);
    const optimalHeight = Math.min(screenHeight * 0.9, 800);
    return {
      width: `${optimalWidth}px`,
      height: `${optimalHeight}px`,
      maxWidth: '80vw',
      maxHeight: '90vh',
    };
  }
};

const PDFViewer: React.FC<PDFViewerProps> = ({ fileUrl, fileName, onClose, isOpen }) => {
  const [viewerKey, setViewerKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dimensions, setDimensions] = useState({ width: '800px', height: '600px', maxWidth: '80vw', maxHeight: '90vh' });

  // Update dimensions on resize or fullscreen change
  useEffect(() => {
    const updateDimensions = () => {
      const mobile = isMobileDevice();
      setIsMobile(mobile);
      setDimensions(getOptimalDimensions(isFullscreen, mobile));
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    window.addEventListener('orientationchange', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('orientationchange', updateDimensions);
    };
  }, [isFullscreen]);

  // Body scroll lock and viewport positioning
  useEffect(() => {
    if (isOpen) {
      // Get current scroll position before locking
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      // Store original styles to restore later
      const originalBodyStyle = {
        overflow: document.body.style.overflow,
        position: document.body.style.position,
        top: document.body.style.top,
        left: document.body.style.left,
        right: document.body.style.right,
        width: document.body.style.width,
        height: document.body.style.height,
      };
      
      const originalHtmlStyle = {
        overflow: document.documentElement.style.overflow,
      };
      
      // Lock body scroll and ensure modal is positioned relative to viewport
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = `-${scrollX}px`;
      document.body.style.right = '0';
      document.body.style.width = '100vw';
      document.body.style.height = '100vh';
      
      // Lock document overflow to prevent any scrolling
      document.documentElement.style.overflow = 'hidden';
      
      // Ensure viewport meta tag is properly set for mobile
      let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
      const originalViewportContent = viewportMeta?.content;
      if (viewportMeta) {
        viewportMeta.content = 'width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover';
      }
      
      return () => {
        // Restore original body styles
        Object.keys(originalBodyStyle).forEach(key => {
          document.body.style[key as any] = originalBodyStyle[key as keyof typeof originalBodyStyle] || '';
        });
        
        // Restore original html styles
        document.documentElement.style.overflow = originalHtmlStyle.overflow || '';
        
        // Restore viewport meta tag
        if (viewportMeta && originalViewportContent) {
          viewportMeta.content = originalViewportContent;
        }
        
        // Restore scroll position
        window.scrollTo(scrollX, scrollY);
      };
    }
  }, [isOpen]);

  // Reset viewerKey and loading state on file change
  useEffect(() => {
    if (isOpen && fileUrl) {
      setViewerKey(Date.now() + Math.random());
      setIsLoading(true);
      setError(false);
      // Remove any lingering iframes (for mobile)
      if (isMobile) {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
          iframe.src = 'about:blank';
          setTimeout(() => iframe.remove(), 100);
        });
      }
    }
  }, [fileUrl, isOpen, isMobile]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      setViewerKey(0);
      setIsLoading(true);
      setError(false);
      // Remove any lingering iframes
      if (isMobile) {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
          iframe.src = 'about:blank';
          setTimeout(() => iframe.remove(), 100);
        });
      }
    }
  }, [isOpen, isMobile]);

  if (!isOpen) return null;

  return (
    <div 
      className="pdf-modal-overlay bg-gradient-to-br from-black/95 via-black/90 to-slate-900/95 backdrop-blur-md overflow-hidden"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '8px' : '24px',
        zIndex: 9999,
        // Force hardware acceleration and perfect centering
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        willChange: 'transform',
        // Ensure consistent viewport behavior across devices
        contain: 'layout style paint',
        // Remove any potential scroll effects
        overscrollBehavior: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div 
        className={`pdf-modal-content bg-white shadow-2xl flex flex-col relative transition-all duration-500 ease-out ${
          isFullscreen 
            ? 'w-full h-full rounded-none' 
            : 'rounded-2xl border border-slate-200/20'
        }`}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          maxWidth: isFullscreen ? '100vw' : (isMobile ? '95vw' : '80vw'),
          maxHeight: isFullscreen ? '100vh' : (isMobile ? '82vh' : '90vh'),
          minHeight: isMobile ? '70vh' : '500px',
          minWidth: isMobile ? '90vw' : '600px',
          boxShadow: isFullscreen 
            ? 'none' 
            : '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          // Ensure perfect centering
          margin: 'auto',
          position: 'relative',
          // Force center alignment in flex container
          alignSelf: 'center',
          justifySelf: 'center',
          // Remove any transforms that could affect positioning
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          // Ensure consistent behavior across browsers
          contain: 'layout style',
        }}
      >
        {/* Professional Header with Enhanced Design */}
        <div className={`flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-200/60 ${
          isFullscreen ? 'px-6 py-4' : 'px-5 py-4'
        } ${!isFullscreen ? 'rounded-t-2xl' : ''}`}
        style={{
          background: isFullscreen 
            ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #f8fafc 100%)' 
            : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #ffffff 100%)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        }}>
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            {/* Enhanced PDF Icon */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-red-500/20">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
              </div>
            </div>
            {/* Enhanced Title Section */}
            <div className="min-w-0 flex-1">
              <h3 className={`font-bold text-slate-800 truncate leading-tight ${
                isFullscreen ? 'text-xl' : 'text-lg sm:text-xl'
              }`} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                {fileName}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-sm text-slate-500 font-medium">
                  {isFullscreen ? '🖥️ Fullscreen Mode' : '📱 Preview Mode'}
                </p>
                {!isFullscreen && (
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    • Click maximize for fullscreen experience
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Enhanced Control Buttons */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* Fullscreen Toggle with Enhanced Design */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all duration-200 hover:shadow-md hover:scale-105"
              title={isFullscreen ? "Exit fullscreen (ESC)" : "Enter fullscreen (F11)"}
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
              }}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            
            {/* Enhanced Open in New Tab */}
            <button
              onClick={() => window.open(fileUrl, '_blank')}
              className="hidden sm:flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 hover:shadow-lg hover:scale-105"
              title="Open in new browser tab"
              style={{
                boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.35)',
              }}
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden md:inline">Open</span>
            </button>
            
            {/* Enhanced Close Button */}
            <button
              onClick={onClose}
              className="p-3 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:shadow-md hover:scale-105"
              title="Close (ESC)"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Enhanced Content Area with Premium Design */}
        <div className={`flex-1 relative overflow-hidden ${
          !isFullscreen ? 'rounded-b-2xl' : ''
        }`}
        style={{
          background: isFullscreen 
            ? 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)' 
            : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        }}>
          {/* Premium Loading State */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="flex flex-col items-center space-y-6 p-8">
                {/* Enhanced Loading Animation */}
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-slate-200 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-2 w-12 h-12 border-2 border-blue-300 border-b-transparent rounded-full animate-spin-reverse"></div>
                </div>
                {/* Enhanced Loading Text */}
                <div className="text-center">
                  <h4 className="text-xl font-bold text-slate-800 mb-2">Loading PDF Document</h4>
                  <p className="text-sm text-slate-600 max-w-sm">
                    Please wait while we prepare your document for optimal viewing experience
                  </p>
                  <div className="mt-3 flex items-center justify-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced PDF Container with Perfect Fit */}
          <div className="w-full h-full p-1" style={{
            background: isFullscreen ? 'transparent' : 'linear-gradient(145deg, #f8fafc, #ffffff)',
          }}>
            <iframe
              key={viewerKey}
              src={fileUrl}
              title={fileName}
              className={`w-full h-full border-0 transition-all duration-300 ${
                !isFullscreen ? 'rounded-xl shadow-inner' : ''
              }`}
              allow="autoplay; clipboard-read; clipboard-write; fullscreen"
              loading="eager"
              referrerPolicy="no-referrer-when-downgrade"
              sandbox="allow-same-origin allow-scripts allow-forms allow-downloads allow-popups allow-popups-to-escape-sandbox allow-presentation"
              onLoad={() => setIsLoading(false)}
              onError={() => setError(true)}
              style={{ 
                width: '100%',
                height: '100%',
                border: 'none',
                background: '#ffffff',
                display: 'block',
                borderRadius: isFullscreen ? '0px' : '12px',
                boxShadow: isFullscreen 
                  ? 'none' 
                  : 'inset 0 2px 8px 0 rgba(0, 0, 0, 0.08), inset 0 1px 4px 0 rgba(0, 0, 0, 0.05)',
              }}
            />
          </div>

          {/* Premium Error State with Enhanced Design */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-30 p-8"
              style={{
                background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
            >
              <div className="text-center max-w-md">
                {/* Enhanced Error Icon */}
                <div className="w-20 h-20 mx-auto mb-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-red-200 rounded-full opacity-80"></div>
                  <div className="relative w-full h-full bg-gradient-to-br from-red-50 to-red-100 rounded-full flex items-center justify-center shadow-lg ring-4 ring-red-100/50">
                    <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    </svg>
                  </div>
                </div>
                
                {/* Enhanced Error Content */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-slate-800 mb-3" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                    Unable to Load PDF Document
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-base">
                    The document couldn't be loaded. This might be due to network issues, browser restrictions, or file access permissions.
                  </p>
                </div>
                
                {/* Enhanced Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => window.open(fileUrl, '_blank')}
                    className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
                  >
                    🔗 Open in New Tab
                  </button>
                  <button
                    onClick={onClose}
                    className="px-8 py-3.5 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-xl hover:from-slate-200 hover:to-slate-300 transition-all duration-200 font-semibold shadow-md hover:shadow-lg hover:scale-105 border border-slate-300"
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
                  >
                    ✖️ Close
                  </button>
                </div>
                
                {/* Enhanced Help Text */}
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
                  <p className="text-sm text-blue-700 leading-relaxed">
                    💡 <strong>Tip:</strong> If the PDF still won't load, try opening it in a new tab or downloading it directly to your device.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
import React from 'react';
import { Search, Menu, X } from 'lucide-react';

interface HeaderProps {
  isAdmin: boolean;
  onAdminLogout?: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  onToggleMenu: () => void;
  isMenuOpen: boolean;
  websiteName?: string;
}

export function Header({ 
  isAdmin, 
  onAdminLogout, 
  onSearch, 
  searchQuery, 
  onToggleMenu, 
  isMenuOpen,
  websiteName = "Edu51Five"
}: HeaderProps) {
  return (
    <header className="header-professional bg-gradient-to-r from-gray-900 via-slate-900 to-gray-900 text-white shadow-2xl border-b border-gray-700/40 sticky top-0 z-50">
      <div className="mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="flex items-center justify-between h-20 sm:h-20 md:h-22 lg:h-24 xl:h-26">
          {/* Logo and Brand - Fresh Modern Design */}
          <div className="flex items-center space-x-4 sm:space-x-5 flex-shrink-0">
            {/* Circular Logo with Rotating Ring */}
            <div className="relative group">
              {/* Rotating gradient ring */}
              <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 opacity-70 group-hover:opacity-100 blur-lg transition-all duration-700" style={{ animation: 'spin-slow 8s linear infinite' }}></div>
              
              {/* Logo container */}
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-white via-blue-50 to-cyan-50 p-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] border-2 border-white/70 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                <img 
                  src="/Edu_51_Logo.png" 
                  alt="Edu51Five Logo" 
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </div>
            </div>
            
            {/* Vertical separator line */}
            <div className="h-14 sm:h-16 md:h-18 w-0.5 bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent"></div>
            
            {/* Brand Name - Modern Typography */}
            <div className="flex flex-col justify-center -space-y-0.5">
              {/* Main Title */}
              <div className="flex items-baseline leading-none">
                <h1 className="tracking-tight" style={{ fontFamily: "'Orbitron', 'Rajdhani', 'Poppins', sans-serif" }}>
                  {/* EDU - White */}
                  <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                    EDU
                  </span>
                  
                  {/* 51 - SUPER BRIGHT SOLID COLOR */}
                  <span className="relative inline-block mx-1">
                    {/* Massive glow effect */}
                    <span className="absolute -inset-4 bg-yellow-400 blur-3xl opacity-100"></span>
                    <span className="absolute -inset-3 bg-orange-500 blur-2xl opacity-100"></span>
                    <span className="absolute -inset-2 bg-red-500 blur-xl opacity-90"></span>
                    
                    {/* Main 51 - SOLID BRIGHT ORANGE */}
                    <span className="relative text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-orange-400" style={{ 
                      filter: 'brightness(2) saturate(2) drop-shadow(0 0 60px rgba(251,146,60,1)) drop-shadow(0 0 40px rgba(251,191,36,1)) drop-shadow(0 0 20px rgba(239,68,68,1))',
                      textShadow: '0 0 80px rgba(251,146,60,1), 0 0 50px rgba(251,191,36,1), 0 0 30px rgba(239,68,68,0.8)'
                    }}>
                      51
                    </span>
                  </span>
                  
                  {/* FIVE - White */}
                  <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                    FIVE
                  </span>
                </h1>
              </div>
              
              {/* Subtitle */}
              <div className="flex items-center space-x-2 mt-1 pl-0.5">
                {/* Animated dots */}
                <div className="flex items-center space-x-1">
                  <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0s' }}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0.15s' }}></div>
                  <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                </div>
                
                <span className="text-[10px] sm:text-xs md:text-sm font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent uppercase tracking-[0.15em]">
                  Intake 51
                </span>
                
                <div className="px-1.5 py-0.5 bg-green-500/20 border border-green-400/40 rounded text-[8px] sm:text-[9px] font-bold text-green-300 uppercase">
                  Live
                </div>
              </div>
            </div>
          </div>
          
          {/* Desktop Search */}
          <div className="hidden md:flex items-center space-x-5 xl:space-x-6 flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300 h-5 w-5 transition-colors duration-200" />
              <input
                type="text"
                placeholder="Search courses or materials..."
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 hover:bg-white/15"
              />
            </div>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-5 lg:space-x-6 xl:space-x-7">
            {/* Admin Status Indicator */}
            {isAdmin && (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-green-500/20 border border-green-400/30 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-200">Admin</span>
              </div>
            )}
            
            {/* Admin Logout Button */}
            {isAdmin && onAdminLogout && (
              <button
                onClick={onAdminLogout}
                className="hidden sm:flex items-center px-4 py-2 rounded-xl font-medium bg-red-500/90 text-white hover:bg-red-600 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-red-500/25"
              >
                Admin Logout
              </button>
            )}
            
            {/* Mobile Menu Button */}
            <button
              onClick={onToggleMenu}
              className="md:hidden p-2.5 rounded-xl hover:bg-white/10 transition-all duration-200 hover:scale-105 border border-transparent hover:border-white/20"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 transition-transform duration-200" />
              ) : (
                <Menu className="h-6 w-6 transition-transform duration-200" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Search Bar */}
        <div className="md:hidden pb-4 pt-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300 h-5 w-5" />
            <input
              type="text"
              placeholder="Search courses or materials..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
            />
          </div>
        </div>
        
        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-blue-900/95 backdrop-blur-lg border-t border-blue-700/30 shadow-2xl">
            <div className="p-4 space-y-3">
              {isAdmin && (
                <>
                  <div className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-400/30 rounded-xl">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-200">Admin Mode Active</span>
                  </div>
                  {onAdminLogout && (
                    <button
                      onClick={onAdminLogout}
                      className="w-full px-4 py-3 rounded-xl font-medium bg-red-500/90 text-white hover:bg-red-600 transition-all duration-200 shadow-lg"
                    >
                      Admin Logout
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
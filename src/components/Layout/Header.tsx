import React from 'react';
import { Search, Menu, X, GraduationCap } from 'lucide-react';

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
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-5 flex-shrink-0">
            <div className="relative">
              <img 
                src="/Edu_51_Logo.png" 
                alt="Edu51Five Logo" 
                className="h-12 w-12 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 xl:h-18 xl:w-18 object-contain no-select rounded-xl shadow-lg bg-white p-2 border-2 border-slate-300"
              />
            </div>
            <div>
              <h1 className="text-base md:text-xl lg:text-2xl font-bold no-select text-white">
                Edu<span className="text-red-400">51</span>Five
              </h1>
              <p className="text-xs md:text-sm text-gray-300 no-select">BUBT Intake 51</p>
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
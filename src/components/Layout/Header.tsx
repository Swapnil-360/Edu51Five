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
    <header className="header-professional bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white shadow-xl border-b border-blue-700/30 sticky top-0 z-50">
      <div className="responsive-container">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="relative">
              <img 
                src="/Edu_51_Logo.png" 
                alt="Edu51Five Logo" 
                className="h-10 w-10 lg:h-12 lg:w-12 object-contain logo-enhanced modern-icon transition-transform duration-300 hover:scale-110"
              />
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                {websiteName}
              </h1>
              <p className="text-xs lg:text-sm text-blue-200 font-medium">BUBT Intake 51</p>
            </div>
          </div>
          
          {/* Desktop Search */}
          <div className="hidden md:flex items-center space-x-4 flex-1 max-w-lg mx-8">
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
          <div className="flex items-center space-x-2 lg:space-x-4">
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
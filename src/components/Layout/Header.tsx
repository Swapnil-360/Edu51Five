import React from "react";
import { Search, Menu, X } from "lucide-react";

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
  websiteName = "Edu51Five",
}: HeaderProps) {
  return (
    <header className="header-professional bg-gradient-to-r from-gray-900 via-slate-900 to-gray-900 text-white shadow-2xl border-b border-gray-700/40 sticky top-0 z-50">
      <div className="mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="flex items-center justify-between h-20 sm:h-20 md:h-24 lg:h-24 xl:h-28">
          {/* Left: Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={onToggleMenu}
              className="p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 transition-transform duration-200" />
              ) : (
                <Menu className="h-6 w-6 transition-transform duration-200" />
              )}
            </button>
          </div>

          {/* Center: Logo and Brand */}
          <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0">
            {/* Professional Logo - Clean Minimal Style */}
            <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16">
              <img
                src="/Edu_51_Logo.png"
                alt="Edu51Five Logo"
                className="w-full h-full object-contain block"
                width="64"
                height="64"
                decoding="async"
              />
            </div>

            {/* Vertical separator line */}
            <div className="h-12 sm:h-14 md:h-16 w-0.5 bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent"></div>

            {/* Brand Name - Modern Typography */}
            <div className="flex flex-col justify-center -space-y-1">
              {/* Main Title */}
              <div className="flex items-baseline leading-tight">
                <h1
                  className="tracking-tight"
                  style={{
                    fontFamily: "'Orbitron', 'Rajdhani', 'Poppins', sans-serif",
                  }}
                >
                  {/* EDU - White */}
                  <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-white">
                    EDU
                  </span>

                  {/* 51 - Orange */}
                  <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-orange-400 mx-0.5">
                    51
                  </span>

                  {/* FIVE - White */}
                  <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-white">
                    FIVE
                  </span>
                </h1>
              </div>

              {/* Subtitle */}
              <span className="text-xs sm:text-sm font-semibold text-gray-300">
                Intake 51
              </span>
            </div>
          </div>

          {/* Right: Desktop Search + Admin Controls + Mobile Notification */}
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
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
            {/* Admin Status Indicator */}
            {isAdmin && (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-green-500/20 border border-green-400/30 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-200">
                  Admin
                </span>
              </div>
            )}

            {/* Admin Logout Button */}
            {isAdmin && onAdminLogout && (
              <button
                onClick={onAdminLogout}
                className="hidden sm:flex items-center px-4 py-2 rounded-xl font-medium bg-red-600 text-white hover:bg-red-700 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-red-600/25"
              >
                Admin Logout
              </button>
            )}
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
                    <span className="text-sm font-medium text-green-200">
                      Admin Mode Active
                    </span>
                  </div>
                  {onAdminLogout && (
                    <button
                      onClick={onAdminLogout}
                      className="w-full px-4 py-3 rounded-xl font-medium bg-red-600 text-white hover:bg-red-700 transition-all duration-200 shadow-lg"
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

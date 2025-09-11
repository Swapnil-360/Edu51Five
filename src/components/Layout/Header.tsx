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
  websiteName = "BUBT Learning"
}: HeaderProps) {
  return (
    <header className="bg-blue-900 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <img 
              src="/image.png" 
              alt="Logo" 
              className="h-10 w-10 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold">{websiteName}</h1>
              <p className="text-sm text-blue-200">Intake 51</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4 flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search courses or materials..."
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Only show admin controls if user is admin */}
            {isAdmin && onAdminLogout && (
              <button
                onClick={onAdminLogout}
                className="px-4 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Admin Logout
              </button>
            )}
            
            <button
              onClick={onToggleMenu}
              className="md:hidden p-2 rounded-lg hover:bg-blue-800 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile search */}
        <div className="md:hidden pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search courses or materials..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
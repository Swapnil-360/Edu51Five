import React, { useState } from 'react';
import { Header } from './components/Layout/Header';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleToggleAdmin = () => {
    setIsAdmin(!isAdmin);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        isAdmin={isAdmin}
        onToggleAdmin={handleToggleAdmin}
        onSearch={handleSearch}
        searchQuery={searchQuery}
        onToggleMenu={() => setIsMenuOpen(!isMenuOpen)}
        isMenuOpen={isMenuOpen}
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-blue-600 mb-4">
            BUBT 51 Intake Learning Website
          </h1>
          <p className="text-gray-700">
            Header loaded successfully! ✅
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Admin Mode: {isAdmin ? 'ON' : 'OFF'}
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;

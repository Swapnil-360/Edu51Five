import React from 'react';
import { Users, Calendar, BookOpen } from 'lucide-react';

interface IntakeViewProps {
  onSelectSection: (sectionId: string, sectionName: string) => void;
}

export function IntakeView({ onSelectSection }: IntakeViewProps) {
  // Mock data for sections
  const sections = [
    { id: '1', name: 'Section 1', courseCount: 8, description: 'Computer Science & Engineering', accessible: false },
    { id: '2', name: 'Section 2', courseCount: 7, description: 'Business Administration', accessible: false },
    { id: '3', name: 'Section 3', courseCount: 9, description: 'Electrical & Electronics Engineering', accessible: false },
    { id: '4', name: 'Section 4', courseCount: 6, description: 'Economics', accessible: false },
    { id: '5', name: 'Section 5', courseCount: 5, description: 'Dept. of CSE', accessible: true },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Intake 51</h2>
        <p className="text-gray-600">Select your section to access course materials</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <div
            key={section.id}
            onClick={() => section.accessible && onSelectSection(section.id, section.name)}
            className={`bg-white rounded-xl shadow-md transition-all duration-300 border group ${
              section.accessible 
                ? 'hover:shadow-lg cursor-pointer hover:border-blue-300' 
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-full transition-colors ${
                  section.accessible 
                    ? 'bg-blue-100 group-hover:bg-blue-200' 
                    : 'bg-gray-100'
                }`}>
                  <Users className={`h-6 w-6 ${
                    section.accessible ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                </div>
                <div className="text-right">
                  <div className={`flex items-center text-sm ${
                    section.accessible ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    <BookOpen className="h-4 w-4 mr-1" />
                    {section.courseCount} courses
                  </div>
                </div>
              </div>
              
              <h3 className={`text-xl font-semibold mb-2 transition-colors ${
                section.accessible 
                  ? 'text-gray-900 group-hover:text-blue-600' 
                  : 'text-gray-500'
              }`}>
                {section.name}
              </h3>
              <p className={`text-sm mb-4 ${
                section.accessible ? 'text-gray-600' : 'text-gray-400'
              }`}>
                {section.description}
              </p>
              
              {!section.accessible && (
                <div className="bg-gray-100 px-3 py-1 rounded-full mb-4">
                  <span className="text-xs text-gray-500 font-medium">Coming Soon</span>
                </div>
              )}
              
              <div className={`flex items-center text-sm ${
                section.accessible ? 'text-gray-500' : 'text-gray-400'
              }`}>
                <Calendar className="h-4 w-4 mr-1" />
                Fall 2025
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
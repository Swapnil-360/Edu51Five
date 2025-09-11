import React, { useState } from 'react';
import { FileText, Play, Download, Eye, Calendar, Tag } from 'lucide-react';
import { useMaterials } from '../../hooks/useMaterials';

interface CourseViewProps {
  courseId: string;
  courseName: string;
  courseCode: string;
}

export function CourseView({ courseId, courseName, courseCode }: CourseViewProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const { materials } = useMaterials(courseId);

  const tabs = [
    { id: 'all', label: 'All Materials', count: materials.length },
    { id: 'pdf', label: 'Notes', count: materials.filter(m => m.type === 'pdf' || m.type === 'doc').length },
    { id: 'video', label: 'Videos', count: materials.filter(m => m.type === 'video').length },
    { id: 'suggestion', label: 'Suggestions', count: materials.filter(m => m.type === 'suggestion').length },
    { id: 'past_question', label: 'Past Questions', count: materials.filter(m => m.type === 'past_question').length },
  ];

  const filteredMaterials = activeTab === 'all' 
    ? materials 
    : materials.filter(material => {
        if (activeTab === 'pdf') return material.type === 'pdf' || material.type === 'doc';
        return material.type === activeTab;
      });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="h-5 w-5" />;
      case 'pdf': 
      case 'doc': return <FileText className="h-5 w-5" />;
      case 'suggestion': return <Tag className="h-5 w-5" />;
      case 'past_question': return <FileText className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'text-red-600 bg-red-100';
      case 'pdf': return 'text-blue-600 bg-blue-100';
      case 'doc': return 'text-green-600 bg-green-100';
      case 'suggestion': return 'text-orange-600 bg-orange-100';
      case 'past_question': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <h2 className="text-3xl font-bold text-gray-900">{courseName}</h2>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {courseCode}
          </span>
        </div>
        <p className="text-gray-600">Access all course materials and resources</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border mb-8">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-teal-500 text-teal-600 bg-teal-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab.label}
              <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Materials Grid */}
      <div className="space-y-4">
        {filteredMaterials.map((material) => (
          <div
            key={material.id}
            className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <div className={`p-3 rounded-full ${getTypeColor(material.type)}`}>
                  {getTypeIcon(material.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {material.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">{material.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {material.created_at}
                    </div>
                    {material.size && (
                      <div>Size: {material.size}</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Preview Button */}
                {material.type === 'video' && material.video_url ? (
                  <a
                    href={material.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Watch Video"
                  >
                    <Eye className="h-5 w-5" />
                  </a>
                ) : material.file_url ? (
                  <a
                    href={material.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Preview File"
                  >
                    <Eye className="h-5 w-5" />
                  </a>
                ) : (
                  <button
                    className="p-2 text-gray-300 cursor-not-allowed rounded-lg"
                    title="No preview available"
                    disabled
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                )}

                {/* Download Button */}
                {material.file_url ? (
                  <a
                    href={material.file_url}
                    download
                    className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                    title="Download File"
                  >
                    <Download className="h-5 w-5" />
                  </a>
                ) : (
                  <button
                    className="p-2 text-gray-300 cursor-not-allowed rounded-lg"
                    title="No file to download"
                    disabled
                  >
                    <Download className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMaterials.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No materials found</h3>
          <p className="text-gray-600">No materials have been uploaded for this category yet.</p>
        </div>
      )}
    </div>
  );
}
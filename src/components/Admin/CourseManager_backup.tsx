import React, { useState } from 'react';
import { ArrowLeft, Plus, FileText, Video, Tag, HelpCircle, Calendar, Download, Eye, Trash2 } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { useMaterials } from '../../hooks/useMaterials';

interface CourseManagerProps {
  courseId: string;
  courseName: string;
  courseCode: string;
  onBack: () => void;
}

export function CourseManager({ courseId, courseName, courseCode, onBack }: CourseManagerProps) {
  const { materials, addMaterial, removeMaterial } = useMaterials(courseId);
  const [showUpload, setShowUpload] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');

  const handleFileUploaded = (newMaterial: any) => {
    addMaterial(newMaterial);
  };

  const handleDeleteMaterial = (materialId: string) => {
    if (confirm('Are you sure you want to delete this material?')) {
      removeMaterial(materialId);
    }
  };

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
      case 'video': return <Video className="h-5 w-5" />;
      case 'pdf': 
      case 'doc': return <FileText className="h-5 w-5" />;
      case 'suggestion': return <Tag className="h-5 w-5" />;
      case 'past_question': return <HelpCircle className="h-5 w-5" />;
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 sm:space-x-4 order-1">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white rounded-lg transition-colors border border-gray-200 flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <h2 className="text-xl sm:text-3xl font-bold text-gray-900 truncate">{courseName}</h2>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium self-start">
                  {courseCode}
                </span>
              </div>
              <p className="text-gray-600 text-sm sm:text-base mt-1">Manage course materials and resources</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowUpload(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors w-full sm:w-auto order-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Material</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{materials.length}</p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Total Materials</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-red-100 p-2 rounded-full flex-shrink-0">
                <Video className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{materials.filter(m => m.type === 'video').length}</p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Videos</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-orange-100 p-2 rounded-full flex-shrink-0">
                <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{materials.filter(m => m.type === 'suggestion').length}</p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Suggestions</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-purple-100 p-2 rounded-full flex-shrink-0">
                <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{materials.filter(m => m.type === 'past_question').length}</p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Past Questions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6 sm:mb-8">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <span className="truncate">{tab.label}</span>
                <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Materials List */}
        <div className="space-y-3 sm:space-y-4">
          {filteredMaterials.map((material) => (
            <div
              key={material.id}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-4 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                  <div className={`p-2 sm:p-3 rounded-full ${getTypeColor(material.type)} flex-shrink-0`}>
                    {getTypeIcon(material.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 break-words">
                      {material.title}
                    </h3>
                    {material.description && (
                      <p className="text-gray-600 text-sm mb-3 break-words">{material.description}</p>
                    )}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                        <span>{material.created_at}</span>
                      </div>
                      {material.size && (
                        <div>Size: {material.size}</div>
                      )}
                    </div>
                </div>
                
                <div className="flex items-center space-x-2 sm:space-x-3 justify-end sm:justify-start flex-shrink-0">
                  <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <Download className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteMaterial(material.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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

      {showUpload && (
        <FileUpload
          courseId={courseId}
          courseName={courseName}
          onFileUploaded={handleFileUploaded}
          onClose={() => setShowUpload(false)}
        />
      )}
      </div>
    </div>
  );
}
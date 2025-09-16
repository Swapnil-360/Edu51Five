import React from 'react';
import { Clock, Target, BookOpen, FileText, Presentation, Lightbulb, AlertTriangle } from 'lucide-react';
import { ExamMaterial, MaterialType, ExamType } from '../config/examMaterials';
import { getCurrentSemesterStatus } from '../config/semester';

interface ExamMaterialCardProps {
  material: ExamMaterial;
  isCurrentlyRelevant?: boolean;
  onClick?: () => void;
}

export const ExamMaterialCard: React.FC<ExamMaterialCardProps> = ({ 
  material, 
  isCurrentlyRelevant = false,
  onClick 
}) => {
  const isUrgent = material.isHighPriority && isCurrentlyRelevant;

  const getTypeIcon = (type: MaterialType) => {
    switch (type) {
      case 'ct': return <FileText className="h-4 w-4" />;
      case 'notes': return <BookOpen className="h-4 w-4" />;
      case 'slides': return <Presentation className="h-4 w-4" />;
      case 'suggestions': return <Lightbulb className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getExamTypeBadge = (examType: ExamType) => {
    switch (examType) {
      case 'midterm':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
            <Target className="h-3 w-3 mr-1" />
            Mid-term
          </span>
        );
      case 'all':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <BookOpen className="h-3 w-3 mr-1" />
            All Periods
          </span>
        );
      case 'regular':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            <BookOpen className="h-3 w-3 mr-1" />
            Regular
          </span>
        );
      default:
        return null;
    }
  };

  const relevanceScore = material.relevanceScore;

  return (
    <div 
      onClick={onClick}
      className={`group relative p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
        isCurrentlyRelevant 
          ? isUrgent 
            ? 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 hover:border-orange-300 shadow-lg hover:shadow-xl' 
            : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300 shadow-md hover:shadow-lg'
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
      } hover:-translate-y-1`}
    >
      {/* Priority & Relevance Indicators */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getTypeIcon(material.type)}
          <span className="font-medium text-gray-900">{material.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          {isUrgent && (
            <span className="flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 animate-pulse">
              <AlertTriangle className="h-3 w-3 mr-1" />
              URGENT
            </span>
          )}
          {relevanceScore >= 90 && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              {relevanceScore}% Match
            </span>
          )}
        </div>
      </div>

      {/* Exam Type Badge */}
      <div className="flex items-center justify-between mb-2">
        {getExamTypeBadge(material.examType)}
        <span className="text-xs text-gray-500">
          {new Date(material.uploadDate).toLocaleDateString('en-BD', {
            month: 'short',
            day: 'numeric'
          })}
        </span>
      </div>

      {/* Description */}
      {material.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {material.description}
        </p>
      )}

      {/* Topics */}
      {material.topics && material.topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {material.topics.slice(0, 3).map((topic: string, index: number) => (
            <span 
              key={index}
              className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
            >
              {topic}
            </span>
          ))}
          {material.topics.length > 3 && (
            <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-500">
              +{material.topics.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Current Exam Relevance */}
      {isCurrentlyRelevant && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3 text-green-600" />
            <span className="text-xs text-green-600 font-medium">
              Relevant for current exam period
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              relevanceScore >= 90 ? 'bg-green-500' :
              relevanceScore >= 70 ? 'bg-yellow-500' :
              'bg-gray-400'
            }`}></div>
          </div>
        </div>
      )}

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-300"></div>
    </div>
  );
};

// Exam Period Status Banner
export const ExamPeriodBanner: React.FC = () => {
  const semesterStatus = getCurrentSemesterStatus();
  
  if (semesterStatus.currentPhase === 'Mid-term Examinations') {
    return (
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-xl mb-6 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white bg-opacity-20 rounded-lg">
            <Target className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-lg">🔥 Mid-term Examinations Active!</h3>
            <p className="text-orange-100">
              Showing materials optimized for current Mid-term period. 
              <strong> {semesterStatus.daysToMilestone} days</strong> until semester ends.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show a general study banner during non-exam periods
  return (
    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4 rounded-xl mb-6 shadow-lg">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-white bg-opacity-20 rounded-lg">
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-bold text-lg">📚 Study Materials Available</h3>
          <p className="text-blue-100">
            Browse all available materials organized by course and type.
          </p>
        </div>
      </div>
    </div>
  );
};
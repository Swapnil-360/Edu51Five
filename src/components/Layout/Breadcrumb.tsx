import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="bg-gray-50 border-b px-4 py-3">
      <div className="container mx-auto">
        <div className="flex items-center space-x-2 text-sm">
          <Home className="h-4 w-4 text-gray-500" />
          {items.map((item, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <button
                onClick={item.onClick}
                className={`${
                  index === items.length - 1
                    ? 'text-blue-900 font-medium'
                    : 'text-gray-600 hover:text-blue-900'
                } transition-colors`}
                disabled={index === items.length - 1}
              >
                {item.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>
    </nav>
  );
}
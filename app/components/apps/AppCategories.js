"use client";

import {
  GlobeAltIcon,
  Cog6ToothIcon,
  SparklesIcon,
  UsersIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";

const AppCategories = ({ categories, selectedCategory, onCategoryChange }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map(category => {
        const IconComponent = category.icon;
        return (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
              selectedCategory === category.id
                ? "bg-primary text-primary-content border-primary"
                : "bg-base-100 text-base-content border-base-300 hover:border-primary hover:bg-primary/5"
            }`}
          >
            <IconComponent className="w-4 h-4" />
            <span className="font-medium">{category.label}</span>
            <span className={`text-sm ${
              selectedCategory === category.id ? "text-primary-content/70" : "text-base-content/50"
            }`}>
              ({category.count})
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default AppCategories;

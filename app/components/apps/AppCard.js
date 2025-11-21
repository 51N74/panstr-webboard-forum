"use client";

import {
  StarIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  ExternalLinkIcon,
  CalendarIcon,
  TagIcon,
  CogIcon,
  SparklesIcon,
  UsersIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

const AppCard = ({ app, onAction }) => {
  const getAppIcon = (type) => {
    switch (type) {
      case "app":
        return CogIcon;
      case "bot":
        return SparklesIcon;
      case "service":
        return UsersIcon;
      case "game":
        return ChartBarIcon;
      case "tool":
        return CogIcon;
      default:
        return CogIcon;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "app":
        return "badge-primary";
      case "bot":
        return "badge-secondary";
      case "service":
        return "badge-accent";
      case "game":
        return "badge-warning";
      case "tool":
        return "badge-info";
      default:
        return "badge-neutral";
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "app":
        return "Application";
      case "bot":
        return "Bot";
      case "service":
        return "Service";
      case "game":
        return "Game";
      case "tool":
        return "Tool";
      default:
        return "Unknown";
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const IconComponent = getAppIcon(app.kind || app.type);

  return (
    <div className="bg-base-100 rounded-lg border border-base-300 hover:border-primary/50 transition-all duration-200 hover:shadow-lg overflow-hidden group">
      {/* App Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          {/* App Icon and Basic Info */}
          <div className="flex items-center space-x-3">
            {app.icon ? (
              <img
                src={app.icon}
                alt={app.name}
                className="w-12 h-12 rounded-lg object-cover border border-base-300"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextElementSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-base-300"
              style={{ display: app.icon ? "none" : "flex" }}
            >
              <IconComponent className="w-6 h-6 text-primary" />
            </div>

            <div>
              <h3 className="font-semibold text-base-content group-hover:text-primary transition-colors">
                {app.name}
              </h3>
              <div className="flex items-center space-x-2">
                <span
                  className={`badge badge-xs ${getTypeColor(app.kind || app.type)}`}
                >
                  {getTypeLabel(app.kind || app.type)}
                </span>
                {app.lastUpdated && (
                  <span className="text-xs text-base-content/50 flex items-center">
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    {new Date(app.lastUpdated).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Rating */}
          {app.stars !== undefined && (
            <div className="flex items-center space-x-1 text-sm">
              <StarIcon className="w-4 h-4 text-warning" />
              <span className="font-medium">{app.stars}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-base-content/70 text-sm mb-4 line-clamp-3">
          {app.description || "No description available"}
        </p>

        {/* Tags */}
        {app.tags && app.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {app.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="badge badge-outline badge-xs">
                <TagIcon className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
            {app.tags.length > 3 && (
              <span className="badge badge-outline badge-xs">
                +{app.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        {(app.downloads !== undefined || app.stars !== undefined) && (
          <div className="flex items-center justify-between text-sm text-base-content/60 mb-4">
            {app.downloads !== undefined && (
              <div className="flex items-center space-x-1">
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>{formatNumber(app.downloads)} downloads</span>
              </div>
            )}
            {app.stars !== undefined && (
              <div className="flex items-center space-x-1">
                <StarIcon className="w-4 h-4" />
                <span>{formatNumber(app.stars)} stars</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="border-t border-base-300 p-4 bg-base-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {app.url && (
              <button
                onClick={() => window.open(app.url, "_blank")}
                className="btn btn-sm btn-ghost"
                title="Visit Website"
              >
                <ExternalLinkIcon className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onAction(app.id, "share")}
              className="btn btn-sm btn-ghost"
              title="Share App"
            >
              <ShareIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onAction(app.id, "view")}
              className="btn btn-sm btn-ghost"
            >
              View Details
            </button>
            <button
              onClick={() => onAction(app.id, "install")}
              className="btn btn-sm btn-primary"
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
              Install
            </button>
          </div>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
    </div>
  );
};

export default AppCard;

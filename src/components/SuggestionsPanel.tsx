'use client';

import { Lightbulb, AlertTriangle, Info, TrendingUp, RefreshCw } from 'lucide-react';

interface Suggestion {
  type: 'savings' | 'warning' | 'tip' | 'info';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  category?: string;
}

interface SuggestionsPanelProps {
  suggestions: Suggestion[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function SuggestionsPanel({ suggestions, onRefresh, isLoading = false }: SuggestionsPanelProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'savings':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'tip':
        return <Lightbulb className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-500/10';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-500/10';
      default:
        return 'border-l-blue-500 bg-blue-500/10';
    }
  };

  if (suggestions.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">AI Suggestions</h2>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center space-x-1 text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh suggestions"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
        <div className="text-center py-8">
          <Lightbulb className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400">No suggestions available</p>
          <p className="text-sm text-slate-500 mt-1">Add some expenses to get personalized tips!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">AI Suggestions</h2>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center space-x-1 text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh suggestions"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className={`border-l-4 p-4 rounded-r-lg ${getPriorityColor(suggestion.priority)}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(suggestion.type)}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white mb-1">
                  {suggestion.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {suggestion.message}
                </p>
                {suggestion.category && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
                      {suggestion.category.charAt(0).toUpperCase() + suggestion.category.slice(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
        <p className="text-xs text-slate-400 text-center">
          💡 Suggestions are powered by AI and based on your spending patterns
        </p>
      </div>
    </div>
  );
}

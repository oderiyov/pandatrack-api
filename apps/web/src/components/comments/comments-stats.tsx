// src/components/comments/comments-stats.tsx
'use client';

import { useState, useEffect } from 'react';

interface CommentsStatsProps {
  pageId: string;
  totalComments: number;
  className?: string;
}

interface StatsData {
  pageId: string;
  totalComments: number;
  recentComments: number;
  lastUpdated: string;
}

const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://api.pandatrack.com.ua/comments' 
  : 'http://localhost:3003';

export function CommentsStats({ pageId, totalComments, className = '' }: CommentsStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      if (!pageId) return;
      
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/comments/${pageId}/stats`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Помилка завантаження статистики коментарів:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [pageId]);

  // Використовуємо передані totalComments як fallback
  const displayTotalComments = stats?.totalComments ?? totalComments;
  const recentComments = stats?.recentComments ?? 0;

  if (!displayTotalComments && !loading) {
    return null;
  }

  return (
    <div className={`comments-stats bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Загальна кількість коментарів */}
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <div>
              <span className="text-sm font-medium text-gray-900">
                Коментарів ({displayTotalComments})
              </span>
              {loading && (
                <div className="inline-block ml-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-1 border-blue-600"></div>
                </div>
              )}
            </div>
          </div>

          {/* Активні користувачі online (статична цифра для прикладу) */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">
              {Math.max(3, Math.floor(displayTotalComments * 0.1))} онлайн
            </span>
          </div>

          {/* Нові коментарі за 24 години */}
          {recentComments > 0 && (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-green-600">
                +{recentComments} за добу
              </span>
            </div>
          )}
        </div>

        {/* Додаткова інформація */}
        <div className="text-xs text-gray-500">
          {stats?.lastUpdated && (
            <span title={new Date(stats.lastUpdated).toLocaleString('uk-UA')}>
              Оновлено {formatRelativeTime(stats.lastUpdated)}
            </span>
          )}
        </div>
      </div>

      {/* Прогрес бар активності (опціонально) */}
      {displayTotalComments > 0 && (
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600">Активність обговорення</span>
            <span className="text-xs text-gray-500">
              {getActivityLevel(displayTotalComments, recentComments)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-300 ${getActivityColor(displayTotalComments, recentComments)}`}
              style={{ width: `${Math.min(100, (recentComments / Math.max(1, displayTotalComments * 0.2)) * 100)}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Допоміжні функції
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'щойно';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} хв. тому`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} год. тому`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} дн. тому`;
  }
}

function getActivityLevel(totalComments: number, recentComments: number): string {
  const activityRatio = recentComments / Math.max(1, totalComments);
  
  if (activityRatio > 0.3) return 'Дуже активно';
  if (activityRatio > 0.1) return 'Активно';
  if (activityRatio > 0.05) return 'Помірно';
  return 'Спокійно';
}

function getActivityColor(totalComments: number, recentComments: number): string {
  const activityRatio = recentComments / Math.max(1, totalComments);
  
  if (activityRatio > 0.3) return 'bg-green-500';
  if (activityRatio > 0.1) return 'bg-blue-500';
  if (activityRatio > 0.05) return 'bg-yellow-500';
  return 'bg-gray-400';
}
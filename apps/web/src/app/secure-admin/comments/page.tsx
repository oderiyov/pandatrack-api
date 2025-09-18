// src/app/secure-admin/comments/page.tsx v2.0

'use client';

import { useState, useEffect } from 'react';

interface PendingComment {
  id: string;
  page_id: string;
  content: string;
  author_name: string;
  is_anonymous: boolean;
  spam_score: number;
  created_at: string;
  ip_hash: string;
  vote_count: number;
  comment_type: string;
}

interface AdminStats {
  pending: number;
  approvedToday: number;
  spam: number;
  flagged: number;
  topPages: Array<{ pageId: string; count: number }>;
}

type FilterType = 'ALL' | 'QUESTIONS' | 'EXPERIENCES' | 'HIGH_RISK' | 'LOW_RISK' | 'SPAM';
type SortBy = 'created_at' | 'spam_score' | 'comment_type';

const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://api.pandatrack.com.ua/comments' 
  : 'http://localhost:3003';

export default function AdminCommentsPage() {
  // Authentication
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [attempts, setAttempts] = useState(0);
  
  // Data states
  const [pendingComments, setPendingComments] = useState<PendingComment[]>([]);
  const [filteredComments, setFilteredComments] = useState<PendingComment[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string[]>([]);
  
  // UI states
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [sortBy, setSortBy] = useState<SortBy>('created_at');
  const [selectedComments, setSelectedComments] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  const correctPassword = 'PandaTrack2024Admin!';
  const maxAttempts = 3;

  // Authentication logic
  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_session');
    const savedTime = localStorage.getItem('admin_session_time');
    
    if (savedAuth && savedTime) {
      const sessionTime = parseInt(savedTime);
      const now = Date.now();
      if (now - sessionTime < 8 * 60 * 60 * 1000) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('admin_session');
        localStorage.removeItem('admin_session_time');
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadPendingComments();
      loadStats();
    }
  }, [isAuthenticated]);

  // Filtering and sorting
  useEffect(() => {
    let filtered = [...pendingComments];
    
    // Apply filters
    switch (filterType) {
      case 'QUESTIONS':
        filtered = filtered.filter(c => c.comment_type === 'QUESTION');
        break;
      case 'EXPERIENCES':
        filtered = filtered.filter(c => c.comment_type === 'EXPERIENCE');
        break;
      case 'HIGH_RISK':
        filtered = filtered.filter(c => c.spam_score > 0.5);
        break;
      case 'LOW_RISK':
        filtered = filtered.filter(c => c.spam_score <= 0.3);
        break;
      case 'SPAM':
        filtered = filtered.filter(c => c.comment_type === 'SPAM' || c.spam_score > 0.7);
        break;
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'spam_score':
          return b.spam_score - a.spam_score;
        case 'comment_type':
          return a.comment_type.localeCompare(b.comment_type);
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    
    setFilteredComments(filtered);
  }, [pendingComments, filterType, sortBy]);

  // Hotkeys
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isAuthenticated) return;
      
      if (e.ctrlKey && !e.shiftKey) {
        switch(e.key) {
          case 'a': // Ctrl+A - Select all visible
            e.preventDefault();
            setSelectedComments(filteredComments.map(c => c.id));
            break;
          case 'r': // Ctrl+R - Refresh
            e.preventDefault();
            loadPendingComments();
            break;
          case 'q': // Ctrl+Q - Quick approve questions
            e.preventDefault();
            smartBulkActions.approveSafeQuestions();
            break;
          case 's': // Ctrl+S - Reject obvious spam
            e.preventDefault();
            smartBulkActions.rejectObviousSpam();
            break;
          case 'e': // Ctrl+E - Approve experiences
            e.preventDefault();
            smartBulkActions.approveExperiences();
            break;
          case 'h': // Ctrl+H - Toggle help
            e.preventDefault();
            setShowHelp(prev => !prev);
            break;
        }
      }
      
      // Escape - Clear selection
      if (e.key === 'Escape') {
        setSelectedComments([]);
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [filteredComments, isAuthenticated]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (attempts >= maxAttempts) {
      alert('Перевищено кількість спроб. Перезавантажте сторінку.');
      return;
    }

    if (password === correctPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('admin_session', 'true');
      localStorage.setItem('admin_session_time', Date.now().toString());
      setPassword('');
      setAttempts(0);
    } else {
      setAttempts(prev => prev + 1);
      setPassword('');
      alert(`Невірний пароль. Залишилось спроб: ${maxAttempts - attempts - 1}`);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_session');
    localStorage.removeItem('admin_session_time');
    setPendingComments([]);
    setStats(null);
    setSelectedComments([]);
  };

  const loadPendingComments = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/comments/pending`, {
        headers: {
          'Authorization': `Bearer fake_token`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingComments(data.comments || []);
      }
    } catch (error) {
      console.error('Помилка завантаження коментарів:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer fake_token`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Помилка завантаження статистики:', error);
    }
  };

  const approveComment = async (commentId: string) => {
    setProcessing(prev => [...prev, commentId]);
    try {
      const response = await fetch(`${API_BASE}/api/admin/comments/${commentId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer fake_token`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        setPendingComments(prev => prev.filter(c => c.id !== commentId));
        setSelectedComments(prev => prev.filter(id => id !== commentId));
        loadStats();
      } else {
        alert('Помилка схвалення коментаря');
      }
    } catch (error) {
      alert('Помилка: ' + (error instanceof Error ? error.message : 'Невідома помилка'));
    } finally {
      setProcessing(prev => prev.filter(id => id !== commentId));
    }
  };

  const rejectComment = async (commentId: string) => {
    const reason = prompt('Причина відхилення (опціонально):');
    
    setProcessing(prev => [...prev, commentId]);
    try {
      const response = await fetch(`${API_BASE}/api/admin/comments/${commentId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer fake_token`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ reason: reason || 'Не вказано' }),
      });

      if (response.ok) {
        setPendingComments(prev => prev.filter(c => c.id !== commentId));
        setSelectedComments(prev => prev.filter(id => id !== commentId));
        loadStats();
      } else {
        alert('Помилка відхилення коментаря');
      }
    } catch (error) {
      alert('Помилка: ' + (error instanceof Error ? error.message : 'Невідома помилка'));
    } finally {
      setProcessing(prev => prev.filter(id => id !== commentId));
    }
  };

  const bulkApprove = async (commentIds: string[]) => {
    if (commentIds.length === 0) return;

    try {
      const response = await fetch(`${API_BASE}/api/admin/comments/bulk-approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer fake_token`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ commentIds }),
      });

      if (response.ok) {
        const data = await response.json();
        setPendingComments(prev => prev.filter(c => !commentIds.includes(c.id)));
        setSelectedComments([]);
        loadStats();
        alert(`Схвалено ${data.approvedCount} коментарів`);
      }
    } catch (error) {
      alert('Помилка масового схвалення');
    }
  };

  // Smart bulk actions
  const smartBulkActions = {
    approveSafeQuestions: () => {
      const safeQuestions = pendingComments.filter(c => 
        c.comment_type === 'QUESTION' && 
        c.spam_score < 0.3
      );
      
      if (safeQuestions.length === 0) {
        alert('Немає безпечних питань для схвалення');
        return;
      }
      
      if (confirm(`Схвалити ${safeQuestions.length} безпечних питань?`)) {
        bulkApprove(safeQuestions.map(c => c.id));
      }
    },
    
    rejectObviousSpam: async () => {
      const obviousSpam = pendingComments.filter(c => 
        c.comment_type === 'SPAM' || c.spam_score > 0.7
      );
      
      if (obviousSpam.length === 0) {
        alert('Немає очевидного спаму для відхилення');
        return;
      }
      
      if (confirm(`Відхилити ${obviousSpam.length} спам коментарів?`)) {
        for (const comment of obviousSpam) {
          await rejectComment(comment.id);
        }
      }
    },
    
    approveExperiences: () => {
      const experiences = pendingComments.filter(c => 
        c.comment_type === 'EXPERIENCE' && c.spam_score < 0.2
      );
      
      if (experiences.length === 0) {
        alert('Немає безпечного досвіду для схвалення');
        return;
      }
      
      if (confirm(`Схвалити ${experiences.length} коментарів з досвідом?`)) {
        bulkApprove(experiences.map(c => c.id));
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('uk-UA');
  };

  const getSpamScoreColor = (score: number) => {
    if (score < 0.3) return 'text-green-600 bg-green-50';
    if (score < 0.7) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getCommentTypeColor = (type: string) => {
    switch (type) {
      case 'QUESTION': return 'text-blue-600 bg-blue-50';
      case 'EXPERIENCE': return 'text-green-600 bg-green-50';
      case 'COMPLAINT': return 'text-orange-600 bg-orange-50';
      case 'SPAM': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getFilterCounts = () => {
    return {
      ALL: pendingComments.length,
      QUESTIONS: pendingComments.filter(c => c.comment_type === 'QUESTION').length,
      EXPERIENCES: pendingComments.filter(c => c.comment_type === 'EXPERIENCE').length,
      HIGH_RISK: pendingComments.filter(c => c.spam_score > 0.5).length,
      LOW_RISK: pendingComments.filter(c => c.spam_score <= 0.3).length,
      SPAM: pendingComments.filter(c => c.comment_type === 'SPAM' || c.spam_score > 0.7).length
    };
  };

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center mb-6">Адмін панель PandaTrack</h1>
          <form onSubmit={handlePasswordSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Пароль адміністратора
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введіть пароль"
                  disabled={attempts >= maxAttempts}
                />
              </div>
              <button
                type="submit"
                disabled={attempts >= maxAttempts}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {attempts >= maxAttempts ? 'Заблоковано' : 'Увійти'}
              </button>
              {attempts > 0 && (
                <p className="text-red-600 text-sm text-center">
                  Спроб залишилось: {maxAttempts - attempts}
                </p>
              )}
            </div>
          </form>
          <div className="mt-4 text-xs text-gray-500 text-center">
            Сесія зберігається на 8 годин
          </div>
        </div>
      </div>
    );
  }

  const filterCounts = getFilterCounts();

  // Main admin panel
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold">PandaTrack - Адмін панель</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="text-gray-600 hover:text-gray-900 px-3 py-1 rounded text-sm"
              >
                Hotkeys
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 px-3 py-1 rounded"
              >
                Вийти
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Help overlay */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Гарячі клавіші</h3>
            <div className="space-y-2 text-sm">
              <div><kbd className="bg-gray-100 px-2 py-1 rounded">Ctrl+A</kbd> - Вибрати всі видимі</div>
              <div><kbd className="bg-gray-100 px-2 py-1 rounded">Ctrl+R</kbd> - Оновити</div>
              <div><kbd className="bg-gray-100 px-2 py-1 rounded">Ctrl+Q</kbd> - Схвалити безпечні питання</div>
              <div><kbd className="bg-gray-100 px-2 py-1 rounded">Ctrl+E</kbd> - Схвалити досвід</div>
              <div><kbd className="bg-gray-100 px-2 py-1 rounded">Ctrl+S</kbd> - Відхилити спам</div>
              <div><kbd className="bg-gray-100 px-2 py-1 rounded">Esc</kbd> - Очистити вибір</div>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Зрозуміло
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">На модерації</h3>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Схвалено сьогодні</h3>
              <p className="text-2xl font-bold text-green-600">{stats.approvedToday}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Спам</h3>
              <p className="text-2xl font-bold text-red-600">{stats.spam}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Скарги</h3>
              <p className="text-2xl font-bold text-red-600">{stats.flagged}</p>
            </div>
          </div>
        )}

        {/* Filters and actions */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(filterCounts).map(([filter, count]) => (
                <button
                  key={filter}
                  onClick={() => setFilterType(filter as FilterType)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    filterType === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter === 'ALL' ? 'Всі' :
                   filter === 'QUESTIONS' ? 'Питання' :
                   filter === 'EXPERIENCES' ? 'Досвід' :
                   filter === 'HIGH_RISK' ? 'Високий ризик' :
                   filter === 'LOW_RISK' ? 'Низький ризик' :
                   'Спам'} ({count})
                </button>
              ))}
            </div>

            {/* Sort and bulk actions */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="created_at">За часом</option>
                  <option value="spam_score">За spam score</option>
                  <option value="comment_type">За типом</option>
                </select>
                
                {selectedComments.length > 0 && (
                  <span className="text-sm text-gray-600">
                    Вибрано: {selectedComments.length}
                  </span>
                )}
              </div>

              <div className="flex space-x-2">
                {selectedComments.length > 0 && (
                  <>
                    <button
                      onClick={() => bulkApprove(selectedComments)}
                      className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                    >
                      Схвалити вибрані
                    </button>
                    <button
                      onClick={() => setSelectedComments([])}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400"
                    >
                      Очистити
                    </button>
                  </>
                )}
                
                <button
                  onClick={smartBulkActions.approveSafeQuestions}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                >
                  Схвалити питання
                </button>
                <button
                  onClick={loadPendingComments}
                  className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
                >
                  Оновити
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Comments list */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium">
              Коментарі ({filteredComments.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Немає коментарів для відображення
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredComments.map((comment) => (
                <div key={comment.id} className="p-6">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedComments.includes(comment.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedComments(prev => [...prev, comment.id]);
                        } else {
                          setSelectedComments(prev => prev.filter(id => id !== comment.id));
                        }
                      }}
                      className="mt-1"
                    />
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium">
                              {comment.author_name || 'Анонім'}
                            </span>
                            <span className="text-sm text-gray-500">
                              {comment.page_id}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSpamScoreColor(comment.spam_score)}`}>
                              {(comment.spam_score * 100).toFixed(0)}%
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCommentTypeColor(comment.comment_type)}`}>
                              {comment.comment_type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {formatDate(comment.created_at)} • IP: {comment.ip_hash.substring(0, 8)}...
                          </p>
                        </div>
                      </div>

                      <div className="mb-4 bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-800 whitespace-pre-wrap text-sm">
                          {comment.content}
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => approveComment(comment.id)}
                          disabled={processing.includes(comment.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          {processing.includes(comment.id) ? 'Обробка...' : 'Схвалити'}
                        </button>
                        <button
                          onClick={() => rejectComment(comment.id)}
                          disabled={processing.includes(comment.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                        >
                          {processing.includes(comment.id) ? 'Обробка...' : 'Відхилити'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
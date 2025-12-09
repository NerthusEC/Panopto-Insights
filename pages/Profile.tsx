
import React, { useState } from 'react';
import { Award, Clock, BookOpen, Settings, Moon, Sun, Save } from 'lucide-react';
import { QuizDifficulty, UserStats } from '../types';

interface ProfileProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  stats: UserStats;
}

export const Profile: React.FC<ProfileProps> = ({ isDarkMode, toggleTheme, stats }) => {
  // Local state for preferences managed in this view
  const [defaultDifficulty, setDefaultDifficulty] = useState<QuizDifficulty>(
    () => (localStorage.getItem('quizDifficulty') as QuizDifficulty) || 'Intermediate'
  );
  const [defaultNumQuestions, setDefaultNumQuestions] = useState<number>(
    () => Number(localStorage.getItem('quizNumQuestions')) || 5
  );
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const handleDifficultyChange = (diff: QuizDifficulty) => {
    setDefaultDifficulty(diff);
    localStorage.setItem('quizDifficulty', diff);
    triggerSaveFeedback();
  };

  const handleNumQuestionsChange = (num: number) => {
    setDefaultNumQuestions(num);
    localStorage.setItem('quizNumQuestions', num.toString());
    triggerSaveFeedback();
  };

  const triggerSaveFeedback = () => {
    setShowSaveConfirm(true);
    setTimeout(() => setShowSaveConfirm(false), 2000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-accent dark:text-white">Student Profile</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card & Settings */}
        <div className="space-y-8">
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 text-center">
                <div className="w-24 h-24 bg-accent text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4 border-4 border-highlight">
                    S
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Student</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Lifelong Learner</p>
                
                <button className="w-full py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    Edit Profile
                </button>
            </div>

            {/* Preferences */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 relative">
                <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                    <Settings className="text-primary" size={20} />
                    <h3 className="font-bold text-gray-800 dark:text-white">App Preferences</h3>
                    {showSaveConfirm && (
                        <span className="ml-auto flex items-center gap-1 text-xs text-green-500 font-medium animate-in fade-in slide-in-from-right-2">
                            <Save size={12} /> Saved
                        </span>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Appearance</span>
                        </div>
                        <button 
                            onClick={toggleTheme}
                            className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${isDarkMode ? 'bg-primary' : 'bg-gray-300'}`}
                        >
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>

                    {/* Default Difficulty */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Default Quiz Level</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['Basic', 'Intermediate', 'Hard'] as QuizDifficulty[]).map((level) => (
                                <button
                                    key={level}
                                    onClick={() => handleDifficultyChange(level)}
                                    className={`py-2 px-1 rounded-lg text-xs font-medium transition-all truncate ${
                                        defaultDifficulty === level 
                                        ? 'bg-primary text-white shadow-sm' 
                                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Default Questions */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Default Question Count</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[5, 10, 15, 20].map((count) => (
                                <button
                                    key={count}
                                    onClick={() => handleNumQuestionsChange(count)}
                                    className={`py-2 rounded-lg text-xs font-medium transition-all ${
                                        defaultNumQuestions === count 
                                        ? 'bg-accent text-white shadow-sm' 
                                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {count}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Stats Grid */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Learning Analytics</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center">
                <Clock className="text-primary mb-2" size={28} />
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{(stats.studyTimeMinutes / 60).toFixed(1)}h</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">Total Study Time</span>
             </div>
             <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center">
                <Award className="text-accent dark:text-gray-200 mb-2" size={28} />
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.quizzesAced}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">Quizzes Aced</span>
             </div>
             <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center">
                <BookOpen className="text-highlight mb-2" size={28} />
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.lecturesCompleted}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">Lectures Completed</span>
             </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800">
             <h4 className="font-bold text-gray-800 dark:text-white mb-4">Achievements & History</h4>
             <div className="space-y-4">
                {stats.achievements.length > 0 ? (
                    stats.achievements.map((item, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                            <div className="text-2xl">{item.icon}</div>
                            <div className="flex-1">
                                <h5 className="font-semibold text-gray-900 dark:text-white text-sm">{item.title}</h5>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                            </div>
                            <span className="text-xs text-gray-400 dark:text-gray-500">{item.date}</span>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-500 text-center py-4">Complete quizzes to unlock achievements!</p>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

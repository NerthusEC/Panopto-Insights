import React, { useState, useEffect } from 'react';
import { NavItem, Lecture, UserStats } from './types';
import { Navigation } from './components/Navigation';
import { MobileNav } from './components/MobileNav';
import { Home } from './pages/Home';
import { Library } from './pages/Library';
import { Practice } from './pages/Practice';
import { Profile } from './pages/Profile';
import { VideoDetail } from './pages/VideoDetail';
import { MOCK_LECTURES } from './constants';

// Reset stats to zero for a fresh start
const INITIAL_STATS: UserStats = {
  studyTimeMinutes: 0,
  quizzesTaken: 0,
  totalQuizScore: 0,
  totalQuestionsAnswered: 0,
  quizzesAced: 0,
  lecturesCompleted: 0,
  achievements: []
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavItem>(NavItem.Home);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  
  // Starting with an empty array as requested
  const [lectures, setLectures] = useState<Lecture[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lectures');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return []; // No lectures initially
  });
  
  const [userStats, setUserStats] = useState<UserStats>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('userStats');
      return saved ? JSON.parse(saved) : INITIAL_STATS;
    }
    return INITIAL_STATS;
  });

  const [recentLectureIds, setRecentLectureIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recentLectureIds');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  const [practiceTargetLecture, setPracticeTargetLecture] = useState<Lecture | null>(null);

  useEffect(() => {
    localStorage.setItem('lectures', JSON.stringify(lectures));
  }, [lectures]);

  useEffect(() => {
    localStorage.setItem('userStats', JSON.stringify(userStats));
  }, [userStats]);

  useEffect(() => {
    localStorage.setItem('recentLectureIds', JSON.stringify(recentLectureIds));
  }, [recentLectureIds]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleNavigate = (tab: NavItem) => {
    setActiveTab(tab);
    setSelectedLecture(null);
    if (tab !== NavItem.Practice) {
        setPracticeTargetLecture(null);
    }
  };

  const handleLectureSelect = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    setRecentLectureIds(prev => {
      const filtered = prev.filter(id => id !== lecture.id);
      return [lecture.id, ...filtered].slice(0, 5);
    });
  };

  const handleBackFromVideo = () => {
    setSelectedLecture(null);
  };

  const handleAddLecture = (newLecture: Lecture) => {
    setLectures(prev => [newLecture, ...prev]);
  };

  const handleUpdateLecture = (id: string, updates: Partial<Lecture>) => {
    setLectures(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    if (selectedLecture && selectedLecture.id === id) {
      setSelectedLecture(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleLaunchQuiz = (lecture: Lecture) => {
      setPracticeTargetLecture(lecture);
      setSelectedLecture(null);
      setActiveTab(NavItem.Practice);
  };

  const handleQuizComplete = (score: number, totalQuestions: number, lectureTitle: string) => {
    setUserStats(prev => {
      const newStats = { ...prev };
      
      newStats.quizzesTaken += 1;
      newStats.totalQuizScore += score;
      newStats.totalQuestionsAnswered += totalQuestions;
      newStats.studyTimeMinutes += 15;
      
      if (score === totalQuestions) {
        newStats.quizzesAced += 1;
        const hasAceAchievement = newStats.achievements.some(a => a.title === 'Perfectionist');
        if (!hasAceAchievement) {
          newStats.achievements.unshift({
            title: "Perfectionist",
            desc: "Scored 100% on a quiz",
            date: "Just now",
            icon: "🏆"
          });
        }
      }

      if (newStats.quizzesTaken === 10) {
         newStats.achievements.unshift({
            title: "Quiz Master",
            desc: "Completed 10 practice sessions",
            date: "Just now",
            icon: "🧠"
          });
      }

      newStats.lecturesCompleted += 1;

      return newStats;
    });
  };

  const recentLectures = recentLectureIds
    .map(id => lectures.find(l => l.id === id))
    .filter((l): l is Lecture => !!l);

  const renderContent = () => {
    if (selectedLecture) {
      return (
        <VideoDetail 
          lecture={selectedLecture} 
          onBack={handleBackFromVideo} 
          onUpdateLecture={handleUpdateLecture}
          onLaunchQuiz={handleLaunchQuiz}
        />
      );
    }

    switch (activeTab) {
      case NavItem.Home:
        return (
          <Home 
            lectures={lectures} 
            recentLectures={recentLectures}
            onLectureSelect={handleLectureSelect} 
            stats={userStats}
          />
        );
      case NavItem.Library:
        return <Library lectures={lectures} onLectureSelect={handleLectureSelect} onAddLecture={handleAddLecture} />;
      case NavItem.Practice:
        return <Practice lectures={lectures} onQuizComplete={handleQuizComplete} initialLecture={practiceTargetLecture} />;
      case NavItem.Profile:
        return <Profile isDarkMode={isDarkMode} toggleTheme={toggleTheme} stats={userStats} />;
      default:
        return <Home lectures={lectures} recentLectures={recentLectures} onLectureSelect={handleLectureSelect} stats={userStats} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {!selectedLecture && (
        <Navigation 
          activeTab={activeTab} 
          onNavigate={handleNavigate} 
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
      )}

      <main className={`${selectedLecture ? 'w-full' : 'md:ml-64'} min-h-screen transition-all duration-300`}>
        {renderContent()}
      </main>

      {!selectedLecture && <MobileNav activeTab={activeTab} onNavigate={handleNavigate} />}
    </div>
  );
};

export default App;
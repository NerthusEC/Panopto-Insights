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

// Initial stats if nothing is in localStorage
const INITIAL_STATS: UserStats = {
  studyTimeMinutes: 125, // Starting with some mock data so it doesn't look empty
  quizzesTaken: 5,
  totalQuizScore: 42, // e.g. 42 correct answers total
  totalQuestionsAnswered: 50,
  quizzesAced: 1,
  lecturesCompleted: 8,
  achievements: [
    { title: "First Step", desc: "Completed your first lecture", date: "1 week ago", icon: "🚀" }
  ]
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavItem>(NavItem.Home);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lectures');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return MOCK_LECTURES;
  });
  
  // -- Dynamic User Data --
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
      return saved ? JSON.parse(saved) : [MOCK_LECTURES[0].id, MOCK_LECTURES[1].id];
    }
    return [MOCK_LECTURES[0].id, MOCK_LECTURES[1].id];
  });

  // -- Theme --
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  // -- Practice Target --
  const [practiceTargetLecture, setPracticeTargetLecture] = useState<Lecture | null>(null);

  // Persistence Effects
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

  // -- Handlers --

  const handleNavigate = (tab: NavItem) => {
    setActiveTab(tab);
    setSelectedLecture(null);
    if (tab !== NavItem.Practice) {
        setPracticeTargetLecture(null);
    }
  };

  const handleLectureSelect = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    // Update Recent History
    setRecentLectureIds(prev => {
      const filtered = prev.filter(id => id !== lecture.id);
      return [lecture.id, ...filtered].slice(0, 5); // Keep last 5
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
      newStats.studyTimeMinutes += 15; // Assume ~15 mins study time per quiz
      
      // Check for 'Aced'
      if (score === totalQuestions) {
        newStats.quizzesAced += 1;
        // Add achievement if it's a new ace
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

      // Check for 'Quiz Master' (e.g. 10 quizzes)
      if (newStats.quizzesTaken === 10) {
         newStats.achievements.unshift({
            title: "Quiz Master",
            desc: "Completed 10 practice sessions",
            date: "Just now",
            icon: "🧠"
          });
      }

      // Increment lectures completed count (heuristic)
      newStats.lecturesCompleted += 1;

      return newStats;
    });
  };

  // Resolve recent lectures objects
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
      {/* Navigation (Desktop Sidebar) */}
      {!selectedLecture && (
        <Navigation 
          activeTab={activeTab} 
          onNavigate={handleNavigate} 
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
      )}

      {/* Main Content Area */}
      <main className={`${selectedLecture ? 'w-full' : 'md:ml-64'} min-h-screen transition-all duration-300`}>
        {renderContent()}
      </main>

      {/* Navigation (Mobile Bottom Bar) */}
      {!selectedLecture && <MobileNav activeTab={activeTab} onNavigate={handleNavigate} />}
    </div>
  );
};

export default App;
import React, { useState } from 'react';
import { NavItem, Lecture } from './types';
import { Navigation } from './components/Navigation';
import { MobileNav } from './components/MobileNav';
import { Home } from './pages/Home';
import { Library } from './pages/Library';
import { Practice } from './pages/Practice';
import { Profile } from './pages/Profile';
import { VideoDetail } from './pages/VideoDetail';
import { MOCK_LECTURES } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavItem>(NavItem.Home);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>(MOCK_LECTURES);

  const handleNavigate = (tab: NavItem) => {
    setActiveTab(tab);
    setSelectedLecture(null); // Reset video selection when changing tabs
  };

  const handleLectureSelect = (lecture: Lecture) => {
    setSelectedLecture(lecture);
  };

  const handleBackFromVideo = () => {
    setSelectedLecture(null);
  };

  const handleAddLecture = (newLecture: Lecture) => {
    setLectures(prev => [newLecture, ...prev]);
  };

  const renderContent = () => {
    if (selectedLecture) {
      return <VideoDetail lecture={selectedLecture} onBack={handleBackFromVideo} />;
    }

    switch (activeTab) {
      case NavItem.Home:
        return <Home lectures={lectures} onLectureSelect={handleLectureSelect} />;
      case NavItem.Library:
        return <Library lectures={lectures} onLectureSelect={handleLectureSelect} onAddLecture={handleAddLecture} />;
      case NavItem.Practice:
        return <Practice lectures={lectures} />;
      case NavItem.Profile:
        return <Profile />;
      default:
        return <Home lectures={lectures} onLectureSelect={handleLectureSelect} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface font-sans text-gray-900">
      {/* Navigation (Desktop Sidebar) */}
      {!selectedLecture && <Navigation activeTab={activeTab} onNavigate={handleNavigate} />}

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
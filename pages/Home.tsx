import React from 'react';
import { VideoCard } from '../components/VideoCard';
import { Lecture } from '../types';
import { Clock, TrendingUp, BookOpen } from 'lucide-react';

interface HomeProps {
  lectures: Lecture[];
  onLectureSelect: (lecture: Lecture) => void;
}

export const Home: React.FC<HomeProps> = ({ lectures, onLectureSelect }) => {
  const recentLectures = lectures.slice(0, 2);
  const recommendedLectures = lectures.slice(2, 4);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-accent mb-2">Welcome back, Alex</h1>
        <p className="text-gray-500">You have 2 pending quizzes and 3 new lectures.</p>
      </header>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-accent to-[#2A4E66] text-white p-6 rounded-2xl shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/10 rounded-lg">
                <Clock size={24} className="text-highlight" />
            </div>
            <div>
                <p className="text-sm text-gray-300">Study Time</p>
                <p className="text-2xl font-bold">12.5 hrs</p>
            </div>
          </div>
          <div className="h-2 bg-black/20 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[70%]"></div>
          </div>
          <p className="text-xs text-gray-400 mt-2">+2.5 hrs this week</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
                <TrendingUp size={24} className="text-primary" />
            </div>
            <div>
                <p className="text-sm text-gray-500">Quiz Average</p>
                <p className="text-2xl font-bold text-accent">88%</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">Top 10% of class</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-highlight/30 rounded-lg">
                <BookOpen size={24} className="text-accent" />
            </div>
            <div>
                <p className="text-sm text-gray-500">Lectures Completed</p>
                <p className="text-2xl font-bold text-accent">{lectures.length + 20}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">4 remaining in Module 1</p>
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-xl font-bold text-accent">Continue Watching</h2>
          <button className="text-primary text-sm font-semibold hover:underline">View All</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentLectures.map(lecture => (
            <VideoCard key={lecture.id} lecture={lecture} onClick={onLectureSelect} />
          ))}
        </div>
      </section>

      {/* Recommended */}
      <section>
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-xl font-bold text-accent">Recommended for You</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedLectures.map(lecture => (
            <VideoCard key={lecture.id} lecture={lecture} onClick={onLectureSelect} />
          ))}
        </div>
      </section>
    </div>
  );
};
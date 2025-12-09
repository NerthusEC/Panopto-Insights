import React from 'react';
import { User, Award, Clock, BookOpen } from 'lucide-react';

export const Profile: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-accent">Student Profile</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="w-24 h-24 bg-accent text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4 border-4 border-highlight">
            AD
          </div>
          <h2 className="text-xl font-bold text-gray-900">Alex Doe</h2>
          <p className="text-gray-500 mb-6">Computer Science Major</p>
          
          <button className="w-full py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition">
            Edit Profile
          </button>
        </div>

        {/* Stats Grid */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-gray-800">Learning Analytics</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <div className="bg-white p-6 rounded-xl border border-gray-100 flex flex-col items-center text-center">
                <Clock className="text-primary mb-2" size={28} />
                <span className="text-3xl font-bold text-gray-900">42h</span>
                <span className="text-xs text-gray-500 uppercase tracking-wide mt-1">Total Study Time</span>
             </div>
             <div className="bg-white p-6 rounded-xl border border-gray-100 flex flex-col items-center text-center">
                <Award className="text-accent mb-2" size={28} />
                <span className="text-3xl font-bold text-gray-900">12</span>
                <span className="text-xs text-gray-500 uppercase tracking-wide mt-1">Quizzes Aced</span>
             </div>
             <div className="bg-white p-6 rounded-xl border border-gray-100 flex flex-col items-center text-center">
                <BookOpen className="text-highlight mb-2" size={28} />
                <span className="text-3xl font-bold text-gray-900">85</span>
                <span className="text-xs text-gray-500 uppercase tracking-wide mt-1">Lectures Watched</span>
             </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100">
             <h4 className="font-bold text-gray-800 mb-4">Recent Achievements</h4>
             <div className="space-y-4">
                {[
                    { title: "Algorithm Master", desc: "Scored 100% on CS101 Quiz", date: "2 days ago", icon: "🏆" },
                    { title: "Night Owl", desc: "Studied for 3 hours after midnight", date: "1 week ago", icon: "🦉" },
                    { title: "Fast Learner", desc: "Completed 5 lectures in one day", date: "2 weeks ago", icon: "⚡" },
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="text-2xl">{item.icon}</div>
                        <div className="flex-1">
                            <h5 className="font-semibold text-gray-900 text-sm">{item.title}</h5>
                            <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                        <span className="text-xs text-gray-400">{item.date}</span>
                    </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

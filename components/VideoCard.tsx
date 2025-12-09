import React from 'react';
import { Lecture } from '../types';
import { PlayCircle, Clock, Calendar } from 'lucide-react';

interface VideoCardProps {
  lecture: Lecture;
  onClick: (lecture: Lecture) => void;
  compact?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({ lecture, onClick, compact = false }) => {
  return (
    <div 
      onClick={() => onClick(lecture)}
      className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative aspect-video bg-gray-200 overflow-hidden">
        <img 
          src={lecture.thumbnailUrl} 
          alt={lecture.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
           <PlayCircle size={48} className="text-white drop-shadow-lg" />
        </div>
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {lecture.duration}
        </div>
      </div>
      
      <div className={`p-4 ${compact ? 'py-3' : 'py-5'}`}>
        <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">{lecture.subject}</span>
        </div>
        <h3 className={`font-bold text-accent mb-2 leading-tight ${compact ? 'text-sm' : 'text-lg'}`}>
          {lecture.title}
        </h3>
        <p className="text-gray-500 text-sm mb-3">{lecture.instructor}</p>
        
        {!compact && (
          <div className="flex items-center gap-4 text-xs text-gray-400 border-t border-gray-100 pt-3">
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{lecture.date}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

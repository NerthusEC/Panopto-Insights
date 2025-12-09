import React, { useState, useRef, useEffect } from 'react';
import { VideoCard } from '../components/VideoCard';
import { Lecture } from '../types';
import { Search, Upload, Plus, X, Film, User, Calendar as CalendarIcon, Loader2, Play } from 'lucide-react';

interface LibraryProps {
  lectures: Lecture[];
  onLectureSelect: (lecture: Lecture) => void;
  onAddLecture: (lecture: Lecture) => void;
}

interface UploadMetadata {
  className: string;
  lecturer: string;
  date: string;
}

export const Library: React.FC<LibraryProps> = ({ lectures, onLectureSelect, onAddLecture }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<UploadMetadata>({ className: '', lecturer: '', date: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoDuration, setVideoDuration] = useState<string>('');
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const subjects = ['All', ...Array.from(new Set(lectures.map(l => l.subject)))];

  const filteredLectures = lectures.filter(lecture => {
    const matchesSearch = lecture.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lecture.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || lecture.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPendingFile(file);
      // Pre-fill date with today
      const today = new Date().toISOString().split('T')[0];
      setMetadata(prev => ({ ...prev, date: today }));
      setIsUploadModalOpen(true);
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleMetadataChange = (field: keyof UploadMetadata, value: string) => {
    setMetadata(prev => ({ ...prev, [field]: value }));
  };

  const extractThumbnail = async (videoElement: HTMLVideoElement): Promise<string> => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
    });
  };

  const formatDuration = (seconds: number): string => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const handleVideoLoadedMetadata = () => {
    if (videoPreviewRef.current) {
        setVideoDuration(formatDuration(videoPreviewRef.current.duration));
        // Seek to 20% or 5s to get a good frame
        videoPreviewRef.current.currentTime = Math.min(5, videoPreviewRef.current.duration * 0.2);
    }
  };

  const handleProcessVideo = async () => {
    if (!pendingFile || !metadata.className || !metadata.lecturer || !metadata.date) return;
    
    setIsProcessing(true);

    try {
        // 1. Thumbnail Extraction
        let thumbnailUrl = 'https://images.unsplash.com/photo-1626379953822-baec19c3accd?q=80&w=2070';
        if (videoPreviewRef.current) {
            try {
                thumbnailUrl = await extractThumbnail(videoPreviewRef.current);
            } catch (e) {
                console.error("Thumbnail extraction failed", e);
            }
        }

        // 2. Simulate AI Transcript Generation (In a real app, upload to backend -> Gemini)
        // We create a structured mock transcript based on the inputs
        const mockTranscript = `
          [00:00] Introduction to ${metadata.className}.
          Welcome everyone to today's lecture on ${metadata.className}. I am Professor ${metadata.lecturer}.
          [00:45] Overview of Key Concepts.
          Today we will be discussing the fundamental principles that govern this field.
          [02:30] Detailed Analysis.
          As you can see from the slide, the data indicates a strong correlation between these variables.
          [05:15] Practical Application.
          Let's apply this formula to a real-world scenario.
          [10:00] Conclusion.
          To summarize, remember that understanding the core theory is essential for the final exam.
          (Note: This is an automatically generated transcript for the uploaded video file: ${pendingFile.name})
        `;

        const newLecture: Lecture = {
            id: `upload-${Date.now()}`,
            title: `${metadata.className}: Lecture ${metadata.date}`,
            instructor: metadata.lecturer,
            date: new Date(metadata.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            duration: videoDuration || "Unknown",
            subject: metadata.className,
            thumbnailUrl: thumbnailUrl,
            transcript: mockTranscript,
            videoUrl: URL.createObjectURL(pendingFile) // Create local URL for playback
        };

        // Simulate network delay for "AI Processing"
        setTimeout(() => {
            onAddLecture(newLecture);
            setIsProcessing(false);
            setIsUploadModalOpen(false);
            setMetadata({ className: '', lecturer: '', date: '' });
            setPendingFile(null);
        }, 1500);

    } catch (error) {
        console.error("Processing failed", error);
        setIsProcessing(false);
    }
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setPendingFile(null);
    setMetadata({ className: '', lecturer: '', date: '' });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen pb-24 relative">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold text-accent dark:text-white">Library</h1>
            
            <div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="video/*"
                />
                <button 
                    onClick={handleUploadClick}
                    className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-orange-600 transition-colors shadow-sm font-medium"
                >
                    <Upload size={18} />
                    <span>Upload Video</span>
                </button>
            </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search lectures, topics, or instructors..." 
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative overflow-x-auto pb-2 md:pb-0">
             <div className="flex gap-2">
                {subjects.map(subject => (
                    <button
                        key={subject}
                        onClick={() => setSelectedSubject(subject)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                            selectedSubject === subject 
                            ? 'bg-accent text-white' 
                            : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                    >
                        {subject}
                    </button>
                ))}
             </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <button 
            onClick={handleUploadClick}
            className="flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl hover:border-primary hover:bg-orange-50 dark:hover:bg-gray-900/50 transition-all group"
        >
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 group-hover:bg-white dark:group-hover:bg-gray-700 group-hover:shadow-md transition-all">
                <Plus size={32} className="text-gray-400 dark:text-gray-500 group-hover:text-primary" />
            </div>
            <p className="font-semibold text-gray-600 dark:text-gray-300 group-hover:text-primary">Add New Video</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">MP4, MOV, WebM</p>
        </button>

        {filteredLectures.map(lecture => (
          <VideoCard key={lecture.id} lecture={lecture} onClick={onLectureSelect} />
        ))}
      </div>

      {filteredLectures.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No lectures found matching your criteria.</p>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && pendingFile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row max-h-[90vh] border border-gray-200 dark:border-gray-800">
                
                {/* Left: Video Preview */}
                <div className="w-full md:w-1/2 bg-black flex items-center justify-center relative group">
                    <video 
                        ref={videoPreviewRef}
                        src={URL.createObjectURL(pendingFile)}
                        className="w-full h-full object-contain max-h-[300px] md:max-h-full"
                        onLoadedMetadata={handleVideoLoadedMetadata}
                        controls={false}
                        muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <Play size={48} className="text-white/50" />
                    </div>
                    <div className="absolute bottom-4 left-4 text-white text-sm font-medium bg-black/60 px-2 py-1 rounded">
                        {pendingFile.name}
                    </div>
                </div>

                {/* Right: Metadata Form */}
                <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-accent dark:text-white">Process Video</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">AI Assistant requires metadata to generate analytics.</p>
                        </div>
                        <button onClick={closeUploadModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-4 flex-1 overflow-y-auto">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class Name</label>
                            <div className="relative">
                                <Film size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="e.g. CS101, Marketing"
                                    value={metadata.className}
                                    onChange={(e) => handleMetadataChange('className', e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lecturer Name</label>
                            <div className="relative">
                                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="e.g. Dr. Turing"
                                    value={metadata.lecturer}
                                    onChange={(e) => handleMetadataChange('lecturer', e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Date</label>
                            <div className="relative">
                                <CalendarIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="date" 
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    value={metadata.date}
                                    onChange={(e) => handleMetadataChange('date', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="bg-surface dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">AI Tasks</h4>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                <li className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full border border-primary flex items-center justify-center">
                                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    </div>
                                    Thumbnail Extraction
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full border border-primary flex items-center justify-center">
                                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    </div>
                                    Speech-to-Text Transcription
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full border border-primary flex items-center justify-center">
                                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    </div>
                                    Visual Context Analysis
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <button 
                            onClick={handleProcessVideo}
                            disabled={isProcessing || !metadata.className || !metadata.lecturer || !metadata.date}
                            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Analyzing Media...
                                </>
                            ) : (
                                <>
                                    <SparklesIcon size={20} />
                                    Process & Add to Library
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

// Helper Icon for the modal
const SparklesIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
);
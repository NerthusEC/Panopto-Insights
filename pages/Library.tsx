
import React, { useState, useRef, useEffect } from 'react';
import { VideoCard } from '../components/VideoCard';
import { Lecture } from '../types';
import { Search, Upload, Plus, X, Film, User, Calendar as CalendarIcon, Loader2, Play, Sparkles as SparklesIcon, MessageSquare, Send, Bot, Filter } from 'lucide-react';
import { analyzeVideo, searchLibrary } from '../services/geminiService';

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

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  relatedLectures?: Lecture[];
}

export const Library: React.FC<LibraryProps> = ({ lectures, onLectureSelect, onAddLecture }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  
  // Advanced Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<UploadMetadata>({ className: '', lecturer: '', date: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState<string>('');
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  // AI Assistant State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const subjects = ['All', ...Array.from(new Set(lectures.map(l => l.subject)))];
  const instructors = ['All', ...Array.from(new Set(lectures.map(l => l.instructor)))];

  const filteredLectures = lectures.filter(lecture => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = lecture.title.toLowerCase().includes(term) || 
                          lecture.instructor.toLowerCase().includes(term) ||
                          (lecture.transcript && lecture.transcript.toLowerCase().includes(term)); // Enhanced search
    const matchesSubject = selectedSubject === 'All' || lecture.subject === selectedSubject;
    const matchesInstructor = selectedInstructor === 'All' || lecture.instructor === selectedInstructor;

    let matchesDate = true;
    if (startDate || endDate) {
        const lectureDate = new Date(lecture.date);
        // Reset time part for accurate date comparison
        lectureDate.setHours(0, 0, 0, 0);

        if (startDate) {
            const start = new Date(startDate);
            // new Date('YYYY-MM-DD') defaults to UTC, which might be previous day in local time. 
            // Adding 'T00:00:00' helps force local time parsing in many environments, 
            // or simply using the input value string directly if we parse lecture date similarly.
            // For simplicity here, we assume standard browser behavior or timezone offset handling.
            // Better to use setHours to normalize.
            start.setHours(0, 0, 0, 0);
            // Adjust for timezone offset if needed, but for now simple comparison:
            // Actually, Date.parse(startDate) treats YYYY-MM-DD as UTC. 
            // let's construct it manually to be safe for local time comparison.
            const [y, m, d] = startDate.split('-').map(Number);
            const localStart = new Date(y, m - 1, d);
            matchesDate = matchesDate && lectureDate >= localStart;
        }
        if (endDate) {
            const [y, m, d] = endDate.split('-').map(Number);
            const localEnd = new Date(y, m - 1, d);
            matchesDate = matchesDate && lectureDate <= localEnd;
        }
    }

    return matchesSearch && matchesSubject && matchesInstructor && matchesDate;
  });

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatOpen]);

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

  // Chat Logic
  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;
    
    const userQuery = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userQuery }]);
    setIsChatLoading(true);

    const result = await searchLibrary(userQuery, lectures);
    
    const relatedLectures = result.relevantLectureIds
        .map(id => lectures.find(l => l.id === id))
        .filter((l): l is Lecture => !!l);

    setChatHistory(prev => [...prev, { 
        role: 'ai', 
        text: result.answer,
        relatedLectures: relatedLectures.length > 0 ? relatedLectures : undefined
    }]);
    
    setIsChatLoading(false);
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
    setUploadProgress(10); // Start

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
        
        setUploadProgress(20);

        // 2. Automated Deep Analysis (Transcript + Summary)
        let transcript = "";
        let summary = "";
        
        try {
            // Using analyzeVideo directly to get full results from the start
            const analysisResult = await analyzeVideo(pendingFile);
            transcript = analysisResult.transcript;
            summary = analysisResult.summary;
        } catch (error) {
            console.error("Deep analysis failed during upload", error);
            transcript = "Automatic transcription unavailable.";
            summary = "Summary unavailable.";
        }

        setUploadProgress(90);

        const newLecture: Lecture = {
            id: `upload-${Date.now()}`,
            title: `${metadata.className}: Lecture ${metadata.date}`,
            instructor: metadata.lecturer,
            date: new Date(metadata.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            duration: videoDuration || "Unknown",
            subject: metadata.className,
            thumbnailUrl: thumbnailUrl,
            transcript: transcript,
            summary: summary,
            videoUrl: URL.createObjectURL(pendingFile) // Create local URL for playback
        };

        setUploadProgress(100);
            
        setTimeout(() => {
          onAddLecture(newLecture);
          setIsProcessing(false);
          setIsUploadModalOpen(false);
          setMetadata({ className: '', lecturer: '', date: '' });
          setPendingFile(null);
          setUploadProgress(0);
        }, 500);

    } catch (error) {
        console.error("Processing failed", error);
        setIsProcessing(false);
        setUploadProgress(0);
        alert("An error occurred while processing the file.");
    }
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setPendingFile(null);
    setMetadata({ className: '', lecturer: '', date: '' });
    setIsProcessing(false);
    setUploadProgress(0);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen pb-24 relative">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold text-accent dark:text-white">Library</h1>
            
            <div className="flex gap-2">
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
          <div className="relative flex-1 flex gap-3">
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
            <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-xl border transition-colors ${
                    showFilters 
                    ? 'bg-accent text-white border-accent' 
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                title="Toggle Filters"
            >
                <Filter size={20} />
            </button>
          </div>
          
          <button 
             onClick={() => setIsChatOpen(!isChatOpen)}
             className={`px-5 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                 isChatOpen 
                 ? 'bg-accent text-white shadow-lg' 
                 : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
             }`}
          >
             <SparklesIcon size={18} className={isChatOpen ? 'text-primary' : ''} />
             <span>Ask AI</span>
          </button>
        </div>

        {/* Extended Filters Panel */}
        {showFilters && (
            <div className="mt-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Instructor</label>
                    <select
                        value={selectedInstructor}
                        onChange={(e) => setSelectedInstructor(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-primary outline-none"
                    >
                        {instructors.map(inst => (
                            <option key={inst} value={inst}>{inst}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">From Date</label>
                    <div className="relative">
                        <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-primary outline-none"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">To Date</label>
                    <div className="relative">
                        <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-primary outline-none"
                        />
                    </div>
                </div>
            </div>
        )}
        
        <div className="flex flex-wrap gap-2 mt-4">
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
      </header>

      <div className="flex gap-6 relative">
          {/* Main Grid */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start">
            <button 
                onClick={handleUploadClick}
                className="flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl hover:border-primary hover:bg-orange-50 dark:hover:bg-gray-900/50 transition-all group"
            >
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 group-hover:bg-white dark:group-hover:bg-gray-700 group-hover:shadow-md transition-all">
                    <Plus size={32} className="text-gray-400 dark:text-gray-500 group-hover:text-primary" />
                </div>
                <p className="font-semibold text-gray-600 dark:text-gray-300 group-hover:text-primary">Add New Video</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">MP4, MOV</p>
            </button>

            {filteredLectures.map(lecture => (
              <VideoCard key={lecture.id} lecture={lecture} onClick={onLectureSelect} />
            ))}
          </div>
          
          {/* Chat Sidebar */}
          <div className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out z-40 border-l border-gray-200 dark:border-gray-800 flex flex-col ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                  <h3 className="font-bold text-accent dark:text-white flex items-center gap-2">
                      <Bot size={20} className="text-primary" />
                      Library Assistant
                  </h3>
                  <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
                      <X size={20} className="text-gray-500" />
                  </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-950/50">
                  {chatHistory.length === 0 && (
                      <div className="text-center py-10 px-4 text-gray-500 dark:text-gray-400">
                          <SparklesIcon size={40} className="mx-auto mb-4 text-primary opacity-50" />
                          <p className="font-medium mb-2">How can I help you find?</p>
                          <p className="text-sm">Try asking: "Find videos about marketing strategies" or "Where did Dr. Turing talk about complexity?"</p>
                      </div>
                  )}

                  {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                              msg.role === 'user' 
                              ? 'bg-primary text-white rounded-tr-none' 
                              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none shadow-sm'
                          }`}>
                              {msg.text}
                          </div>
                          
                          {/* Recommended Videos in Chat */}
                          {msg.relatedLectures && msg.relatedLectures.length > 0 && (
                              <div className="mt-2 w-[85%] space-y-2">
                                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Related Videos</p>
                                  {msg.relatedLectures.map(lecture => (
                                      <div key={`rec-${lecture.id}`} className="transform scale-90 origin-top-left w-[110%]">
                                          <VideoCard lecture={lecture} onClick={onLectureSelect} compact />
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  ))}

                  {isChatLoading && (
                      <div className="flex items-start">
                          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                          </div>
                      </div>
                  )}
                  <div ref={chatEndRef}></div>
              </div>

              <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                  <div className="relative">
                      <input 
                          type="text" 
                          className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm shadow-sm"
                          placeholder="Ask the library..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                      />
                      <button 
                          onClick={handleChatSubmit}
                          disabled={!chatInput.trim() || isChatLoading}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                          <Send size={16} />
                      </button>
                  </div>
              </div>
          </div>
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
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Prepare video for the Library.</p>
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
                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Automated Tasks</h4>
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
                                    Deep Video Analysis (Gemini Pro)
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full border border-primary flex items-center justify-center">
                                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    </div>
                                    Transcript & Summary Generation
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <button 
                            onClick={handleProcessVideo}
                            disabled={isProcessing || !metadata.className || !metadata.lecturer || !metadata.date}
                            className="w-full relative h-12 bg-primary text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 overflow-hidden"
                        >
                            {isProcessing && (
                                <div 
                                    className="absolute left-0 top-0 h-full bg-orange-700/20 transition-all duration-300 ease-out"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            )}
                            
                            <div className="relative z-10 flex items-center gap-2">
                                {isProcessing ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Analyzing Video Content...
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon size={20} />
                                        Process & Add to Library
                                    </>
                                )}
                            </div>
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
const Sparkles = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
);

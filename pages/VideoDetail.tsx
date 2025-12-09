import React, { useState, useEffect, useRef } from 'react';
import { Lecture } from '../types';
import { ArrowLeft, Play, Pause, MessageSquare, FileText, Share2, Sparkles, Send, Clock } from 'lucide-react';
import { generateVideoSummary, answerVideoQuestion } from '../services/geminiService';

interface VideoDetailProps {
  lecture: Lecture;
  onBack: () => void;
}

interface TranscriptSegment {
  time: number;
  displayTime: string;
  text: string;
}

export const VideoDetail: React.FC<VideoDetailProps> = ({ lecture, onBack }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'chat' | 'transcript'>('summary');
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  
  // Video & Transcript State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[] | null>(null);

  useEffect(() => {
    // Generate summary on mount if not present
    const fetchSummary = async () => {
        setLoadingSummary(true);
        const result = await generateVideoSummary(lecture.transcript);
        setSummary(result);
        setLoadingSummary(false);
    };
    fetchSummary();
  }, [lecture]);

  // Parse Transcript
  useEffect(() => {
    const parseTranscript = (text: string) => {
        // Split by timestamp regex [MM:SS]
        const parts = text.split(/(\[\d{2}:\d{2}\])/);
        const result: TranscriptSegment[] = [];
        
        // If split didn't find timestamps, return null to fallback to plain text
        if (parts.length <= 1) return null;

        for (let i = 1; i < parts.length; i += 2) {
            const timeStr = parts[i].replace('[', '').replace(']', '');
            const content = parts[i+1]?.trim();
            
            if (content) {
                const [min, sec] = timeStr.split(':').map(Number);
                result.push({
                    time: min * 60 + sec,
                    displayTime: timeStr,
                    text: content
                });
            }
        }
        return result;
    };

    const segments = parseTranscript(lecture.transcript);
    setTranscriptSegments(segments);
  }, [lecture]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoadingChat(true);

    const aiResponse = await answerVideoQuestion(lecture.transcript, userMsg);
    
    setChatHistory(prev => [...prev, { role: 'ai', text: aiResponse }]);
    setLoadingChat(false);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
        videoRef.current.currentTime = time;
        videoRef.current.play();
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Left: Video Player Area */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <div className="bg-black aspect-video relative flex items-center justify-center group sticky top-0 z-20">
          <button onClick={onBack} className="absolute top-4 left-4 text-white z-10 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors">
            <ArrowLeft size={20} />
          </button>
          
          {lecture.videoUrl ? (
            <video 
                ref={videoRef}
                src={lecture.videoUrl} 
                controls 
                autoPlay 
                className="w-full h-full"
                onTimeUpdate={handleTimeUpdate}
            />
          ) : (
            <>
                <img src={lecture.thumbnailUrl} alt={lecture.title} className="w-full h-full object-cover opacity-60" />
                
                <button className="absolute inset-0 m-auto w-20 h-20 flex items-center justify-center bg-primary text-white rounded-full shadow-2xl hover:scale-105 transition-transform z-10">
                    <Play size={32} fill="currentColor" className="ml-1" />
                </button>

                {/* Video Controls Placeholder */}
                <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black/80 to-transparent p-4 flex items-end">
                    <div className="w-full h-1 bg-white/30 rounded-full mb-1">
                        <div className="w-1/3 h-full bg-primary rounded-full relative">
                            <div className="absolute right-0 -top-1 w-3 h-3 bg-white rounded-full shadow"></div>
                        </div>
                    </div>
                </div>
            </>
          )}
        </div>

        <div className="p-6 md:p-8 space-y-6">
            <div>
                <span className="text-primary font-bold text-sm tracking-wider uppercase mb-2 block">{lecture.subject}</span>
                <h1 className="text-3xl font-bold text-accent dark:text-white mb-2">{lecture.title}</h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Instructor: {lecture.instructor} • {lecture.date}</p>
            </div>

            <div className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                    <Share2 size={18} />
                    <span>Share</span>
                </button>
                <button 
                    onClick={() => setActiveTab('transcript')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${activeTab === 'transcript' ? 'bg-accent text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                     <FileText size={18} />
                    <span>Transcript</span>
                </button>
            </div>

            <div>
                <h3 className="font-bold text-accent dark:text-gray-100 text-lg mb-2">About this Lecture</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    This lecture covers fundamental concepts crucial for the understanding of the subject. 
                    The instructor dives deep into theoretical frameworks and provides real-world examples 
                    to illustrate the complexity of the topic.
                </p>
                {/* Visual debug for AI processing if needed */}
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
                    <p className="font-mono">Transcript Length: {lecture.transcript.length} chars</p>
                    <p className="font-mono">Source: {lecture.videoUrl ? 'User Upload' : 'Library Archive'}</p>
                </div>
            </div>
        </div>
      </div>

      {/* Right: AI Sidebar */}
      <div className="w-full md:w-[400px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col h-[50vh] md:h-screen sticky top-0 transition-colors duration-300">
        <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <button 
                onClick={() => setActiveTab('summary')}
                className={`flex-1 py-4 text-xs md:text-sm font-semibold flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'summary' ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
                <Sparkles size={16} />
                Summary
                {activeTab === 'summary' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
            </button>
            <button 
                onClick={() => setActiveTab('transcript')}
                className={`flex-1 py-4 text-xs md:text-sm font-semibold flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'transcript' ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
                <FileText size={16} />
                Transcript
                {activeTab === 'transcript' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
            </button>
            <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-4 text-xs md:text-sm font-semibold flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'chat' ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
                <MessageSquare size={16} />
                Chat
                 {activeTab === 'chat' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-0 bg-white dark:bg-gray-900">
            {activeTab === 'summary' && (
                <div className="p-6 space-y-4 animate-in fade-in duration-300">
                    {loadingSummary ? (
                        <div className="space-y-3">
                            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full animate-pulse"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full animate-pulse"></div>
                        </div>
                    ) : (
                        <div className="prose prose-sm prose-slate dark:prose-invert">
                            <h3 className="text-accent dark:text-gray-100 font-bold mb-4 flex items-center gap-2">
                                <Sparkles size={16} className="text-primary" />
                                Key Takeaways
                            </h3>
                            <div className="whitespace-pre-line text-gray-600 dark:text-gray-300 leading-relaxed">
                                {summary}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'transcript' && (
                <div className="animate-in fade-in duration-300">
                     {transcriptSegments ? (
                         <div className="divide-y divide-gray-50 dark:divide-gray-800">
                             {transcriptSegments.map((segment, idx) => {
                                 const isActive = currentTime >= segment.time && 
                                                  (transcriptSegments[idx + 1] ? currentTime < transcriptSegments[idx + 1].time : true);
                                 
                                 return (
                                     <div 
                                        key={idx} 
                                        onClick={() => handleSeek(segment.time)}
                                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${isActive ? 'bg-orange-50 dark:bg-orange-900/10 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
                                     >
                                         <div className="flex gap-3">
                                             <span className="text-xs font-mono text-primary font-medium shrink-0 pt-1">
                                                {segment.displayTime}
                                             </span>
                                             <p className={`text-sm leading-relaxed ${isActive ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                                {segment.text}
                                             </p>
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
                     ) : (
                         <div className="p-6">
                            <h3 className="text-accent dark:text-gray-100 font-bold mb-4 flex items-center gap-2">
                                <FileText size={16} className="text-primary" />
                                Full Transcript
                            </h3>
                            <div className="whitespace-pre-line text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                                {lecture.transcript}
                            </div>
                         </div>
                     )}
                </div>
            )}

            {activeTab === 'chat' && (
                <div className="flex flex-col h-full p-6">
                    <div className="flex-1 space-y-4 mb-4">
                        {chatHistory.length === 0 && (
                            <div className="text-center text-gray-400 dark:text-gray-500 mt-10">
                                <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Ask any question about the lecture content.</p>
                            </div>
                        )}
                        {chatHistory.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-primary text-white rounded-tr-none' 
                                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-tl-none shadow-sm'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {loadingChat && (
                             <div className="flex justify-start">
                                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg rounded-tl-none shadow-sm">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {activeTab === 'chat' && (
            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                <div className="relative">
                    <input 
                        type="text" 
                        className="w-full pl-4 pr-12 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="Type a question..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button 
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || loadingChat}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
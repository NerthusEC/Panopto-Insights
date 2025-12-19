
import React, { useState, useEffect, useRef } from 'react';
import { Lecture } from '../types';
import { ArrowLeft, Play, MessageSquare, FileText, Share2, Sparkles, Send, Check, Loader2, GraduationCap, Gauge, ChevronDown, AlertCircle } from 'lucide-react';
import { generateVideoSummary, answerVideoQuestion } from '../services/geminiService';

interface VideoDetailProps {
  lecture: Lecture;
  onBack: () => void;
  onUpdateLecture?: (id: string, updates: Partial<Lecture>) => void;
  onLaunchQuiz: (lecture: Lecture) => void;
}

interface TranscriptSegment {
  time: number;
  displayTime: string;
  text: string;
}

export const VideoDetail: React.FC<VideoDetailProps> = ({ lecture, onBack, onUpdateLecture, onLaunchQuiz }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'chat' | 'transcript'>('summary');
  
  // Initialize state correctly using props.
  const [summary, setSummary] = useState<string | null>(lecture.summary || null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [transcriptText, setTranscriptText] = useState(lecture.transcript);
  const [videoError, setVideoError] = useState(false);

  // Sync state if prop changes
  useEffect(() => {
    setSummary(lecture.summary || null);
    setTranscriptText(lecture.transcript);
    setVideoError(false); // Reset error state on new lecture
  }, [lecture]);

  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [showShareFeedback, setShowShareFeedback] = useState(false);
  
  // Video & Transcript State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[] | null>(null);
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  // Initial Summary Generation (Only for Mock Lectures without existing summary)
  useEffect(() => {
    const fetchSummary = async () => {
        // If it's a mock lecture (no videoUrl or error) and has text but no summary, generate one.
        // Uploaded videos should already have summary from the upload process.
        if (transcriptText && !summary && (!lecture.videoUrl || videoError)) {
            setLoadingSummary(true);
            const result = await generateVideoSummary(transcriptText);
            setSummary(result);
            if (onUpdateLecture) {
                onUpdateLecture(lecture.id, { summary: result });
            }
            setLoadingSummary(false);
        }
    };
    fetchSummary();
  }, [lecture.id, lecture.videoUrl, transcriptText, summary, onUpdateLecture, videoError]);

  // Apply playback speed
  useEffect(() => {
    if (videoRef.current) {
        videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Parse Transcript
  useEffect(() => {
    const parseTranscript = (text: string) => {
        if (!text) return null;
        // Split by timestamp regex [MM:SS] or [MMM:SS] to allow > 99 mins
        const parts = text.split(/(\[\d{2,3}:\d{2}\])/);
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

    const segments = parseTranscript(transcriptText);
    setTranscriptSegments(segments);
  }, [transcriptText]);

  // Scroll active segment into view
  useEffect(() => {
    if (activeSegmentRef.current && activeTab === 'transcript') {
        activeSegmentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentTime, activeTab]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatInput('');
    
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoadingChat(true);

    const aiResponse = await answerVideoQuestion(transcriptText, userMsg, chatHistory);
    
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

  const handleShare = async () => {
    const shareData = {
        title: lecture.title,
        text: `Check out this lecture: ${lecture.title} by ${lecture.instructor}`,
        url: window.location.href
    };
    
    const textToShare = `${shareData.text} - ${shareData.url}`;

    const fallbackCopyTextToClipboard = (text: string) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px"; 
        textArea.style.top = "0";
        textArea.setAttribute('readonly', '');

        document.body.appendChild(textArea);
        
        textArea.focus({ preventScroll: true });
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                setShowShareFeedback(true);
                setTimeout(() => setShowShareFeedback(false), 2000);
            } else {
                console.error('Fallback: Copying text command was unsuccessful');
            }
        } catch (err) {
             console.error('Fallback: Oops, unable to copy', err);
        } finally {
            document.body.removeChild(textArea);
        }
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
            return; 
        } catch (err) {
            if ((err as Error).name === 'AbortError') return;
            console.log("Native share failed, trying clipboard.", err);
        }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(textToShare);
            setShowShareFeedback(true);
            setTimeout(() => setShowShareFeedback(false), 2000);
        } catch (err) {
            console.warn('Clipboard API failed, using fallback.', err);
            fallbackCopyTextToClipboard(textToShare);
        }
    } else {
        fallbackCopyTextToClipboard(textToShare);
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
          
          {lecture.videoUrl && !videoError ? (
            <video 
                ref={videoRef}
                src={lecture.videoUrl} 
                controls 
                autoPlay 
                className="w-full h-full"
                onTimeUpdate={handleTimeUpdate}
                onError={() => setVideoError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-4 text-center z-20">
                 {/* Error / Placeholder UI */}
                {videoError ? (
                    <>
                        <AlertCircle size={48} className="mb-4 text-red-500" />
                        <h3 className="text-xl font-bold mb-2">Video Unavailable</h3>
                        <p className="text-gray-400 max-w-md text-sm">
                            The video stream could not be loaded. If this was an uploaded video, the link may have expired on refresh.
                        </p>
                    </>
                ) : (
                    <>
                        <img src={lecture.thumbnailUrl} alt={lecture.title} className="absolute inset-0 w-full h-full object-cover opacity-40" />
                        <div className="relative z-10 flex flex-col items-center">
                            <AlertCircle size={48} className="mb-4 text-gray-400" />
                            <h3 className="text-xl font-bold mb-2">No Video Source</h3>
                            <p className="text-gray-300 max-w-md text-sm">
                                This lecture entry does not have a video file attached.
                            </p>
                        </div>
                    </>
                )}
            </div>
          )}
        </div>

        <div className="p-6 md:p-8 space-y-6">
            <div>
                <span className="text-primary font-bold text-sm tracking-wider uppercase mb-2 block">{lecture.subject}</span>
                <h1 className="text-3xl font-bold text-accent dark:text-white mb-2">{lecture.title}</h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Instructor: {lecture.instructor} • {lecture.date}</p>
            </div>

            <div className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-6 flex-wrap">
                <button 
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition min-w-[100px] justify-center"
                >
                    {showShareFeedback ? (
                        <>
                           <Check size={18} className="text-green-500" />
                           <span className="text-green-600 dark:text-green-400 font-medium whitespace-nowrap">Link copied!</span>
                        </>
                    ) : (
                        <>
                            <Share2 size={18} />
                            <span>Share</span>
                        </>
                    )}
                </button>
                <button 
                    onClick={() => onLaunchQuiz(lecture)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition min-w-[100px] justify-center"
                >
                    <GraduationCap size={18} />
                    <span>Take Quiz</span>
                </button>
                
                {/* Playback Speed Control */}
                <div className="relative flex items-center">
                    <Gauge size={18} className="absolute left-3 text-gray-500 pointer-events-none" />
                    <select
                        value={playbackSpeed}
                        onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                        className="appearance-none pl-10 pr-8 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="0.5">0.5x Speed</option>
                        <option value="0.75">0.75x Speed</option>
                        <option value="1">1x Normal</option>
                        <option value="1.25">1.25x Speed</option>
                        <option value="1.5">1.5x Speed</option>
                        <option value="2">2x Speed</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 text-gray-500 pointer-events-none" />
                </div>
            </div>

            <div>
                <h3 className="font-bold text-accent dark:text-gray-100 text-lg mb-2">About this Lecture</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    This lecture covers fundamental concepts crucial for the understanding of the subject. 
                    The instructor dives deep into theoretical frameworks and provides real-world examples 
                    to illustrate the complexity of the topic.
                </p>
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
                        </div>
                    ) : summary ? (
                        <div className="prose prose-sm prose-slate dark:prose-invert">
                            <h3 className="text-accent dark:text-gray-100 font-bold mb-4 flex items-center gap-2">
                                <Sparkles size={16} className="text-primary" />
                                Key Takeaways
                            </h3>
                            <div className="whitespace-pre-line text-gray-600 dark:text-gray-300 leading-relaxed">
                                {summary}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                                No summary available.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'transcript' && (
                <div className="animate-in fade-in duration-300 flex flex-col h-full">
                     {transcriptSegments ? (
                         <div className="divide-y divide-gray-50 dark:divide-gray-800 flex-1 overflow-y-auto">
                             {transcriptSegments.map((segment, idx) => {
                                 const isActive = currentTime >= segment.time && 
                                                  (transcriptSegments[idx + 1] ? currentTime < transcriptSegments[idx + 1].time : true);
                                 
                                 return (
                                     <div 
                                        key={idx} 
                                        ref={isActive ? activeSegmentRef : null}
                                        onClick={() => handleSeek(segment.time)}
                                        className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all duration-300 ${
                                            isActive 
                                            ? 'bg-orange-50 dark:bg-orange-900/30 border-l-4 border-primary shadow-lg ring-1 ring-primary/20 transform scale-[1.02]' 
                                            : 'border-l-4 border-transparent opacity-80 hover:opacity-100'
                                        }`}
                                     >
                                         <div className="flex gap-4">
                                             <span className={`text-sm font-mono font-medium shrink-0 pt-1 transition-colors ${
                                                isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
                                             }`}>
                                                {segment.displayTime}
                                             </span>
                                             <p className={`text-base leading-loose transition-colors ${
                                                isActive 
                                                ? 'text-gray-900 dark:text-white font-bold' 
                                                : 'text-gray-700 dark:text-gray-300'
                                             }`}>
                                                {segment.text}
                                             </p>
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
                     ) : transcriptText ? (
                         <div className="p-6">
                            <h3 className="text-accent dark:text-gray-100 font-bold mb-4 flex items-center gap-2">
                                <FileText size={16} className="text-primary" />
                                Full Transcript
                            </h3>
                            <div className="whitespace-pre-line text-gray-700 dark:text-gray-300 leading-loose text-base">
                                {transcriptText}
                            </div>
                         </div>
                     ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-center p-4 mt-10">
                            <FileText size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                                No transcript available.
                            </p>
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
                                {!transcriptText && (
                                    <p className="text-xs text-orange-500 mt-2">Note: Transcript required for accurate answers.</p>
                                )}
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


import React, { useState, useEffect } from 'react';
import { generateQuizFromTranscript } from '../services/geminiService';
import { QuizQuestion, Lecture, QuizDifficulty } from '../types';
import { Sparkles, CheckCircle, XCircle, ChevronRight, RefreshCw, BookOpen, Settings, BarChart, Layers, RotateCcw } from 'lucide-react';

interface PracticeProps {
  lectures: Lecture[];
  onQuizComplete: (score: number, total: number, lectureTitle: string) => void;
}

export const Practice: React.FC<PracticeProps> = ({ lectures, onQuizComplete }) => {
  const [step, setStep] = useState<'select' | 'configure' | 'loading' | 'quiz' | 'result'>('select');
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  
  // Quiz Configuration State - Initialize from localStorage or default
  const [difficulty, setDifficulty] = useState<QuizDifficulty>(
    () => (localStorage.getItem('quizDifficulty') as QuizDifficulty) || 'Intermediate'
  );
  const [numQuestions, setNumQuestions] = useState<number>(
    () => Number(localStorage.getItem('quizNumQuestions')) || 5
  );

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);

  // Persist configuration changes to localStorage
  useEffect(() => {
    localStorage.setItem('quizDifficulty', difficulty);
    localStorage.setItem('quizNumQuestions', numQuestions.toString());
  }, [difficulty, numQuestions]);

  const handleLectureSelect = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    setStep('configure');
  };

  const handleStartQuiz = async () => {
    if (!selectedLecture) return;
    setStep('loading');
    const generatedQuestions = await generateQuizFromTranscript(selectedLecture.transcript, difficulty, numQuestions);
    setQuestions(generatedQuestions);
    setUserAnswers(new Array(generatedQuestions.length).fill(-1));
    setStep('quiz');
  };

  const handleAnswerSelect = (optionIdx: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIdx] = optionIdx;
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      // Calculate score
      let correctCount = 0;
      questions.forEach((q, idx) => {
        if (q.correctAnswer === userAnswers[idx]) correctCount++;
      });
      setScore(correctCount);
      
      // -- Notify Parent to Update Stats --
      if (selectedLecture) {
        onQuizComplete(correctCount, questions.length, selectedLecture.title);
      }

      setStep('result');
    }
  };

  const resetPractice = () => {
    setStep('select');
    setSelectedLecture(null);
    setQuestions([]);
    setCurrentQuestionIdx(0);
    setUserAnswers([]);
    setScore(0);
  };

  const handleRetry = () => {
    setCurrentQuestionIdx(0);
    setUserAnswers(new Array(questions.length).fill(-1));
    setScore(0);
    setStep('quiz');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-accent dark:text-white mb-2">Practice & Quizzes</h1>
        <p className="text-gray-500 dark:text-gray-400">Reinforce your learning with AI-generated quizzes.</p>
      </header>

      {step === 'select' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
             <h2 className="font-bold text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                <Sparkles size={20} className="text-primary" />
                Create a New Quiz
             </h2>
          </div>
          <div className="p-6">
             <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select a lecture to generate questions from:</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lectures.map(lecture => (
                    <div 
                        key={lecture.id}
                        onClick={() => handleLectureSelect(lecture)}
                        className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-orange-50 dark:hover:bg-orange-900/10 cursor-pointer transition-all group"
                    >
                        <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                            <img src={lecture.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-accent dark:text-gray-100 text-sm group-hover:text-primary transition-colors">{lecture.title}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{lecture.subject}</p>
                        </div>
                        <ChevronRight className="text-gray-300 dark:text-gray-600 group-hover:text-primary" />
                    </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {step === 'configure' && selectedLecture && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
           <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
             <h2 className="font-bold text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                <Settings size={20} className="text-primary" />
                Configure Quiz
             </h2>
             <button onClick={() => setStep('select')} className="text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">Change Video</button>
          </div>
          
          <div className="p-8 space-y-8">
             <div className="flex items-start gap-4 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/20">
                <div className="w-16 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={selectedLecture.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                    <h3 className="font-bold text-accent dark:text-white text-sm">{selectedLecture.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{selectedLecture.instructor}</p>
                </div>
             </div>

             {/* Difficulty Selection */}
             <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <BarChart size={18} /> Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-4">
                    {(['Basic', 'Intermediate', 'Hard'] as QuizDifficulty[]).map((level) => (
                        <button
                            key={level}
                            onClick={() => setDifficulty(level)}
                            className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                                difficulty === level 
                                ? 'border-primary bg-primary/5 dark:bg-primary/20 text-primary' 
                                : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
                            }`}
                        >
                            {level}
                        </button>
                    ))}
                </div>
             </div>

             {/* Question Count Selection */}
             <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <Layers size={18} /> Number of Questions
                </label>
                <div className="flex gap-4">
                    {[5, 10, 15, 20].map((count) => (
                        <button
                            key={count}
                            onClick={() => setNumQuestions(count)}
                            className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                                numQuestions === count 
                                ? 'border-primary bg-primary/5 dark:bg-primary/20 text-primary' 
                                : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
                            }`}
                        >
                            {count}
                        </button>
                    ))}
                </div>
             </div>

             <button
                onClick={handleStartQuiz}
                className="w-full py-4 bg-accent dark:bg-primary text-white rounded-xl font-bold text-lg hover:bg-accent/90 dark:hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20 dark:shadow-orange-500/20"
             >
                <Sparkles size={20} />
                Generate Quiz
             </button>
          </div>
        </div>
      )}

      {step === 'loading' && (
        <div className="flex flex-col items-center justify-center h-96">
            <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 border-t-primary rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-bold text-accent dark:text-white mb-2">Generating Questions</h3>
            <p className="text-gray-500 dark:text-gray-400">Creating a {difficulty.toLowerCase()} quiz with {numQuestions} questions...</p>
        </div>
      )}

      {step === 'quiz' && questions.length > 0 && (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                <span>Topic: <span className="font-semibold text-accent dark:text-white">{selectedLecture?.title}</span></span>
                <span>Question {currentQuestionIdx + 1} of {questions.length}</span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full mb-8">
                <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }}
                ></div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 mb-8">
                <div className="flex justify-between items-start mb-6">
                    <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-bold rounded-full uppercase tracking-wider">
                        {difficulty}
                    </span>
                </div>
                <h3 className="text-xl font-bold text-accent dark:text-white mb-6 leading-relaxed">
                    {questions[currentQuestionIdx].question}
                </h3>
                <div className="space-y-3">
                    {questions[currentQuestionIdx].options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleAnswerSelect(idx)}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${
                                userAnswers[currentQuestionIdx] === idx
                                ? 'border-primary bg-orange-50 dark:bg-orange-900/20 text-primary font-medium shadow-sm'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                    userAnswers[currentQuestionIdx] === idx ? 'border-primary bg-primary' : 'border-gray-400 dark:border-gray-500'
                                }`}>
                                    {userAnswers[currentQuestionIdx] === idx && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                </div>
                                {option}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleNext}
                    disabled={userAnswers[currentQuestionIdx] === -1}
                    className="bg-accent dark:bg-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-accent/90 dark:hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                    {currentQuestionIdx === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
      )}

      {step === 'result' && (
        <div className="max-w-md mx-auto text-center pt-10">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles size={40} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-accent dark:text-white mb-2">Quiz Completed!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">You scored <span className="font-bold text-accent dark:text-white">{score}</span> out of <span className="font-bold text-accent dark:text-white">{questions.length}</span></p>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 mb-8 text-left">
                <h4 className="font-bold text-gray-900 dark:text-white mb-4">Summary</h4>
                <ul className="space-y-4">
                    {questions.map((q, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm">
                            {userAnswers[idx] === q.correctAnswer ? (
                                <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                            ) : (
                                <XCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                            )}
                            <div>
                                <p className="text-gray-700 dark:text-gray-300 font-medium">{q.question}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    Correct: {q.options[q.correctAnswer]}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="flex gap-4 justify-center">
                <button 
                    onClick={resetPractice}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    <BookOpen size={18} />
                    Back to Topics
                </button>
                <button 
                    onClick={handleRetry}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    <RotateCcw size={18} />
                    Retry Quiz
                </button>
                <button 
                    onClick={() => setStep('configure')}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
                >
                    <RefreshCw size={18} />
                    New Config
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

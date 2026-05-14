/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Canvas } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, OrbitControls } from '@react-three/drei';
import { MessageSquare, ShieldCheck, RefreshCcw, User, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- 3D Background Components ---

function AnimatedSpheres() {
  return (
    <>
      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        <Sphere args={[1.2, 64, 64]} position={[-2, 0, -2]}>
          <MeshDistortMaterial color="#ec4899" speed={3} distort={0.4} radius={1} />
        </Sphere>
      </Float>
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1.5}>
        <Sphere args={[0.8, 64, 64]} position={[2, 1, -1]}>
          <MeshDistortMaterial color="#8b5cf6" speed={2} distort={0.3} radius={1} />
        </Sphere>
      </Float>
      <Float speed={3} rotationIntensity={2} floatIntensity={3}>
        <Sphere args={[0.5, 32, 32]} position={[0, -1.5, -3]}>
          <MeshDistortMaterial color="#3b82f6" speed={4} distort={0.5} radius={1} />
        </Sphere>
      </Float>
    </>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <AnimatedSpheres />
      <OrbitControls enableZoom={false} enablePan={false} />
    </>
  );
}

// --- Data Services (Google Sheets Integration) ---

// Replace this with the URL from your Google Apps Script Deployment
const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SHEET_SCRIPT_URL || "YOUR_APPS_SCRIPT_URL_HERE";

const questionService = {
  // Fetch from Sheet (via doGet in Apps Script)
  getQuestions: async () => {
    try {
      const response = await fetch(SCRIPT_URL);
      const data = await response.json();
      return data.map((q, index) => ({
        id: `row-${index}`,
        text: q.question,
        author: q.author || 'Anonymous',
        timestamp: new Date(q.created_at).getTime(),
        answered: q.status === 'answered',
        status: q.status
      }));
    } catch (e) {
      console.error('Failed to fetch from Database', e);
      return [];
    }
  },

  // Post to Sheet (via doPost in Apps Script)
  addQuestion: async (text, author) => {
    try {
      console.log(text)
      console.log(author)
      // Note: Apps Script POST requires no-cors for simple browser fetch
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          author: author || 'Anonymous'
        }),
      });
      return { success: true };
    } catch (e) {
      console.error('Question submission failed', e);
      throw e;
    }
  }
};

// --- Components ---

function AttendeeView() {
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSubmitting(true);
    try {
      await questionService.addQuestion(text, author);
      setSubmitted(true);
      setText('');
      setAuthor('');
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      alert("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl z-20"
      >
        <header className="px-4 mb-10 text-center md:text-left">
          <p className="text-rose-300 uppercase tracking-[0.3em] text-[10px] font-bold mb-1 ml-1">The Heart to Heart Talk</p>
          <h1 className="text-white text-4xl md:text-5xl font-serif font-light leading-tight">
            Latter House YAYA (LP61) Q&A
          </h1>
        </header>

        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
          <div className="mb-8 relative z-10">
            <span className="bg-rose-500/80 text-white text-[10px] px-3 py-1 rounded-full uppercase tracking-wider font-bold">Public Portal</span>
            <h2 className="text-white text-2xl md:text-3xl font-medium mt-4 leading-tight">Ask your most <br/>honest question.</h2>
            <p className="text-rose-100/60 text-sm mt-2 italic">Submitted directly to our moderation team.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-rose-200/80 text-[10px] uppercase tracking-widest block mb-2 px-1">Your Question</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your heart out here..."
                className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-white placeholder:text-rose-200/20 focus:outline-none focus:border-rose-400/50 min-h-[160px] transition-all resize-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-rose-200/80 text-[10px] uppercase tracking-widest block mb-2 px-1">Your Name (Optional)</label>
              <div className="relative">
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Anonymous"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white placeholder:text-rose-200/20 focus:outline-none focus:border-rose-400/50 transition-all"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-200/30" size={18} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full py-5 rounded-3xl font-bold text-white tracking-widest text-xs uppercase shadow-lg shadow-rose-900/20 transition-all flex items-center justify-center gap-2",
                isSubmitting ? "bg-white/10" : "bg-gradient-to-r from-rose-500 to-purple-600 hover:scale-[1.01] active:scale-[0.98]"
              )}
            >
              {isSubmitting ? (
                <RefreshCcw className="animate-spin" size={20} />
              ) : submitted ? (
                "Question Sent to Database!"
              ) : (
                "Submit Question"
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <Link to="#" className="text-rose-100/30 hover:text-rose-100/60 text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-colors">
            <ShieldCheck size={14} />
            Built by Toluwalase
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

function ModeratorView() {
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuestions = async () => {
    const data = await questionService.getQuestions();
    setQuestions(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchQuestions();
    const interval = setInterval(fetchQuestions, 8000); // Poll every 8s
    return () => clearInterval(interval);
  }, []);

  const filteredQuestions = useMemo(() => {
    let base = [...questions];
    if (filter === 'pending') base = questions.filter(q => !q.answered);
    if (filter === 'answered') base = questions.filter(q => q.answered);
    return base.sort((a, b) => a.timestamp - b.timestamp);
    // return base.sort((a, b) => b.timestamp - a.timestamp); // Newest first
    // Sort by timestamp ascending (oldest to newest)
  }, [questions, filter]);

  return (
    <div className="min-h-screen p-6 md:p-12 relative">
      <div className="max-w-6xl mx-auto space-y-10 relative z-20">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <p className="text-rose-300 uppercase tracking-[0.3em] text-[10px] font-bold mb-1">YAYA(LP61) Live Data Feed</p>
            <h1 className="text-4xl md:text-5xl font-serif font-light text-white leading-tight">
              Responses
            </h1>
          </div>

          <div className="flex bg-black/20 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10">
            {['all', 'pending', 'answered'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all",
                  filter === f ? "bg-white/15 text-white shadow-lg" : "text-white/40 hover:text-white/60"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-rose-200/50">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p className="text-xs uppercase tracking-widest">Fetching data from Database...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredQuestions.map((q, idx) => (
                <motion.div
                  key={q.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "group bg-white/5 backdrop-blur-2xl border border-white/10 p-6 rounded-[32px] flex flex-col justify-between transition-all hover:bg-white/10",
                    q.answered && "opacity-60"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-mono">
                          #{questions.length - idx}
                        </div>
                        <span className="text-rose-300 text-[10px] uppercase font-bold tracking-tighter">
                          {new Date(q.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={cn(
                        "text-[10px] px-2 py-1 rounded-md uppercase font-bold tracking-widest",
                        q.answered ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                      )}>
                        {q.status}
                      </div>
                    </div>
                    <p className="text-white text-base font-light italic leading-relaxed mb-6">
                      "{q.text}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-rose-200">
                        @
                      </div>
                      <span className="text-rose-100/60 text-xs font-semibold">{q.author}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {filteredQuestions.length === 0 && !isLoading && (
          <div className="py-24 text-center">
            <MessageSquare size={48} className="mx-auto text-white/5 mb-4" />
            <p className="text-white/10 text-xs uppercase tracking-widest font-bold">No questions found in the Database</p>
          </div>
        )}

        <footer className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-rose-200/30 text-[10px] uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Database Sync Active
          </div>
          <span>API Status: Operational</span>
        </footer>
      </div>
    </div>
  );
}

// --- Main App ---

export default function App() {
  return (
    <div className="relative w-full min-h-screen bg-[#0f0c29] overflow-x-hidden font-sans">
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <Scene />
        </Canvas>
      </div>

      <div className="fixed inset-0 z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[150px]" />
        <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-20 w-full">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AttendeeView />} />
            <Route path="/moderator" element={<ModeratorView />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}
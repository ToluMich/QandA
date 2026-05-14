/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Canvas } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, OrbitControls } from '@react-three/drei';
import { MessageSquare, ShieldCheck, RefreshCcw, User, Loader2, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Firebase Imports ---
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc 
} from "firebase/firestore";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
      await addDoc(collection(db, "questions"), {
        question: text,
        author: author || "Anonymous",
        status: "pending",
        created_at: serverTimestamp()
      });
      
      setSubmitted(true);
      setText('');
      setAuthor('');
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      console.error(err);
      alert("Submission failed. Please check your connection.");
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
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-rose-200/80 text-[10px] uppercase tracking-widest block mb-2 px-1">Your Question</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your heart out here..."
                className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-white focus:outline-none focus:border-rose-400/50 min-h-[160px] transition-all resize-none"
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
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white placeholder:text-rose-200/20"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-200/30" size={18} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full py-5 rounded-3xl font-bold text-white tracking-widest text-xs uppercase transition-all flex items-center justify-center gap-2",
                isSubmitting ? "bg-white/10" : "bg-gradient-to-r from-rose-500 to-purple-600 hover:scale-[1.01]"
              )}
            >
              {isSubmitting ? <RefreshCcw className="animate-spin" size={20} /> : submitted ? "Sent!" : "Submit"}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <Link to="https://portfolio-tolu-michaels-projects.vercel.app/" className="text-rose-100/30 hover:text-rose-100/60 text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-colors">
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
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "questions"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().created_at?.toDate().getTime() || Date.now()
      }));
      setQuestions(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // NEW: Function to mark as answered
  const handleMarkAsAnswered = async (questionId) => {
    setActionLoading(questionId);
    try {
      const questionRef = doc(db, "questions", questionId);
      await updateDoc(questionRef, {
        status: "answered"
      });
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredQuestions = useMemo(() => {
    let base = [...questions];
    if (filter === 'pending') base = questions.filter(q => q.status === 'pending');
    if (filter === 'answered') base = questions.filter(q => q.status === 'answered');
    return base.sort((a, b) => a.timestamp - b.timestamp);
  }, [questions, filter]);

  return (
    <div className="min-h-screen p-6 md:p-12 relative">
      <div className="max-w-6xl mx-auto space-y-10 relative z-20">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <p className="text-rose-300 uppercase tracking-[0.3em] text-[10px] font-bold mb-1">Latter House Live Feed</p>
            <h1 className="text-4xl md:text-5xl font-serif font-light text-white leading-tight">Questions to Moderator</h1>
          </div>
          <div className="flex bg-black/20 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10">
            {['all', 'pending', 'answered'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all",
                  filter === f ? "bg-white/15 text-white" : "text-white/40 hover:text-white/60"
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
            <p className="text-xs uppercase tracking-widest">Connecting...</p>
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
                    "group bg-white/5 backdrop-blur-2xl border border-white/10 p-6 rounded-[32px] flex flex-col justify-between transition-all",
                    q.status === 'answered' && "bg-emerald-500/5 border-emerald-500/20"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-mono">
                          #{idx + 1}
                        </div>
                      </div>
                      <div className={cn(
                        "text-[10px] px-2 py-1 rounded-md uppercase font-bold tracking-widest",
                        q.status === 'answered' ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                      )}>
                        {q.status}
                      </div>
                    </div>
                    <p className="text-white text-base font-light italic leading-relaxed mb-6">"{q.question}"</p>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-rose-100/60 text-xs font-semibold">{q.author}</span>
                    </div>

                    {/* ANSWERED BUTTON */}
                    {q.status === 'pending' && (
                      <button
                      onClick={() => handleMarkAsAnswered(q.id)}
                      disabled={actionLoading === q.id}
                      className="
                        flex items-center gap-2 px-4 py-2 rounded-xl
                    
                        bg-white/10
                        backdrop-blur-xl
                        border border-white/20
                    
                        text-white/80 hover:text-white
                        text-[10px] font-bold uppercase tracking-widest
                    
                        shadow-[0_8px_30px_rgba(0,0,0,0.2)]
                        hover:bg-white/15
                        hover:border-white/30
                    
                        transition-all duration-300
                        active:scale-[0.98]
                      "
                    >
                      {actionLoading === q.id ? (
                        <RefreshCcw className="animate-spin" size={14} />
                      ) : (
                        <>
                          <CheckCircle2 size={14} />
                          Answered
                        </>
                      )}
                    </button>
                    )}
                  </div>

                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
          <Link to="https://portfolio-tolu-michaels-projects.vercel.app/" className="text-rose-100/30 hover:text-rose-100/60 text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-colors">
            <ShieldCheck size={14} />
            Built by Toluwalase
          </Link>
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
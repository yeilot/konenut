/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Users, 
  Clock, 
  Heart, 
  Plus, 
  Trophy,
  Quote,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Firebase Imports
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  Timestamp,
  getDocs,
  doc
} from 'firebase/firestore';

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Types
interface Commitment {
  id: string;
  name: string;
  hours: number;
  timestamp: any; // Firestore Timestamp
}

const GOAL_HOURS = 18000;

export default function App() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [hours, setHours] = useState<number>(1);
  const [institution, setInstitution] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [aiQuote, setAiQuote] = useState<string>('"מוסיפים תורה, מוסיפים טוב, מוסיפים חיל לאומה"');
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const generateQuote = async () => {
    if (!process.env.GEMINI_API_KEY) {
      alert("אנא הגדר את מפתח ה-Gemini בנטליפי כדי להשתמש בתכונה זו.");
      return;
    }
    setIsGeneratingQuote(true);
    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "תן ציטוט קצר ומעורר השראה על חשיבות לימוד התורה לעם ישראל. רק הציטוט עצמו בעברית.",
      });
      if (response.text) {
        setAiQuote(response.text.trim());
      }
    } catch (error) {
      console.error("Gemini Error:", error);
    } finally {
      setIsGeneratingQuote(false);
    }
  };

  const loadData = () => {
    setConnectionError(null);
    const q = query(collection(db, 'commitments'), orderBy('timestamp', 'desc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Commitment[];
      setCommitments(docs);
      setConnectionError(null);
    }, (error) => {
      console.error("Firestore Error:", error);
      const code = error.code || 'unknown';
      if (code === 'unavailable') {
        setConnectionError("שגיאת חיבור: השרת לא זמין. אם אתה בנטפרי, ייתכן שצריך לבקש פתיחה של הכתובת.");
      } else {
        setConnectionError(`שגיאת חיבור (${code}): ${error.message}`);
      }
    });

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribe = loadData();
    return () => unsubscribe();
  }, [retryCount]);

  const totalHours = useMemo(() => 
    commitments.reduce((sum, c) => sum + c.hours, 0), 
  [commitments]);

  const progress = Math.min((totalHours / GOAL_HOURS) * 100, 100);

  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || hours <= 0) return;
    setIsSubmitting(true);
    try {
      const commitmentData: any = {
        name,
        hours: Number(hours),
        timestamp: Timestamp.now()
      };
      if (institution) commitmentData.institution = institution;
      if (phone) commitmentData.phone = phone;
      await addDoc(collection(db, 'commitments'), commitmentData);
      setName('');
      setHours(1);
      setInstitution('');
      setPhone('');
      setIsModalOpen(false);
    } catch (error) {
      alert("חלה שגיאה בשמירת הנתונים. וודא שאתה מחובר.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen font-sans overflow-x-hidden bg-[#FDFCF8]">
      {connectionError && (
        <div className="bg-red-600 text-white p-3 text-center flex flex-col sm:flex-row items-center justify-center gap-3 sticky top-0 z-[200] shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} />
            <span className="font-bold">{connectionError}</span>
          </div>
          <button 
            onClick={() => setRetryCount(prev => prev + 1)}
            className="bg-white text-red-600 px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors"
          >
            <RefreshCw size={14} />
            נסה להתחבר שוב
          </button>
        </div>
      )}

      {/* Header / Hero Section */}
      <header className="relative min-h-[90vh] md:h-[85vh] flex flex-col items-center justify-center text-center px-4 py-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#C5A059]/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#8E6E37]/10 rounded-full blur-[100px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C5A059]/10 text-[#8E6E37] font-semibold text-sm mb-6 border border-[#C5A059]/20">
            <Trophy size={16} />
            <span>יעד הקמפיין: 18,000 שעות לימוד</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-display font-black text-[#2D2926] mb-4 sm:mb-6 tracking-tighter leading-tight sm:leading-none px-2">
            כוננים <span className="text-[#C5A059]">לתורה</span> <span className="text-xs opacity-20">v5</span>
          </h1>
          
          <p className="text-base sm:text-xl md:text-2xl font-medium text-[#5A5A40] mb-3 sm:mb-4 max-w-2xl mx-auto leading-relaxed italic px-4 min-h-[3em] flex items-center justify-center">
            {aiQuote}
          </p>
          
          <button 
            onClick={generateQuote}
            disabled={isGeneratingQuote}
            className="mb-8 text-[#C5A059] hover:text-[#8E6E37] flex items-center gap-2 mx-auto text-sm font-bold transition-all"
          >
            <Sparkles size={14} className={isGeneratingQuote ? "animate-spin" : ""} />
            <span>{isGeneratingQuote ? "מייצר ציטוט..." : "קבל ציטוט השראה מה-AI"}</span>
          </button>
          
          <p className="text-sm sm:text-lg md:text-xl text-[#2D2926] mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed px-6 font-medium">
            כולנו רוצים לקחת חלק במלחמה, להתנדב ולהוסיף טוב, לימוד תורה זה טוב שאנחנו יכולים להוסיף בוודאות!
          </p>

          <div className="glass-card rounded-3xl p-5 sm:p-8 md:p-12 max-w-2xl mx-auto shadow-xl bg-white/80 backdrop-blur-md border border-white">
            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4 sm:gap-0 mb-6 sm:mb-4">
              <div className="text-center sm:text-right">
                <span className="block text-[10px] sm:text-sm uppercase tracking-widest text-[#8E6E37] font-bold mb-1">הושגו עד כה</span>
                <motion.span 
                  key={totalHours}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-4xl sm:text-6xl font-black font-display text-[#2D2926]"
                >
                  {totalHours.toLocaleString()}
                </motion.span>
                <span className="text-base sm:text-xl font-bold text-[#5A5A40] mr-2">שעות</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="block text-[10px] sm:text-sm uppercase tracking-widest text-[#8E6E37] font-bold mb-1">יעד</span>
                <span className="text-xl sm:text-3xl font-bold text-[#2D2926]">{GOAL_HOURS.toLocaleString()}</span>
              </div>
            </div>

            <div className="relative h-6 bg-black/5 rounded-full overflow-hidden mb-8">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5 }}
                className="absolute inset-y-0 right-0 charidy-gradient"
              />
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white mix-blend-difference">
                {progress.toFixed(1)}%
              </div>
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full py-4 sm:py-5 rounded-2xl charidy-gradient text-white font-bold text-lg sm:text-xl shadow-lg hover:shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 group"
            >
              <Plus className="group-hover:rotate-90 transition-transform" />
              <span>אני רוצה לקחת שעות לימוד</span>
            </button>
          </div>
        </motion.div>
      </header>

      {/* Recent Commitments Section */}
      <section className="py-16 md:py-24 max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-black font-display">מצטרפים אחרונים</h2>
          <Heart className="text-[#C5A059]" />
        </div>

        <div className="space-y-3 md:space-y-4">
          {commitments.length === 0 && !connectionError && (
            <div className="text-center py-12 text-[#5A5A40] opacity-50">טוען נתונים...</div>
          )}
          <AnimatePresence initial={false}>
            {commitments.map((c, index) => (
              <motion.div 
                key={c.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-4 md:p-6 rounded-2xl border border-[#C5A059]/10 shadow-sm flex items-center justify-between group hover:border-[#C5A059]/30 transition-colors"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#C5A059]/5 flex items-center justify-center text-[#C5A059]">
                    <Quote size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-base md:text-lg">{c.name}</h4>
                    <p className="text-xs md:text-sm text-[#5A5A40] opacity-70">
                      {c.timestamp?.toDate ? c.timestamp.toDate().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : 'כרגע'}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-xl md:text-2xl font-black text-[#C5A059]">{c.hours}</span>
                  <span className="text-xs md:text-sm font-bold text-[#5A5A40] mr-1">שעות</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* Commitment Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-[#FDFCF8] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="charidy-gradient p-6 text-white text-center">
                <h3 className="text-xl font-black mb-1">אני מצטרף לכוננים!</h3>
                <p className="text-white/80 text-xs">בחרו את כמות השעות שתרצו להוסיף</p>
              </div>
              
              <form onSubmit={handleCommit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#8E6E37] mb-1">שם מלא / שם המשפחה *</label>
                  <input 
                    type="text" required value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#C5A059]/20 focus:ring-2 focus:ring-[#C5A059]/50 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8E6E37] mb-1">כמות שעות לימוד</label>
                  <div className="flex items-center gap-4">
                    <button type="button" onClick={() => setHours(Math.max(1, hours - 1))} className="w-10 h-10 rounded-xl border border-[#C5A059]/20 text-[#C5A059]">-</button>
                    <input type="number" required min="1" value={hours} onChange={(e) => setHours(parseInt(e.target.value) || 1)} className="flex-1 text-center text-xl font-black bg-transparent" />
                    <button type="button" onClick={() => setHours(hours + 1)} className="w-10 h-10 rounded-xl border border-[#C5A059]/20 text-[#C5A059]">+</button>
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full py-4 rounded-xl charidy-gradient text-white font-bold text-lg shadow-lg flex items-center justify-center gap-2">
                  {isSubmitting ? "שומר..." : "אישור והצטרפות"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
  AlertCircle
} from 'lucide-react';

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
  getDocFromServer,
  doc
} from 'firebase/firestore';

// Types
interface Commitment {
  id: string;
  name: string;
  hours: number;
  timestamp: any; // Firestore Timestamp
}

const GOAL_HOURS = 18000;

// Error Handling Helper
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

export default function App() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [hours, setHours] = useState<number>(1);
  const [institution, setInstitution] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Test Connection & Listen for Real-time Updates
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error: any) {
        if (error.message?.includes('the client is offline')) {
          setConnectionError("שגיאת חיבור לבסיס הנתונים. אנא וודא שהגדרות ה-Firebase תקינות.");
        }
      }
    };
    testConnection();

    const q = query(collection(db, 'commitments'), orderBy('timestamp', 'desc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Commitment[];
      setCommitments(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'commitments');
    });

    return () => unsubscribe();
  }, []);

  const totalHours = useMemo(() => 
    commitments.reduce((sum, c) => sum + c.hours, 0), 
  [commitments]);

  const progress = Math.min((totalHours / GOAL_HOURS) * 100, 100);

  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || hours <= 0) return;

    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, 'commitments'), {
        name,
        hours: Number(hours),
        institution: institution || null,
        phone: phone || null,
        timestamp: Timestamp.now()
      });
      
      setName('');
      setHours(1);
      setInstitution('');
      setPhone('');
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'commitments');
      alert("חלה שגיאה בשמירת הנתונים. אנא נסה שוב.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen font-sans overflow-x-hidden">
      {connectionError && (
        <div className="bg-red-500 text-white p-2 text-center flex items-center justify-center gap-2">
          <AlertCircle size={16} />
          <span>{connectionError}</span>
        </div>
      )}

      {/* Header / Hero Section */}
      <header className="relative min-h-[90vh] md:h-[85vh] flex flex-col items-center justify-center text-center px-4 py-12 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#C5A059]/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#8E6E37]/10 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper.png')] opacity-30" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C5A059]/10 text-[#8E6E37] font-semibold text-sm mb-6 border border-[#C5A059]/20">
            <Trophy size={16} />
            <span>יעד הקמפיין: 18,000 שעות לימוד</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-display font-black text-[#2D2926] mb-6 tracking-tighter leading-none px-2">
            כוננים <span className="text-[#C5A059]">לתורה</span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl font-medium text-[#5A5A40] mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed italic px-4">
            "מוסיפים תורה, מוסיפים טוב, מוסיפים חיל לאומה"
          </p>

          {/* Main Progress Card */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 md:p-12 max-w-2xl mx-auto mx-2 sm:mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-6 sm:gap-0 mb-6 sm:mb-4">
              <div className="text-center sm:text-right">
                <span className="block text-xs sm:text-sm uppercase tracking-widest text-[#8E6E37] font-bold mb-1">הושגו עד כה</span>
                <motion.span 
                  key={totalHours}
                  initial={{ scale: 1.2, color: '#C5A059' }}
                  animate={{ scale: 1, color: '#2D2926' }}
                  className="text-5xl sm:text-6xl font-black font-display"
                >
                  {totalHours.toLocaleString()}
                </motion.span>
                <span className="text-lg sm:text-xl font-bold text-[#5A5A40] mr-2">שעות</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="block text-xs sm:text-sm uppercase tracking-widest text-[#8E6E37] font-bold mb-1">יעד</span>
                <span className="text-2xl sm:text-3xl font-bold text-[#2D2926]">{GOAL_HOURS.toLocaleString()}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-6 bg-black/5 rounded-full overflow-hidden mb-8">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
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

      {/* Stats & Info Section */}
      <section className="py-16 md:py-24 bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-12 text-center">
            <div className="p-6 md:p-8 rounded-3xl bg-[#FDFCF8] border border-[#C5A059]/10">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[#C5A059]/10 rounded-2xl flex items-center justify-center text-[#C5A059] mx-auto mb-4 md:mb-6">
                <Users size={28} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">{commitments.length}</h3>
              <p className="text-sm md:text-base text-[#5A5A40]">משתתפים שכבר לקחו חלק</p>
            </div>
            <div className="p-6 md:p-8 rounded-3xl bg-[#FDFCF8] border border-[#C5A059]/10">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[#C5A059]/10 rounded-2xl flex items-center justify-center text-[#C5A059] mx-auto mb-4 md:mb-6">
                <BookOpen size={28} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">לימוד משותף</h3>
              <p className="text-sm md:text-base text-[#5A5A40]">כל שעה מצטרפת לבניין האומה</p>
            </div>
            <div className="p-6 md:p-8 rounded-3xl bg-[#FDFCF8] border border-[#C5A059]/10 sm:col-span-2 md:col-span-1">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[#C5A059]/10 rounded-2xl flex items-center justify-center text-[#C5A059] mx-auto mb-4 md:mb-6">
                <Clock size={28} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">זמן איכות</h3>
              <p className="text-sm md:text-base text-[#5A5A40]">השקעה נצחית ברוח ישראל</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Commitments Section */}
      <section className="py-16 md:py-24 bg-[#FDFCF8]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-black font-display">מצטרפים אחרונים</h2>
            <div className="h-px flex-1 bg-[#C5A059]/20 mx-4 md:mx-8 hidden sm:block" />
            <Heart className="text-[#C5A059]" />
          </div>

          <div className="space-y-3 md:space-y-4">
            <AnimatePresence initial={false}>
              {commitments.map((c, index) => (
                <motion.div 
                  key={c.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white p-4 md:p-6 rounded-2xl border border-[#C5A059]/10 shadow-sm flex items-center justify-between group hover:border-[#C5A059]/30 transition-colors"
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#C5A059]/5 flex items-center justify-center text-[#C5A059]">
                      <Quote size={16} className="md:w-5 md:h-5" />
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
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2D2926] text-white py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-display font-black mb-4">כוננים לתורה</h2>
          <p className="text-white/60 mb-8 italic">"מוסיפים תורה, מוסיפים טוב, מוסיפים חיל לאומה"</p>
          <div className="flex justify-center gap-6 mb-12">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#C5A059] transition-colors cursor-pointer">
              <Heart size={18} />
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#C5A059] transition-colors cursor-pointer">
              <BookOpen size={18} />
            </div>
          </div>
          <p className="text-xs text-white/30">© {new Date().getFullYear()} כל הזכויות שמורות לקמפיין כוננים לתורה</p>
        </div>
      </footer>

      {/* Commitment Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-[#FDFCF8] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="charidy-gradient p-6 sm:p-8 text-white text-center">
                <h3 className="text-xl sm:text-2xl font-black mb-2">אני מצטרף לכוננים!</h3>
                <p className="text-white/80 text-xs sm:text-sm">בחרו את כמות השעות שתרצו להוסיף</p>
              </div>
              
              <form onSubmit={handleCommit} className="p-6 sm:p-8 space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#8E6E37] mb-2">שם מלא / שם המשפחה *</label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="למשל: משפחת ישראלי"
                    className="w-full px-4 py-3 rounded-xl border border-[#C5A059]/20 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 transition-all bg-white text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#8E6E37] mb-2">שם מוסד הלימודים (רשות)</label>
                  <input 
                    type="text" 
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="למשל: ישיבת אור החיים"
                    className="w-full px-4 py-3 rounded-xl border border-[#C5A059]/20 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 transition-all bg-white text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#8E6E37] mb-2">מספר טלפון (רשות - לשימוש פנימי בלבד)</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="לעדכונים והגרלות"
                    className="w-full px-4 py-3 rounded-xl border border-[#C5A059]/20 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 transition-all bg-white text-sm sm:text-base"
                  />
                  <p className="text-[10px] text-[#5A5A40] mt-1 opacity-60">המספר לא יוצג באתר ויישמר אצל המנהל בלבד</p>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#8E6E37] mb-2">כמות שעות לימוד</label>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <button 
                      type="button"
                      onClick={() => setHours(Math.max(1, hours - 1))}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border border-[#C5A059]/20 flex items-center justify-center text-[#C5A059] hover:bg-[#C5A059]/5 active:bg-[#C5A059]/10"
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      required
                      min="1"
                      value={hours}
                      onChange={(e) => setHours(parseInt(e.target.value) || 1)}
                      className="flex-1 text-center text-xl sm:text-2xl font-black text-[#2D2926] focus:outline-none bg-transparent"
                    />
                    <button 
                      type="button"
                      onClick={() => setHours(hours + 1)}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border border-[#C5A059]/20 flex items-center justify-center text-[#C5A059] hover:bg-[#C5A059]/5 active:bg-[#C5A059]/10"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[10, 50, 100].map(val => (
                    <button 
                      key={val}
                      type="button"
                      onClick={() => setHours(val)}
                      className={`py-2 rounded-lg border text-xs sm:text-sm font-bold transition-all ${hours === val ? 'bg-[#C5A059] text-white border-[#C5A059]' : 'border-[#C5A059]/20 text-[#C5A059] hover:bg-[#C5A059]/5'}`}
                    >
                      +{val}
                    </button>
                  ))}
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 sm:py-4 rounded-xl charidy-gradient text-white font-bold text-base sm:text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      <CheckCircle2 size={18} className="sm:w-5 sm:h-5" />
                      <span>אישור והצטרפות</span>
                    </>
                  )}
                </button>
                
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-1 text-[#5A5A40] text-xs sm:text-sm font-medium hover:underline"
                >
                  ביטול
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

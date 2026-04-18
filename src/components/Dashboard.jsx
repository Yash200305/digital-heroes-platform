import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [scoresList, setScoresList] = useState([]);
  const [winData, setWinData] = useState(null); 
  const [score, setScore] = useState('');
  const [date, setDate] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const fetchScores = async (userId) => {
    const { data } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (data) setScoresList(data);
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) { 
        navigate('/login'); 
        return; 
      }
      setUser(session.user);

      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*, charities(name)')
        .eq('user_id', session.user.id)
        .single();
      setSubscription(subData);

      fetchScores(session.user.id);

      const { data: winRecord } = await supabase
        .from('winnings')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); 
      
      if (winRecord) {
        setWinData(winRecord);
      }
    };

    loadDashboardData();
  }, [navigate]);

  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    
    // PRD Section 04 Guard: Only Active subscribers can submit
    if (subscription?.status !== 'active') {
      setMessage({ text: 'Renew subscription to enter.', type: 'error' });
      return;
    }

    // PRD Section 05 Guard: Strict 1-45 Stableford Range
    const parsedScore = parseInt(score);
    if (parsedScore < 1 || parsedScore > 45) {
      setMessage({ text: 'Score must be between 1 and 45.', type: 'error' });
      return;
    }

    // 1. Insert the new score
    const { error: insertError } = await supabase
      .from('scores')
      .insert([{ user_id: user.id, score: parsedScore, date: date }]);

    if (insertError) {
      // Catch unique date constraint violation
      setMessage({ text: insertError.code === '23505' ? 'Score already logged for this date.' : insertError.message, type: 'error' });
      return; 
    }

    // 2. Fetch all scores for this user, ordered by date (newest first)
    const { data: allScores } = await supabase
      .from('scores')
      .select('id')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    // 3. PRD Section 05: Enforce rolling 5 limit by deleting excess scores
    if (allScores && allScores.length > 5) {
      const excessScores = allScores.slice(5);
      const excessIds = excessScores.map(s => s.id);

      await supabase
        .from('scores')
        .delete()
        .in('id', excessIds);
    }

    // 4. Update the UI
    setMessage({ text: 'Score logged successfully!', type: 'success' });
    setScore(''); 
    setDate('');
    fetchScores(user.id);
  };

  const simulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      alert("Proof submitted! Our team will verify and release your funds within 24 hours.");
    }, 2000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (!user || !subscription) return <div className="p-20 text-center font-black uppercase tracking-widest text-gray-300">Syncing Platform...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 pb-20">
      
      {/* User Header & Logout */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
          Hub Access: <span className="text-black">{user.email}</span>
        </p>
        <button 
          onClick={handleLogout}
          className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 transition"
        >
          Sign Out
        </button>
      </div>

      {/* 1. THE WINNER'S CIRCLE */}
      {winData && winData.payment_status === 'pending' && (
        <div className="bg-black text-white p-10 rounded-[2rem] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-700">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-2 text-center md:text-left">
              <span className="bg-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Verified Win</span>
              <h2 className="text-5xl font-black italic tracking-tighter uppercase">Winner's Circle</h2>
              <p className="text-gray-400 font-medium max-w-sm">Congratulations! You've matched {winData.match_tier} scores and unlocked a prize.</p>
            </div>
            
            <div className="bg-neutral-900 p-8 rounded-2xl border border-neutral-800 text-center">
              <p className="text-xs uppercase font-black text-gray-400 mb-1">Prize Unlocked</p>
              <p className="text-4xl font-black">${Number(winData.prize_amount).toFixed(2)}</p>
              <button 
                onClick={simulateUpload}
                disabled={isUploading}
                className="mt-6 px-8 py-3 bg-white text-black font-black rounded-xl uppercase tracking-widest text-[10px] hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Upload Proof & Claim'}
              </button>
            </div>
          </div>
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-600/30 rounded-full blur-[100px]"></div>
        </div>
      )}

      {/* 2. STATS ROW */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subscription</p>
          <h3 className="text-xl font-black text-gray-900 mt-1 capitalize">{subscription.plan}</h3>
          <p className="text-green-600 text-[10px] font-black mt-2 uppercase tracking-tighter italic">Status: {subscription.status}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selected Charity</p>
          <h3 className="text-xl font-black text-gray-900 mt-1">{subscription.charities?.name}</h3>
          <p className="text-blue-600 text-[10px] font-black mt-2 uppercase tracking-tighter italic">Impact: {subscription.charity_percentage}%</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Ranking</p>
          <h3 className="text-xl font-black text-gray-900 mt-1">Tier: Diamond</h3>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Score Form */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-black text-gray-900 mb-8 uppercase tracking-tighter">Submit Round</h2>
          <form onSubmit={handleScoreSubmit} className="space-y-4">
            <input 
              type="number" 
              required 
              min="1" 
              max="45"
              placeholder="STABLEFORD SCORE (1-45)" 
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="w-full px-6 py-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black outline-none font-black text-lg" 
            />
            <input type="date" required value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-6 py-5 bg-gray-50 border-none rounded-2xl outline-none font-black uppercase text-xs" />
            {message.text && <p className={`text-xs font-black uppercase ${message.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>{message.text}</p>}
            <button className="w-full py-5 bg-black text-white font-black rounded-2xl hover:opacity-90 transition shadow-xl uppercase tracking-[0.2em] text-xs">
              Lock into Pool
            </button>
          </form>
        </div>

        {/* Rolling 5 Scores */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Live Pool</h2>
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Latest 5 Only</span>
          </div>
          <div className="space-y-3">
            {scoresList.length > 0 ? scoresList.map(s => (
              <div key={s.id} className="flex justify-between items-center p-6 bg-gray-50 rounded-2xl group hover:bg-black hover:text-white transition-all duration-300">
                <span className="text-xs font-black uppercase tracking-widest opacity-40 group-hover:opacity-100">{new Date(s.date).toLocaleDateString()}</span>
                <span className="text-2xl font-black italic">{s.score} <span className="text-[10px] not-italic opacity-40">PTS</span></span>
              </div>
            )) : (
              <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                <p className="text-gray-300 font-black uppercase tracking-widest text-xs italic">No qualifying rounds found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
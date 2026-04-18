import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [charities, setCharities] = useState([]);
  const [winnings, setWinnings] = useState([]);
  const [drawResults, setDrawResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // PRD Section 11: Analytics State
  const [analytics, setAnalytics] = useState({ users: 0, prizePool: 0, charity: 0 });

  useEffect(() => {
    let isMounted = true;

    const loadAdminData = async () => {
      try {
        const [userRes, charityRes, winningsRes] = await Promise.all([
          supabase.from('users').select('*, subscriptions(*)'),
          supabase.from('charities').select('*'),
          supabase.from('winnings').select('*').order('created_at', { ascending: false })
        ]);

        if (isMounted) {
          if (userRes.data) setUsers(userRes.data);
          if (charityRes.data) setCharities(charityRes.data);
          if (winningsRes.data) setWinnings(winningsRes.data);

          // --- PRD Section 11: CALCULATE ANALYTICS ---
          const totalUsers = userRes.data ? userRes.data.length : 0;
          
          const totalPrize = winningsRes.data 
            ? winningsRes.data.reduce((sum, w) => sum + Number(w.prize_amount), 0) 
            : 0;

          // Calculate Charity: Active Users * $10 base fee * Their chosen percentage
          const totalCharity = userRes.data 
            ? userRes.data.reduce((sum, u) => {
                const sub = u.subscriptions?.[0];
                if (sub && sub.status === 'active') {
                  return sum + (10 * (sub.charity_percentage / 100));
                }
                return sum;
              }, 0)
            : 0;

          setAnalytics({ users: totalUsers, prizePool: totalPrize, charity: totalCharity });
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error loading admin data:", err);
      }
    };

    loadAdminData();
    return () => { isMounted = false; };
  }, []);

  const runDraw = async () => {
    const { data: eligibleUsers, error } = await supabase.rpc('get_eligible_users'); 
    
    if (error || !eligibleUsers || eligibleUsers.length === 0) {
      alert("No users are currently eligible (5 scores required).");
      return;
    }

    const { count } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const baseSubscriptionFee = 10; 
    const totalPrizePool = (count || 0) * baseSubscriptionFee;
    const match5Prize = totalPrizePool * 0.40; 

    const winner = eligibleUsers[Math.floor(Math.random() * eligibleUsers.length)];
    setDrawResults(winner);
    
    const { data: newWin, error: winError } = await supabase
      .from('winnings')
      .insert([{
        user_id: winner.id,
        match_tier: 5,
        prize_amount: match5Prize > 0 ? match5Prize : 500.00,
        payment_status: 'pending'
      }])
      .select()
      .single();
    
    if (!winError && newWin) {
      setWinnings([newWin, ...winnings]);
      // Update local analytics state instantly so Admin sees the number go up
      setAnalytics(prev => ({ ...prev, prizePool: prev.prizePool + Number(newWin.prize_amount) }));
      alert(`Draw Complete! Winner: ${winner.email} won $${match5Prize.toFixed(2)}`);
    }
  };

  const handleVerifyWin = async (winId) => {
    const { error } = await supabase
      .from('winnings')
      .update({ payment_status: 'paid' })
      .eq('id', winId);

    if (error) {
      alert("Error updating payment status.");
    } else {
      setWinnings(winnings.map(w => w.id === winId ? { ...w, payment_status: 'paid' } : w));
    }
  };

  const getUserEmail = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.email : 'Unknown User';
  };

  if (isLoading) return <div className="p-20 text-center font-black uppercase tracking-widest text-gray-300">Syncing Database...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 pb-20">
      <header className="flex justify-between items-end border-b-4 border-black pb-4">
        <h1 className="text-5xl font-black uppercase tracking-tighter italic text-gray-900">Admin Portal</h1>
        <div className="text-right">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Status: Operational</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Node V.1.0.7</p>
        </div>
      </header>

      {/* PRD SECTION 11: ANALYTICS ROW */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-black text-white p-6 rounded-2xl shadow-xl">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Users</p>
          <h3 className="text-4xl font-black mt-2">{analytics.users}</h3>
        </div>
        <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-xl">
          <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Charity Generated (Monthly)</p>
          <h3 className="text-4xl font-black mt-2">${analytics.charity.toFixed(2)}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">All-Time Prize Pool</p>
          <h3 className="text-4xl font-black mt-2 text-green-600">${analytics.prizePool.toFixed(2)}</h3>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Charity Registry */}
        <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <h2 className="text-xl font-black mb-6 uppercase tracking-widest text-gray-400">Charity Registry</h2>
          <div className="space-y-4 mb-8">
            <input 
              placeholder="ADD NEW CHARITY" 
              className="w-full p-4 bg-gray-50 rounded-xl outline-none font-bold border-2 border-transparent focus:border-black transition-all"
            />
            <button className="w-full py-4 bg-black text-white font-black rounded-xl uppercase tracking-widest shadow-lg active:scale-95 transition-all">
              Update Directory
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 flex-grow">
            {charities.map(c => (
              <div key={c.id} className="p-4 bg-gray-50 rounded-xl flex justify-between items-center font-bold text-xs uppercase">
                <span>{c.name}</span>
                <span className="text-[9px] text-green-600">Active</span>
              </div>
            ))}
          </div>
        </section>

        {/* Draw Execution */}
        <section className="bg-black text-white p-8 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <h2 className="text-xl font-black mb-6 uppercase tracking-widest text-gray-500">Draw Management</h2>
            <div className="p-8 border-2 border-dashed border-gray-700 rounded-2xl text-center bg-gray-900/40">
              <p className="text-[10px] text-gray-400 mb-8 font-bold uppercase tracking-[0.2em] leading-relaxed">
                Eligibility: 5 Rounds Logged <br />
                Logic: Tier-Based Randomization
              </p>
              <button 
                onClick={runDraw}
                className="w-full py-5 bg-white text-black font-black rounded-xl uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl"
              >
                Execute Monthly Draw
              </button>
            </div>
            {drawResults && (
              <div className="mt-6 p-5 bg-blue-600/20 border border-blue-500/50 rounded-xl animate-pulse">
                <p className="text-[9px] uppercase font-black text-blue-400 mb-2 tracking-widest">Selected Winner</p>
                <p className="font-black text-lg truncate">{drawResults.email}</p>
              </div>
            )}
          </div>
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
        </section>
      </div>

      {/* WINNER VERIFICATION QUEUE */}
      <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black uppercase tracking-widest text-blue-600">Verification Queue</h2>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PRD Section 09</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                <th className="pb-4">Winner Email</th>
                <th className="pb-4">Tier</th>
                <th className="pb-4">Prize</th>
                <th className="pb-4">Status</th>
                <th className="pb-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="font-bold text-sm">
              {winnings.length > 0 ? winnings.map(w => (
                <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-4 truncate pr-4">{getUserEmail(w.user_id)}</td>
                  <td className="py-4 text-xs">Match {w.match_tier}</td>
                  <td className="py-4 text-green-600">${Number(w.prize_amount).toFixed(2)}</td>
                  <td className="py-4">
                     <span className={`px-3 py-1 rounded-full text-[9px] uppercase font-black tracking-widest ${w.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                       {w.payment_status}
                     </span>
                  </td>
                  <td className="py-4 text-right">
                    {w.payment_status === 'pending' ? (
                      <button 
                        onClick={() => handleVerifyWin(w.id)}
                        className="px-4 py-2 bg-black text-white text-[9px] rounded uppercase font-black tracking-widest hover:bg-blue-600 transition-colors"
                      >
                        Approve
                      </button>
                    ) : (
                      <span className="text-[9px] uppercase text-gray-300 font-black tracking-widest">Verified</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-xs text-gray-400 uppercase tracking-widest font-bold">No draw history found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Subscription Registry */}
      <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-black mb-6 uppercase tracking-widest text-gray-400">Subscription Registry</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[500px]">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                <th className="pb-4">Member</th>
                <th className="pb-4">Plan</th>
                <th className="pb-4">Status</th>
              </tr>
            </thead>
            <tbody className="font-bold text-sm">
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-4 truncate pr-4">{u.email}</td>
                  <td className="py-4">
                     <span className="text-blue-500 uppercase text-[10px] tracking-wider">{u.subscriptions?.[0]?.plan || 'Lapsed'}</span>
                  </td>
                  <td className="py-4">
                     <span className={`px-3 py-1 rounded-full text-[9px] uppercase font-black tracking-widest ${u.subscriptions?.[0]?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                       {u.subscriptions?.[0]?.status || 'Inactive'}
                     </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
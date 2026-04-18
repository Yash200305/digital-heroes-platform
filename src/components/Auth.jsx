import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // PRD Requirements: Charity, Donation %, and Plan Selection
  const [charities, setCharities] = useState([]);
  const [selectedCharity, setSelectedCharity] = useState('');
  const [donationPercent, setDonationPercent] = useState(10);
  const [plan, setPlan] = useState('monthly');
  
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // 1. Fetch data on mount to avoid cascading render warnings
  useEffect(() => {
    const loadCharities = async () => {
      const { data, error } = await supabase.from('charities').select('*');
      if (!error && data) {
        setCharities(data);
        if (data.length > 0) setSelectedCharity(data[0].id);
      }
    };
    loadCharities();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        // Login Flow
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        // Signup Flow - PRD Section 04
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;

        if (authData.user) {
          // Record the subscription preferences and charity allocation
          const { error: subError } = await supabase.from('subscriptions').insert([{
            user_id: authData.user.id,
            plan: plan,
            status: 'active',
            charity_id: selectedCharity,
            charity_percentage: donationPercent
          }]);
          if (subError) throw subError;
        }
        navigate('/dashboard');
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[90vh] p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <h2 className="text-3xl font-black text-center text-gray-900 mb-8 uppercase tracking-tighter">
          {isLogin ? 'Welcome Back' : 'Join the Impact'}
        </h2>
        
        <form onSubmit={handleAuth} className="space-y-5">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black transition-all outline-none font-bold"
            placeholder="Email Address"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black transition-all outline-none font-bold"
            placeholder="Password"
          />

          {!isLogin && (
            <div className="pt-6 border-t border-gray-100 space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Select Charity</label>
                <select 
                  value={selectedCharity} 
                  onChange={(e) => setSelectedCharity(e.target.value)}
                  className="w-full px-4 py-4 bg-gray-50 border-none rounded-xl font-bold appearance-none cursor-pointer"
                >
                  {charities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">
                  Impact Donation: {donationPercent}%
                </label>
                <input 
                  type="range" min="10" max="100" step="5"
                  value={donationPercent}
                  onChange={(e) => setDonationPercent(e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                />
                <p className="text-[10px] text-blue-500 mt-2 font-bold uppercase tracking-widest">Minimum impact threshold reached</p>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setPlan('monthly')}
                  className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all uppercase text-xs tracking-widest ${plan === 'monthly' ? 'border-black bg-black text-white' : 'border-gray-100 text-gray-400'}`}
                >
                  Monthly
                </button>
                <button 
                  type="button"
                  onClick={() => setPlan('yearly')}
                  className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all uppercase text-xs tracking-widest ${plan === 'yearly' ? 'border-black bg-black text-white' : 'border-gray-100 text-gray-400'}`}
                >
                  Yearly
                </button>
              </div>
            </div>
          )}

          {message && <p className="text-red-500 text-xs text-center font-bold uppercase tracking-tight">{message}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-black text-white font-black rounded-xl hover:opacity-90 transition-all shadow-xl active:scale-[0.98] uppercase tracking-[0.2em]"
          >
            {isLoading ? 'SYNCING...' : (isLogin ? 'SECURE LOGIN' : 'CREATE ACCOUNT')}
          </button>
        </form>
        <div className="mt-6 flex justify-center items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
            Mocked Secure Payment via <span className="text-[#635BFF] bg-[#635BFF]/10 px-2 py-1 rounded">Stripe</span>
          </p>
        </div>

        <p className="mt-8 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
          {isLogin ? "New to the hub? " : "Already registered? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-black hover:underline">
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}
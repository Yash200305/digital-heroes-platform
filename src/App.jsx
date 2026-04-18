import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin'; // Importing the real Admin panel

const Home = () => (
  <div className="p-8 max-w-4xl mx-auto text-center mt-20">
    <h1 className="text-6xl font-black text-gray-900 mb-6 uppercase tracking-tighter italic">Digital Heroes</h1>
    <p className="text-xl text-gray-500 mb-10 font-medium">A modern platform driving charitable impact through sport.</p>
    <Link to="/login" className="px-10 py-5 bg-black text-white font-black rounded-2xl hover:bg-blue-600 transition-all shadow-2xl uppercase tracking-widest">
      Join the Impact
    </Link>
  </div>
);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100">
        {/* Navigation Bar */}
        <nav className="p-6 bg-white shadow-sm flex gap-10 justify-center items-center border-b border-gray-100">
          <Link to="/" className="font-black text-xl text-gray-900 tracking-tighter hover:text-blue-600 transition uppercase italic">
            Digital Heroes
          </Link>
          <div className="flex gap-8 items-center">
            <Link to="/login" className="text-xs uppercase font-black tracking-widest text-gray-400 hover:text-black transition">Login</Link>
            <Link to="/dashboard" className="text-xs uppercase font-black tracking-widest text-gray-400 hover:text-black transition">Dashboard</Link>
            <Link to="/admin" className="text-[10px] uppercase font-black tracking-widest px-3 py-1 bg-gray-100 rounded-md text-gray-400 hover:bg-black hover:text-white transition">Admin</Link>
          </div>
        </nav>

        {/* Page Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
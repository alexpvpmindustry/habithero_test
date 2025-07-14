import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Game from './components/Game';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

function App() {
  const [session, setSession] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session && _event === 'SIGNED_IN') {
        axios.post(`${import.meta.env.VITE_BACKEND_URL}/login-reward`, {}, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }).catch(console.error);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <header>
        <nav className="container mx-auto">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">My App</h1>
            <div className="hidden md:flex space-x-6">
              {session ? (
                <>
                  <Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                  <Link to="/profile" className="hover:text-primary transition-colors">Profile</Link>
                  <Link to="/game" className="hover:text-primary transition-colors">Game</Link>
                  <button onClick={() => supabase.auth.signOut()} className="hover:text-primary transition-colors">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="hover:text-primary transition-colors">Login</Link>
                  <Link to="/signup" className="hover:text-primary transition-colors">Sign Up</Link>
                </>
              )}
            </div>
            <button 
              className="md:hidden focus:outline-none" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>
          {isMenuOpen && (
            <div className="md:hidden bg-secondary py-2">
              {session ? (
                <>
                  <Link to="/dashboard" className="block px-4 py-2 hover:text-primary transition-colors">Dashboard</Link>
                  <Link to="/profile" className="block px-4 py-2 hover:text-primary transition-colors">Profile</Link>
                  <Link to="/game" className="block px-4 py-2 hover:text-primary transition-colors">Game</Link>
                  <button onClick={() => supabase.auth.signOut()} className="block px-4 py-2 hover:text-primary transition-colors w-full text-left">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block px-4 py-2 hover:text-primary transition-colors">Login</Link>
                  <Link to="/signup" className="block px-4 py-2 hover:text-primary transition-colors">Sign Up</Link>
                </>
              )}
            </div>
          )}
        </nav>
      </header>
      <main className="container mx-auto">
        <Routes>
          <Route path="/login" element={!session ? <Login supabase={supabase} /> : <Navigate to="/dashboard" />} />
          <Route path="/signup" element={!session ? <Signup supabase={supabase} /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={session ? <Dashboard supabase={supabase} session={session} /> : <Navigate to="/login" />} />
          <Route path="/profile" element={session ? <Profile session={session} /> : <Navigate to="/login" />} />
          <Route path="/game" element={session ? <Game session={session} /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={session ? "/dashboard" : "/login"} />} />
        </Routes>
      </main>
      <footer>
        <p>© {new Date().getFullYear()} My App. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
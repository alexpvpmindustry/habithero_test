import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session && _event === 'SIGNED_IN') {
        // Trigger login reward
        axios.post(`${import.meta.env.VITE_BACKEND_URL}/login-reward`, {}, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }).catch(console.error);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={!session ? <Login supabase={supabase} /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={!session ? <Signup supabase={supabase} /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={session ? <Dashboard supabase={supabase} session={session} /> : <Navigate to="/login" />} />
        <Route path="/profile" element={session ? <Profile session={session} /> : <Navigate to="/login" />} />
        <Route path="/game" element={session ? <Game session={session} /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={session ? "/dashboard" : "/login"} />} />
      </Routes>
    </div>
  );
}

export default App;
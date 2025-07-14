import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Dashboard = ({ session }) => {
  const [profile, setProfile] = useState({ tokens: 0, current_streak: 0 });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/profile`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      setProfile(data);
    };
    fetchProfile();
  }, [session]);

  const completeTask = async (type) => {
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/complete-task`, { task_type: type }, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      setProfile({ ...profile, tokens: data.tokens });
      alert('Task completed!');
    } catch (err) {
      alert(err.response?.data.message || 'Error');
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome! Your tokens: {profile.tokens} | Streak: {profile.current_streak}</p>
      <h2>Daily Reminders</h2>
      <ul>
        <li>Drink water <button onClick={() => completeTask('drink_water')}>Log Completion</button></li>
        <li>Go for a walk <button onClick={() => completeTask('walk')}>Log Completion</button></li>
        <li>Play game <Link to="/game">Go to Game</Link></li>
      </ul>
      <Link to="/profile">View Profile</Link> | <button onClick={() => supabase.auth.signOut()}>Logout</button>
    </div>
  );
};

export default Dashboard;
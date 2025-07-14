import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Dashboard = ({ session, supabase }) => {
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
      setProfile({ ...profile, tokens: data.tokens }); // Update profile with new tokens
      if (type === 'drink_water' && data.message === 'Task already completed today') {
        alert('You have already drank water today!');
      } else {
        alert('Task completed!');
      }
    } catch (err) {
      alert(err.response?.data.message || 'Error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h1 className="text-3xl font-bold text-secondary mb-6">Dashboard</h1>
      <div className="card mb-6">
        <p className="text-lg text-gray-600">
          Welcome! Your tokens: <span className="font-semibold">{profile.tokens}</span> | Streak: <span className="font-semibold">{profile.current_streak} days</span>
        </p>
      </div>
      <h2 className="text-2xl font-semibold text-secondary mb-4">Daily Reminders</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary mb-2">Drink Water</h3>
          <p className="text-gray-600 mb-4">Stay hydrated!</p>
          <button onClick={() => completeTask('drink_water')}>Log Completion</button>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary mb-2">Go for a Walk</h3>
          <p className="text-gray-600 mb-4">Get some fresh air!</p>
          <button onClick={() => completeTask('walk')}>Log Completion</button>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary mb-2">Play Game</h3>
          <p className="text-gray-600 mb-4">Test your memory!</p>
          <Link to="/game" className="inline-block bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-600 transition duration-300 shadow-md">Go to Game</Link>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary mb-2">Laugh Out Loud</h3>
          <p className="text-gray-600 mb-4">Have a good laugh!</p>
          <button onClick={() => completeTask('laugh')}>Log Completion</button>
        </div>
      </div>
      <div className="mt-6 flex space-x-4">
        <Link to="/profile" className="text-primary hover:underline">View Profile</Link>
        <button onClick={() => supabase.auth.signOut()}>Logout</button>
      </div>
    </div>
  );
};

export default Dashboard;
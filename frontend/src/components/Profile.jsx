import { useState, useEffect } from 'react';
import axios from 'axios';

const Profile = ({ session }) => {
  const [profile, setProfile] = useState({ tokens: 0, current_streak: 0, badges: [], milestones: [] });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/profile`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      setProfile(data);
    };
    fetchProfile();
  }, [session]);

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h1 className="text-3xl font-bold text-secondary mb-6">Profile</h1>
      <div className="card mb-6">
        <p className="text-lg text-gray-600 mb-2">Tokens: <span className="font-semibold">{profile.tokens}</span></p>
        <p className="text-lg text-gray-600">Current Streak: <span className="font-semibold">{profile.current_streak} days</span></p>
      </div>
      <h2 className="text-2xl font-semibold text-secondary mb-4">Badges</h2>
      <div className="grid">
        {profile.badges.length > 0 ? (
          profile.badges.map((badge) => (
            <div key={badge} className="card">
              <p className="text-gray-600">{badge}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No badges earned yet.</p>
        )}
      </div>
      <h2 className="text-2xl font-semibold text-secondary mb-4 mt-6">Milestones</h2>
      <div className="grid">
        {profile.milestones.length > 0 ? (
          profile.milestones.map((milestone) => (
            <div key={milestone} className="card">
              <p className="text-gray-600">{milestone}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No milestones achieved yet.</p>
        )}
      </div>
    </div>
  );
};

export default Profile;
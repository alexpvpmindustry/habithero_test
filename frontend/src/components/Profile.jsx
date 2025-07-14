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
    <div>
      <h1>Profile</h1>
      <p>Tokens: {profile.tokens}</p>
      <p>Current Streak: {profile.current_streak} days</p>
      <h2>Badges</h2>
      <ul>{profile.badges.map((badge) => <li key={badge}>{badge}</li>)}</ul>
      <h2>Milestones</h2>
      <ul>{profile.milestones.map((milestone) => <li key={milestone}>{milestone}</li>)}</ul>
    </div>
  );
};

export default Profile;
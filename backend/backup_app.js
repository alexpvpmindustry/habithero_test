const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

console.log('Running');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  global: {
    fetch: (...args) => fetch(...args)
  }
});

// Middleware to verify user (expects JWT from frontend)
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error) return res.status(401).json({ error: 'Invalid token' });
  req.user = user;
  next();
};

// Get profile
app.get('/profile', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.user.id)
    .single();
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// Handle daily login (called after successful login)
app.post('/login-reward', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];

  // Check if already logged today
  const { data: log, error: logError } = await supabase
    .from('task_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('task_type', 'login')
    .eq('completed_at', today)
    .single();

  if (log) return res.json({ message: 'Already rewarded today' });
  if (logError && logError.code !== 'PGRST116') return res.status(500).json({ error: logError });

  // Get current profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tokens, current_streak, last_login')
    .eq('id', userId)
    .single();
  if (profileError) return res.status(500).json({ error: profileError });

  // Update streak
  let newStreak = 1;
  if (profile.last_login) {
    const lastDate = new Date(profile.last_login);
    const diff = (new Date(today) - lastDate) / (1000 * 60 * 60 * 24);
    if (diff === 1) newStreak = profile.current_streak + 1;
  }

  // Award tokens
  const newTokens = profile.tokens + 10;

  // Update profile and log
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ tokens: newTokens, current_streak: newStreak, last_login: today })
    .eq('id', userId);
  if (updateError) return res.status(500).json({ error: updateError });

  await supabase.from('task_logs').insert({ user_id: userId, task_type: 'login', completed_at: today });

  // Check and award badges/milestones
  await awardBadgesAndMilestones(supabase, userId, newTokens, newStreak);

  res.json({ message: 'Login rewarded', tokens: newTokens, streak: newStreak });
});

// Complete task (drink_water, walk, game)
app.post('/complete-task', authMiddleware, async (req, res) => {
  const { task_type } = req.body;
  if (!['drink_water', 'walk', 'game'].includes(task_type)) return res.status(400).json({ error: 'Invalid task' });

  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];

  // Check if already completed today
  const { data: log, error: logError } = await supabase
    .from('task_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('task_type', task_type)
    .eq('completed_at', today)
    .single();

  if (log) return res.json({ message: 'Task already completed today' });
  if (logError && logError.code !== 'PGRST116') return res.status(500).json({ error: logError });

  // Get current tokens
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tokens')
    .eq('id', userId)
    .single();
  if (profileError) return res.status(500).json({ error: profileError });

  // Award tokens based on task
  let reward = 0;
  if (task_type === 'drink_water') reward = 5;
  else if (task_type === 'walk') reward = 10;
  else if (task_type === 'game') reward = 20;

  const newTokens = profile.tokens + reward;

  // Update tokens and log
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ tokens: newTokens })
    .eq('id', userId);
  if (updateError) return res.status(500).json({ error: updateError });

  await supabase.from('task_logs').insert({ user_id: userId, task_type, completed_at: today });

  // Check badges/milestones (streak not affected)
  await awardBadgesAndMilestones(supabase, userId, newTokens, null);

  res.json({ message: 'Task completed', tokens: newTokens });
});

// Helper to award badges and milestones
async function awardBadgesAndMilestones(supabase, userId, tokens, streak) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('badges, milestones, current_streak')
    .eq('id', userId)
    .single();
  if (error) return;

  let newBadges = [...profile.badges];
  let newMilestones = [...profile.milestones];
  let updated = false;

  // Badges and milestones for tokens
  if (tokens >= 100 && !newBadges.includes('Centurion')) {
    newBadges.push('Centurion');
    newMilestones.push('Reached 100 tokens');
    updated = true;
  }

  // For streak (only if streak provided)
  const currentStreak = streak || profile.current_streak;
  if (currentStreak >= 7 && !newBadges.includes('Week Streaker')) {
    newBadges.push('Week Streaker');
    newMilestones.push('Achieved 7-day streak');
    updated = true;
  }

  if (updated) {
    await supabase
      .from('profiles')
      .update({ badges: newBadges, milestones: newMilestones })
      .eq('id', userId);
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
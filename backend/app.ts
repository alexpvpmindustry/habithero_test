import { createClient } from "@supabase/supabase-js";
import { load } from "https://deno.land/std@0.224.0/dotenv/load.ts";

await load({ export: true });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  global: {
    fetch: (...args) => fetch(...args),
  },
});

const PORT = Number(Deno.env.get("PORT") || 5000);

async function awardBadgesAndMilestones(
  supabase: any,
  userId: string,
  tokens: number,
  streak: number | null,
) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("badges, milestones, current_streak")
    .eq("id", userId)
    .single();
  if (error) return;

  let newBadges = [...profile.badges];
  let newMilestones = [...profile.milestones];
  let updated = false;

  // Badges and milestones for tokens
  if (tokens >= 100 && !newBadges.includes("Centurion")) {
    newBadges.push("Centurion");
    newMilestones.push("Reached 100 tokens");
    updated = true;
  }

  // For streak (only if streak provided)
  const currentStreak = streak !== null ? streak : profile.current_streak;
  if (currentStreak >= 7 && !newBadges.includes("Week Streaker")) {
    newBadges.push("Week Streaker");
    newMilestones.push("Achieved 7-day streak");
    updated = true;
  }

  if (updated) {
    await supabase
      .from("profiles")
      .update({ badges: newBadges, milestones: newMilestones })
      .eq("id", userId);
  }
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  const contentHeaders = new Headers(corsHeaders);
  contentHeaders.set("Content-Type", "application/json");

  // Middleware-like auth check function
  async function authenticate(): Promise<any | Response> {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "No token provided" }), { status: 401, headers: contentHeaders });
    }
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: contentHeaders });
    }
    return user;
  }

  if (req.method === "GET" && path === "/profile") {
    const authResult = await authenticate();
    if (authResult instanceof Response) return authResult;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authResult.id)
      .single();
    if (error) {
      return new Response(JSON.stringify({ error }), { status: 500, headers: contentHeaders });
    }
    return new Response(JSON.stringify(data), { headers: contentHeaders });
  }

  if (req.method === "POST" && path === "/login-reward") {
    const authResult = await authenticate();
    if (authResult instanceof Response) return authResult;
    const userId = authResult.id;

    const today = new Date().toISOString().split("T")[0];

    // Check if already logged today
    const { data: log, error: logError } = await supabase
      .from("task_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("task_type", "login")
      .eq("completed_at", today)
      .single();

    if (log) {
      return new Response(JSON.stringify({ message: "Already rewarded today" }), { headers: contentHeaders });
    }
    if (logError && logError.code !== "PGRST116") {
      return new Response(JSON.stringify({ error: logError }), { status: 500, headers: contentHeaders });
    }

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tokens, current_streak, last_login")
      .eq("id", userId)
      .single();
    if (profileError) {
      return new Response(JSON.stringify({ error: profileError }), { status: 500, headers: contentHeaders });
    }

    // Update streak
    let newStreak = 1;
    if (profile.last_login) {
      const lastDate = new Date(profile.last_login);
      const diff = (new Date(today).getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) newStreak = profile.current_streak + 1;
    }

    // Award tokens
    const newTokens = profile.tokens + 10;

    // Update profile and log
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ tokens: newTokens, current_streak: newStreak, last_login: today })
      .eq("id", userId);
    if (updateError) {
      return new Response(JSON.stringify({ error: updateError }), { status: 500, headers: contentHeaders });
    }

    await supabase.from("task_logs").insert({ user_id: userId, task_type: "login", completed_at: today });

    // Check and award badges/milestones
    await awardBadgesAndMilestones(supabase, userId, newTokens, newStreak);

    return new Response(JSON.stringify({ message: "Login rewarded", tokens: newTokens, streak: newStreak }), { headers: contentHeaders });
  }

  if (req.method === "POST" && path === "/complete-task") {
    const authResult = await authenticate();
    if (authResult instanceof Response) return authResult;
    const userId = authResult.id;

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: contentHeaders });
    }
    const { task_type } = body;
    if (!["drink_water", "walk", "game"].includes(task_type)) {
      return new Response(JSON.stringify({ error: "Invalid task" }), { status: 400, headers: contentHeaders });
    }

    const today = new Date().toISOString().split("T")[0];

    // Check if already completed today
    const { data: log, error: logError } = await supabase
      .from("task_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("task_type", task_type)
      .eq("completed_at", today)
      .single();

    if (log) {
      return new Response(JSON.stringify({ message: "Task already completed today" }), { headers: contentHeaders });
    }
    if (logError && logError.code !== "PGRST116") {
      return new Response(JSON.stringify({ error: logError }), { status: 500, headers: contentHeaders });
    }

    // Get current tokens
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tokens")
      .eq("id", userId)
      .single();
    if (profileError) {
      return new Response(JSON.stringify({ error: profileError }), { status: 500, headers: contentHeaders });
    }

    // Award tokens based on task
    let reward = 0;
    if (task_type === "drink_water") reward = 5;
    else if (task_type === "walk") reward = 10;
    else if (task_type === "game") reward = 20;

    const newTokens = profile.tokens + reward;

    // Update tokens and log
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ tokens: newTokens })
      .eq("id", userId);
    if (updateError) {
      return new Response(JSON.stringify({ error: updateError }), { status: 500, headers: contentHeaders });
    }

    await supabase.from("task_logs").insert({ user_id: userId, task_type, completed_at: today });

    // Check badges/milestones (streak not affected)
    await awardBadgesAndMilestones(supabase, userId, newTokens, null);

    return new Response(JSON.stringify({ message: "Task completed", tokens: newTokens }), { headers: contentHeaders });
  }

  return new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers: contentHeaders });
};

Deno.serve({ port: PORT }, handler);
console.log(`Server running on port ${PORT}`);
// src/App.tsx
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const APP_URL = import.meta.env.VITE_APP_URL ?? window.location.origin;

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [workouts, setWorkouts] = useState<any[]>([]);
  const today = new Date().toISOString().slice(0, 10);

  // Po powrocie z OAuth: obsłuż PKCE (?code=...) i implicit (#access_token=...)
  useEffect(() => {
    (async () => {
      try {
        // 1) PKCE: ?code=...
        if (window.location.search.includes('code=')) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.search);
          if (error) console.error('exchangeCodeForSession error:', error.message);
          // wyczyść query z URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        // 2) Implicit: #access_token=..., #refresh_token=...
        if (window.location.hash.includes('access_token=')) {
          const params = new URLSearchParams(window.location.hash.slice(1));
          const access_token = params.get('access_token') ?? undefined;
          const refresh_token = params.get('refresh_token') ?? undefined;

          if (access_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) console.error('setSession error:', error.message);
          }

          // wyczyść hash z URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {
        console.error(e);
      } finally {
        // Zawsze pobierz aktualną sesję po próbie wymiany/ustawienia
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
      }
    })();

    // subskrypcja zmian sesji
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // logowanie: magic link
  const signInMagic = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: APP_URL },
    });
    if (error) alert(error.message);
    else alert('Link wysłany. Sprawdź pocztę.');
  };

  // logowanie: Google
  const signInGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: APP_URL },
    });
    if (error) alert(error.message);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // dodanie testowego treningu
  const addWorkout = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Najpierw się zaloguj.');
    const { error } = await supabase
      .from('workouts')
      .insert([{ user_id: user.id, date: today, notes: 'test z frontu' }]);
    if (error) alert(error.message);
    else loadWorkouts();
  };

  // pobranie ostatnich treningów
  const loadWorkouts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('workouts')
      .select('id,date,notes')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(10);
    if (error) alert(error.message);
    else setWorkouts(data || []);
  };

  useEffect(() => {
    if (session) loadWorkouts();
  }, [session]);

  if (!session) {
    return (
      <div style={{ maxWidth: 420, margin: '60px auto', fontFamily: 'ui-sans-serif' }}>
        <h2>Logowanie</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          <input
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button onClick={signInMagic}>Zaloguj magic linkiem</button>
          <button onClick={signInGoogle}>Zaloguj przez Google</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'ui-sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Witaj w Fitness UI</h2>
        <button onClick={signOut}>Wyloguj</button>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span>Dzisiejsza data: <b>{today}</b></span>
        <button onClick={addWorkout}>+ Dodaj trening (test)</button>
        <button onClick={loadWorkouts}>⟳ Odśwież</button>
      </div>

      <h3>Ostatnie treningi</h3>
      <ul>
        {workouts.map((w) => (
          <li key={w.id}>
            <b>{w.date}</b>{w.notes ? ` — ${w.notes}` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}

// src/App.tsx
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

// Absolutny adres Twojej aplikacji (ustaw w Vercel env: VITE_APP_URL)
// Fallback: aktualny origin strony.
const APP_URL = import.meta.env.VITE_APP_URL ?? window.location.origin;

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [workouts, setWorkouts] = useState<any[]>([]);
  const today = new Date().toISOString().slice(0, 10);

  // nasłuch stanu sesji
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  // logowanie: magic link
  const signInMagic = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: APP_URL }, // ważne: pełny URL
    });
    if (error) alert(error.message);
    else alert('Link wysłany. Sprawdź pocztę.');
  };

  // logowanie: Google
  const signInGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: APP_URL }, // ważne: pełny URL
    });
    if (error) alert(error.message);
  };

  const signOut = async () => {
    await supab

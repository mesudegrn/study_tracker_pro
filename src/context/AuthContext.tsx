import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, semesterStartDate: string) => Promise<{ error: string | null; requiresEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    void supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) console.error('Unable to restore authentication session:', error.message);
        setSession(data.session);
        setLoading(false);
      })
      .catch((error: unknown) => {
        console.error('Unable to restore authentication session:', error);
        setLoading(false);
      });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string, semesterStartDate: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name.trim(), semester_start_date: semesterStartDate } },
      });
      if (error) {
        console.error('Unable to create account:', error.message);
        return { error: error.message, requiresEmailConfirmation: false };
      }
      if (data.session) {
        setSession(data.session);
        setLoading(false);
      }
      return { error: null, requiresEmailConfirmation: !data.session };
    } catch (error) {
      console.error('Unable to create account:', error);
      return { error: error instanceof Error ? error.message : 'Unable to create account.', requiresEmailConfirmation: false };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Unable to sign in:', error.message);
        return { error: error.message };
      }
      if (!data.session) {
        const message = 'Sign-in succeeded, but no session was returned. Please try again.';
        console.error(message);
        return { error: message };
      }
      setSession(data.session);
      setLoading(false);
      return { error: null };
    } catch (error) {
      console.error('Unable to sign in:', error);
      return { error: error instanceof Error ? error.message : 'Unable to sign in.' };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Unable to sign out:', error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

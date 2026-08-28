"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type EditorContextType = {
  profile: any;
  districtId: string | null;
  loading: boolean;
};

const EditorContext = createContext<EditorContextType>({ profile: null, districtId: null, loading: true });

export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile] = useState<any>(null);
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) {
      setProfile(data);
      setDistrictId(data.district_id);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Use getSession() first (no network call, reads from cookie) for speed
    // then verify with getUser() in background for security
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        loadProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setDistrictId(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <EditorContext.Provider value={{ profile, districtId, loading }}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => useContext(EditorContext);

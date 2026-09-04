"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type EditorContextType = {
  profile: any;
  districtId: string | null;
  loading: boolean;
};

const EditorContext = createContext<EditorContextType>({ profile: null, districtId: null, loading: true });

const CACHE_KEY = 'editor_profile_cache';

export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
  // Try to load from cache immediately (synchronous) to avoid blank flash
  const getCachedProfile = () => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  };

  const cached = typeof window !== 'undefined' ? getCachedProfile() : null;

  const [profile, setProfile] = useState<any>(cached);
  const [districtId, setDistrictId] = useState<string | null>(cached?.district_id ?? null);
  const [loading, setLoading] = useState(!cached); // if cache hit → not loading

  const loadProfile = async (userId: string) => {
    // Check cache first
    const cached = getCachedProfile();
    if (cached && cached.id === userId) {
      setProfile(cached);
      setDistrictId(cached.district_id);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile(data);
      setDistrictId(data.district_id);
      // Save to sessionStorage for this browser session
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
    }
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Clear cache on new sign-in so fresh profile is fetched
        try { sessionStorage.removeItem(CACHE_KEY); } catch {}
        loadProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        try { sessionStorage.removeItem(CACHE_KEY); } catch {}
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

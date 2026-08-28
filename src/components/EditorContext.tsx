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

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setProfile(data);
          setDistrictId(data.district_id);
        }
      }
      setLoading(false);
    };
    fetchProfile();

    // Listen to auth state changes (e.g. when a new tab logs in)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        fetchProfile();
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setDistrictId(null);
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

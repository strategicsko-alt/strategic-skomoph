"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

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
  const supabase = createClient();

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
  }, []);

  return (
    <EditorContext.Provider value={{ profile, districtId, loading }}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => useContext(EditorContext);

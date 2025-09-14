import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Material {
  id: string;
  course_id: string;
  title: string;
  type: 'pdf' | 'doc' | 'video' | 'suggestion' | 'past_question';
  category: 'notes' | 'suggestions' | 'super-tips' | 'slides' | 'ct-questions' | 'videos' | 'other';
  file_url?: string;
  video_url?: string;
  description?: string;
  created_at: string;
  size?: string;
}

export function useMaterials(courseId?: string) {
  const [materials, setMaterials] = useState<Material[]>([]);

  // fallback: load from localStorage if Supabase fails
  function getLocalMaterials(): Material[] {
    try {
      const stored = localStorage.getItem('bubt-materials');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  function saveLocalMaterials(materials: Material[]) {
    try {
      localStorage.setItem('bubt-materials', JSON.stringify(materials));
    } catch (error) {
      console.error('Failed to save materials:', error);
    }
  }

  useEffect(() => {
    let isMounted = true;
    async function fetchMaterials() {
      let query = supabase.from('materials').select('*').order('created_at', { ascending: false });
      if (courseId) {
        query = query.eq('course_id', courseId);
      }
      const { data, error } = await query;
      if (!error && isMounted) {
        setMaterials(data || []);
      } else if (isMounted) {
        // fallback to local cache if error
        const local = getLocalMaterials();
        setMaterials(courseId ? local.filter((m: Material) => m.course_id === courseId) : local);
      }
    }
    fetchMaterials();
    return () => { isMounted = false; };
  }, [courseId]);

  const addMaterial = async (material: Material) => {
    const { error } = await supabase.from('materials').insert([material]);
    if (!error) {
      setMaterials(prev => [material, ...prev]);
    } else {
      // fallback to local cache
      const local = [material, ...getLocalMaterials()];
      saveLocalMaterials(local);
      setMaterials(local);
    }
  };

  const removeMaterial = async (materialId: string) => {
    await supabase.from('materials').delete().eq('id', materialId);
    setMaterials(prev => prev.filter(m => m.id !== materialId));
    // Also update local cache
    const local = getLocalMaterials().filter((m: Material) => m.id !== materialId);
    saveLocalMaterials(local);
  };

  const updateMaterial = async (materialId: string, updates: Partial<Material>) => {
    await supabase.from('materials').update(updates).eq('id', materialId);
    setMaterials(prev => prev.map(m => m.id === materialId ? { ...m, ...updates } : m));
    // Also update local cache
    const local = getLocalMaterials().map((m: Material) => m.id === materialId ? { ...m, ...updates } : m);
    saveLocalMaterials(local);
  };

  return {
    materials,
    addMaterial,
    removeMaterial,
    updateMaterial
  };
}

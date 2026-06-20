import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { X, Plus, Trash2, AlertTriangle, Save, Clock, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, supabaseConfigured } from '../../lib/supabase';

export type RoutineType = 'regular' | 'improvement' | 'retake';

type ClassMode = 'theory' | 'lab';

type Day = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

interface RoutineEntry {
  id: string;
  title: string;
  courseCode?: string;
  type: RoutineType;
  mode: ClassMode;
  day: Day;
  start: string; // HH:MM 24h
  end: string;   // HH:MM 24h
  room?: string;
  section?: string;
  teacher?: string;
  linkedTo?: string; // ID of linked entry for split 3hr labs
  createdAt: number;
}

interface CustomRoutineProps {
  onClose: () => void;
  isDarkMode: boolean;
}

// Only active days; Fri/Sat are closed
const DAYS: Day[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
const START_TIME = '08:00';
const END_TIME = '17:45';
const START_MINUTES = toMinutes(START_TIME);
const END_MINUTES = toMinutes(END_TIME);
const SLOT_MINUTES = 90; // 1h30 per slot
const BREAK_START = '12:45';
const BREAK_END = '13:15'

const format12h = (hhmm: string) => {
  const [hRaw, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(hRaw) || Number.isNaN(m)) return hhmm;
  const suffix = hRaw >= 12 ? 'PM' : 'AM';
  const h12 = ((hRaw + 11) % 12) + 1;
  return `${String(h12)}:${String(m).padStart(2, '0')} ${suffix}`;
};

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function overlaps(a: RoutineEntry, b: RoutineEntry): boolean {
  if (a.day !== b.day) return false;
  const s1 = toMinutes(a.start); const e1 = toMinutes(a.end);
  const s2 = toMinutes(b.start); const e2 = toMinutes(b.end);
  return Math.max(s1, s2) < Math.min(e1, e2);
}

function resolveVisibility(entries: RoutineEntry[]): { visible: Set<string>; conflicts: Record<string, string[]>; deemphasize: Set<string> } {
  const visible = new Set<string>(entries.map(e => e.id));
  const conflicts: Record<string, string[]> = {};
  const deemphasize = new Set<string>();

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i];
      const b = entries[j];
      if (!overlaps(a, b)) continue;
      // Track conflicts
      conflicts[a.id] = conflicts[a.id] || [];
      conflicts[b.id] = conflicts[b.id] || [];
      conflicts[a.id].push(b.id);
      conflicts[b.id].push(a.id);

      // Visibility rule:
      // - If one is regular and the other improvement/retake, show both but deemphasize the non-regular
      // - If same-level, keep earliest and hide newer
      const priority = (t: RoutineType) => (t === 'regular' ? 2 : 1);
      const pa = priority(a.type);
      const pb = priority(b.type);
      if (pa !== pb) {
        if (pa > pb) deemphasize.add(b.id); else deemphasize.add(a.id);
      } else {
        if (a.createdAt <= b.createdAt) visible.delete(b.id); else visible.delete(a.id);
      }
    }
  }
  return { visible, conflicts, deemphasize };
}

function enforceOverlapConstraints(entries: RoutineEntry[]): RoutineEntry[] {
  const byDay: Record<Day, RoutineEntry[]> = {
    Sun: [], Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: []
  };
  entries.forEach(e => byDay[e.day].push(e));

  const kept: RoutineEntry[] = [];

  (Object.keys(byDay) as Day[]).forEach(day => {
    const dayEntries = byDay[day].slice().sort((a, b) => {
      const diff = toMinutes(a.start) - toMinutes(b.start);
      if (diff !== 0) return diff;
      return a.createdAt - b.createdAt;
    });

    const active: RoutineEntry[] = [];
    dayEntries.forEach(entry => {
      const start = toMinutes(entry.start);
      // Drop finished entries from active window
      for (let i = active.length - 1; i >= 0; i--) {
        if (toMinutes(active[i].end) <= start) {
          active.splice(i, 1);
        }
      }

      const overlapping = active.filter(a => toMinutes(a.end) > start);
      const regularCount = overlapping.filter(e => e.type === 'regular').length + (entry.type === 'regular' ? 1 : 0);
      const nonRegularCount = overlapping.filter(e => e.type !== 'regular').length + (entry.type !== 'regular' ? 1 : 0);
      const total = overlapping.length + 1;

      // Enforce: max 2 total, and at most 1 regular + 1 improvement/retake
      if (total > 2) return;
      if (entry.type === 'regular' && regularCount > 1) return;
      if (entry.type !== 'regular' && nonRegularCount > 1) return;

      active.push(entry);
      kept.push(entry);
    });
  });

  return kept;
}

export default function CustomRoutine({ onClose, isDarkMode }: CustomRoutineProps) {
  const [entries, setEntries] = useState<RoutineEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('customRoutineEntries');
      if (raw) {
        const parsed = JSON.parse(raw) as RoutineEntry[];
        return enforceOverlapConstraints(parsed);
      }
    } catch (err) {
      console.warn('Failed to parse saved routine from localStorage', err);
    }
    return [];
  });
  const [isLoadingFromDb, setIsLoadingFromDb] = useState(true);

  // Load entries from Supabase on mount
  useEffect(() => {
    const loadFromDatabase = async () => {
      if (!supabaseConfigured) {
        setIsLoadingFromDb(false);
        return;
      }

      try {
        // Get device-based user ID
        const deviceUserId = localStorage.getItem('customRoutineDeviceId');
        if (!deviceUserId) {
          // No device ID yet, use localStorage data
          setIsLoadingFromDb(false);
          return;
        }

        console.log('📥 [Load] Loading from Supabase for device', deviceUserId);
        const { data, error } = await supabase
          .from('custom_routines')
          .select('*')
          .eq('user_id', deviceUserId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          console.log('📥 [Load] Loaded', data.length, 'entries from cloud');
          const loadedEntries: RoutineEntry[] = data.map((row: any) => ({
            id: row.entry_id,
            title: row.title,
            courseCode: row.course_code || undefined,
            type: row.type as RoutineType,
            mode: row.mode as ClassMode,
            day: row.day as Day,
            start: row.start_time,
            end: row.end_time,
            room: row.room || undefined,
            section: row.section || undefined,
            teacher: row.teacher || undefined,
            linkedTo: row.linked_to || undefined,
            createdAt: new Date(row.created_at).getTime()
          }));
          persistEntries(loadedEntries, { sync: false });
        }
      } catch (err) {
        console.error('Error loading from database:', err);
        // Fallback: keep whatever is already in state (likely localStorage)
      } finally {
        setIsLoadingFromDb(false);
      }
    };
    loadFromDatabase();
  }, []);

  const syncToDatabase = useCallback(async (entriesOverride?: RoutineEntry[]) => {
    const list = entriesOverride ?? entries;
    console.log('🔄 [Sync] Starting cloud sync', { supabaseConfigured, entryCount: list.length });
    
    if (!supabaseConfigured) {
      console.log('ℹ️ [Sync] Supabase not configured - skipping cloud sync');
      return false;
    }

    try {
      setIsSyncing(true);

      // Get or create device-based user ID
      let deviceUserId = localStorage.getItem('customRoutineDeviceId');
      if (!deviceUserId) {
        deviceUserId = `device_${crypto.randomUUID()}`;
        localStorage.setItem('customRoutineDeviceId', deviceUserId);
        console.log('🆔 [Sync] Created new device ID:', deviceUserId);
      }

      console.log('🗑️ [Sync] Deleting old entries for device', deviceUserId);
      const { error: deleteError } = await supabase
        .from('custom_routines')
        .delete()
        .eq('user_id', deviceUserId);
      
      if (deleteError) {
        console.error('❌ [Sync] Delete failed:', deleteError);
        throw deleteError;
      }

      if (list.length > 0) {
        console.log('📝 [Sync] Inserting', list.length, 'entries');
        const rows = list.map(e => ({
          user_id: deviceUserId,
          entry_id: e.id,
          title: e.title,
          course_code: e.courseCode || null,
          type: e.type,
          mode: e.mode,
          day: e.day,
          start_time: e.start,
          end_time: e.end,
          room: e.room || null,
          section: e.section || null,
          teacher: e.teacher || null,
          linked_to: e.linkedTo || null,
          created_at: new Date(e.createdAt).toISOString()
        }));

        const { error: insertError } = await supabase
          .from('custom_routines')
          .insert(rows);
        
        if (insertError) {
          console.error('❌ [Sync] Insert failed:', insertError);
          throw insertError;
        }
      }

      console.log('✅ [Sync] Cloud sync successful');
      setSyncMessage('✓ Synced');
      setTimeout(() => setSyncMessage(null), 2000);
      return true;
    } catch (err: any) {
      console.error('❌ [Sync] Error:', err);
      setSyncMessage(`✗ Sync failed: ${err.message}`);
      setTimeout(() => setSyncMessage(null), 3000);
      return false;
    } finally {
      setIsSyncing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - function uses current entries via parameter or captures latest from closure

  useEffect(() => {
    if (isLoadingFromDb) return; // Skip sync during initial load
    localStorage.setItem('customRoutineEntries', JSON.stringify(entries));
    syncToDatabase(entries); // Instant sync on every change - pass entries explicitly
  }, [entries, isLoadingFromDb, syncToDatabase]);

  const [form, setForm] = useState<Partial<RoutineEntry>>({
    title: '',
    courseCode: '',
    type: 'regular',
    mode: 'theory',
    day: 'Sun',
    start: '09:45',
    end: '11:15',
    room: '',
    section: ''
  });
  const [labDuration, setLabDuration] = useState<90 | 180>(90);
  const [formError, setFormError] = useState<string | null>(null);
  const [showOverlapModal, setShowOverlapModal] = useState(false);
  const [selectedOverlapEntry, setSelectedOverlapEntry] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const fieldClass = (extra = '') => `${
    isDarkMode
      ? 'text-white placeholder-gray-400 border-gray-700 bg-gray-800'
      : 'text-gray-900 placeholder-gray-500 border-gray-300 bg-white'
  } w-full px-3 py-2 rounded border ${extra}`;

  const allowedStartTimes = useMemo(() => {
    const times: string[] = [];
    const startMin = toMinutes('08:15');
    const endMin = END_MINUTES;
    const dur = form.mode === 'lab' && labDuration === 180 ? 180 : SLOT_MINUTES;
    const bS = toMinutes(BREAK_START), bE = toMinutes(BREAK_END);
    
    for (let t = startMin; t <= endMin; t += SLOT_MINUTES) {
      const start = t;
      const end = t + dur;
      if (end > END_MINUTES) continue;
      const crossesBreak = Math.max(start, bS) < Math.min(end, bE);
      
      // For 3hr labs, allow times that span the break (they'll be auto-split)
      // Skip only if the slot would START during break or END during break
      if (form.mode === 'lab' && labDuration === 180) {
        // Allow if start is before break and would span it
        if (start < bS && end > bE) {
          const hh = String(Math.floor(start / 60)).padStart(2, '0');
          const mm = String(start % 60).padStart(2, '0');
          times.push(`${hh}:${mm}`);
          continue;
        }
        // Skip if overlaps with break but doesn't fully span it
        if (crossesBreak) continue;
      } else {
        // For non-3hr slots, skip any that cross break
        if (crossesBreak) continue;
      }
      
      const hh = String(Math.floor(start / 60)).padStart(2, '0');
      const mm = String(start % 60).padStart(2, '0');
      times.push(`${hh}:${mm}`);
    }
    return times;
  }, [form.mode, labDuration]);

  useEffect(() => {
    const dur = form.mode === 'lab' && labDuration === 180 ? 180 : SLOT_MINUTES;
    const startMin = toMinutes(form.start || '09:45');
    let endMin = startMin + dur;
    
    // If 3hr lab spans the break, add break duration to end time
    if (form.mode === 'lab' && labDuration === 180) {
      const bS = toMinutes(BREAK_START);
      const bE = toMinutes(BREAK_END);
      const crossesBreak = startMin < bS && (startMin + dur) > bS;
      if (crossesBreak) {
        endMin = startMin + dur + (bE - bS); // Add 30 min break
      }
    }
    
    const cappedEnd = Math.min(endMin, END_MINUTES);
    const hh = String(Math.floor(cappedEnd / 60)).padStart(2, '0');
    const mm = String(cappedEnd % 60).padStart(2, '0');
    setForm(f => ({ ...f, end: `${hh}:${mm}` }));
  }, [form.start, form.mode, labDuration]);

  const addEntry = () => {
    setFormError(null);
    if (!form.title || !form.start || !form.end) { setFormError('Please fill in title and time.'); return; }
    const s = toMinutes(form.start!); const e = toMinutes(form.end!);
    if (e <= s) { setFormError('End time must be after start time.'); return; }
    if (e > END_MINUTES) { setFormError('End time must be on or before 5:45 PM.'); return; }
    const bS = toMinutes(BREAK_START), bE = toMinutes(BREAK_END);
    
    // Check if 3hr lab spans the break - auto split it
    if (form.mode === 'lab' && labDuration === 180) {
      const crossesBreak = Math.max(s, bS) < Math.min(e, bE);
      if (crossesBreak) {
        // Check overlap rules for BOTH slots before adding
        const firstEndMin = toMinutes(BREAK_START);
        const secondStartMin = toMinutes(BREAK_END);
        const secondEndMin = secondStartMin + SLOT_MINUTES;
        if (secondEndMin > END_MINUTES) {
          setFormError('❌ 3hr lab cannot extend beyond 5:45 PM.');
          return;
        }
        const newDay = (form.day as Day) || 'Sun';
        const newEntryType = (form.type as RoutineType) || 'regular';
        
        // Check first slot overlaps
        const firstSlotOverlaps = entries.filter(entry => {
          if (entry.day !== newDay) return false;
          const entryS = toMinutes(entry.start);
          const entryE = toMinutes(entry.end);
          return Math.max(s, entryS) < Math.min(firstEndMin, entryE);
        });
        
        // Check second slot overlaps
        const secondSlotOverlaps = entries.filter(entry => {
          if (entry.day !== newDay) return false;
          const entryS = toMinutes(entry.start);
          const entryE = toMinutes(entry.end);
          return Math.max(secondStartMin, entryS) < Math.min(secondEndMin, entryE);
        });
        
        // Validate both slots
        for (const overlaps of [firstSlotOverlaps, secondSlotOverlaps]) {
          if (overlaps.length > 0) {
            const regularCount = overlaps.filter(e => e.type === 'regular').length;
            const improvementRetakeCount = overlaps.filter(e => e.type !== 'regular').length;
            
            // Check total overlap count first
            if (overlaps.length >= 2) {
              setFormError('❌ Maximum 2 overlapping courses allowed. One of the 3hr lab slots has too many overlaps.');
              return;
            }
            
            if (newEntryType === 'regular') {
              if (regularCount > 0) {
                setFormError('❌ Cannot overlap two regular courses. One of the 3hr lab slots conflicts with an existing regular course.');
                return;
              }
              // Allow 1 regular + 1 improvement/retake
            } else {
              if (improvementRetakeCount > 0) {
                setFormError('❌ Cannot overlap two improvement/retake courses. One of the 3hr lab slots conflicts.');
                return;
              }
              // Allow 1 regular + 1 improvement/retake
            }
          }
        }
        
        // Split into two 1h30 slots: before break (ending at 12:45) and after break (starting at 13:15)
        const firstEnd = `${String(Math.floor(firstEndMin / 60)).padStart(2, '0')}:${String(firstEndMin % 60).padStart(2, '0')}`;
        const secondStart = `${String(Math.floor(secondStartMin / 60)).padStart(2, '0')}:${String(secondStartMin % 60).padStart(2, '0')}`;
        const secondEnd = `${String(Math.floor(secondEndMin / 60)).padStart(2, '0')}:${String(secondEndMin % 60).padStart(2, '0')}`;
        
        const id1 = crypto.randomUUID();
        const id2 = crypto.randomUUID();
        
        const entry1: RoutineEntry = {
          id: id1,
          title: form.title!,
          courseCode: form.courseCode || undefined,
          type: (form.type as RoutineType) || 'regular',
          mode: 'lab',
          day: (form.day as Day) || 'Sun',
          start: form.start!,
          end: firstEnd,
          room: form.room || undefined,
          section: form.section || undefined,
          teacher: form.teacher || undefined,
          linkedTo: id2,
          createdAt: Date.now()
        };
        
        const entry2: RoutineEntry = {
          id: id2,
          title: form.title!,
          courseCode: form.courseCode || undefined,
          type: (form.type as RoutineType) || 'regular',
          mode: 'lab',
          day: (form.day as Day) || 'Sun',
          start: secondStart,
          end: secondEnd,
          room: form.room || undefined,
          section: form.section || undefined,
          teacher: form.teacher || undefined,
          linkedTo: id1,
          createdAt: Date.now()
        };
        
        setEntries(prev => {
          const next = [...prev, entry1, entry2];
          persistEntries(next);
          return next;
        });
        setForm({
          title: '',
          courseCode: '',
          type: 'regular',
          mode: 'theory',
          day: form.day,
          start: '09:45',
          end: '11:15',
          room: '',
          section: '',
          teacher: ''
        });
        setFormError(null);
        return;
      }
    }
    
    // Regular validation for non-split entries
    if (Math.max(s, bS) < Math.min(e, bE)) { setFormError('12:45–1:15 is break. Choose another slot.'); return; }
    
    // Check for overlap conflicts with existing entries
    const newEntryType = (form.type as RoutineType) || 'regular';
    const newDay = (form.day as Day) || 'Sun';
    
    const overlappingEntries = entries.filter(entry => {
      if (entry.day !== newDay) return false;
      const entryS = toMinutes(entry.start);
      const entryE = toMinutes(entry.end);
      return Math.max(s, entryS) < Math.min(e, entryE);
    });
    
    if (overlappingEntries.length > 0) {
      // Check if adding this would violate overlap rules
      const regularCount = overlappingEntries.filter(e => e.type === 'regular').length;
      const improvementRetakeCount = overlappingEntries.filter(e => e.type !== 'regular').length;
      
      // Check total overlap count first
      if (overlappingEntries.length >= 2) {
        setFormError('❌ Maximum 2 overlapping courses allowed. Remove one first.');
        return;
      }
      
      if (newEntryType === 'regular') {
        // Trying to add a regular course
        if (regularCount > 0) {
          setFormError('❌ Cannot overlap two regular courses. Remove the existing regular course first.');
          return;
        }
        // Allow 1 regular + 1 improvement/retake (improvementRetakeCount can be 1)
      } else {
        // Trying to add improvement/retake
        if (improvementRetakeCount > 0) {
          setFormError('❌ Cannot overlap two improvement/retake courses. Only 1 regular + 1 improvement/retake allowed.');
          return;
        }
        // Allow 1 regular + 1 improvement/retake (regularCount can be 1)
      }
    }
    
    const newEntry: RoutineEntry = {
      id: crypto.randomUUID(),
      title: form.title!,
      courseCode: form.courseCode || undefined,
      type: (form.type as RoutineType) || 'regular',
      mode: (form.mode as ClassMode) || 'theory',
      day: (form.day as Day) || 'Sun',
      start: form.start!,
      end: form.end!,
      room: form.room || undefined,
      section: form.section || undefined,
      teacher: form.teacher || undefined,
      createdAt: Date.now()
    };
    setEntries(prev => {
      const next = [...prev, newEntry];
      persistEntries(next);
      return next;
    });
    // Clear form for next input
    setForm({
      title: '',
      courseCode: '',
      type: 'regular',
      mode: 'theory',
      day: form.day,
      start: '09:45',
      end: '11:15',
      room: '',
      section: '',
      teacher: ''
    });
    setFormError(null);
  };

  const removeEntry = (id: string) => {
    setEntries(prev => {
      const entry = prev.find(e => e.id === id);
      const next = entry?.linkedTo
        ? prev.filter(e => e.id !== id && e.id !== entry.linkedTo)
        : prev.filter(e => e.id !== id);
      
      // Persist and sync to database immediately
      console.log('🗑️ [Remove] Removing entry', id, 'and syncing...');
      const sanitized = enforceOverlapConstraints(next);
      try {
        localStorage.setItem('customRoutineEntries', JSON.stringify(sanitized));
      } catch (err) {
        console.warn('Failed to persist routine to localStorage', err);
      }
      
      // Always sync to database when removing
      if (!isLoadingFromDb) {
        syncToDatabase(sanitized);
      }
      
      return sanitized;
    });
  };
  const clearAll = () => {
    const next: RoutineEntry[] = [];
    persistEntries(next);
  };

  // Resolve visibility based on overlaps and priority rules
  const { visible, conflicts, deemphasize } = useMemo(() => {
    const visible = new Set<string>(entries.map(e => e.id));
    const conflicts: Record<string, string[]> = {};
    const deemphasize = new Set<string>();

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i];
        const b = entries[j];
        if (a.day !== b.day) continue;
        const aS = toMinutes(a.start), aE = toMinutes(a.end);
        const bS = toMinutes(b.start), bE = toMinutes(b.end);
        const overlap = Math.max(aS, bS) < Math.min(aE, bE);
        if (!overlap) continue;

        // Track conflicts
        if (!conflicts[a.id]) conflicts[a.id] = [];
        if (!conflicts[b.id]) conflicts[b.id] = [];
        conflicts[a.id].push(b.id);
        conflicts[b.id].push(a.id);

        // Priority: regular > improvement/retake - keep both visible but deemphasize lower priority
        if (a.type === 'regular' && b.type !== 'regular') {
          deemphasize.add(b.id);
        } else if (b.type === 'regular' && a.type !== 'regular') {
          deemphasize.add(a.id);
        } else {
          // Same priority: keep earliest, deemphasize later
          if (a.createdAt <= b.createdAt) {
            deemphasize.add(b.id);
          } else {
            deemphasize.add(a.id);
          }
        }
      }
    }
    return { visible, conflicts, deemphasize };
  }, [entries]);

  const persistEntries = useCallback(
      (next: RoutineEntry[], { sync = true }: { sync?: boolean } = {}) => {
        const sanitized = enforceOverlapConstraints(next);
        setEntries(sanitized);
        try {
          localStorage.setItem('customRoutineEntries', JSON.stringify(sanitized));
        } catch (err) {
          console.warn('Failed to persist routine to localStorage', err);
        }
        if (!isLoadingFromDb && sync) {
          syncToDatabase(sanitized);
        }
      },
      [isLoadingFromDb, syncToDatabase]
    );

  const handleSave = useCallback(async () => {
    console.log('💾 [Save] Saving routine to localStorage');
    try {
      // Always save to localStorage first
      localStorage.setItem('customRoutineEntries', JSON.stringify(entries));
      console.log('💾 [Save] Saved to localStorage, now syncing to cloud...');
      
      // Then try cloud sync (blocking to see result)
      const success = await syncToDatabase(entries);
      
      if (success) {
        setSyncMessage('✓ Saved & synced');
        console.log('✅ [Save] Complete - saved locally and synced to cloud');
      } else {
        setSyncMessage('✓ Saved locally only');
        console.log('⚠️ [Save] Saved locally but cloud sync skipped/failed');
      }
      setTimeout(() => setSyncMessage(null), 2000);
      
    } catch (err) {
      console.error('❌ [Save] Save failed', err);
      setSyncMessage('✗ Save failed');
      setTimeout(() => setSyncMessage(null), 2000);
    }
  }, [entries, syncToDatabase]);

  const totalMinutes = END_MINUTES - START_MINUTES;
  const timeToTop = (hhmm: string) => ((toMinutes(hhmm) - START_MINUTES) / totalMinutes) * 100;
  const heightFromRange = (start: string, end: string) => ((toMinutes(end) - toMinutes(start)) / totalMinutes) * 100;
  const hourMarks = useMemo(() => {
    const marks: number[] = [];
    for (let m = START_MINUTES; m <= END_MINUTES; m += 60) {
      marks.push(m);
    }
    if (marks[marks.length - 1] !== END_MINUTES) marks.push(END_MINUTES);
    return marks;
  }, []);

  const todayName = (['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] as Day[])[new Date().getDay()];

  const inputCls = `w-full px-3 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'}`;
  const labelCls = `text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`;

  return (
    <div className={`min-h-screen w-full pb-10 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>

      {/* ── Sticky action bar ──────────────────────────── */}
      <div className={`print-hide sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b ${isDarkMode ? 'bg-slate-950/90 backdrop-blur-md border-slate-800/80' : 'bg-white/90 backdrop-blur-md border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>My Routine</span>
          <span className={`text-[11px] ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>· Intake 51</span>
          {entries.length > 0 && (
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
              {entries.length} {entries.length === 1 ? 'class' : 'classes'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {syncMessage && (
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${syncMessage.startsWith('✓') ? isDarkMode ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border-emerald-200' : isDarkMode ? 'bg-red-900/30 text-red-400 border-red-800/50' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {syncMessage}
            </span>
          )}
          {isSyncing && (
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
              Syncing…
            </span>
          )}
          <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-sm hover:shadow-blue-600/25">
            <Save className="w-3.5 h-3.5" /> Save
          </button>
        </div>
      </div>

      {/* ── Builder layout ─────────────────────────────── */}
      <div className="routine-grid-container px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Form panel ──────────────────────────────── */}
        <div className={`print-hide lg:col-span-1 rounded-2xl border shadow-sm ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          {/* Panel header */}
          <div className={`flex items-center gap-2.5 px-4 py-3.5 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-blue-500/15' : 'bg-blue-50'}`}>
              <Plus className="w-4 h-4 text-blue-500" />
            </div>
            <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Add Class</span>
          </div>

          <div className="p-4 space-y-3.5">
            {/* Title */}
            <div>
              <label className={labelCls}>Course Title</label>
              <input value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} placeholder="e.g., CSE-327 Data Comm" />
            </div>

            {/* Code */}
            <div>
              <label className={labelCls}>Course Code</label>
              <input value={form.courseCode || ''} onChange={e => setForm(f => ({ ...f, courseCode: e.target.value }))} className={inputCls} placeholder="CSE-327" />
            </div>

            {/* Type — segmented */}
            <div>
              <label className={labelCls}>Type</label>
              <div className={`flex rounded-xl p-0.5 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                {([['regular','Regular','bg-emerald-600'],['improvement','Improve','bg-blue-600'],['retake','Retake','bg-rose-600']] as const).map(([v, label, active]) => (
                  <button key={v} type="button" onClick={() => setForm(f => ({ ...f, type: v as RoutineType }))}
                    className={`flex-1 text-[11px] font-bold py-2 rounded-lg transition-all ${form.type === v ? `${active} text-white shadow-sm` : isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode — segmented */}
            <div>
              <label className={labelCls}>Mode</label>
              <div className={`flex rounded-xl p-0.5 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                {(['theory','lab'] as const).map(v => (
                  <button key={v} type="button" onClick={() => setForm(f => ({ ...f, mode: v }))}
                    className={`flex-1 text-[11px] font-bold py-2 rounded-lg transition-all capitalize ${form.mode === v ? 'bg-violet-600 text-white shadow-sm' : isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration (lab only) + Day */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Duration</label>
                {form.mode === 'lab' ? (
                  <select value={labDuration} onChange={e => setLabDuration(Number(e.target.value) as 90 | 180)}
                    className={inputCls}>
                    <option value={90}>1h 30m</option>
                    <option value={180}>3h (2 slots)</option>
                  </select>
                ) : (
                  <div className={`px-3 py-2.5 rounded-xl border text-sm font-semibold ${isDarkMode ? 'bg-slate-800/40 border-slate-700 text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                    1h 30m
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>Day</label>
                <select value={form.day as string} onChange={e => setForm(f => ({ ...f, day: e.target.value as Day }))} className={inputCls}>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Start + End row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Start</label>
                <select value={form.start} onChange={e => setForm(f => ({ ...f, start: e.target.value }))} className={inputCls}>
                  {allowedStartTimes.map(t => <option key={t} value={t}>{format12h(t)}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>End (auto)</label>
                <div className={`px-3 py-2.5 rounded-xl border text-sm font-semibold ${isDarkMode ? 'bg-slate-800/40 border-slate-700 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                  {format12h(form.end || '')}
                </div>
              </div>
            </div>

            {/* Room + Section */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Room</label>
                <input value={form.room || ''} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} className={inputCls} placeholder="2710" />
              </div>
              <div>
                <label className={labelCls}>Section</label>
                <input value={form.section || ''} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} className={inputCls} placeholder="S-5" />
              </div>
            </div>

            {/* Teacher */}
            <div>
              <label className={labelCls}>Teacher</label>
              <input value={form.teacher || ''} onChange={e => setForm(f => ({ ...f, teacher: e.target.value }))} className={inputCls} placeholder="e.g., SHB" />
            </div>

            {/* Error */}
            {formError && (
              <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl text-sm border ${isDarkMode ? 'bg-amber-900/20 text-amber-300 border-amber-800/40' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-0.5">
              <button onClick={addEntry} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-sm">
                <Plus className="w-4 h-4" /> Add Class
              </button>
              <button onClick={clearAll} title="Clear all" className={`px-3.5 py-2.5 rounded-xl border text-sm transition-all ${isDarkMode ? 'border-slate-700 text-slate-500 hover:text-rose-400 hover:border-rose-800/50 hover:bg-rose-900/10' : 'border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50'}`}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <p className={`text-[11px] leading-relaxed ${isDarkMode ? 'text-slate-700' : 'text-slate-400'}`}>
              Break: 12:45–1:15 PM · Slots 1h 30m · 3hr labs auto-split across break
            </p>
          </div>
        </div>

        {/* ── Grid panel ──────────────────────────────── */}
        <div className="lg:col-span-2 space-y-3">

          {/* Grid branding header */}
          <div className={`hidden sm:flex items-center justify-between gap-3 rounded-2xl border px-5 py-3.5 shadow-sm ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <div>
              <div className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Edu<span className="text-red-500">51</span>Portal
              </div>
              <div className={`text-[11px] font-semibold ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Custom Routine · Intake 51</div>
            </div>
            <div className={`text-[11px] font-semibold ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </div>

          {/* Timetable */}
          <div className="overflow-x-auto">
            <div className={`rounded-2xl overflow-hidden border shadow-sm min-w-[520px] ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>

              {/* Day headers */}
              <div className={`grid grid-cols-6 border-b ${isDarkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                <div className="py-3" />
                {DAYS.map(d => {
                  const isToday = d === todayName;
                  return (
                    <div key={d} className="py-3 text-center">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg inline-block transition-colors ${isToday ? 'bg-blue-600 text-white' : isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        {d}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="relative">
                <div className="grid grid-cols-6">
                  {/* Time column */}
                  <div className={`border-r ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    {hourMarks.map((m, idx) => (
                      <div key={idx} className={`h-24 px-2 text-[10px] font-semibold flex items-start pt-1.5 justify-end ${isDarkMode ? 'text-slate-700' : 'text-slate-400'}`}>
                        {format12h(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`)}
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {DAYS.map((d, colIdx) => (
                    <motion.div
                      key={d}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: colIdx * 0.05, duration: 0.3, ease: 'easeOut' }}
                      className={`relative border-l ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}
                    >
                      {/* Hour grid lines */}
                      {hourMarks.slice(1).map((m, idx) => (
                        <div key={idx} className="absolute left-0 right-0" style={{ top: `${((m - START_MINUTES) / totalMinutes) * 100}%`, height: '1px', background: isDarkMode ? 'rgba(30,41,59,0.9)' : 'rgba(241,245,249,1)' }} />
                      ))}

                      {/* Break band */}
                      {(() => {
                        const top = ((toMinutes(BREAK_START) - START_MINUTES) / (END_MINUTES - START_MINUTES)) * 100;
                        const height = ((toMinutes(BREAK_END) - toMinutes(BREAK_START)) / (END_MINUTES - START_MINUTES)) * 100;
                        return (
                          <div className={`absolute left-0 right-0 flex items-center justify-center overflow-hidden ${isDarkMode ? 'bg-amber-500/6' : 'bg-amber-50'}`} style={{ top: `${top}%`, height: `${height}%` }}>
                            <span className={`text-[9px] font-black tracking-widest uppercase ${isDarkMode ? 'text-amber-700' : 'text-amber-400'}`}>Break</span>
                          </div>
                        );
                      })()}

                      {/* Entry cards */}
                      <AnimatePresence>
                      {entries.filter(e => e.day === d).map(entry => {
                        const top = timeToTop(entry.start);
                        const height = heightFromRange(entry.start, entry.end);
                        const isDeemphasized = deemphasize.has(entry.id);

                        const borderAccent = entry.type === 'regular' ? 'border-l-emerald-500' : entry.type === 'improvement' ? 'border-l-blue-500' : 'border-l-rose-500';
                        const bgTint = entry.type === 'regular'
                          ? isDarkMode ? 'bg-emerald-950/50' : 'bg-emerald-50/90'
                          : entry.type === 'improvement'
                          ? isDarkMode ? 'bg-blue-950/50' : 'bg-blue-50/90'
                          : isDarkMode ? 'bg-rose-950/50' : 'bg-rose-50/90';
                        const outerBorder = isDarkMode ? 'border-y border-r border-slate-800/80' : 'border-y border-r border-slate-200/80';
                        const styleOffset = isDeemphasized
                          ? { zIndex: 0, opacity: 0.82, width: 'calc(100% - 10px)', marginLeft: '3px' } as React.CSSProperties
                          : { zIndex: 1, width: 'calc(100% - 2px)' } as React.CSSProperties;

                        return (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                            whileHover={{ scale: 1.015, zIndex: 20 }}
                            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
                            className={`absolute border-l-[3px] rounded-r-lg cursor-pointer group shadow-sm hover:shadow-lg ${borderAccent} ${bgTint} ${outerBorder}`}
                            style={{ left: '1px', top: `${top}%`, height: `${height}%`, minHeight: 80, right: '1px', ...styleOffset }}
                            onClick={() => { setSelectedOverlapEntry(entry.id); setShowOverlapModal(true); }}
                          >
                            <div className="h-full p-2 flex flex-col gap-0.5 overflow-hidden">
                              <div className={`text-[12px] font-bold leading-tight line-clamp-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                {entry.title}
                              </div>
                              {entry.courseCode && (
                                <div className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{entry.courseCode}</div>
                              )}
                              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                <span className={`text-[9px] font-black px-1.5 py-[2px] rounded-full text-white leading-none ${entry.type === 'regular' ? 'bg-emerald-600' : entry.type === 'improvement' ? 'bg-blue-600' : 'bg-rose-600'}`}>
                                  {entry.type === 'regular' ? 'REG' : entry.type === 'improvement' ? 'IMP' : 'RT'}
                                </span>
                                <span className={`text-[9px] font-black px-1.5 py-[2px] rounded-full text-white leading-none ${entry.mode === 'lab' ? 'bg-violet-600' : 'bg-slate-500'}`}>
                                  {entry.mode === 'lab' ? 'LAB' : 'TH'}
                                </span>
                              </div>
                              <div className={`flex items-center gap-1 mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="text-[10px] font-semibold">{format12h(entry.start)}–{format12h(entry.end)}</span>
                              </div>
                              {entry.teacher && (
                                <div className={`text-[10px] line-clamp-1 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{entry.teacher}</div>
                              )}
                              {(entry.room || entry.section) && (
                                <div className={`flex items-center gap-1 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                  <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                                  <span className="text-[10px] line-clamp-1">{[entry.room, entry.section].filter(Boolean).join(' · ')}</span>
                                </div>
                              )}
                              <div className="mt-auto flex justify-end">
                                <button
                                  onClick={e => { e.stopPropagation(); removeEntry(entry.id); }}
                                  className={`p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${isDarkMode ? 'text-slate-600 hover:text-rose-400 hover:bg-rose-900/20' : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'}`}
                                  title="Remove"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 flex-wrap">
            {([
              ['bg-emerald-600','Regular'],
              ['bg-blue-600','Improvement'],
              ['bg-rose-600','Retake'],
              ['bg-violet-600','Lab'],
              ['bg-slate-500','Theory'],
            ] as const).map(([color, label]) => (
              <span key={label} className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${isDarkMode ? 'bg-slate-800/80 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Course Details / Overlap Modal ─────────────── */}
      {showOverlapModal && selectedOverlapEntry && (() => {
        const selectedEntry = entries.find(e => e.id === selectedOverlapEntry);
        if (!selectedEntry) return null;
        const conflictingEntries = conflicts[selectedOverlapEntry]?.map(id => entries.find(e => e.id === id)).filter(Boolean) || [];
        const hasConflicts = conflictingEntries.length > 0;
        const isSingleCourse = !hasConflicts;

        const renderCard = (entry: RoutineEntry, isSelected: boolean) => {
          const badge = entry.type === 'regular' ? 'Regular' : entry.type === 'improvement' ? 'Improvement' : 'Retake';
          const accentBar = entry.type === 'regular' ? 'bg-emerald-500' : entry.type === 'improvement' ? 'bg-blue-500' : 'bg-rose-500';
          const typePill = entry.type === 'regular' ? 'bg-emerald-600' : entry.type === 'improvement' ? 'bg-blue-600' : 'bg-rose-600';
          const modePill = entry.mode === 'lab' ? 'bg-violet-600' : 'bg-slate-500';
          return (
            <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
              <div className={`h-[3px] w-full ${accentBar}`} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <div className={`font-bold text-sm leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{entry.title}</div>
                    {entry.courseCode && <div className={`text-xs font-bold mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{entry.courseCode}</div>}
                  </div>
                  <div className="flex flex-col gap-1 items-end flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${typePill}`}>{badge}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${modePill}`}>{entry.mode === 'lab' ? 'Lab' : 'Theory'}</span>
                  </div>
                </div>
                <div className={`space-y-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  <div className="font-semibold">{entry.day} · {format12h(entry.start)}–{format12h(entry.end)}</div>
                  {entry.teacher && <div>{entry.teacher}</div>}
                  {(entry.room || entry.section) && <div>{[entry.room, entry.section].filter(Boolean).join(' · ')}</div>}
                </div>
                {!isSelected && (
                  <button
                    onClick={() => removeEntry(entry.id)}
                    className={`mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${isDarkMode ? 'bg-rose-900/20 text-rose-400 hover:bg-rose-900/40 border-rose-900/40' : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-100'}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                )}
              </div>
            </div>
          );
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowOverlapModal(false)}>
            <div
              className={`${isSingleCourse ? 'max-w-sm' : 'max-w-xl'} w-full max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
              onClick={e => e.stopPropagation()}
            >
              <div className={`sticky top-0 flex items-center justify-between px-4 py-3.5 border-b ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {hasConflicts ? 'Overlapping Courses' : 'Course Details'}
                </h3>
                <button onClick={() => setShowOverlapModal(false)} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className={`grid ${isSingleCourse ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                  {renderCard(selectedEntry, true)}
                  {conflictingEntries.map(entry => entry && renderCard(entry, false))}
                </div>
                {hasConflicts && (
                  <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs border ${isDarkMode ? 'bg-amber-900/15 text-amber-300 border-amber-800/30' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    Remove one course or adjust times to resolve the overlap.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

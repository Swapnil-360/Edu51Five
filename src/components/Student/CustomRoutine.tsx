import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { X, Plus, Trash2, Calendar, AlertTriangle, Save } from 'lucide-react';
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

  return (
    <div className={`min-h-screen w-full pb-8 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`print-hide sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b ${isDarkMode ? 'bg-gray-900/80 backdrop-blur border-gray-800' : 'bg-white/80 backdrop-blur border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded ${isDarkMode ? 'bg-purple-900/40' : 'bg-purple-100'}`}>
            <Calendar className={`w-5 h-5 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`} />
          </div>
          <div>
            <div className="font-semibold text-lg">Custom Routine</div>
            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Compose personal schedule with overlap handling</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {syncMessage && (
            <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              {syncMessage}
            </span>
          )}
          {isSyncing && (
            <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              Syncing...
            </span>
          )}
          <button onClick={handleSave} className={`hidden sm:flex items-center gap-1 px-3 py-1.5 rounded ${isDarkMode ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
            <Save className="w-4 h-4" /> Save
          </button>
          <button onClick={onClose} className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Builder */}
      <div className="routine-grid-container px-4 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Form */}
        <div className={`print-hide lg:col-span-1 rounded-xl border ${isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 font-semibold">Add Class</div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-sm block mb-1">Title</label>
                <input value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={fieldClass()} placeholder="e.g., CSE-327 Data Comm" />
              </div>
              <div>
                <label className="text-sm block mb-1">Course Code</label>
                <input value={form.courseCode || ''} onChange={e => setForm(f => ({ ...f, courseCode: e.target.value }))} className={fieldClass()} placeholder="CSE-327" />
              </div>
              <div>
                <label className="text-sm block mb-1">Type</label>
                <select value={form.type as string} onChange={e => setForm(f => ({ ...f, type: e.target.value as RoutineType }))} className={fieldClass()}>
                  <option value="regular">Regular</option>
                  <option value="improvement">Improvement</option>
                  <option value="retake">Retake</option>
                </select>
              </div>
              <div>
                <label className="text-sm block mb-1">Mode</label>
                <select value={form.mode as string} onChange={e => setForm(f => ({ ...f, mode: e.target.value as ClassMode }))} className={fieldClass()}>
                  <option value="theory">Theory</option>
                  <option value="lab">Lab</option>
                </select>
              </div>
              <div>
                <label className="text-sm block mb-1">Duration</label>
                {form.mode === 'lab' ? (
                  <select value={labDuration} onChange={e => setLabDuration(Number(e.target.value) as 90 | 180)} className={fieldClass()}>
                    <option value={90}>1 hr 30 min (1 slot)</option>
                    <option value={180}>3 hr (2 slots)</option>
                  </select>
                ) : (
                  <input value="1 hr 30 min" readOnly className={fieldClass('cursor-not-allowed')} />
                )}
              </div>
              <div>
                <label className="text-sm block mb-1">Day</label>
                <select value={form.day as string} onChange={e => setForm(f => ({ ...f, day: e.target.value as Day }))} className={fieldClass()}>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm block mb-1">Start</label>
                <select value={form.start} onChange={e => setForm(f => ({ ...f, start: e.target.value }))} className={fieldClass()}>
                  {allowedStartTimes.map(t => <option key={t} value={t}>{format12h(t)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm block mb-1">End</label>
                <input value={format12h(form.end || '')} readOnly className={fieldClass('cursor-not-allowed')} />
              </div>
              <div>
                <label className="text-sm block mb-1">Room</label>
                <input value={form.room || ''} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} className={fieldClass()} placeholder="2710" />
              </div>
              <div>
                <label className="text-sm block mb-1">Section</label>
                <input value={form.section || ''} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} className={fieldClass()} placeholder="Intake 51, S-5" />
              </div>
              <div className="col-span-2">
                <label className="text-sm block mb-1">Course Teacher</label>
                <input value={form.teacher || ''} onChange={e => setForm(f => ({ ...f, teacher: e.target.value }))} className={fieldClass()} placeholder="e.g., SHB or S. H. Bhuiyan" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={addEntry} className={`inline-flex items-center gap-1 px-3 py-2 rounded ${isDarkMode ? 'bg-green-700 hover:bg-green-600' : 'bg-green-600 hover:bg-green-700'} text-white`}>
                <Plus className="w-4 h-4" /> Add Class
              </button>
              <button onClick={clearAll} className={`inline-flex items-center gap-1 px-3 py-2 rounded ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}>
                <Trash2 className="w-4 h-4" /> Clear All
              </button>
            </div>
            {formError && (
              <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                <AlertTriangle className="w-4 h-4" /> {formError}
              </div>
            )}
            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Lunch & Prayer Break: 12:45–1:15 PM (no classes). Slots are 1h 30m; labs can be 3h. 3hr labs spanning the break are auto-split into two 1h30 slots. Overlap: Regular vs improvement/retake is shown with a smart overlay; same-level keeps earliest.
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header */}
          <div className={`hidden sm:flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${isDarkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-gradient-to-br from-blue-50 to-purple-50 text-gray-900'}`}>
            <div>
              <div className="text-xl font-extrabold">Edu51Five</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Custom Routine · Intake 51</div>
            </div>
            <div className={`text-xs text-right ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Generated on {new Date().toLocaleDateString()}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <div className={`rounded-xl overflow-hidden border ${isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-300 bg-gradient-to-br from-slate-50 to-gray-100'} min-w-[520px]`}>
            <div className={`grid grid-cols-6 text-xs font-semibold border-b ${isDarkMode ? 'border-gray-800 bg-gray-800 text-gray-200' : 'border-gray-300 bg-gradient-to-r from-blue-100 to-purple-100 text-gray-900'}`}>
              <div className="p-2 text-center text-[10px]"></div>
              {DAYS.map(d => (
                <div key={d} className="p-2 text-center text-sm font-bold">{d}</div>
              ))}
            </div>
            <div className="relative">
              <div className="grid grid-cols-6">
                {/* Time labels */}
                <div className={`border-r w-20 ${isDarkMode ? 'border-gray-800 bg-gray-800/50' : 'border-gray-300 bg-slate-100'}`}>
                  {hourMarks.map((m, idx) => (
                    <div key={idx} className={`h-24 px-2 text-[11px] flex items-center justify-center font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {format12h(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`)}
                    </div>
                  ))}
                </div>
                {/* Day columns */}
                {DAYS.map((d) => (
                  <div key={d} className={`relative border-l ${isDarkMode ? 'border-gray-800' : 'border-gray-300'}`}>
                    {/* Hour lines */}
                    {hourMarks.slice(1).map((m, idx) => (
                      <div key={idx} className={`absolute left-0 right-0`} style={{ top: `${((m - START_MINUTES) / totalMinutes) * 100}%`, height: '1px', background: isDarkMode ? 'rgba(75,85,99,0.3)' : 'rgba(229,231,235,0.8)' }} />
                    ))}

                    {/* Break band 12:45–13:15 */}
                    {(() => {
                      const top = ((toMinutes(BREAK_START) - START_MINUTES) / (END_MINUTES - START_MINUTES)) * 100;
                      const height = ((toMinutes(BREAK_END) - toMinutes(BREAK_START)) / (END_MINUTES - START_MINUTES)) * 100;
                      return (
                        <div className={`absolute left-0 right-0 ${isDarkMode ? 'bg-amber-500/10' : 'bg-amber-200/30'} flex items-center justify-center`} style={{ top: `${top}%`, height: `${height}%` }}>
                          <div className={`text-[10px] font-semibold ${isDarkMode ? 'text-amber-300' : 'text-amber-800'}`}>Lunch & Prayer Break 12:45–1:15 PM</div>
                        </div>
                      );
                    })()}

                    {/* Entries for this day */}
                    {entries.filter(e => e.day === d).map(entry => {
                      const top = timeToTop(entry.start);
                      const height = heightFromRange(entry.start, entry.end);
                      const hasConflict = !!conflicts[entry.id]?.length;
                      const color = entry.type === 'regular' ? 'bg-green-600' : entry.type === 'improvement' ? 'bg-blue-600' : 'bg-red-600';
                      const badge = entry.type === 'regular' ? 'Regular' : entry.type === 'improvement' ? 'Improvement' : 'Retake';
                      const isDeemphasized = deemphasize.has(entry.id);
                      const styleOffset = isDeemphasized ? { 
                        transform: 'translateX(-2px)', 
                        zIndex: 0, 
                        opacity: 0.92,
                        width: 'calc(100% - 12px)',
                        marginLeft: '4px'
                      } as React.CSSProperties : { zIndex: 1, width: 'calc(100% - 2px)' } as React.CSSProperties;
                      return (
                        <div
                          key={entry.id}
                          className={`absolute rounded-lg cursor-pointer hover:ring-2 transition-all backdrop-blur-md ${isDarkMode ? 'hover:ring-white/60 bg-white/10 hover:bg-white/15 border border-white/20 text-white' : 'hover:ring-blue-400/60 bg-slate-100/70 hover:bg-slate-100/85 border border-slate-300/60 text-slate-900'}`}
                          style={{ left: '2px', top: `${top}%`, height: `${height}%`, minHeight: 90, right: '2px', ...styleOffset }}
                          onClick={() => { setSelectedOverlapEntry(entry.id); setShowOverlapModal(true); }}
                        >
                          <div className={`h-full w-full rounded-lg p-2 flex flex-col gap-1 ${isDeemphasized ? isDarkMode ? 'ring-2 ring-white/40 border border-white/20' : 'ring-2 ring-blue-400/40 border border-blue-300/40' : ''}`}> 
                            <div className="space-y-0.5 flex-1">
                              <div className="text-sm font-bold leading-tight drop-shadow-md line-clamp-2">{entry.title}</div>
                              {entry.courseCode && <div className="text-xs opacity-90 font-semibold">{entry.courseCode}</div>}
                            </div>
                            <div className="flex items-center justify-center gap-1 text-[10px] font-bold flex-wrap">
                              <span className={`px-2 py-0.5 rounded-full whitespace-nowrap text-white font-semibold ${entry.type === 'regular' ? 'bg-green-500/80' : entry.type === 'improvement' ? 'bg-blue-500/80' : 'bg-red-500/80'}`}>{badge}</span>
                              <span className={`px-2 py-0.5 rounded-full whitespace-nowrap text-white font-semibold ${entry.mode === 'lab' ? 'bg-purple-500/80' : 'bg-indigo-500/80'}`}>{entry.mode === 'lab' ? 'Lab' : 'Theory'}</span>
                            </div>
                            <div className="text-xs font-bold opacity-95 whitespace-normal leading-tight text-center">
                              {format12h(entry.start)}–{format12h(entry.end)}
                            </div>
                            {entry.teacher && (
                              <div className="text-[11px] opacity-90 font-semibold whitespace-normal line-clamp-1">
                                {entry.teacher}
                              </div>
                            )}
                            {(entry.room || entry.section) && (
                              <div className="text-[11px] opacity-90 flex gap-1.5 font-semibold">
                                {entry.room && <span className="whitespace-normal line-clamp-1">{entry.room}</span>}
                                {entry.section && <span className="whitespace-normal line-clamp-1">{entry.section}</span>}
                              </div>
                            )}
                            <div className="mt-auto flex items-center justify-end">
                              <button onClick={(e) => { e.stopPropagation(); removeEntry(entry.id); }} className={`p-0.5 rounded transition-colors ${isDarkMode ? 'hover:bg-white/30' : 'hover:bg-white/60'}`} title="Remove">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-600"></span> Regular</span>
            <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded bg-blue-600"></span> Improvement</span>
            <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded bg-red-600"></span> Retake</span>
          </div>
        </div>
      </div>

      {/* Course Details Modal */}
      {showOverlapModal && selectedOverlapEntry && (() => {
        const selectedEntry = entries.find(e => e.id === selectedOverlapEntry);
        if (!selectedEntry) return null;
        const conflictingEntries = conflicts[selectedOverlapEntry]?.map(id => entries.find(e => e.id === id)).filter(Boolean) || [];
        const hasConflicts = conflictingEntries.length > 0;
        const totalCourses = 1 + (hasConflicts ? conflictingEntries.length : 0);
        const isSingleCourse = totalCourses === 1;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowOverlapModal(false)}>
            <div className={`${isSingleCourse ? 'max-w-sm' : 'max-w-2xl'} w-full max-h-[85vh] overflow-y-auto rounded-lg shadow-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
              <div className={`sticky top-0 flex items-center justify-between p-3 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div>
                  <h3 className="text-base font-bold">{hasConflicts ? 'Overlapping Courses' : 'Course Details'}</h3>
                </div>
                <button onClick={() => setShowOverlapModal(false)} className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className={`p-3 space-y-2.5 ${isSingleCourse ? '' : 'space-y-3'}`}>
                <div className={`grid ${isSingleCourse ? 'grid-cols-1' : 'grid-cols-2'} gap-3 ${isSingleCourse ? '' : 'gap-2.5'}`}>
                  {/* Selected Entry */}
                  {(() => {
                    const typeBg = selectedEntry.type === 'regular' ? 'bg-green-500/80' : selectedEntry.type === 'improvement' ? 'bg-blue-500/80' : 'bg-red-500/80';
                    const modeBg = selectedEntry.mode === 'lab' ? 'bg-purple-500/80' : 'bg-indigo-500/80';
                    const badge = selectedEntry.type === 'regular' ? 'Regular' : selectedEntry.type === 'improvement' ? 'Improvement' : 'Retake';
                    return (
                      <div className={`rounded-lg p-3 flex flex-col backdrop-blur-md border ${isDarkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-slate-100/70 border-slate-300/60 text-slate-900'}`}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold leading-tight line-clamp-2">{selectedEntry.title}</div>
                            {selectedEntry.courseCode && <div className="text-xs opacity-90 mt-1 font-semibold">{selectedEntry.courseCode}</div>}
                          </div>
                          <div className="flex flex-col gap-0.5 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap text-white ${typeBg}`}>{badge}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap text-white ${modeBg}`}>{selectedEntry.mode === 'lab' ? 'Lab' : 'Theory'}</span>
                          </div>
                        </div>
                        <div className="space-y-1 text-xs flex-1">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold min-w-fit">{selectedEntry.day}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">{format12h(selectedEntry.start)}–{format12h(selectedEntry.end)}</span>
                          </div>
                          {selectedEntry.teacher && (
                            <div className="flex items-center gap-1 truncate">
                              <span className="truncate">{selectedEntry.teacher}</span>
                            </div>
                          )}
                          {selectedEntry.room && (
                            <div className="flex items-center gap-1 truncate">
                              <span className="truncate">{selectedEntry.room}</span>
                            </div>
                          )}
                          {selectedEntry.section && (
                            <div className="flex items-center gap-1 truncate">
                              <span className="truncate">{selectedEntry.section}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Conflicting Entries */}
                  {conflictingEntries.map(entry => {
                    if (!entry) return null;
                    const typeBg = entry.type === 'regular' ? 'bg-green-500/80' : entry.type === 'improvement' ? 'bg-blue-500/80' : 'bg-red-500/80';
                    const modeBg = entry.mode === 'lab' ? 'bg-purple-500/80' : 'bg-indigo-500/80';
                    const badge = entry.type === 'regular' ? 'Regular' : entry.type === 'improvement' ? 'Improvement' : 'Retake';
                    const isDeemphasized = deemphasize.has(entry.id);
                    return (
                      <div key={entry.id} className={`rounded-lg p-3 flex flex-col backdrop-blur-md border transition-all ${isDeemphasized ? isDarkMode ? 'ring-2 ring-white/40' : 'ring-2 ring-blue-400/40' : ''} ${isDarkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-slate-100/70 border-slate-300/60 text-slate-900'}`}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold leading-tight line-clamp-2">{entry.title}</div>
                            {entry.courseCode && <div className="text-xs opacity-90 mt-1 font-semibold">{entry.courseCode}</div>}
                          </div>
                          <div className="flex flex-col gap-0.5 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap text-white ${typeBg}`}>{badge}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap text-white ${modeBg}`}>{entry.mode === 'lab' ? 'Lab' : 'Theory'}</span>
                          </div>
                        </div>
                        <div className="space-y-1 text-xs flex-1">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold min-w-fit">{entry.day}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">{format12h(entry.start)}–{format12h(entry.end)}</span>
                          </div>
                          {entry.teacher && (
                            <div className="flex items-center gap-1 truncate">
                              <span className="truncate">{entry.teacher}</span>
                            </div>
                          )}
                          {entry.room && (
                            <div className="flex items-center gap-1 truncate">
                              <span className="truncate">{entry.room}</span>
                            </div>
                          )}
                          {entry.section && (
                            <div className="flex items-center gap-1 truncate">
                              <span className="truncate">{entry.section}</span>
                            </div>
                          )}
                        </div>
                        <button onClick={() => removeEntry(entry.id)} className="mt-2 px-2 py-1.5 rounded bg-black/30 hover:bg-black/50 text-xs font-semibold flex items-center justify-center gap-1 transition-colors w-full">
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
                {hasConflicts && (
                  <div className={`p-2.5 rounded text-xs ${isDarkMode ? 'bg-amber-900/20 text-amber-100' : 'bg-amber-50 text-amber-900'}`}>
                    <p className="font-semibold">Remove one course or adjust times to resolve overlap.</p>
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

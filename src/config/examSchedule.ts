// Mid-term exam schedule for BUBT Intake 51 Section 5
// All exams are 10:00 AM to 11:30 AM in Room 2710

export const MID_TERM_SCHEDULE = {
  'CSE-319-20': {
    date: '2025-09-14',
    day: 'Sunday',
    teacher: 'SHB',
    time: '10:00 AM to 11:30 AM',
    room: '2710'
  },
  'CSE-327': {
    date: '2025-09-16', 
    day: 'Tuesday',
    teacher: 'DMAa',
    time: '10:00 AM to 11:30 AM',
    room: '2710'
  },
  'CSE-407': {
    date: '2025-09-18',
    day: 'Thursday', 
    teacher: 'NB',
    time: '10:00 AM to 11:30 AM',
    room: '2710'
  },
  'CSE-417': {
    date: '2025-09-22',
    day: 'Monday',
    teacher: 'TAB', 
    time: '10:00 AM to 11:30 AM',
    room: '2710'
  },
  'CSE-351': {
    date: '2025-09-24',
    day: 'Wednesday',
    teacher: 'SHD',
    time: '10:00 AM to 11:30 AM', 
    room: '2710'
  }
};

export const getTodaysExam = (currentDate = new Date()) => {
  const today = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  for (const [courseCode, exam] of Object.entries(MID_TERM_SCHEDULE)) {
    if (exam.date === today) {
      return {
        courseCode,
        ...exam,
        isToday: true
      };
    }
  }
  
  return null;
};

export const getUpcomingExam = (currentDate = new Date()) => {
  const today = currentDate.toISOString().split('T')[0];
  
  for (const [courseCode, exam] of Object.entries(MID_TERM_SCHEDULE)) {
    if (exam.date > today) {
      const examDate = new Date(exam.date);
      const daysUntil = Math.ceil((examDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        courseCode,
        ...exam,
        daysUntil
      };
    }
  }
  
  return null;
};
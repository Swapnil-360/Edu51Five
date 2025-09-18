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
      // Check if exam time has passed (exam ends at 11:30 AM)
      const examEndTime = new Date();
      examEndTime.setHours(11, 30, 0, 0); // 11:30 AM
      
      const isCompleted = currentDate >= examEndTime;
      
      return {
        courseCode,
        ...exam,
        isToday: true,
        isCompleted
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

// Get the next exam with precise countdown information
export const getNextExamCountdown = (currentDate = new Date()) => {
  const today = currentDate.toISOString().split('T')[0];
  
  for (const [courseCode, exam] of Object.entries(MID_TERM_SCHEDULE)) {
    if (exam.date >= today) {
      // Create exam datetime (assuming 10:00 AM start time)
      const examDateTime = new Date(`${exam.date}T10:00:00+06:00`); // Bangladesh time
      const now = currentDate;
      
      const timeDiff = examDateTime.getTime() - now.getTime();
      
      if (timeDiff > 0) {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        const isToday = exam.date === today;
        const isTomorrow = days === 0 && !isToday;
        
        return {
          courseCode,
          ...exam,
          countdown: {
            days,
            hours,
            minutes,
            seconds,
            totalMs: timeDiff,
            isToday,
            isTomorrow,
            isUrgent: days <= 1, // Within 24 hours
            isCritical: hours <= 3 && days === 0 // Within 3 hours
          }
        };
      }
    }
  }
  
  return null;
};

// Check if we're currently in exam period
export const isExamPeriod = (currentDate = new Date()) => {
  const examDates = Object.values(MID_TERM_SCHEDULE).map(exam => exam.date);
  const firstExam = Math.min(...examDates.map(date => new Date(date).getTime()));
  const lastExam = Math.max(...examDates.map(date => new Date(date).getTime()));
  const currentTime = currentDate.getTime();
  
  // Exam period starts 3 days before first exam and ends on last exam day
  const examPeriodStart = firstExam - (3 * 24 * 60 * 60 * 1000);
  const examPeriodEnd = lastExam + (24 * 60 * 60 * 1000);
  
  return currentTime >= examPeriodStart && currentTime <= examPeriodEnd;
};

// Check if all mid-term exams are completed
export const areMidTermExamsCompleted = (currentDate = new Date()) => {
  const today = currentDate.toISOString().split('T')[0];
  const examDates = Object.values(MID_TERM_SCHEDULE).map(exam => exam.date);
  const lastExamDate = Math.max(...examDates.map(date => new Date(date).getTime()));
  const lastExamString = new Date(lastExamDate).toISOString().split('T')[0];
  
  return today > lastExamString;
};

// Get exam status message
export const getExamStatusMessage = (currentDate = new Date()) => {
  const midTermCompleted = areMidTermExamsCompleted(currentDate);
  const inExamPeriod = isExamPeriod(currentDate);
  
  if (midTermCompleted) {
    return {
      type: 'completed',
      title: '✅ Mid-term Exams Completed',
      message: 'All mid-term examinations have been completed successfully!',
      subMessage: 'Final exam schedule will be shown when the updated routine is available.',
      showPanel: true
    };
  } else if (inExamPeriod) {
    return {
      type: 'active',
      title: '📅 Next Exam',
      message: '',
      subMessage: '',
      showPanel: true
    };
  } else {
    return {
      type: 'none',
      title: '',
      message: '',
      subMessage: '',
      showPanel: false
    };
  }
};
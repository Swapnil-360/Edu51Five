export interface ClassSlot {
  time: string;
  courseCode: string;
  courseName: string;
  teacher: string;
  room: string;
  type: 'theory' | 'lab';
}

export interface DaySchedule {
  day: string;
  date?: string;
  slots: ClassSlot[];
}

// Regular Class Schedule (Based on Official Fall 2025 routine - Section 5-5 Intake 51)
// B.Sc. Engg. in CSE | Intake: 5-5 | Semester: Fall, 2023 (Updated for Fall 2025)
// Note: Format - Building 2, Floor-Room. E.g., 2417 = Building 2, 4th Floor, Room 17
// Room numbers verified from official class routine
export const REGULAR_CLASS_SCHEDULE: DaySchedule[] = [
  {
    day: 'Sunday',
    slots: [
      {
        time: '01:30 PM - 04:00 PM',
        courseCode: 'CSE 320',
        courseName: 'Computer Networks Lab',
        teacher: 'Lab Instructor',
        room: '2416',
        type: 'lab'
      },
      {
        time: '04:00 PM - 05:15 PM',
        courseCode: 'CSE 327',
        courseName: 'Software Engineering',
        teacher: 'Course Teacher',
        room: '2316',
        type: 'theory'
      }
    ]
  },
  {
    day: 'Monday',
    slots: [
      {
        time: '10:30 AM - 11:45 AM',
        courseCode: 'CSE 407',
        courseName: 'Project Management Professional Ethics',
        teacher: 'Course Teacher',
        room: '2908',
        type: 'theory'
      },
      {
        time: '11:45 AM - 01:00 PM',
        courseCode: 'CSE 417',
        courseName: 'Distributed Database Management Systems',
        teacher: 'Course Teacher',
        room: '2908',
        type: 'theory'
      },
      {
        time: '01:30 PM - 02:45 PM',
        courseCode: 'CSE 319',
        courseName: 'Computer Networks',
        teacher: 'Course Teacher',
        room: '2908',
        type: 'theory'
      }
    ]
  },
  {
    day: 'Tuesday',
    slots: [
      {
        time: '08:00 AM - 09:15 AM',
        courseCode: 'CSE 417',
        courseName: 'Distributed Database Management Systems',
        teacher: 'Course Teacher',
        room: '2318',
        type: 'theory'
      },
      {
        time: '09:15 AM - 10:30 AM',
        courseCode: 'CSE 351',
        courseName: 'Artificial Intelligence and Expert System',
        teacher: 'Course Teacher',
        room: '2318',
        type: 'theory'
      },
      {
        time: '10:30 AM - 11:45 AM',
        courseCode: 'CSE 352',
        courseName: 'Artificial Intelligence and Expert System Lab',
        teacher: 'Lab Instructor',
        room: '2218',
        type: 'lab'
      }
    ]
  },
  {
    day: 'Wednesday',
    slots: [
      {
        time: '01:30 PM - 02:45 PM',
        courseCode: 'CSE 328',
        courseName: 'Software Engineering Lab',
        teacher: 'Lab Instructor',
        room: '2417',
        type: 'lab'
      },
      {
        time: '02:45 PM - 04:00 PM',
        courseCode: 'CSE 319',
        courseName: 'Computer Networks',
        teacher: 'Course Teacher',
        room: '2417',
        type: 'theory'
      },
      {
        time: '04:00 PM - 05:15 PM',
        courseCode: 'CSE 327',
        courseName: 'Software Engineering',
        teacher: 'Course Teacher',
        room: '2417',
        type: 'theory'
      },
      {
        time: '05:15 PM - 06:30 PM',
        courseCode: 'CSE 351',
        courseName: 'Artificial Intelligence and Expert System',
        teacher: 'Course Teacher',
        room: '2320',
        type: 'theory'
      }
    ]
  },
  {
    day: 'Thursday',
    slots: [
      {
        time: '01:30 PM - 02:45 PM',
        courseCode: 'CSE 418',
        courseName: 'Distributed Database Management Systems Lab',
        teacher: 'Lab Instructor',
        room: '2417',
        type: 'lab'
      },
      {
        time: '04:00 PM - 05:15 PM',
        courseCode: 'CSE 407',
        courseName: 'Project Management Professional Ethics',
        teacher: 'Course Teacher',
        room: '2908',
        type: 'theory'
      }
    ]
  },
  {
    day: 'Friday',
    slots: [] // No classes - Free day
  },
  {
    day: 'Saturday',
    slots: [] // No classes - Free day
  }
];

export const FINAL_EXAM_SCHEDULE: DaySchedule[] = [
  {
    day: 'Sunday',
    date: '01-12-2025',
    slots: [
      {
        time: '09:30 AM - 12:30 PM',
        courseCode: 'CSE 320',
        courseName: 'Computer Networks Lab',
        teacher: 'Exam Hall A',
        room: 'Exam Hall A',
        type: 'theory'
      }
    ]
  },
  {
    day: 'Tuesday',
    date: '03-12-2025',
    slots: [
      {
        time: '09:30 AM - 12:30 PM',
        courseCode: 'CSE 327',
        courseName: 'Software Engineering',
        teacher: 'Exam Hall B',
        room: 'Exam Hall B',
        type: 'theory'
      }
    ]
  },
  {
    day: 'Thursday',
    date: '05-12-2025',
    slots: [
      {
        time: '09:30 AM - 12:30 PM',
        courseCode: 'CSE 407',
        courseName: 'Project Management Professional Ethics',
        teacher: 'Exam Hall A',
        room: 'Exam Hall A',
        type: 'theory'
      }
    ]
  },
  {
    day: 'Sunday',
    date: '08-12-2025',
    slots: [
      {
        time: '09:30 AM - 12:30 PM',
        courseCode: 'CSE 417',
        courseName: 'Distributed Database Management Systems',
        teacher: 'Exam Hall B',
        room: 'Exam Hall B',
        type: 'theory'
      }
    ]
  },
  {
    day: 'Tuesday',
    date: '10-12-2025',
    slots: [
      {
        time: '09:30 AM - 12:30 PM',
        courseCode: 'CSE 351',
        courseName: 'Artificial Intelligence and Expert System',
        teacher: 'Exam Hall A',
        room: 'Exam Hall A',
        type: 'theory'
      }
    ]
  }
];

export const getCurrentRoutineType = () => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();
  
  if (currentMonth === 11 && currentDate >= 1 && currentDate <= 15) {
    return 'final_exam';
  }
  
  if (currentMonth === 8 && currentDate >= 14 && currentDate <= 24) {
    return 'midterm_exam';
  }
  
  return 'regular_classes';
};

export const getCurrentSchedule = (): DaySchedule[] => {
  const routineType = getCurrentRoutineType();
  return routineType === 'final_exam' ? FINAL_EXAM_SCHEDULE : REGULAR_CLASS_SCHEDULE;
};

export const getRoutineTitle = (): string => {
  const routineType = getCurrentRoutineType();
  
  switch (routineType) {
    case 'final_exam':
      return '🎯 Final Examination Schedule - Section 5';
    case 'midterm_exam':
      return '📝 Mid-term Examination Schedule - Section 5';
    default:
      return '📚 Section 5 Class Schedule - Fall 2025';
  }
};

export const getRoutineDescription = (): string => {
  const routineType = getCurrentRoutineType();
  
  switch (routineType) {
    case 'final_exam':
      return 'Final examinations for Fall 2025 semester. Good luck with your exams!';
    case 'midterm_exam':
      return 'Mid-term examinations are currently ongoing. Stay focused!';
    default:
      return 'Section 51-5 | Mid-terms completed - Regular classes resumed | More sections coming soon';
  }
};

export const getTodaysSchedule = (): ClassSlot[] => {
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[today.getDay()];
  
  const currentSchedule = getCurrentSchedule();
  const todaySchedule = currentSchedule.find(day => day.day === todayName);
  
  return todaySchedule?.slots || [];
};

export const getNextClass = () => {
  const todaysClasses = getTodaysSchedule();
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  // Check for remaining classes today
  for (const classSlot of todaysClasses) {
    const startTime = parseTimeToMinutes(classSlot.time.split(' - ')[0]);
    if (startTime > currentTime) {
      return {
        ...classSlot,
        isToday: true,
        dayName: null,
        minutesToStart: startTime - currentTime
      };
    }
  }
  
  // If no classes remaining today, get next day's first class
  return getNextDayFirstClass();
};

export const getNextDayFirstClass = () => {
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentSchedule = getCurrentSchedule();
  
  // Start checking from tomorrow
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (today.getDay() + i) % 7;
    const nextDayName = dayNames[nextDayIndex];
    const nextDaySchedule = currentSchedule.find(day => day.day === nextDayName);
    
    if (nextDaySchedule && nextDaySchedule.slots.length > 0) {
      const firstClass = nextDaySchedule.slots[0];
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + i);
      tomorrow.setHours(0, 0, 0, 0);
      
      const startTime = parseTimeToMinutes(firstClass.time.split(' - ')[0]);
      const classDateTime = new Date(tomorrow);
      classDateTime.setHours(Math.floor(startTime / 60), startTime % 60, 0, 0);
      
      const minutesToStart = Math.floor((classDateTime.getTime() - now.getTime()) / (1000 * 60));
      
      return {
        ...firstClass,
        isToday: false,
        dayName: nextDayName,
        daysUntil: i,
        minutesToStart: minutesToStart,
        hoursUntil: Math.floor(minutesToStart / 60)
      };
    }
  }
  
  return null;
};

const parseTimeToMinutes = (timeStr: string): number => {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let totalMinutes = hours * 60 + minutes;
  
  if (period === 'PM' && hours !== 12) {
    totalMinutes += 12 * 60;
  } else if (period === 'AM' && hours === 12) {
    totalMinutes -= 12 * 60;
  }
  
  return totalMinutes;
};

export const getWeeklyClassSummary = () => {
  const schedule = getCurrentSchedule();
  const totalClasses = schedule.reduce((total, day) => total + day.slots.length, 0);
  const labClasses = schedule.reduce((total, day) => 
    total + day.slots.filter(slot => slot.type === 'lab').length, 0
  );
  const theoryClasses = totalClasses - labClasses;
  
  return {
    totalClasses,
    theoryClasses,
    labClasses,
    activeDays: schedule.filter(day => day.slots.length > 0).length
  };
};

export const getCourseClassCount = () => {
  const schedule = getCurrentSchedule();
  const courseCount: Record<string, number> = {};
  
  schedule.forEach(day => {
    day.slots.forEach(slot => {
      courseCount[slot.courseCode] = (courseCount[slot.courseCode] || 0) + 1;
    });
  });
  
  return courseCount;
};

export const getCurrentClassStatus = () => {
  const todaysClasses = getTodaysSchedule();
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  for (const classSlot of todaysClasses) {
    const [startTimeStr, endTimeStr] = classSlot.time.split(' - ');
    const startTime = parseTimeToMinutes(startTimeStr);
    const endTime = parseTimeToMinutes(endTimeStr);
    
    if (currentTime >= startTime && currentTime <= endTime) {
      return {
        status: 'ongoing',
        currentClass: classSlot,
        minutesRemaining: endTime - currentTime
      };
    }
  }
  
  return { status: 'none' };
};

export const formatTimeRemaining = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

// Get the next day with classes
export const getNextDaySchedule = () => {
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentSchedule = getCurrentSchedule();
  
  // Start checking from tomorrow
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (today.getDay() + i) % 7;
    const nextDayName = dayNames[nextDayIndex];
    const nextDaySchedule = currentSchedule.find(day => day.day === nextDayName);
    
    if (nextDaySchedule && nextDaySchedule.slots.length > 0) {
      return {
        dayName: nextDayName,
        daysUntil: i,
        slots: nextDaySchedule.slots,
        totalClasses: nextDaySchedule.slots.length,
        date: getNextDayDate(i)
      };
    }
  }
  
  return null;
};

// Helper to get formatted date for next day
const getNextDayDate = (daysAhead: number): string => {
  const nextDay = new Date();
  nextDay.setDate(nextDay.getDate() + daysAhead);
  return nextDay.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });
};

// Check if all today's classes are finished
export const areTodaysClassesFinished = (): boolean => {
  const todaysClasses = getTodaysSchedule();
  
  if (todaysClasses.length === 0) {
    return true; // No classes today
  }
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  // Get the end time of the last class
  const lastClass = todaysClasses[todaysClasses.length - 1];
  const lastClassEndTime = parseTimeToMinutes(lastClass.time.split(' - ')[1]);
  
  return currentTime > lastClassEndTime;
};

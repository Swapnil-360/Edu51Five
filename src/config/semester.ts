// Academic Calendar Configuration for BUBT Intake 51 Section 5
// Fall 2025 Semester - Real-time tracking system

export interface SemesterPeriod {
  name: string;
  startDate: string;
  endDate: string;
  type: 'regular' | 'midterm' | 'final' | 'break';
}

export interface SemesterConfig {
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  periods: {
    regularClasses: SemesterPeriod;
    midtermExams: SemesterPeriod;
    finalPrep: SemesterPeriod;
    finalExams: SemesterPeriod;
  };
  breaks: {
    winterBreak: SemesterPeriod;
  };
  nextSemester: {
    name: string;
    startDate: string;
  };
}

// CONFIRMED ACADEMIC CALENDAR
export const SEMESTER_CONFIG: SemesterConfig = {
  name: "Fall 2025",
  code: "FALL_2025", 
  startDate: "2025-07-15",      // Confirmed start date
  endDate: "2025-12-15",        // Confirmed end date
  totalDays: 153,               // July 15 to Dec 15 (5 months)

  periods: {
    regularClasses: {
      name: "Regular Classes",
      startDate: "2025-07-15",
      endDate: "2025-09-13",     // Until mid-terms start
      type: 'regular'
    },
    
    midtermExams: {
      name: "Mid-term Examinations",
      startDate: "2025-09-14",   // ACTUAL MID-TERM START (from schedule)
      endDate: "2025-09-24",     // ACTUAL MID-TERM END (from schedule)
      type: 'midterm'
    },
    
    finalPrep: {
      name: "Final Exam Preparation",
      startDate: "2025-09-25",   // After mid-terms end
      endDate: "2025-11-30",     // Before finals
      type: 'regular'
    },
    
    finalExams: {
      name: "Final Examinations",
      // Updated to match the official final exam routine for Section 5
      startDate: "2025-12-04",   // First final exam: 04/12/2025
      endDate: "2025-12-14",     // Last final exam: 14/12/2025
      type: 'final'
    }
  },

  breaks: {
    winterBreak: {
      name: "Winter Break",
      startDate: "2025-12-16",   // Day after finals end
      endDate: "2025-12-31",     // End of year
      type: 'break'
    }
  },

  nextSemester: {
    name: "Spring 2026",
    startDate: "2026-01-01"      // CONFIRMED next semester start
  }
};

// Previous semester for reference
export const PREVIOUS_SEMESTER = {
  name: "Spring 2025",
  startDate: "2025-01-15",       // Estimated
  endDate: "2025-05-31",         // Estimated
  breakStart: "2025-06-01",
  breakEnd: "2025-07-14"         // 14-16 days break confirmed
};

// Real-time semester progress calculator
export const calculateSemesterProgress = (currentDate: Date = new Date()) => {
  const semesterStart = new Date(SEMESTER_CONFIG.startDate);
  const semesterEnd = new Date(SEMESTER_CONFIG.endDate);
  const midtermStart = new Date(SEMESTER_CONFIG.periods.midtermExams.startDate);
  const finalStart = new Date(SEMESTER_CONFIG.periods.finalExams.startDate);
  
  const totalDays = Math.ceil((semesterEnd.getTime() - semesterStart.getTime()) / (1000 * 60 * 60 * 24));
  const daysPassed = Math.ceil((currentDate.getTime() - semesterStart.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.ceil((semesterEnd.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysToMidterm = Math.ceil((midtermStart.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysToFinal = Math.ceil((finalStart.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const progressPercentage = Math.round((daysPassed / totalDays) * 100);
  const semesterWeek = Math.ceil(daysPassed / 7);
  
  // Determine current phase
  let currentPhase: string;
  let nextMilestone: string;
  let daysToMilestone: number;
  
  const midtermEnd = new Date(SEMESTER_CONFIG.periods.midtermExams.endDate);
  
  if (currentDate < midtermStart) {
    currentPhase = "Regular Classes";
    nextMilestone = "Mid-term Exams";
    daysToMilestone = daysToMidterm;
  } else if (currentDate >= midtermStart && currentDate <= midtermEnd) {
    currentPhase = "Mid-term Examinations"; // WE ARE HERE NOW!
    nextMilestone = "Final Exams";
    daysToMilestone = daysToFinal;
  } else if (currentDate < finalStart) {
    currentPhase = "Final Exam Preparation";
    nextMilestone = "Final Exams";
    daysToMilestone = daysToFinal;
  } else if (currentDate <= semesterEnd) {
    currentPhase = "Final Examinations";
    nextMilestone = "Winter Break";
    daysToMilestone = daysRemaining;
  } else {
    currentPhase = "Winter Break";
    nextMilestone = "Spring 2026";
    daysToMilestone = Math.ceil((new Date(SEMESTER_CONFIG.nextSemester.startDate).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  return {
    // Basic Info
    semesterName: SEMESTER_CONFIG.name,
    currentDate: currentDate.toDateString(),
    currentPhase,
    
    // Progress Metrics
    totalDays,
    daysPassed,
    daysRemaining,
    progressPercentage,
    semesterWeek,
    
    // Milestones
    nextMilestone,
    daysToMilestone,
    weeksToMilestone: Math.ceil(daysToMilestone / 7),
    daysToMidterm,
    weeksToMidterm: Math.ceil(daysToMidterm / 7),
    daysToFinal,
    weeksToFinal: Math.ceil(daysToFinal / 7),
    
    // Semester Health
    isActive: currentDate >= semesterStart && currentDate <= semesterEnd,
    isMidtermPeriod: currentDate >= midtermStart && currentDate <= new Date(SEMESTER_CONFIG.periods.midtermExams.endDate),
    isFinalPeriod: currentDate >= finalStart && currentDate <= semesterEnd,
    isBreak: currentDate > semesterEnd
  };
};

// Export current semester status
export const getCurrentSemesterStatus = () => {
  return calculateSemesterProgress();
};

// Bangladesh Standard Time helper
export const getBangladeshTime = () => {
  return new Date().toLocaleString('en-BD', {
    timeZone: 'Asia/Dhaka',
    weekday: 'long',
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Semester timeline data for UI
export const getSemesterTimeline = () => {
  const progress = calculateSemesterProgress();
  
  return {
    phases: [
      {
        name: "Start",
        date: "Jul 15",
        status: "completed",
        icon: "🚀"
      },
      {
        name: "Regular Classes",
        date: "Jul-Oct",
        status: progress.currentPhase === "Regular Classes" ? "current" : progress.daysPassed > 77 ? "completed" : "upcoming",
        icon: "📚"
      },
      {
        name: "Mid-terms",
        date: "Nov 1-15",
        status: progress.isMidtermPeriod ? "current" : progress.daysToMidterm <= 0 ? "completed" : "upcoming",
        icon: "📝"
      },
      {
        name: "Finals",
        date: "Dec 4-14",
        status: progress.isFinalPeriod ? "current" : progress.daysToFinal <= 0 ? "completed" : "upcoming",
        icon: "🎯"
      },
      {
        name: "Break",
        date: "Dec 16",
        status: progress.isBreak ? "current" : "upcoming",
        icon: "🏖️"
      }
    ],
    progressPercentage: progress.progressPercentage
  };
};
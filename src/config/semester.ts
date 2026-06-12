// Academic Calendar Configuration for BUBT Intake 51
// Summer 2026 Semester - Tri-semester system - Real-time tracking

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
    summerBreak: SemesterPeriod;
  };
  nextSemester: {
    name: string;
    startDate: string;
  };
}

// SUMMER 2026 ACADEMIC CALENDAR - BUBT Official Dates
export const SEMESTER_CONFIG: SemesterConfig = {
  name: "Summer 2026",
  code: "SUMMER_2026", 
  startDate: "2026-05-06",      // Orientation and commencement (May 6)
  endDate: "2026-09-03",        // Final Results publication (Sept 3)
  totalDays: 121,               // May 6 to Sept 3 (inclusive)

  periods: {
    regularClasses: {
      name: "Regular Classes",
      startDate: "2026-05-06",
      endDate: "2026-06-23",     // Last day of classes before Midterm (June 23)
      type: 'regular'
    },
    
    midtermExams: {
      name: "Mid-term Examinations",
      startDate: "2026-06-25",   // Mid-term exam period (June 25-July 03)
      endDate: "2026-07-03",     // 9 days for midterms
      type: 'midterm'
    },
    
    finalPrep: {
      name: "Final Exam Preparation",
      startDate: "2026-07-04",   // Classes resume after Midterm (July 04)
      endDate: "2026-08-20",     // Last day of classes before Final (Aug 20)
      type: 'regular'
    },
    
    finalExams: {
      name: "Final Examinations",
      startDate: "2026-08-22",   // Final exams begin (Aug 22)
      endDate: "2026-08-30",     // Final exams end (Aug 30) - 9 days
      type: 'final'
    }
  },

  breaks: {
    summerBreak: {
      name: "Semester Break",
      startDate: "2026-09-04",   // Semester break (Sept 4)
      endDate: "2026-09-04",     // 1 day before Fall 2026 starts
      type: 'break'
    }
  },

  nextSemester: {
    name: "Fall 2026",
    startDate: "2026-09-05"      // Fall semester commencement
  }
};

// Previous semester for reference (Spring 2026)
export const PREVIOUS_SEMESTER = {
  name: "Spring 2026",
  startDate: "2026-01-01",
  endDate: "2026-05-04",
  breakStart: "2026-05-05",
  breakEnd: "2026-05-05"
};

// Real-time semester progress calculator
export const calculateSemesterProgress = (currentDate: Date = new Date()) => {
  const semesterStart = new Date(SEMESTER_CONFIG.startDate);
  const semesterEnd = new Date(SEMESTER_CONFIG.endDate);
  const midtermStart = new Date(SEMESTER_CONFIG.periods.midtermExams.startDate);
  const finalStart = new Date(SEMESTER_CONFIG.periods.finalExams.startDate);
  
  const totalDays = Math.ceil((semesterEnd.getTime() - semesterStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const daysPassed = Math.ceil((currentDate.getTime() - semesterStart.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.ceil((semesterEnd.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysToMidterm = Math.ceil((midtermStart.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysToFinal = Math.ceil((finalStart.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const progressPercentage = Math.min(100, Math.max(0, Math.round((daysPassed / totalDays) * 100)));
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
    currentPhase = "Mid-term Examinations";
    nextMilestone = "Final Exams";
    daysToMilestone = daysToFinal;
  } else if (currentDate < finalStart) {
    currentPhase = "Final Exam Preparation";
    nextMilestone = "Final Exams";
    daysToMilestone = daysToFinal;
  } else if (currentDate <= semesterEnd) {
    currentPhase = "Final Examinations";
    nextMilestone = "Semester Break";
    daysToMilestone = daysRemaining;
  } else {
    currentPhase = "Semester Break";
    nextMilestone = "Fall 2026";
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

// Special academic events - BUBT Summer 2026 Key Dates
export const SPECIAL_EVENTS = {
  orientation: {
    name: "Summer 2026 Orientation & Classes Start",
    date: "2026-05-06",
    description: "Orientation and commencement of classes",
    icon: "🚀"
  },
  midtermStart: {
    name: "Mid-term Examinations Begin",
    date: "2026-06-25",
    description: "Mid-term examination period (June 25 - July 03)",
    icon: "📝"
  },
  classesResumeAfterMidterm: {
    name: "Classes Resume",
    date: "2026-07-04",
    description: "Regular classes resume after midterm exams",
    icon: "📚"
  },
  finalStart: {
    name: "Final Examinations Begin",
    date: "2026-08-22",
    description: "Final examination period (Aug 22 - Aug 30)",
    icon: "🎯"
  },
  resultsPublication: {
    name: "Final Results Publication",
    date: "2026-09-03",
    description: "Publication of final examination results",
    icon: "📊"
  },
  semesterBreak: {
    name: "Semester Break",
    date: "2026-09-04",
    description: "Janmashtami Holiday & Semester break",
    icon: "🏖️"
  },
  fallSemesterStart: {
    name: "Fall 2026 Begins",
    date: "2026-09-05",
    description: "Orientation and commencement of Fall Semester 2026",
    icon: "☀️"
  }
};

// Semester timeline data for UI with BUBT official dates
export const getSemesterTimeline = () => {
  const progress = calculateSemesterProgress();
  const now = new Date();
  
  return {
    phases: [
      {
        name: "Classes Start",
        date: "May 6",
        status: "completed",
        icon: "🚀"
      },
      {
        name: "Regular Classes",
        date: "May-Jun",
        status: progress.currentPhase === "Regular Classes" ? "current" : progress.daysPassed > 48 ? "completed" : "upcoming",
        icon: "📚"
      },
      {
        name: "Mid-terms",
        date: "Jun 25 - Jul 3",
        status: progress.isMidtermPeriod ? "current" : progress.daysToMidterm <= 0 ? "completed" : "upcoming",
        icon: "📝"
      },
      {
        name: "Class Prep",
        date: "Jul-Aug",
        status: progress.currentPhase === "Final Exam Preparation" ? "current" : progress.daysToFinal <= 0 ? "completed" : "upcoming",
        icon: "📖"
      },
      {
        name: "Finals",
        date: "Aug 22-30",
        status: progress.isFinalPeriod ? "current" : progress.daysToFinal <= 0 ? "completed" : "upcoming",
        icon: "🎯"
      },
      {
        name: "Results",
        date: "Sep 3",
        status: now >= new Date("2026-09-03") ? "completed" : "upcoming",
        icon: "📊"
      },
      {
        name: "Break",
        date: "Sep 4",
        status: progress.isBreak ? "current" : "upcoming",
        icon: "🏖️"
      }
    ],
    progressPercentage: progress.progressPercentage
  };
};
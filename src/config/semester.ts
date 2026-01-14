// Academic Calendar Configuration for BUBT Intake 51
// Spring 2026 Semester - Tri-semester system - Real-time tracking

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

// SPRING 2026 ACADEMIC CALENDAR - BUBT Official Dates
export const SEMESTER_CONFIG: SemesterConfig = {
  name: "Spring 2026",
  code: "SPRING_2026", 
  startDate: "2026-01-01",      // Orientation and commencement (Jan 1)
  endDate: "2026-05-04",        // Final Results publication (May 4)
  totalDays: 124,               // January 1 to May 4

  periods: {
    regularClasses: {
      name: "Regular Classes",
      startDate: "2026-01-01",
      endDate: "2026-02-11",     // Last day of classes before Midterm (Feb 11)
      type: 'regular'
    },
    
    midtermExams: {
      name: "Mid-term Examinations",
      startDate: "2026-02-13",   // Mid-term exam period (Feb 13-20)
      endDate: "2026-02-20",     // 8 days for midterms
      type: 'midterm'
    },
    
    finalPrep: {
      name: "Final Exam Preparation",
      startDate: "2026-02-22",   // Classes resume after Midterm (Feb 22)
      endDate: "2026-04-21",     // Last day of classes before Final (Apr 21)
      type: 'regular'
    },
    
    finalExams: {
      name: "Final Examinations",
      startDate: "2026-04-23",   // Final exams begin (Apr 23)
      endDate: "2026-04-30",     // Final exams end (Apr 30) - 8 days
      type: 'final'
    }
  },

  breaks: {
    summerBreak: {
      name: "Summer Break",
      startDate: "2026-05-05",   // Semester break (May 5)
      endDate: "2026-06-05",     // Before Summer 2026 starts
      type: 'break'
    }
  },

  nextSemester: {
    name: "Summer 2026",
    startDate: "2026-06-06"      // Summer semester commencement
  }
};

// Previous semester for reference (Fall 2025)
export const PREVIOUS_SEMESTER = {
  name: "Fall 2025",
  startDate: "2025-09-01",
  endDate: "2025-12-31",
  breakStart: "2026-01-01",
  breakEnd: "2026-01-14"         // 14-day winter break
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
    currentPhase = "Mid-term Examinations";
    nextMilestone = "Final Exams";
    daysToMilestone = daysToFinal;
  } else if (currentDate < finalStart) {
    currentPhase = "Final Exam Preparation";
    nextMilestone = "Final Exams";
    daysToMilestone = daysToFinal;
  } else if (currentDate <= semesterEnd) {
    currentPhase = "Final Examinations";
    nextMilestone = "Summer Break";
    daysToMilestone = daysRemaining;
  } else {
    currentPhase = "Summer Break";
    nextMilestone = "Summer 2026";
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

// Special academic events - BUBT Spring 2026 Key Dates
export const SPECIAL_EVENTS = {
  orientation: {
    name: "Spring 2026 Orientation & Classes Start",
    date: "2026-01-01",
    description: "Orientation and commencement of classes",
    icon: "🚀"
  },
  midtermStart: {
    name: "Mid-term Examinations Begin",
    date: "2026-02-13",
    description: "8-day mid-term examination period",
    icon: "📝"
  },
  classesResumeAfterMidterm: {
    name: "Classes Resume",
    date: "2026-02-22",
    description: "Regular classes resume after mid-term break",
    icon: "📚"
  },
  finalStart: {
    name: "Final Examinations Begin",
    date: "2026-04-23",
    description: "8-day final examination period",
    icon: "🎯"
  },
  resultsPublication: {
    name: "Final Results Publication",
    date: "2026-05-04",
    description: "Publication of final examination results",
    icon: "📊"
  },
  semesterBreak: {
    name: "Semester Break",
    date: "2026-05-05",
    description: "Summer break before next semester",
    icon: "🏖️"
  },
  summerSemesterStart: {
    name: "Summer 2026 Begins",
    date: "2026-06-06",
    description: "Orientation and commencement of Summer Semester 2026",
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
        date: "Jan 1",
        status: "completed",
        icon: "🚀"
      },
      {
        name: "Regular Classes",
        date: "Jan-Feb",
        status: progress.currentPhase === "Regular Classes" ? "current" : progress.daysPassed > 42 ? "completed" : "upcoming",
        icon: "📚"
      },
      {
        name: "Mid-terms",
        date: "Feb 13-20",
        status: progress.isMidtermPeriod ? "current" : progress.daysToMidterm <= 0 ? "completed" : "upcoming",
        icon: "📝"
      },
      {
        name: "Class Prep",
        date: "Feb-Apr",
        status: progress.currentPhase === "Final Exam Preparation" ? "current" : progress.daysToFinal <= 0 ? "completed" : "upcoming",
        icon: "📖"
      },
      {
        name: "Finals",
        date: "Apr 23-30",
        status: progress.isFinalPeriod ? "current" : progress.daysToFinal <= 0 ? "completed" : "upcoming",
        icon: "🎯"
      },
      {
        name: "Results",
        date: "May 4",
        status: now >= new Date("2026-05-04") ? "completed" : "upcoming",
        icon: "📊"
      },
      {
        name: "Break",
        date: "May 5+",
        status: progress.isBreak ? "current" : "upcoming",
        icon: "🏖️"
      }
    ],
    progressPercentage: progress.progressPercentage
  };
};
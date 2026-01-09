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

// SPRING 2026 ACADEMIC CALENDAR (Tri-Semester System)
export const SEMESTER_CONFIG: SemesterConfig = {
  name: "Spring 2026",
  code: "SPRING_2026", 
  startDate: "2026-01-15",      // Spring semester start
  endDate: "2026-05-15",        // Spring semester end (4 months)
  totalDays: 121,               // January 15 to May 15

  periods: {
    regularClasses: {
      name: "Regular Classes",
      startDate: "2026-01-15",
      endDate: "2026-03-10",     // Until mid-terms start
      type: 'regular'
    },
    
    midtermExams: {
      name: "Mid-term Examinations",
      startDate: "2026-03-11",   // Mid-term exams period
      endDate: "2026-03-20",     // 10 days for midterms
      type: 'midterm'
    },
    
    finalPrep: {
      name: "Final Exam Preparation",
      startDate: "2026-03-21",   // After mid-terms end
      endDate: "2026-04-25",     // Before finals
      type: 'regular'
    },
    
    finalExams: {
      name: "Final Examinations",
      startDate: "2026-04-26",   // Final exams begin
      endDate: "2026-05-10",     // Final exams end
      type: 'final'
    }
  },

  breaks: {
    summerBreak: {
      name: "Summer Break",
      startDate: "2026-05-16",   // After semester ends
      endDate: "2026-06-14",     // 30-day break before Summer 2026
      type: 'break'
    }
  },

  nextSemester: {
    name: "Summer 2026",
    startDate: "2026-06-15"      // Next tri-semester starts
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

// Special academic events
export const SPECIAL_EVENTS = {
  orientation: {
    name: "Spring 2026 Orientation",
    date: "2026-01-14",
    description: "Welcome session and course registration for Spring 2026",
    icon: "🎓"
  },
  projectPresentation: {
    name: "Final Project Presentations",
    date: "2026-05-12",
    description: "End of semester project presentations",
    icon: "💼"
  }
};

// Semester timeline data for UI
export const getSemesterTimeline = () => {
  const progress = calculateSemesterProgress();
  const now = new Date();
  const orientationDate = new Date(SPECIAL_EVENTS.orientation.date);
  
  return {
    phases: [
      {
        name: "Start",
        date: "Jan 15",
        status: "completed",
        icon: "🚀"
      },
      {
        name: "Regular Classes",
        date: "Jan-Mar",
        status: progress.currentPhase === "Regular Classes" ? "current" : progress.daysPassed > 55 ? "completed" : "upcoming",
        icon: "📚"
      },
      {
        name: "Mid-terms",
        date: "Mar 11-20",
        status: progress.isMidtermPeriod ? "current" : progress.daysToMidterm <= 0 ? "completed" : "upcoming",
        icon: "📝"
      },
      {
        name: "Finals",
        date: "Apr 26-May 10",
        status: progress.isFinalPeriod ? "current" : progress.daysToFinal <= 0 ? "completed" : "upcoming",
        icon: "🎯"
      },
      {
        name: "Projects",
        date: "May 12",
        status: now >= new Date(SPECIAL_EVENTS.projectPresentation.date) ? "completed" : now.toDateString() === new Date(SPECIAL_EVENTS.projectPresentation.date).toDateString() ? "current" : "upcoming",
        icon: "💼"
      },
      {
        name: "Break",
        date: "May 16",
        status: progress.isBreak ? "current" : "upcoming",
        icon: "🏖️"
      }
    ],
    progressPercentage: progress.progressPercentage
  };
};
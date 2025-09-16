// Test the semester calculations
import { calculateSemesterProgress, getBangladeshTime, getSemesterTimeline } from './semester';

// Test with current date (September 17, 2025)
console.log('=== SEMESTER PROGRESS TEST ===');
console.log('Current Bangladesh Time:', getBangladeshTime());
console.log('');

const progress = calculateSemesterProgress(new Date('2025-09-17'));
console.log('Semester Progress:', progress);
console.log('');

const timeline = getSemesterTimeline();
console.log('Semester Timeline:', timeline);
console.log('');

console.log('=== SUMMARY ===');
console.log(`📅 Today: ${progress.currentDate}`);
console.log(`📚 Semester: ${progress.semesterName} - Week ${progress.semesterWeek}`);
console.log(`📊 Progress: ${progress.progressPercentage}% complete`);
console.log(`🎯 Current Phase: ${progress.currentPhase}`);
console.log(`⏰ Next Milestone: ${progress.nextMilestone} in ${progress.daysToMilestone} days`);
console.log(`📝 Mid-terms: ${progress.daysToMidterm} days (${progress.weeksToMidterm} weeks)`);
console.log(`🎯 Finals: ${progress.daysToFinal} days (${progress.weeksToFinal} weeks)`);
/**
 * Timetable Generation Algorithm (School-Level Edition)
 *
 * Generates a weekly timetable (Mon-Fri, configurable periods per day) based on:
 * - Grade & Section structure
 * - Master Subject & Dynamic Lab management list
 * - Teacher assignments
 * - Configurable Break Hours (Morning Tea Break, Lunch Break, Afternoon Tea Break)
 * - Practical Lab setup (working hours & lab collision detection)
 * - Constraints (no teacher conflicts, max periods per day, lab conflict rules)
 */

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
export const DEFAULT_PERIODS_PER_DAY = 8;

/**
 * Generate a timetable for a school class/section
 */
export function generateTimetable({
  subjects = [],
  frequencies = [],
  facultyAssignments = [],
  hasLab = true,
  labs = [], // Dynamic array of labs: [{ name, teacher, day, time, hours }]
  lab1Name,
  lab1Day,
  lab1Time,
  lab1Hours = 3,
  lab2Name,
  lab2Day,
  lab2Time,
  lab2Hours = 3,
  periodsPerDay = DEFAULT_PERIODS_PER_DAY,
  periodDurationMins = 45,
  lowFreqThreshold = 3,
  enforceLowFreqConstraint = true,
  enforceMaxPeriodsConstraint = true,
}) {
  const numPeriods = parseInt(periodsPerDay) || DEFAULT_PERIODS_PER_DAY;

  // Initialize empty timetable grid
  const timetable = {};
  DAYS.forEach((day) => {
    timetable[day] = new Array(numPeriods).fill(null);
  });

  const teacherMap = {};

  // Build subject-teacher map
  subjects.forEach((subj, idx) => {
    const subName = typeof subj === 'object' ? subj.name : subj;
    const teacher = facultyAssignments[idx] || 'Unassigned Teacher';
    teacherMap[subName] = teacher;
  });

  // Place practical labs
  const labDays = [];
  if (hasLab) {
    if (labs && labs.length > 0) {
      labs.forEach((l) => {
        if (l.name && l.day) {
          const fullName = l.name.includes('(Lab)') ? l.name : `${l.name} (Lab)`;
          placeLab(timetable, l.name, l.day, l.time || 'before', numPeriods, l.hours || 3);
          if (l.teacher) {
            teacherMap[fullName] = l.teacher;
            teacherMap[l.name] = l.teacher;
          }
          labDays.push(l.day);
        }
      });
    } else {
      // Legacy fallback
      if (lab1Name) {
        placeLab(timetable, lab1Name, lab1Day, lab1Time, numPeriods, lab1Hours);
        labDays.push(lab1Day);
      }
      if (lab2Name) {
        placeLab(timetable, lab2Name, lab2Day, lab2Time, numPeriods, lab2Hours);
        labDays.push(lab2Day);
      }
    }
  }

  // Build subject pool based on frequencies
  const subjectPool = [];
  subjects.forEach((subject, index) => {
    const subName = typeof subject === 'object' ? subject.name : subject;
    let freq = 0;
    if (Array.isArray(frequencies)) {
      freq = frequencies[index] || 0;
    } else if (frequencies && typeof frequencies === 'object') {
      freq = parseInt(frequencies[subName]) || 0;
    }

    const teacher = facultyAssignments[index] || teacherMap[subName] || 'Unassigned Teacher';

    for (let i = 0; i < freq; i++) {
      subjectPool.push({
        name: subName,
        teacher,
        isLowFreq: freq <= lowFreqThreshold,
      });
    }
  });

  // Shuffle pool for optimal distribution
  shuffleArray(subjectPool);

  const filteredLabDays = labDays.filter(Boolean);

  for (const day of DAYS) {
    for (let period = 0; period < numPeriods; period++) {
      if (timetable[day][period] !== null) continue;

      const subjectIndex = findSuitableSubject(
        subjectPool,
        timetable,
        day,
        period,
        filteredLabDays,
        enforceLowFreqConstraint,
        enforceMaxPeriodsConstraint
      );

      if (subjectIndex !== -1) {
        const subject = subjectPool[subjectIndex];
        timetable[day][period] = subject.name;
        subjectPool.splice(subjectIndex, 1);
      } else {
        if (subjectPool.length > 0) {
          const subject = subjectPool.shift();
          timetable[day][period] = subject.name;
        } else {
          timetable[day][period] = 'Free / Study Period';
        }
      }
    }
  }

  // Fill remaining slots
  DAYS.forEach((day) => {
    for (let p = 0; p < numPeriods; p++) {
      if (timetable[day][p] === null) {
        timetable[day][p] = 'Free / Study Period';
      }
    }
  });

  // Calculate working hours statistics
  const stats = calculateWorkingHours(timetable, numPeriods, periodDurationMins);

  return {
    ...timetable,
    _stats: stats,
    _periodsPerDay: numPeriods,
    _periodDurationMins: periodDurationMins,
    _teacherMap: teacherMap,
  };
}

function placeLab(timetable, labName, labDay, labTime, numPeriods, labHoursCount = 3) {
  if (!labName || !labDay || !DAYS.includes(labDay)) return;
  const count = Math.min(numPeriods, Math.max(1, parseInt(labHoursCount) || 3));
  const labLabel = labName.includes('(Lab)') ? labName : `${labName} (Lab)`;

  let startPeriod;
  if (labTime === 'before') {
    startPeriod = 1; // Period 2 (index 1), skipping morning assembly / 1st period
  } else {
    startPeriod = Math.max(1, numPeriods - count); // After lunch break
  }

  for (let i = 0; i < count; i++) {
    if (startPeriod + i < numPeriods) {
      timetable[labDay][startPeriod + i] = labLabel;
    }
  }
}

function findSuitableSubject(
  pool,
  timetable,
  day,
  period,
  labDays,
  enforceLowFreq,
  enforceMaxPeriods
) {
  for (let i = 0; i < pool.length; i++) {
    const subject = pool[i];
    let suitable = true;

    const todayCount = timetable[day].filter((s) => s === subject.name).length;

    if (enforceMaxPeriods && todayCount >= 2) {
      suitable = false;
    }

    if (
      period > 0 &&
      timetable[day][period - 1] === subject.name &&
      period > 1 &&
      timetable[day][period - 2] === subject.name
    ) {
      suitable = false;
    }

    if (enforceLowFreq && subject.isLowFreq && labDays.includes(day)) {
      suitable = false;
    }

    if (suitable) return i;
  }
  return -1;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Calculate total working hours and lab hours for a timetable
 */
export function calculateWorkingHours(timetable, numPeriods, periodDurationMins = 45) {
  let totalClassPeriods = 0;
  let totalLabPeriods = 0;
  let freePeriods = 0;

  DAYS.forEach((day) => {
    const periods = timetable[day] || [];
    periods.forEach((cell) => {
      if (!cell || cell.includes('Free')) {
        freePeriods++;
      } else if (cell.includes('(Lab)')) {
        totalLabPeriods++;
        totalClassPeriods++;
      } else {
        totalClassPeriods++;
      }
    });
  });

  const totalClassHours = ((totalClassPeriods * periodDurationMins) / 60).toFixed(1);
  const totalLabHours = ((totalLabPeriods * periodDurationMins) / 60).toFixed(1);
  const totalWeeklyCapacityHours = (((DAYS.length * numPeriods) * periodDurationMins) / 60).toFixed(1);

  return {
    totalClassPeriods,
    totalLabPeriods,
    freePeriods,
    totalClassHours: parseFloat(totalClassHours),
    totalLabHours: parseFloat(totalLabHours),
    totalWeeklyCapacityHours: parseFloat(totalWeeklyCapacityHours),
    hasLab: totalLabPeriods > 0,
  };
}

/**
 * Detect Lab Conflicts across multiple generated class timetables.
 * No 2 classes can have the same lab at the same period on the same day.
 */
export function detectLabConflicts(results) {
  const labOccupancy = {}; // key: `day_periodIndex_labName` -> array of class names
  const conflicts = [];

  const keys = Object.keys(results || {});
  keys.forEach((key) => {
    const item = results[key];
    if (!item || !item.timetable) return;

    const className = `${item.grade || 'Grade'} (${item.section || 'Section'})`;
    const tt = item.timetable;

    DAYS.forEach((day) => {
      const periods = tt[day] || [];
      periods.forEach((cell, periodIdx) => {
        if (cell && cell.includes('(Lab)')) {
          // Extract lab name e.g. "Physics Lab (Lab)" -> "Physics Lab"
          const labName = cell.replace(/\s*\(Lab\)$/, '').trim();
          const occupancyKey = `${day}_P${periodIdx + 1}_${labName.toLowerCase()}`;

          if (!labOccupancy[occupancyKey]) {
            labOccupancy[occupancyKey] = {
              day,
              period: periodIdx + 1,
              labName,
              classes: [],
            };
          }
          labOccupancy[occupancyKey].classes.push(className);
        }
      });
    });
  });

  // Collect any key with > 1 classes assigned
  Object.keys(labOccupancy).forEach((occKey) => {
    const occ = labOccupancy[occKey];
    if (occ.classes.length > 1) {
      conflicts.push({
        day: occ.day,
        period: occ.period,
        labName: occ.labName,
        classes: occ.classes,
        message: `Lab Conflict: "${occ.labName}" is double-booked on ${occ.day} Period ${occ.period} by ${occ.classes.join(' and ')}. No two classes can use the same lab simultaneously.`,
      });
    }
  });

  return conflicts;
}

/**
 * Generate time slots dynamically with 2 Tea Breaks and 1 Lunch Break
 * Returns array of timeline slot objects including period and break slots.
 */
export function generateTimeSlots(
  startTime = '08:30',
  periodsPerDay = DEFAULT_PERIODS_PER_DAY,
  periodDurationMins = 45,
  breakConfig = {
    tea1AfterPeriod: 2,
    tea1DurationMins: 15,
    lunchAfterPeriod: 4,
    lunchDurationMins: 30,
    tea2AfterPeriod: 6,
    tea2DurationMins: 15,
  }
) {
  const slots = [];
  const numPeriods = parseInt(periodsPerDay) || DEFAULT_PERIODS_PER_DAY;

  const tea1After = parseInt(breakConfig.tea1AfterPeriod) || 2;
  const tea1Dur = parseInt(breakConfig.tea1DurationMins) || 15;

  const lunchAfter = parseInt(breakConfig.lunchAfterPeriod) || Math.floor(numPeriods / 2);
  const lunchDur = parseInt(breakConfig.lunchDurationMins) || 30;

  const tea2After = parseInt(breakConfig.tea2AfterPeriod) || 6;
  const tea2Dur = parseInt(breakConfig.tea2DurationMins) || 15;

  let [startHour, startMin] = (startTime || '08:30').split(':').map(Number);
  let currentTime = new Date(2026, 0, 1, startHour || 8, startMin || 30);

  for (let i = 0; i < numPeriods; i++) {
    const periodNum = i + 1;
    const start = formatTime(currentTime);
    currentTime = new Date(currentTime.getTime() + periodDurationMins * 60000);
    const end = formatTime(currentTime);

    let nextBreak = null;
    let breakSlot = null;

    if (periodNum === tea1After) {
      nextBreak = { type: 'Morning Tea Break', duration: tea1Dur };
      const bStart = end;
      const bEndTime = new Date(currentTime.getTime() + tea1Dur * 60000);
      const bEnd = formatTime(bEndTime);
      currentTime = bEndTime;
      breakSlot = {
        isBreak: true,
        type: 'Morning Tea Break',
        label: '☕ Morning Tea Break',
        start: bStart,
        end: bEnd,
        duration: tea1Dur,
      };
    } else if (periodNum === lunchAfter) {
      nextBreak = { type: 'Lunch Break', duration: lunchDur };
      const bStart = end;
      const bEndTime = new Date(currentTime.getTime() + lunchDur * 60000);
      const bEnd = formatTime(bEndTime);
      currentTime = bEndTime;
      breakSlot = {
        isBreak: true,
        type: 'Lunch Break',
        label: '🥪 Lunch Break',
        start: bStart,
        end: bEnd,
        duration: lunchDur,
      };
    } else if (periodNum === tea2After && tea2After < numPeriods) {
      nextBreak = { type: 'Afternoon Tea Break', duration: tea2Dur };
      const bStart = end;
      const bEndTime = new Date(currentTime.getTime() + tea2Dur * 60000);
      const bEnd = formatTime(bEndTime);
      currentTime = bEndTime;
      breakSlot = {
        isBreak: true,
        type: 'Afternoon Tea Break',
        label: '☕ Afternoon Tea Break',
        start: bStart,
        end: bEnd,
        duration: tea2Dur,
      };
    }

    slots.push({
      isBreak: false,
      period: periodNum,
      periodIndex: i,
      start,
      end,
      nextBreak,
      breakSlot,
    });

    if (breakSlot) {
      slots.push(breakSlot);
    }
  }

  return slots;
}

function formatTime(date) {
  const hours = date.getHours().toString().padStart(2, '0');
  const mins = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${mins}`;
}

/**
 * Export Timetable Data to Software-Compatible CSV String (including Break columns)
 */
export function exportToCSV(timetable, grade = 'Grade 10', section = 'Section A', timeSlots = []) {
  const slots = timeSlots.length > 0 ? timeSlots : generateTimeSlots();

  let csv = `School Timetable Export,${grade},${section}\n`;
  csv += `Generated By,ATG Automatic Timetable Generator\n\n`;

  // Header row
  let header = 'Day';
  slots.forEach((slot) => {
    if (slot.isBreak) {
      header += `,"${slot.label} (${slot.start}-${slot.end})"`;
    } else {
      header += `,Period ${slot.period} (${slot.start}-${slot.end})`;
    }
  });
  csv += `${header}\n`;

  const teacherMap = timetable._teacherMap || {};

  // Data rows
  DAYS.forEach((day) => {
    let row = day;
    const periods = timetable[day] || [];
    slots.forEach((slot) => {
      if (slot.isBreak) {
        row += `,"-- ${slot.type} --"`;
      } else {
        const cell = periods[slot.periodIndex] || 'Free';
        const teacher = teacherMap[cell] || '';
        const cellStr = teacher && !cell.includes('Free') ? `${cell} [Teacher: ${teacher}]` : cell;
        row += `,"${cellStr.replace(/"/g, '""')}"`;
      }
    });
    csv += `${row}\n`;
  });

  if (timetable._stats) {
    csv += `\nSummary Statistics\n`;
    csv += `Total Teaching Hours,${timetable._stats.totalClassHours} hrs/week\n`;
    csv += `Total Lab Working Hours,${timetable._stats.totalLabHours} hrs/week\n`;
    csv += `Total Free Periods,${timetable._stats.freePeriods}\n`;
  }

  return csv;
}

export function getFacultyCode(name) {
  if (!name || name.includes('Unassigned')) return 'UT';
  const clean = name.replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.|Prof\.)\s*/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 3).toUpperCase();
  return parts.map((p) => p[0]).join('').toUpperCase();
}

export function getSubjectCode(name) {
  if (!name || name.includes('Free')) return '';
  if (name.includes('(') && name.includes(')')) {
    const match = name.match(/\(([^)]+)\)/);
    if (match && match[1] !== 'Lab') return match[1];
  }
  const clean = name.replace(/\s*\([^)]*\)/g, '').trim();
  const lower = clean.toLowerCase();

  if (lower.includes('distributed computing')) return 'DC';
  if (lower.includes('soft computing')) return 'SC';
  if (lower.includes('internet of things')) return 'IOT';
  if (lower.includes('data mining')) return 'DM';
  if (lower.includes('project')) return 'PROJECT';
  if (lower.includes('computer science')) return 'CS';
  if (lower.includes('social science')) return 'SS';
  if (lower.includes('basic science')) return 'BS';
  if (lower.includes('mathematics') || lower.includes('math')) return 'MATH';
  if (lower.includes('malayalam')) return clean.replace(/malayalam/i, 'MAL');
  if (lower.includes('physics')) return 'PHY';
  if (lower.includes('chemistry')) return 'CHEM';
  if (lower.includes('biology')) return 'BIO';

  const words = clean.split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 4).toUpperCase();
  return words.map((w) => w[0]).join('').toUpperCase();
}

/**
 * Generate Complete Vector PDF HTML string matching Image 2:
 * - Top Class Advisor / Grade & Section Header
 * - Exact Timetable Matrix (1..N periods + vertical LUNCH BREAK column)
 * - Period cells formatted as SUB_CODE(FACULTY_CODE) with consecutive period merging
 * - Course Name & Faculty Roster Table at the bottom (SUB CODE, COURSE NAME, FACULTY NAME, FACULTY CODE)
 */
export function generatePDFHTML({
  timetable,
  grade = 'Grade 10',
  section = 'Section A',
  timeSlots = [],
  teacherMap = {},
}) {
  const periodsCount = timetable._periodsPerDay || DEFAULT_PERIODS_PER_DAY;
  const map = { ...(timetable._teacherMap || {}), ...(teacherMap || {}) };

  // Determine primary advisor / teacher
  const firstTeacher = Object.values(map)[0] || 'Faculty Advisor';

  // Period columns excluding break slots
  const periodIndices = Array.from({ length: periodsCount }, (_, i) => i);
  const lunchAfterPeriod = Math.floor(periodsCount / 2); // e.g. period 4

  // Table Headers
  let headerCols = `<th style="border:1.5px solid #000;background:#e0e0e0;padding:10px;text-align:center;width:75px;font-size:13px;font-weight:bold;"></th>`;
  periodIndices.forEach((pIdx) => {
    headerCols += `<th style="border:1.5px solid #000;background:#e0e0e8;padding:10px;text-align:center;font-size:14px;font-weight:bold;">${pIdx + 1}</th>`;
    if (pIdx + 1 === lunchAfterPeriod) {
      headerCols += `<th style="border:1.5px solid #000;background:#e0e0e8;padding:10px;text-align:center;font-size:12px;font-weight:bold;width:32px;">LUNCH</th>`;
    }
  });

  // Daily Rows with consecutive merging and vertical Lunch column
  let bodyRows = '';
  const dayAbbrs = { Monday: 'MON', Tuesday: 'TUE', Wednesday: 'WED', Thursday: 'THUR', Friday: 'FRI' };

  DAYS.forEach((day, dayIdx) => {
    bodyRows += '<tr>';
    bodyRows += `<td style="border:1.5px solid #000;background:#e0e0e8;font-weight:bold;text-align:center;padding:12px;font-size:13px;">${dayAbbrs[day] || day}</td>`;

    const dayPeriods = timetable[day] || [];
    let p = 0;

    while (p < periodsCount) {
      const cellVal = dayPeriods[p] || 'Free';

      // Check consecutive duplicate periods for merging
      let span = 1;
      if (!cellVal.includes('Free')) {
        while (p + span < periodsCount && p + span + 1 !== lunchAfterPeriod + 1 && dayPeriods[p + span] === cellVal) {
          span++;
        }
      }

      const teacher = map[cellVal] || '';
      const subCode = getSubjectCode(cellVal);
      const facCode = getFacultyCode(teacher);
      const isFree = cellVal.includes('Free');

      let cellDisplay = '';
      if (isFree) {
        cellDisplay = 'FREE';
      } else {
        const codeLabel = subCode || cellVal.toUpperCase();
        cellDisplay = facCode ? `${codeLabel}(${facCode})` : codeLabel;
      }

      bodyRows += `<td colspan="${span}" style="border:1.5px solid #000;padding:12px 6px;text-align:center;vertical-align:middle;font-weight:bold;font-size:13px;line-height:1.3;">${cellDisplay}</td>`;

      if (p + span - 1 + 1 === lunchAfterPeriod) {
        // Insert vertical Lunch Break column on Monday spanning 5 rows
        if (dayIdx === 0) {
          bodyRows += `
            <td rowspan="5" style="border:1.5px solid #000;background:#fafafa;text-align:center;vertical-align:middle;font-weight:bold;font-size:12px;letter-spacing:2px;padding:4px;writing-mode:vertical-rl;transform:rotate(180deg);">
              L U N C H &nbsp; B R E A K
            </td>
          `;
        }
      }

      p += span;
    }

    bodyRows += '</tr>';
  });

  // Course Roster Table (SUB CODE | COURSE NAME | FACULTY NAME | FACULTY CODE)
  const rosterMap = new Map();
  DAYS.forEach((day) => {
    (timetable[day] || []).forEach((subj) => {
      if (subj && !subj.includes('Free') && !rosterMap.has(subj)) {
        const teacher = map[subj] || 'Faculty Member';
        const subCode = getSubjectCode(subj);
        const facCode = getFacultyCode(teacher);
        rosterMap.set(subj, {
          subCode: subCode || subj.toUpperCase().substring(0, 4),
          courseName: subj.toUpperCase(),
          facultyName: teacher.toUpperCase(),
          facultyCode: facCode,
        });
      }
    });
  });

  let rosterRows = '';
  rosterMap.forEach((info) => {
    rosterRows += `
      <tr>
        <td style="border:1.5px solid #000;padding:8px 10px;text-align:center;font-weight:bold;font-size:12px;">${info.subCode}</td>
        <td style="border:1.5px solid #000;padding:8px 10px;font-weight:bold;font-size:12px;">${info.courseName}</td>
        <td style="border:1.5px solid #000;padding:8px 10px;font-weight:bold;font-size:12px;">${info.facultyName}</td>
        <td style="border:1.5px solid #000;padding:8px 10px;text-align:center;font-weight:bold;font-size:12px;">${info.facultyCode}</td>
      </tr>
    `;
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${grade} ${section} Timetable</title>
        <style>
          @page { size: A4 landscape; margin: 15mm; }
          body { font-family: Arial, Helvetica, sans-serif; color: #000; background: #fff; margin: 0; padding: 12px; }
          .advisor-bar { font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #000; }
          table.grid { width: 100%; border-collapse: collapse; border: 2px solid #000; table-layout: fixed; margin-bottom: 24px; }
          table.grid th, table.grid td { border: 1.5px solid #000; }
          table.roster { width: 100%; border-collapse: collapse; border: 2px solid #000; font-size: 12px; }
          table.roster th { border: 1.5px solid #000; background: #d6d6d6; color: #000; text-align: center; padding: 8px; font-weight: bold; }
          table.roster td { border: 1.5px solid #000; padding: 8px; }
        </style>
      </head>
      <body>
        <div class="advisor-bar">
          Class Advisors: ${firstTeacher.toUpperCase()} &nbsp;|&nbsp; ${grade.toUpperCase()} - ${section.toUpperCase()}
        </div>

        <table class="grid">
          <thead>
            <tr>${headerCols}</tr>
          </thead>
          <tbody>
            ${bodyRows}
          </tbody>
        </table>

        ${
          rosterMap.size > 0
            ? `
          <table class="roster">
            <thead>
              <tr>
                <th style="width:15%;">SUB CODE</th>
                <th style="width:45%;">COURSE NAME</th>
                <th style="width:25%;">FACULTY NAME</th>
                <th style="width:15%;">FACULTY CODE</th>
              </tr>
            </thead>
            <tbody>
              ${rosterRows}
            </tbody>
          </table>
        `
            : ''
        }
      </body>
    </html>
  `;
}



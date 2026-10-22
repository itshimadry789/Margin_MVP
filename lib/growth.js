/* Margin growth features: Class Insight and the trimester teaching report.
   One file for the settings and the pure calculations, shared by the app (as a plain script),
   the server's offline templates and the tests. No imports, no exports: it sets globalThis.MarginGrowth. */
(function (root) {
  'use strict';

  /* ---------------- settings ---------------- */
  const CONFIG = {
    ATTAIN_THRESHOLD: 0.5,   // a student attains a CLO at 50% or more of that CLO's marks
    TARGET: 0.6,             // a CLO is achieved when at least 60% of students attain it
    TRIMESTER_WEEKS: 14,
    REPORT_WINDOW_WEEKS: 2,  // the home-screen report card shows in the last 2 weeks
    HARDEST_N: 3,            // "Hardest questions" shows the 3 lowest averages
    HELP_MIN_CLOS: 2,        // "may need help" = below the threshold on 2 or more CLOs
    TERM: 'Fall 2026',
  };

  /* ---------------- calculation ---------------- */
  // assessments: [{ id, name, questions: [{ id, label, clo, max, text? }], scores: { [studentId]: { [questionId]: number } } }]
  // students:    [{ id, name }]
  function compute(assessments, students, cfg) {
    cfg = Object.assign({}, CONFIG, cfg || {});
    const clos = [...new Set(assessments.flatMap((a) => a.questions.map((q) => q.clo)).filter(Boolean))].sort();
    const per = {}; // per[sid][clo] = { earned, avail }
    const qstats = [];
    for (const a of assessments) {
      for (const q of a.questions) {
        if (!q.clo || !(q.max > 0)) continue;
        let sum = 0, n = 0;
        for (const s of students) {
          const row = a.scores[s.id];
          if (!row || row[q.id] == null || row[q.id] === '') continue; // absent: this question does not count for them
          const v = Math.max(0, Math.min(q.max, Number(row[q.id]) || 0));
          const p = (per[s.id] = per[s.id] || {});
          const c = (p[q.clo] = p[q.clo] || { earned: 0, avail: 0 });
          c.earned += v; c.avail += q.max; sum += v / q.max; n++;
        }
        if (n) qstats.push({ assessment: a.name, id: q.id, label: `${a.name} ${q.label}`, clo: q.clo, text: q.text || '', avg: (sum / n) * 100, n });
      }
    }
    const closOut = clos.map((clo) => {
      const withData = students.filter((s) => per[s.id] && per[s.id][clo] && per[s.id][clo].avail > 0);
      const got = withData.filter((s) => per[s.id][clo].earned / per[s.id][clo].avail >= cfg.ATTAIN_THRESHOLD - 1e-9);
      const attain = withData.length ? (got.length / withData.length) * 100 : null;
      return { clo, students: withData.length, attained: got.length, attain, achieved: attain != null && attain >= cfg.TARGET * 100 - 1e-9 };
    });
    const hardest = qstats.slice().sort((a, b) => a.avg - b.avg).slice(0, cfg.HARDEST_N);
    const needHelp = students.map((s) => {
      const below = clos.filter((clo) => per[s.id] && per[s.id][clo] && per[s.id][clo].avail > 0 && per[s.id][clo].earned / per[s.id][clo].avail < cfg.ATTAIN_THRESHOLD);
      return { id: s.id, name: s.name, below, scores: Object.fromEntries(clos.map((c) => [c, per[s.id] && per[s.id][c] ? Math.round((per[s.id][c].earned / per[s.id][c].avail) * 100) : null])) };
    }).filter((x) => x.below.length >= cfg.HELP_MIN_CLOS).sort((a, b) => b.below.length - a.below.length);
    return { clos: closOut, hardest, needHelp, students: students.length, assessments: assessments.length };
  }

  /* ---------------- reading marks sheets ---------------- */
  function parseCSV(text) {
    const rows = []; let row = [], cell = '', q = false;
    const s = String(text || '').replace(/^﻿/, '');
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (q) { if (ch === '"') { if (s[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; continue; }
      if (ch === '"') q = true;
      else if (ch === ',' || ch === '\t' || ch === ';') { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && s[i + 1] === '\n') i++; row.push(cell); cell = ''; if (row.some((c) => c.trim() !== '')) rows.push(row); row = []; }
      else cell += ch;
    }
    row.push(cell); if (row.some((c) => c.trim() !== '')) rows.push(row);
    return rows.map((r) => r.map((c) => c.trim()));
  }
  // Guess which column is the student ID, which is the name and which are questions.
  // A header like "Q3 [CLO3] (10)" carries its CLO and maximum marks.
  function mapColumns(header, rows) {
    const H = header.map((h) => String(h || '').trim());
    const find = (re) => H.findIndex((h) => re.test(h));
    let id = find(/^(student\s*)?(id|roll|reg(istration)?(\s*no)?|student\s*no)\b/i);
    let name = find(/name/i);
    const maxRow = (rows || []).findIndex((r) => /^(max|out of|full marks|total marks)/i.test(String(r[0] || '') + String(r[1] || '')));
    const questions = [];
    H.forEach((h, col) => {
      if (col === id || col === name) return;
      const m = h.match(/^(q(uestion)?\s*\.?\s*(\d+[a-z]?))\b/i) || (/^\d+[a-z]?$/.test(h) ? [h, h, '', h] : null);
      if (!m) return;
      const clo = (h.match(/CLO\s*(\d+)/i) || [])[1];
      const max = Number((h.match(/\((\d+(\.\d+)?)\)/) || [])[1]) || (maxRow >= 0 ? Number(rows[maxRow][col]) : 0) || null;
      questions.push({ col, label: 'Q' + m[3].toUpperCase().replace(/^Q/, ''), clo: clo ? 'CLO' + clo : '', max });
    });
    if (id < 0) id = H.findIndex((_, c) => c !== name && !questions.some((q) => q.col === c));
    // unknown maximum: use the highest mark anyone got, rounded up to a whole mark
    for (const q of questions) if (!q.max) q.max = Math.max(1, Math.ceil(Math.max(0, ...(rows || []).map((r) => Number(r[q.col]) || 0))));
    return { id, name, questions, maxRow };
  }

  /* ---------------- demo data ---------------- */
  function rng(seed) { return function () { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const FIRST = ['Ayesha', 'Rafiq', 'Tasnim', 'Imran', 'Nabila', 'Shakib', 'Farzana', 'Arnab', 'Sadia', 'Tahsin', 'Mim', 'Rakib', 'Nusaiba', 'Fahim', 'Jannat', 'Ridwan', 'Labiba', 'Sabbir', 'Tanjila', 'Mahir', 'Raisa', 'Asif', 'Orpa', 'Nafis', 'Samira', 'Tawsif', 'Prova', 'Zarif', 'Ishrat', 'Nayeem', 'Lamia', 'Sajid', 'Anika', 'Mehedi', 'Rupa', 'Tanvir', 'Shreya', 'Fardin', 'Puja', 'Arif'];
  const LAST = ['Hossain', 'Islam', 'Rahman', 'Ahmed', 'Chowdhury', 'Akter', 'Khan', 'Sarker', 'Das', 'Karim', 'Haque', 'Barua', 'Uddin', 'Sultana', 'Roy', 'Mia', 'Paul', 'Begum', 'Saha', 'Alam'];
  const FIN = {
    id: 'cf-fin', aid: 'a-fin', course: 'FIN 101', title: 'Principles of Finance',
    clos: {
      CLO1: 'Explain the role of financial markets and the time value of money.',
      CLO2: 'Calculate present and future values of cash flows, annuities and loans.',
      CLO3: 'Evaluate investment projects using NPV, IRR and payback period.',
      CLO4: 'Analyse risk and return for single assets and simple portfolios.',
    },
    classes: { planned: 26, held: 25 },
  };
  const FIN_ASSESS = [
    { id: 'fin-quiz', name: 'Quiz 1', kind: 'quiz', questions: [
      { id: 'q1', label: 'Q1', clo: 'CLO1', max: 5, text: 'Time value of money in one sentence' },
      { id: 'q2', label: 'Q2', clo: 'CLO2', max: 5, text: 'Future value of a lump sum' },
      { id: 'q3', label: 'Q3', clo: 'CLO3', max: 5, text: 'Payback period of a simple project' },
      { id: 'q4', label: 'Q4', clo: 'CLO1', max: 5, text: 'Money markets and capital markets' }] },
    { id: 'fin-mid', name: 'Midterm', kind: 'midterm', questions: [
      { id: 'q1', label: 'Q1', clo: 'CLO1', max: 5, text: 'Interest rates and bond prices' },
      { id: 'q2', label: 'Q2', clo: 'CLO2', max: 5, text: 'Present value of an annuity' },
      { id: 'q3', label: 'Q3', clo: 'CLO3', max: 10, text: 'NPV of a 4-year machine purchase' },
      { id: 'q4', label: 'Q4', clo: 'CLO2', max: 10, text: 'Loan instalment and interest split' },
      { id: 'q5', label: 'Q5', clo: 'CLO3', max: 10, text: 'NPV and IRR of a 5-year project, with a recommendation' }] },
  ];
  const FIN_FINAL = { id: 'fin-final', name: 'Final', kind: 'final', questions: [
    { id: 'q1', label: 'Q1', clo: 'CLO1', max: 10, text: 'Policy rate and the cost of capital' },
    { id: 'q2', label: 'Q2', clo: 'CLO2', max: 10, text: 'Retirement savings plan' },
    { id: 'q3', label: 'Q3', clo: 'CLO3', max: 10, text: 'Ranking two projects by NPV and IRR' },
    { id: 'q4', label: 'Q4', clo: 'CLO3', max: 10, text: 'Discounted payback with uneven cash flows' },
    { id: 'q5', label: 'Q5', clo: 'CLO4', max: 10, text: 'Risk and return of a two-asset portfolio' },
    { id: 'q6', label: 'Q6', clo: 'CLO4', max: 10, text: 'Systematic and unsystematic risk' }] };
  // how hard each CLO is for this class (added to a student's ability): CLO3 is clearly the weak one
  const CLO_EASE = { CLO1: 0.18, CLO2: 0.13, CLO3: -0.09, CLO4: 0.12 };
  function finStudents() {
    const r = rng(2026);
    return Array.from({ length: 40 }, (_, n) => ({ id: `2024-2-${String(50 + n * 3).padStart(3, '0')}`, name: `${FIRST[n]} ${LAST[Math.floor(r() * LAST.length)]}`, ability: 0.54 + (r() - 0.5) * 0.58 }));
  }
  function scoreSheet(a, students, seed) {
    const r = rng(seed);
    const scores = {};
    students.forEach((s, n) => {
      if (n === 17 && a.kind === 'quiz') return; // one student missed the quiz
      const row = (scores[s.id] = {});
      for (const q of a.questions) {
        const f = Math.max(0, Math.min(1, s.ability + CLO_EASE[q.clo] + (r() - 0.5) * 0.34));
        row[q.id] = Math.round(f * q.max * 2) / 2;
      }
    });
    return scores;
  }
  function finSeed() {
    const students = finStudents();
    return {
      students: students.map(({ id, name }) => ({ id, name })),
      assessments: FIN_ASSESS.map((a, i) => Object.assign({}, a, { source: 'Entered in Margin', scores: scoreSheet(a, students, 11 + i) })),
    };
  }
  function finFinalCsv() {
    const students = finStudents();
    const scores = scoreSheet(FIN_FINAL, students, 31);
    const head = ['Student ID', 'Student name', ...FIN_FINAL.questions.map((q) => `${q.label} [${q.clo}] (${q.max})`)];
    const lines = [head, ...students.map((s) => [s.id, s.name, ...FIN_FINAL.questions.map((q) => scores[s.id][q.id])])];
    return lines.map((l) => l.map((c) => (/[",]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : c)).join(',')).join('\n');
  }
  const PAST_REPORT = {
    id: 'rep-summer26', term: 'Summer 2026', approved: '2026-08-28', shared: false, closAssessed: 11, closAchieved: 7, held: 70, planned: 78, researchHours: 22,
    sections: {
      wentWell: ['Taught 3 courses (CSE 201, CSE 305, CSE 410) and held 70 of 78 planned classes (90%).', '7 of 11 measured CLOs were achieved, including CSE 410 CLO1 (88%) and CSE 305 CLO2 (81%).', 'Moved the attrition paper to "under review".'],
      struggled: ['CSE 201 CLO2: 52% of students attained it (target 60%). Hardest question: amortised analysis of a dynamic array.', 'CSE 305 CLO3: 55% attained it (target 60%).', 'Course evaluation: students asked for marked quizzes back sooner.'],
      compared: ['This was the first trimester report in Margin, so there was nothing to compare.'],
      growth: ['22 hours of protected research writing; 1 paper moved to review.', 'Goals: two indexed papers this year (0%).', 'Worked with colleagues: moderated 2 papers for Nadia Rahman.'],
      actions: [{ title: 'Add a worked example before each complexity lab in CSE 201', why: 'CSE 201 CLO2 was 52%.' }, { title: 'Return marked quizzes within one week', why: 'The most common request in the course evaluation.' }, { title: 'Protect 4 research hours every week', why: 'Research hours were uneven across the trimester.' }],
    },
  };

  /* ---------------- offline drafting templates (also used by the server when no AI is available) ---------------- */
  const pctTxt = (x) => `${Math.round(x)}%`;
  function insightTemplate(i) {
    const clos = (i.clos || []).filter((c) => c.attain != null);
    if (!clos.length) return { summary: 'No marks yet. Upload a marks sheet to see how students did on each CLO.', actions: [] };
    const weak = clos.slice().sort((a, b) => a.attain - b.attain)[0];
    const hard = (i.hardest || []).filter((q) => q.clo === weak.clo)[0];
    const ok = clos.filter((c) => c.achieved && c.clo !== weak.clo).length;
    const summary = weak.achieved
      ? `All ${clos.length} CLOs are achieved. ${weak.clo} is the lowest at ${pctTxt(weak.attain)}, so it is worth a short review before the final.`
      : [`${weak.clo} (${String(weak.desc || 'this outcome').replace(/\.$/, '').replace(/^([A-Z])(?=[a-z])/, (c) => c.toLowerCase())}) is the weak spot: only ${pctTxt(weak.attain)} of students reached the ${pctTxt(i.threshold || 50)} mark, below the ${pctTxt(i.target || 60)} target.`,
        hard ? `The hardest question on it, ${hard.label}, averaged ${pctTxt(hard.avg)}.` : '',
        ok ? `The other ${ok === 1 ? 'CLO is' : `${ok} CLOs are`} achieved.` : ''].filter(Boolean).join(' ');
    return {
      summary,
      actions: [
        { kind: 'quiz', clo: weak.clo, title: `Create a 10-question practice quiz on ${weak.clo}`, detail: 'Short questions from your bank, one CLO, with an answer key. Students practise before the next assessment.' },
        { kind: 'revision', clo: weak.clo, title: `Plan a revision class on ${weak.clo}`, detail: hard ? `Work through ${hard.label} (${hard.text || 'the hardest question'}) step by step, then two similar problems in class.` : 'Two worked examples, then students try one in pairs.' },
      ],
    };
  }
  function reportTemplate(i) {
    const courses = i.courses || [], clo = i.clo || [], g = i.growth || {}, prev = i.previous;
    const achieved = clo.filter((c) => c.achieved), weak = clo.filter((c) => !c.achieved);
    const held = courses.reduce((a, c) => a + (c.held || 0), 0), planned = courses.reduce((a, c) => a + (c.planned || 0), 0);
    const target = i.target || 60;
    const wentWell = [
      `Taught ${courses.length} courses (${courses.map((c) => c.course).join(', ')}) and held ${held} of ${planned} planned classes${planned ? ` (${Math.round((held / planned) * 100)}%)` : ''}.`,
      achieved.length ? `${achieved.length} of ${clo.length} measured CLOs were achieved, including ${achieved.slice().sort((a, b) => b.attain - a.attain).slice(0, 2).map((c) => `${c.course} ${c.clo} (${pctTxt(c.attain)})`).join(' and ')}.` : 'CLO results will appear here once marks are entered in Class Insight.',
      `${i.assessments || 0} assessments created or recorded in Margin, each mapped to CLOs.`,
      i.evaluation ? `Students rated the course ${i.evaluation.rating}. ${i.evaluation.highlight}` : null,
    ].filter(Boolean);
    const struggled = weak.length ? weak.map((c) => `${c.course} ${c.clo}: ${pctTxt(c.attain)} of students attained it (target ${pctTxt(target)}).${c.hardest ? ` Hardest question: ${c.hardest}.` : ''}`) : ['No measured CLO fell below target this trimester.'];
    if (i.evaluation && i.evaluation.concern) struggled.push(`Course evaluation: ${i.evaluation.concern}`);
    const compared = prev
      ? [`CLOs achieved: ${achieved.length} of ${clo.length} now, against ${prev.closAchieved} of ${prev.closAssessed} in ${prev.term}.`,
        `Classes held: ${held} of ${planned} now, against ${prev.held} of ${prev.planned} in ${prev.term}.`,
        `Research writing: ${g.researchHours || 0} hours now, against ${prev.researchHours} in ${prev.term}.`]
      : ['This is your first trimester report in Margin, so there is nothing to compare yet.'];
    const growth = [
      `${g.researchHours || 0} hours of protected research writing; ${g.papersMoved || 0} paper${g.papersMoved === 1 ? '' : 's'} moved forward${g.accepted ? ` and ${g.accepted} accepted` : ''}.`,
      g.goals && g.goals.length ? `Goals: ${g.goals.map((x) => `${x.t} (${pctTxt(x.pct)})`).join('; ')}.` : null,
      g.colleagues ? `Worked with colleagues: ${g.colleagues}.` : null,
    ].filter(Boolean);
    const w = weak.slice().sort((a, b) => a.attain - b.attain)[0];
    const actions = [
      w ? { title: `Rebuild the ${w.course} ${w.clo} unit with worked examples and a practice quiz`, why: `${w.clo} attainment was ${pctTxt(w.attain)}, below the ${pctTxt(target)} target.` } : { title: 'Keep every CLO above target with one practice quiz per unit', why: 'All measured CLOs were achieved; keep the habit.' },
      { title: `Protect ${Math.max(4, Math.round((g.researchHours || 0) / 10) + 2)} research hours every week`, why: `You logged ${g.researchHours || 0} hours this trimester; a steady weekly block keeps the promotion date on track.` },
      { title: 'Ask a colleague to moderate every midterm and final paper', why: 'Moderated papers go straight into the course file and catch unclear questions early.' },
    ];
    return { wentWell, struggled, compared, growth, actions };
  }

  root.MarginGrowth = { CONFIG, compute, parseCSV, mapColumns, finSeed, finFinalCsv, FIN, FIN_FINAL, PAST_REPORT, insightTemplate, reportTemplate };
})(typeof globalThis !== 'undefined' ? globalThis : window);

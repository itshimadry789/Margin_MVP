/* Margin Compass: all mock data for the rebuilt Compass section, in one place.
   Everything here is SAMPLE DATA for the prototype. Journal names are fictional, and so are their metrics.
   No real citation appears anywhere: example references use placeholder authors and titles, marked as samples.
   Sets globalThis.MarginCompassData; lib/compass.js reads it. */
(function (root) {
  'use strict';

  const mockData = {
    persona: {
      full: 'Dr. Farhan Kabir',
      short: 'Dr. Kabir',
      first: 'Farhan',
      age: 36,
      title: 'Assistant Professor',
      dept: 'Business',
      goal: 'Associate Professor',
    },

    /* Sample promotion rule. ETA maths lives in compass.js and uses these numbers. */
    rule: {
      title: 'Associate Professor',
      needPapers: 3,          // indexed papers (Scopus or Web of Science)
      needTop: 1,             // of which at least this many in Q1 or Q2
      committeeMonths: 2,     // dossier, committee cycle and approval after the last acceptance
      revisionMonths: 2,      // one round of revisions, typical
      label: 'Sample rule: 3 indexed papers, at least 1 in Q1 or Q2',
    },

    stages: ['Idea', 'Writing', 'Submitted', 'Under review', 'Published'],

    /* stage: index into stages. idle: days since the paper last moved. */
    papers: [
      { id: 'p-ocr', t: 'Bangla OCR for invoice digitisation', short: 'Bangla OCR', stage: 1, idle: 21, indexedTarget: true,
        writeLeftMonths: 1.5, target: null, co: 'Dr. Nusrat Jahan (CSE)',
        next: 'Pick a target journal, then finish the results section', words: 6840 },
      { id: 'p-mb', t: 'Mobile banking adoption in rural Bangladesh', short: 'Mobile banking', stage: 3, idle: 70, indexedTarget: true,
        target: 'j-jrds', weeksInReview: 10, co: 'Dr. Sadia Islam',
        next: 'No reply in 10 weeks: send a polite follow-up' },
      { id: 'p-idea', t: 'Digital wallets among gig workers in Dhaka', short: 'Gig workers', stage: 0, idle: 9, indexedTarget: true,
        target: null, co: '', next: 'Find 5 recent papers to frame the gap' },
      { id: 'p-pub1', t: 'Service quality and student loyalty in private universities', short: 'Student loyalty', stage: 4, idle: 400,
        published: { year: 2024, quartile: 'Q3', index: 'Scopus' }, co: '', next: 'In your promotion dossier' },
      { id: 'p-pub2', t: 'Working capital practices of export garment SMEs', short: 'Garment SMEs', stage: 4, idle: 160,
        published: { year: 2026, quartile: 'Q2', index: 'Scopus, WoS' }, co: 'Dr. Sadia Islam', next: 'In your promotion dossier' },
    ],

    /* Research time this week (sample). */
    blocks: [
      { id: 'b1', day: 'Sun', label: '8:00 to 9:30 am, at home', h: 1.5, done: true },
      { id: 'b2', day: 'Tue', label: '2:30 to 4:30 pm, office', h: 2, done: true },
      { id: 'b3', day: 'Thu', label: '7:30 to 8:00 am, before class', h: 0.5, done: false, next: true },
    ],
    weeklyTargetH: 4,

    /* Fictional journals. reviewWeeks = median time to first decision. apc in USD; 0 = no fee. */
    journals: [
      { id: 'j-jadi', name: 'Journal of Applied Document Intelligence', fit: 92, index: ['Scopus'], q: 'Q2', reviewWeeks: 14, accept: 24, apc: 0, oa: 'Hybrid: free to publish, open access optional',
        why: 'Publishes OCR and document AI for business records, including low-resource scripts.',
        style: 'IEEE', abstractMax: 250, wordMax: 8000, highlights: true, sections: ['I. Introduction', 'II. Related Work', 'III. Method', 'IV. Experiments', 'V. Conclusion'] },
      { id: 'j-hijack', name: 'Journal of Advanced Computing and Business Research', fit: 95, index: ['Scopus (claimed)'], q: 'Q1 (claimed)', reviewWeeks: 2, accept: 90, apc: 450, oa: 'Open access',
        why: 'Title and scope match your keywords closely, which is how hijacked sites attract authors.',
        flag: {
          title: "Warning: likely hijacked journal. The site doesn't match the indexed journal's official URL.",
          reasons: [
            'The indexed journal with this name lists its official site as jacbr.example. This result points to jacbr-submit.example.',
            'The submission domain was registered 4 months ago. The indexed journal has published since 2011.',
            'It promises a 2-week review and a 90% acceptance rate. Indexed Q1 journals in this field take 3 to 6 months.',
            'The fee is paid to a personal mobile wallet, not to a publisher account.',
          ],
          check: 'Before you submit anywhere, open the journal from the Scopus source list, not from an email or a search result.',
        } },
      { id: 'j-ijisem', name: 'International Journal of Information Systems in Emerging Markets', fit: 88, index: ['Scopus', 'WoS'], q: 'Q2', reviewWeeks: 18, accept: 21, apc: 1200, oa: 'Gold open access',
        why: 'Strong on technology adoption in South Asia; reviewers will value the invoice use case.',
        style: 'APA 7', abstractMax: 200, wordMax: 9000, highlights: false },
      { id: 'j-ajat', name: 'Asian Journal of Accounting Technology', fit: 81, index: ['Scopus'], q: 'Q3', reviewWeeks: 16, accept: 35, apc: 0, oa: 'Subscription',
        why: 'Free to publish and fits the invoice angle, but Q3 with a narrower readership.',
        style: 'APA 7', abstractMax: 250, wordMax: 7000, highlights: false },
      { id: 'j-clsal', name: 'Computational Linguistics for South Asian Languages', fit: 76, index: ['Scopus', 'WoS'], q: 'Q1', reviewWeeks: 22, accept: 15, apc: 2400, oa: 'Gold open access',
        why: 'Top venue for Bangla language tech; expects a larger benchmark than your current dataset.',
        style: 'IEEE', abstractMax: 200, wordMax: 10000, highlights: true },
      /* already holds the mobile banking paper */
      { id: 'j-jrds', name: 'Journal of Rural Development Studies', fit: 0, index: ['Scopus'], q: 'Q3', reviewWeeks: 50, accept: 18, apc: 0, oa: 'Subscription', hidden: true,
        editor: 'Prof. M. Haque (Handling Editor)' },
    ],

    finderInput: {
      title: 'Bangla OCR for invoice digitisation',
      abstract: 'Small businesses in Bangladesh still keep most invoices on paper, in Bangla script. We build an OCR pipeline for printed and handwritten Bangla invoices, trained on synthetic data and 1,200 real invoices collected from 14 SMEs in Dhaka. We report character error rate against two open-source baselines and measure the time saved in bookkeeping at three partner firms.',
      filters: { index: 'any', quartile: 'any', apc: 'any', review: '24' },
    },

    /* Manuscript formatter (simulated upload). */
    manuscript: {
      file: 'Bangla_OCR_invoices_draft_v7.docx',
      words: 6840, refs: 38, figures: 5, abstractWords: 268, keywords: 5,
      changes: [
        { k: 'Headings', before: '1. INTRODUCTION · 2. LITERATURE REVIEW · 3. METHODOLOGY · 4. FINDINGS · 5. CONCLUSION', after: 'I. Introduction · II. Related Work · III. Method · IV. Experiments · V. Conclusion', note: 'Renamed and renumbered to the journal\'s section template.' },
        { k: 'Abstract', before: '268 words, one paragraph', after: '268 of 250 words: 18 over', note: 'Margin does not rewrite your abstract. It marked the two longest sentences for you to shorten.', warn: true },
        { k: 'References', before: 'APA 7, 38 references', after: 'IEEE, numbered in order of citation', note: 'All 38 converted; in-text citations changed to [1], [2]…',
          sample: { before: 'Author, A., & Author, B. (2021). Sample reference title. Sample Journal, 4(2), 11–20.', after: '[1] A. Author and B. Author, “Sample reference title,” Sample Journal, vol. 4, no. 2, pp. 11–20, 2021.' } },
        { k: 'Figure captions', before: 'Figure 1: OCR pipeline (above the figure)', after: 'Fig. 1. OCR pipeline. (below the figure)', note: '5 captions moved and restyled.' },
      ],
      checklist: [
        { id: 'words', t: 'Word limit', ok: '6,840 of 8,000 words', st: 'ok' },
        { id: 'cover', t: 'Cover letter', ok: 'Filled from the journal\'s template with title, editor and scope match', warn: 'Cover letter template not filled yet', st: 'warn', fix: 'Fill the template' },
        { id: 'abs', t: 'Abstract length', ok: 'Shortened by you to fit the limit', warn: 'Over the limit: shorten the 2 marked sentences', st: 'warn', fix: 'I have shortened it' },
        { id: 'kw', t: 'Keywords', ok: '5 keywords (journal asks for 4 to 6)', st: 'ok' },
        { id: 'data', t: 'Data availability statement', ok: 'Statement added: data available on request (you chose this)', warn: 'Missing. Choose which statement applies', st: 'warn', fix: 'Choose a statement' },
        { id: 'hl', t: 'Highlights', ok: '4 highlights, each under 85 characters', warn: 'Missing. The journal requires 3 to 5', st: 'missing' },
      ],
      highlights: [
        'An OCR pipeline for printed and handwritten Bangla invoices.',
        'Trained on synthetic data plus 1,200 real SME invoices.',
        'Character error rate compared with two open-source baselines.',
        'Bookkeeping time measured at three partner firms in Dhaka.',
      ],
      dataStatements: [
        'The data that support the findings are available from the corresponding author on reasonable request.',
        'The data are publicly available at [repository link to add].',
        'The data cannot be shared because of commercial agreements with the partner firms.',
      ],
    },

    /* Reviewer comments arrive "10 weeks later" (demo step 5). Written for this prototype. */
    reviewerComments: [
      { id: 'c1', r: 'Reviewer 1', text: 'The synthetic data generation is under-described. How were fonts, noise and handwriting variations chosen, and how close is the synthetic distribution to the real invoices?',
        polite: 'Thank you for this helpful comment. We agree the description was too brief. We have expanded the section to explain how fonts, noise and handwriting variation were chosen, and added a comparison of the synthetic and real distributions: [add your comparison figure or table].',
        firm: 'We have expanded the description of synthetic data generation, covering font, noise and handwriting choices, and added a distribution comparison: [add your comparison figure or table].',
        where: 'Section III.B, lines 141–168' },
      { id: 'c2', r: 'Reviewer 1', text: 'Please report results separately for printed and handwritten invoices. A single combined character error rate hides the harder case.',
        polite: 'We appreciate this suggestion. Table 3 now reports character error rate separately for printed and handwritten invoices: [add the split figures from your results].',
        firm: 'Table 3 now reports printed and handwritten results separately: [add the split figures from your results].',
        where: 'Section IV.A, Table 3, lines 212–230' },
      { id: 'c3', r: 'Reviewer 1', text: 'The time-saved measurement at partner firms is interesting but anecdotal. State the measurement protocol and the number of invoices timed.',
        polite: 'Thank you. We have added the measurement protocol and the number of invoices timed at each firm: [add the protocol details and counts from your field notes].',
        firm: 'The measurement protocol and invoice counts per firm are now stated: [add the protocol details and counts].',
        where: 'Section IV.C, lines 268–281' },
      { id: 'c4', r: 'Reviewer 2', text: 'The related work misses recent transformer-based OCR approaches for Indic scripts. Please position your contribution against them.',
        polite: 'Thank you for pointing this out. We have added a paragraph on transformer-based OCR for Indic scripts and clarified how our contribution differs: [add the papers you choose and your positioning sentence].',
        firm: 'Related Work now covers transformer-based OCR for Indic scripts, and our positioning against it is stated: [add the papers you choose and your positioning sentence].',
        where: 'Section II, lines 64–90' },
      { id: 'c5', r: 'Reviewer 2', text: 'Will the dataset be released? If not, explain why, since this limits reproducibility.',
        polite: 'We appreciate the reviewer\'s concern for reproducibility. We have clarified data availability in the statement and in the limitations: [choose: release, release on request, or explain the commercial agreement].',
        firm: 'Data availability is now stated explicitly, with the reason for any restriction: [choose: release, release on request, or explain the commercial agreement].',
        where: 'Data availability statement; Section V, lines 302–306' },
    ],

    /* Teaching → research ideas, from his course data (sample). */
    ideas: [
      { id: 'i1', t: 'CLO attainment before and after flipped quizzes in BUS 2101: a publishable education study',
        why: 'You switched BUS 2101 to flipped quizzes this trimester. CLO 2 attainment rose from 54% to 71% of students (sample data). A before-and-after design with two cohorts is a standard, publishable education study.',
        journal: 'Scopus-indexed management education journal, Q2–Q3',
        data: ['CLO attainment, Summer and Fall 2026', '4 quiz score sets, 2 sections', 'Attendance export', 'Course outline and CLO map'],
        needs: 'Ethics approval and anonymised data before analysis.' },
      { id: 'i2', t: 'Does mid-term feedback change final-exam outcomes? Evidence from three sections of FIN 2201',
        why: 'You sent written mid-term feedback to two of three sections. The third is a natural comparison group.',
        journal: 'Accounting or finance education journal, Q3',
        data: ['Mid-term and final marks, 3 sections', 'Feedback sent log (dates only)', 'Class Insight results'],
        needs: 'Check with your chair that section allocation was not by ability.' },
      { id: 'i3', t: 'Case-based Excel assignments and analytical skills in MKT 3105',
        why: 'Your rubric scores for the "analysis" CLO are recorded per assignment over two trimesters, so the trend is already in Margin.',
        journal: 'Business education or marketing education journal, Q2–Q3',
        data: ['Rubric scores per CLO, 2 trimesters', 'Assignment briefs', 'Course evaluation summary'],
        needs: 'A short student survey would strengthen it; Margin can draft the consent form.' },
    ],

    /* Margin's action cards on Compass home. */
    followUp: {
      to: 'Prof. M. Haque, Handling Editor, Journal of Rural Development Studies',
      subject: 'Status enquiry: manuscript JRDS-2026-0418',
      body: 'Dear Prof. Haque,\n\nI hope you are well. I am writing to ask about the status of our manuscript "Mobile banking adoption in rural Bangladesh" (JRDS-2026-0418), submitted 10 weeks ago. We would be grateful for any update on the review, and we are happy to provide anything that would help.\n\nThank you for your time.\n\nKind regards,\nDr. Farhan Kabir\nAssistant Professor, Business',
    },

    friday: {
      stuck: ['Gig workers idea: no reading done for 9 days.', 'Thursday\'s 30-minute block is short; it may not be enough for the response letter.'],
      plan: [
        { t: 'Fill the [placeholders] in the response letter', when: 'Sun, 8:00 to 9:30 am' },
        { t: 'Re-run the split results for Reviewer 1, comment 2', when: 'Tue, 2:30 to 4:30 pm' },
        { t: 'Read 2 papers for the gig workers idea', when: 'Thu, 7:30 to 8:00 am' },
      ],
    },
  };

  root.MarginCompassData = mockData;
})(typeof globalThis !== 'undefined' ? globalThis : this);

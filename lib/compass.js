/* Margin Compass (v13): the growth side does real research work.
   Margin finds, formats, checks and drafts responses. The teacher approves. It never writes the research.
   Frontend only: every AI step is simulated with a short loading state and pre-written output from lib/compass-data.js.
   The app script calls MarginCompass.install(bridge) before its first render; the bridge exposes the app internals used here. */
(function (root) {
  'use strict';
  const D = root.MarginCompassData;
  const CXV = 2;
  let B = null;

  /* ---------------- state ---------------- */
  const clone = (o) => JSON.parse(JSON.stringify(o));
  function fresh() {
    return {
      v: CXV, tab: 'home',
      papers: clone(D.papers), moved: [], moreActs: false, pipeOpen: false, fuOpen: false,
      finder: { st: 'idle', title: D.finderInput.title, abstract: D.finderInput.abstract, f: clone(D.finderInput.filters), hidden: [], notes: {}, flagOpen: true },
      fmt: { st: 'idle', journal: null, approved: false, skip: [], checks: {}, hl: 'pending', hlText: null, dataSt: null, dl: false, busy: null },
      rev: { st: 'idle', arrived: false, tone: 'polite', text: commentsText(), rows: {} },
      ideas: { st: 'idle', d: {}, titles: {} },
      fri: { st: 'idle', approved: false },
      acts: {}, etaFrom: null, etaWas: null,
      demo: { on: false, step: 0 },
    };
  }
  function commentsText() {
    const by = {};
    D.reviewerComments.forEach((c) => { (by[c.r] = by[c.r] || []).push(c.text); });
    return Object.keys(by).map((r) => r + '\n' + by[r].map((t, i) => (i + 1) + '. ' + t).join('\n')).join('\n\n');
  }
  const S = () => B.S;
  function X() { const s = S(); if (!s.cx || s.cx.v !== CXV) s.cx = fresh(); return s.cx; }
  const J = (id) => D.journals.find((j) => j.id === id);
  const P = (id) => X().papers.find((p) => p.id === id);
  const OCR = () => P('p-ocr');
  const esc = (s) => B.esc(s);
  const ic = (n, s, w) => B.ic(n, s, w);
  const sample = '<span class="cx-sample">Sample data</span>';

  /* ---------------- promotion maths (sample rule) ---------------- */
  const isTop = (q) => /^Q[12]$/.test(q || '');
  const pubQ = (p) => (p.published ? p.published.quartile : (J(p.target) || {}).q);
  function monthsToAccept(p) {
    const j = J(p.target); if (!j || j.flag) return null;
    const rv = j.reviewWeeks / 4.33, R = D.rule.revisionMonths, w = p.writeLeftMonths || 1.5;
    if (p.decision) return R + 1;                     // revision + re-review
    if (p.stage === 0) return 4 + w + rv + R;
    if (p.stage === 1) return w + rv + R;
    if (p.stage === 2) return rv + R;
    if (p.stage === 3) return Math.max(1, rv - (p.weeksInReview || 0) / 4.33) + R;
    return 0;
  }
  function etaOf(papers) {
    const pub = papers.filter((p) => p.stage === 4);
    const need = D.rule.needPapers - pub.length, topHave = pub.filter((p) => isTop(pubQ(p))).length;
    if (need <= 0 && topHave >= D.rule.needTop) return { months: D.rule.committeeMonths, ready: true };
    const c = papers.filter((p) => p.stage < 4 && p.target).map((p) => ({ p, m: monthsToAccept(p) })).filter((x) => x.m != null).sort((a, b) => a.m - b.m);
    if (c.length < need) return { months: null };
    let pick = c.slice(0, need);
    if (topHave < D.rule.needTop && !pick.some((x) => isTop(J(x.p.target).q))) {
      const t = c.find((x) => isTop(J(x.p.target).q)); if (!t) return { months: null };
      pick = pick.slice(0, need - 1).concat(t);
    }
    pick.sort((a, b) => b.m - a.m);
    return { months: Math.ceil(pick[0].m + D.rule.committeeMonths), via: pick[0].p };
  }
  const eta = () => etaOf(X().papers);
  function withTarget(pid, jid) { return etaOf(X().papers.map((p) => (p.id === pid ? Object.assign({}, p, { target: jid }) : p))); }
  function fastest() {
    const now = eta().months; let best = null;
    X().papers.filter((p) => p.stage < 4 && !p.target).forEach((p) => {
      D.journals.filter((j) => !j.flag && !j.hidden).forEach((j) => {
        const m = withTarget(p.id, j.id).months;
        if (m != null && (now == null || m < now) && (!best || m < best.m)) best = { p, j, m };
      });
    });
    return best;
  }
  function etaDate(m) { const d = new Date(); d.setMonth(d.getMonth() + m); return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }); }
  const pubCount = () => X().papers.filter((p) => p.stage === 4).length;
  /* Research blocks live in the app's own model (S.compass.blocks), so Today, focus mode and Compass share one set of hours. */
  const blocks = () => S().compass.blocks;
  const hoursDone = () => blocks().filter((b) => b.done).reduce((a, b) => a + b.h, 0);
  const isPhone = () => matchMedia('(max-width:719px)').matches;
  const fmtH = (n) => (Math.round(n * 10) / 10).toString();

  /* ---------------- helpers ---------------- */
  function later(ms, fn) { setTimeout(() => { fn(); B.save(); if (S().view === 'compass') B.render(); }, ms); }
  function track(t) { X().moved.unshift({ t, at: Date.now() }); X().moved = X().moved.slice(0, 12); }
  function etaChange(before) { const a = eta().months; if (before !== a) { X().etaFrom = before; X().etaWas = before; } return a; }
  function etaTrail(before, after) { return before === after ? `Promotion ETA unchanged: ~${after} months` : `Promotion ETA: ${before == null ? 'not set' : '~' + before} → ~${after} months`; }
  const loader = (t, s) => `<div class="cx-load" role="status"><span class="cx-spin" aria-hidden="true"></span><div><b>${esc(t)}</b>${s ? `<span>${esc(s)}</span>` : ''}</div></div>`;
  const sheetHead = (k, t) => `<div class="sheet-h"><div><div class="tile-k">${ic('lock', 12, 2.4)} ${esc(k)}</div><h2 id="sh-t">${esc(t)}</h2></div><button type="button" class="icon-btn" data-act="close" aria-label="Close">${ic('x', 20)}</button></div>`;
  const placeholders = (t) => esc(t).replace(/\[([^\]]+)\]/g, '<mark class="cx-ph">[$1]</mark>');

  /* ---------------- view ---------------- */
  const TABS = [['home', 'Home', 'compass'], ['finder', 'Journals', 'search'], ['format', 'Format', 'letter'], ['reviews', 'Reviews', 'mail'], ['ideas', 'Ideas', 'spark'], ['friday', 'Friday', 'cal']];
  const TOOL_NAMES = { finder: 'Journal finder', format: 'Manuscript formatter', reviews: 'Reviewer responses', ideas: 'Ideas from your teaching', friday: 'Friday review' };
  const lastMoved = (d) => (d < 14 ? `Last moved ${d} day${d === 1 ? '' : 's'} ago` : `Last moved ${Math.round(d / 7)} weeks ago`);
  function view() {
    const x = X(); if (B.tourOn && B.tourOn()) { x.tab = 'home'; x.demo.on = false; }
    const t = TABS.some((z) => z[0] === x.tab) ? x.tab : 'home';
    const right = `<span class="pill private cx-priv">${ic('lock', 12, 2.4)} Private: your university never sees this</span>
      <button type="button" class="btn sm ${x.demo.on ? 'primary' : ''} cx-demo-btn" data-act="cx-demo" aria-pressed="${x.demo.on}">${ic('focus', 15)} Demo</button>`;
    /* Phones get one navigation row (the app's tab bar): Compass home is the hub, tool screens get a back link. */
    const cur = TABS.find((z) => z[0] === t);
    const nav = isPhone()
      ? (t === 'home' ? '' : `<div class="cx-back rise" style="--i:1"><button type="button" class="lnk" data-act="cx-tab" data-v="home">${ic('chevL', 14, 2.4)} Compass</button><b>${ic(cur[2], 15)} ${TOOL_NAMES[t]}</b></div>`)
      : `<nav class="segs cx-tabs rise" style="--i:1" aria-label="Compass sections">${TABS.map(([k, l, i]) => `<button type="button" data-act="cx-tab" data-v="${k}" aria-pressed="${k === t}">${ic(i, 15)} ${l}</button>`).join('')}</nav>`;
    const body = { home: vHome, finder: vFinder, format: vFormat, reviews: vReviews, ideas: vIdeas, friday: vFriday }[t]();
    setTimeout(afterRender, 0);
    return `<div class="view v9p cx ${x.demo.on ? 'cx-demo-on' : ''}">
      ${B.hd9('compass', B.L('Compass'), 'Margin finds, formats, checks and drafts. You approve, and the research stays yours.', right)}
      ${nav}${body}${x.demo.on ? demoBar() : ''}</div>`;
  }

  /* ---------- 1. home ---------- */
  function vHome() {
    const x = X(), e = eta(), f = fastest(), pc = pubCount(), need = D.rule.needPapers;
    const pubs = x.papers.filter((p) => p.stage === 4), top = pubs.filter((p) => isTop(pubQ(p)));
    const missing = pc >= need ? (top.length ? 'Nothing. The paper rule is met.' : 'One of your papers must be in a Q1 or Q2 journal.')
      : `${need - pc} more indexed paper${need - pc > 1 ? 's' : ''} (Scopus or WoS).${top.length ? ` The Q1/Q2 part is already met by “${esc(top[0].short)}” (${esc(pubQ(top[0]))}).` : ''}`;
    const ocr = OCR(), tj = J(ocr.target);
    const move = f ? `<div class="cx-fast"><span class="cx-fast-ic">${ic('spark', 16)}</span><p><b>Fastest way to move this date:</b> submit the ${esc(f.p.short)} paper to a ${esc(f.j.q)} journal → <b class="num">${f.m} months</b>.</p><button type="button" class="btn sm accent" data-act="cx-tab" data-v="finder">${ic('search', 15)} Find the journal</button></div>`
      : e.via ? `<div class="cx-fast"><span class="cx-fast-ic">${ic('arrow', 16)}</span><p><b>What sets this date:</b> “${esc(e.via.short)}” at ${esc(J(e.via.target).name)}. ${e.via.stage <= 1 ? 'Finish writing, format it and submit.' : e.via.decision ? 'Send the revision and response letter.' : 'Wait for the decision; Margin watches the reply time.'}</p>${e.via.stage <= 1 ? `<button type="button" class="btn sm accent" data-act="cx-tab" data-v="format">${ic('letter', 15)} Format it</button>` : ''}</div>` : '';
    const was = x.etaWas != null && e.months != null && x.etaWas !== e.months ? `<span class="cx-was">was ~${x.etaWas} · ${x.etaWas > e.months ? '−' + (x.etaWas - e.months) + ' months' : '+' + (e.months - x.etaWas) + ' months'}</span>` : '';
    const hero = `<section class="g9h cx-hero rise" style="--i:2" data-tour="promo" id="cx-hero" aria-labelledby="cx-hero-h">
      ${B.ring(Math.min(1, pc / need), 148, 13, `<b class="num">${pc}/${need}</b><small>indexed papers</small>`, 'lg')}
      <div class="cx-hero-m"><div class="g9-k">Promotion gap · ${esc(D.rule.title)} ${sample}</div>
        <h2 id="cx-hero-h">${e.ready ? `Your papers meet the rule. Apply in ~<span class="num" data-cx-eta>${e.months}</span> months, after the committee cycle.` : e.months != null ? `You can apply in ~<span class="num" data-cx-eta>${e.months}</span> months` : 'No date yet: no paper is on the clock'}</h2>
        ${e.months != null ? `<p class="cx-hero-d">Around ${etaDate(e.months)} ${was}</p>` : ''}
        <p class="cx-hero-s"><b>Still missing:</b> ${missing}</p>
        <p class="cx-hero-r">${esc(D.rule.label)}</p></div>
      ${move}</section>`;

    // pipeline board
    const cols = D.stages.map((st, i) => {
      const ps = x.papers.filter((p) => p.stage === i);
      return `<div class="cx-col" role="group" aria-label="${st}, ${ps.length} papers"><div class="cx-col-h"><span>${st}</span><span class="num">${ps.length}</span></div>${ps.map(paperCard).join('') || '<p class="cx-empty">Nothing here</p>'}</div>`;
    }).join('');
    const stalled = x.papers.filter((p) => p.stage < 4 && p.idle >= 14).length;
    const sum = `<div class="cx-pipe-sum">${D.stages.map((st, i) => `<span><b class="num">${x.papers.filter((p) => p.stage === i).length}</b> ${st}</span>`).join('')}</div>`;
    const showBoard = !isPhone() || x.pipeOpen;
    const board = `<section class="b rise cx-board-b" style="--i:3" aria-labelledby="cx-pipe-h"><div class="b-h"><h2 id="cx-pipe-h">Research pipeline</h2>${stalled ? `<span class="tg">${stalled} need${stalled === 1 ? 's' : ''} a next step</span>` : sample}</div>
      ${showBoard ? `<div class="cx-board" tabindex="0" aria-label="Pipeline, scroll sideways">${cols}</div>` : sum}
      ${isPhone() ? `<button type="button" class="lnk cx-tog" data-act="cx-pipe" aria-expanded="${showBoard}">${showBoard ? 'Hide the board' : 'Open the board'} ${ic('chev', 13, 2.4)}</button>` : ''}</section>`;

    // research time
    const hd = hoursDone(), nb = blocks().find((b) => !b.done);
    const time = `<section class="b rise" style="--i:4" aria-labelledby="cx-time-h"><div class="b-h"><h2 id="cx-time-h">This week's research time</h2>${sample}</div>
      <div class="cx-time"><b class="num">${fmtH(hd)}</b><span>of ${D.weeklyTargetH} hours</span></div><div class="meter acc" role="progressbar" aria-label="Research hours" aria-valuenow="${hd}" aria-valuemin="0" aria-valuemax="${D.weeklyTargetH}"><i style="width:${Math.min(100, hd / D.weeklyTargetH * 100)}%"></i></div>
      ${nb ? `<p class="cx-next">${ic('lock', 13, 2.4)} Next protected block: <b>${nb.today ? 'today' : esc(nb.d)}, ${esc(nb.l)}</b></p>` : `<p class="cx-next ok">${ic('check', 13, 2.6)} Weekly target met. Well done.</p>`}
      <details class="cx-week"><summary>See this week's ${blocks().length} blocks ${ic('chev', 13, 2.4)}</summary>
      <ul class="q9-list">${blocks().map((b) => `<li class="r9"><div class="r9-b"><button type="button" class="r9-tick ${b.done ? 'on' : ''}" data-act="cx-blk" data-id="${b.id}" aria-label="${b.done ? 'Unmark' : 'Mark done'}: ${esc(b.d)} block">${ic('check', 16, 2.8)}</button><span class="q9-m"><span class="q9-t">${esc(b.d)}${b.today ? ' · today' : ''}</span><span class="q9-s">${esc(b.l)}, ${fmtH(b.h)} h</span></span></div></li>`).join('')}</ul></details></section>`;

    // action cards
    const cards = actionCards(), MAXC = 2, shown = x.moreActs ? cards : cards.slice(0, MAXC);
    const acts = `<section class="rise cx-acts" style="--i:5" aria-labelledby="cx-acts-h"><div class="b-h cx-sec-h"><h2 id="cx-acts-h">Waiting for you</h2><span class="b-sub">${cards.length ? cards.length + ' to approve' : 'All clear'}</span></div>
      <div class="cx-cards">${shown.join('') || `<p class="cx-empty">Nothing waiting. Margin will bring the next step here.</p>`}</div>
      ${cards.length > MAXC ? `<button type="button" class="lnk cx-tog" data-act="cx-more-acts" aria-expanded="${x.moreActs}">${x.moreActs ? 'Show fewer' : `Show ${cards.length - MAXC} more`} ${ic('chev', 13, 2.4)}</button>` : ''}</section>`;

    const openMore = (B.tourOn && B.tourOn()) || (S().cp && S().cp[S().cpTab]) || S().cpBusy || (S().g11 && S().g11.report && (S().g11.report.busy || S().g11.report.draft));
    const more = `<details class="cx-tools rise" style="--i:7" ${openMore ? 'open' : ''}><summary>${ic('sliders', 16)} More in Grow <span class="b-sub">Trimester report, literature scout, writing partner, references</span></summary><div class="cx-more-b">${B.reportPanel()}${B.copilotHTML()}</div></details>`;
    const tools = isPhone() ? `<section class="b rise cx-toolsrow" style="--i:6" aria-labelledby="cx-tl-h"><div class="b-h"><h2 id="cx-tl-h">Research tools</h2></div><div class="cx-tl">${TABS.slice(1).map(([k, , i]) => `<button type="button" data-act="cx-tab" data-v="${k}">${ic(i, 16)}<span>${TOOL_NAMES[k]}</span>${ic('chev', 14, 2.4)}</button>`).join('')}</div></section>` : '';
    return `${hero}<div class="cx-two">${acts}<div class="cx-col2">${time}</div></div>${board}${tools}${more}`;
  }

  function paperCard(p) {
    const j = J(p.target), stall = p.stage < 4 && p.idle >= 14;
    const meta = p.published ? `${p.published.year} · ${esc(p.published.quartile)} · ${esc(p.published.index)}` : j ? `${esc(j.name)} · ${esc(j.q)}` : 'No target journal yet';
    const mv = p.stage < 4 ? `<button type="button" class="cx-mv" data-act="cx-move" data-id="${p.id}">${p.stage === 3 ? 'Mark accepted' : 'Move to ' + D.stages[p.stage + 1]} ${ic('arrow', 13, 2.4)}</button>` : '';
    const tool = p.id === 'p-ocr' && !p.target ? `<button type="button" class="cx-chip" data-act="cx-tab" data-v="finder">${ic('search', 12, 2.4)} Find a journal</button>`
      : p.id === 'p-ocr' && p.stage <= 1 ? `<button type="button" class="cx-chip" data-act="cx-tab" data-v="format">${ic('letter', 12, 2.4)} Format</button>`
      : p.id === 'p-ocr' && p.decision ? `<button type="button" class="cx-chip" data-act="cx-tab" data-v="reviews">${ic('mail', 12, 2.4)} Reviewers</button>` : '';
    return `<article class="cx-pc ${stall ? 'next' : ''} ${p.stage === 4 ? 'pub' : ''}" data-paper="${p.id}"><b class="cx-pc-t">${esc(p.t)}</b><span class="cx-pc-m">${meta}</span>
      ${p.stage < 4 ? `<span class="cx-pc-n">${ic('arrow', 12, 2.4)} ${esc(p.decision ? 'Major revision: reply to 5 comments' : p.next)}</span>` : ''}
      <span class="cx-pc-i">${p.stage === 4 ? ic('check', 12, 2.6) + ' Counts for promotion' : ic('clock', 12, 2.4) + ' ' + lastMoved(p.idle)}</span>
      ${tool || mv ? `<span class="cx-pc-a">${tool}${mv}</span>` : ''}</article>`;
  }

  function actionCards() {
    const x = X(), out = [], ocr = OCR(), mb = P('p-mb');
    if (!ocr.target && x.acts.journal !== 'dismissed') out.push(B.sCard({ key: 'cx-a-j', icon: 'search', color: 'var(--p-blue)', source: 'Journal finder · Bangla OCR', title: 'Find a journal for Bangla OCR',
      body: `<p>No target journal yet, so this paper is not on the promotion clock. Margin will rank 5 journals and check each one for hijacking.</p>`,
      why: 'It last moved 3 weeks ago, and a Q2 target is the fastest way to move your promotion date.',
      actions: [{ label: 'Find journals', act: 'cx-a-journal', primary: true, icon: 'check' }, { label: 'Edit the abstract first', act: 'cx-tab', attrs: 'data-v="finder"' }], dismiss: { act: 'cx-a-dis', attrs: 'data-k="journal"' }, privacy: null }));
    if (mb.stage === 3 && !x.acts.follow) out.push(B.sCard({ key: 'cx-a-fu', icon: 'mail', color: 'var(--p-yellow)', source: 'Follow-up · Mobile banking', title: 'Draft a follow-up to the journal (10 weeks, no reply)',
      body: `<p class="cx-to">To: ${esc(D.followUp.to)}<br>Subject: ${esc(D.followUp.subject)}</p><div class="sc-draft pre ${x.fuOpen ? '' : 'cx-clamp'}">${esc(x.fuText || D.followUp.body)}</div><button type="button" class="cx-more-lnk" data-act="cx-fu-open" aria-expanded="${!!x.fuOpen}">${x.fuOpen ? 'Show less' : 'Read the whole draft'}</button>`,
      why: 'This journal\'s median first decision is 50 weeks (sample), but no acknowledgement of review after 10 weeks is worth a polite check.',
      actions: [{ label: 'Approve & copy', act: 'cx-fu-ok', primary: true, icon: 'check' }, { label: 'Edit', act: 'cx-fu-edit' }], dismiss: { act: 'cx-a-dis', attrs: 'data-k="follow"' }, privacy: 'Nothing is sent without you' }));
    if (ocr.target && ocr.stage <= 1 && !x.fmt.approved && x.acts.format !== 'dismissed') out.push(B.sCard({ key: 'cx-a-fm', icon: 'letter', color: 'var(--p-lav)', source: 'Formatter · Bangla OCR', title: `Format Bangla OCR for ${J(ocr.target).name}`,
      body: `<p>Margin will convert headings, references and captions to the journal's style (${esc(J(ocr.target).style)}) and check the submission list. Your text is not rewritten.</p>`,
      actions: [{ label: 'Open the formatter', act: 'cx-tab', attrs: 'data-v="format"', primary: true, icon: 'check' }], dismiss: { act: 'cx-a-dis', attrs: 'data-k="format"' }, privacy: null }));
    if (ocr.decision && x.acts.rev !== 'dismissed') out.push(B.sCard({ key: 'cx-a-rv', icon: 'mail', color: 'var(--p-pink)', source: 'Reviewers · Bangla OCR', title: 'Reviewer comments arrived: 5 responses drafted',
      body: `<p>Major revision (sample). Margin drafted a reply to each comment and found where each change goes. The research in each [bracket] is yours to add.</p>`,
      actions: [{ label: 'Review the responses', act: 'cx-tab', attrs: 'data-v="reviews"', primary: true, icon: 'check' }], dismiss: { act: 'cx-a-dis', attrs: 'data-k="rev"' }, privacy: null }));
    if (x.acts.ideas !== 'dismissed' && x.ideas.st !== 'done') out.push(B.sCard({ key: 'cx-a-id', icon: 'spark', color: 'var(--p-orange)', source: 'From your teaching', title: '3 research ideas from your own course data',
      body: `<p>Your CLO results and marks this trimester could become education papers. Margin already holds the data.</p>`,
      actions: [{ label: 'Show the ideas', act: 'cx-tab', attrs: 'data-v="ideas"', primary: true, icon: 'check' }], dismiss: { act: 'cx-a-dis', attrs: 'data-k="ideas"' }, privacy: null }));
    return out;
  }

  /* ---------- 2. journal finder ---------- */
  const FILTERS = [
    ['index', 'Indexing', [['any', 'Scopus or WoS'], ['scopus', 'Scopus'], ['wos', 'Web of Science']]],
    ['quartile', 'Quartile', [['any', 'Any quartile'], ['q2', 'Q2 or better'], ['q1', 'Q1 only']]],
    ['apc', 'Max fee (APC)', [['any', 'Any fee'], ['1500', 'Up to $1,500'], ['0', 'Free only']]],
    ['review', 'Max review time', [['24', 'Up to 24 weeks'], ['16', 'Up to 16 weeks'], ['12', 'Up to 12 weeks']]],
  ];
  function passes(j, f) {
    const qn = parseInt(String(j.q).replace(/\D/g, ''), 10) || 9;
    if (f.index === 'scopus' && !j.index.some((i) => /Scopus/.test(i))) return false;
    if (f.index === 'wos' && !j.index.some((i) => /WoS/.test(i))) return false;
    if (f.quartile === 'q2' && qn > 2) return false;
    if (f.quartile === 'q1' && qn > 1) return false;
    if (f.apc !== 'any' && j.apc > +f.apc) return false;
    if (j.reviewWeeks > +f.review) return false;
    return true;
  }
  function results() {
    const x = X().finder;
    const all = D.journals.filter((j) => !j.hidden && passes(j, x.f));
    const ok = all.filter((j) => !j.flag).sort((a, b) => b.fit - a.fit), bad = all.filter((j) => j.flag);
    if (bad.length) ok.splice(Math.min(1, ok.length), 0, ...bad);
    return ok.filter((j) => !x.hidden.includes(j.id));
  }
  function vFinder() {
    const x = X().finder, ocr = OCR();
    const form = `<section class="b rise" style="--i:2" aria-labelledby="cx-jf-h"><div class="b-h"><h2 id="cx-jf-h">${ic('search', 18)} Journal finder</h2><span class="b-sub">Bangla OCR paper</span></div>
      <div class="field"><label for="cx-jt">Paper title</label><input id="cx-jt" data-cx-in="finder.title" value="${esc(x.title)}"></div>
      <div class="field"><label for="cx-ja">Abstract</label><textarea id="cx-ja" rows="4" data-cx-in="finder.abstract">${esc(x.abstract)}</textarea></div>
      <div class="cx-filters">${FILTERS.map(([k, l, o]) => `<div class="field"><label for="cx-f-${k}">${l}</label><select id="cx-f-${k}" data-cx-f="${k}">${o.map(([v, t]) => `<option value="${v}" ${x.f[k] === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>`).join('')}</div>
      <div class="row-acts" style="margin-top:14px"><button type="button" class="btn primary" data-act="cx-find" ${x.st === 'loading' ? 'disabled' : ''}>${ic('spark', 15)} ${x.st === 'done' ? 'Search again' : 'Find journals'}</button><span class="b-sub cx-hint">Margin searches indexed journals and checks every site against the official index record.</span></div></section>`;
    let out = '';
    if (x.st === 'loading') out = `<section class="b cx-res">${loader('Ranking journals for your abstract…', 'Matching scope · reading review times · checking each site against Scopus and WoS records')}<div class="cx-skel"></div><div class="cx-skel"></div><div class="cx-skel"></div></section>`;
    else if (x.st === 'done') {
      const rs = results(); let n = 0;
      const chosen = ocr.target ? `<div class="cx-banner ok">${ic('check', 16, 2.6)}<span>Target set: <b>${esc(J(ocr.target).name)}</b>. Promotion ETA now <b>~${eta().months} months</b>.</span><button type="button" class="lnk" data-act="cx-tab" data-v="home">See it on Compass ${ic('chev', 13, 2.4)}</button></div>` : '';
      out = `<section class="cx-res rise" style="--i:3" aria-labelledby="cx-res-h"><div class="b-h cx-sec-h"><h2 id="cx-res-h">${rs.length} journals, ranked by fit</h2>${sample}</div>${chosen}
        <div class="cx-jlist">${rs.map((j) => jCard(j, j.flag ? null : ++n)).join('') || '<p class="cx-empty">No journal matches these filters. Loosen the fee or review time.</p>'}</div>
        <p class="cx-foot">Journal names and numbers are fictional sample data for this prototype. Always confirm a journal on the Scopus or Web of Science source list before submitting.</p></section>`;
    }
    return form + out;
  }
  function jCard(j, rank) {
    const x = X().finder, ocr = OCR();
    const stat = (k, v) => `<div><small>${k}</small><b>${v}</b></div>`;
    const stats = `<div class="cx-jstats">${stat('Indexing', esc(j.index.join(', ')))}${stat('Quartile', esc(j.q))}${stat('Median review', j.reviewWeeks + ' weeks')}${stat('Acceptance', j.accept + '%')}${stat('Fee (APC)', j.apc ? '$' + j.apc.toLocaleString('en-US') : 'None')}${stat('Open access', esc(j.oa))}</div>`;
    if (j.flag) {
      return `<article class="scard cx-jc flag" id="cx-flag" data-j="${j.id}"><span class="sc-sl" hidden>Journal finder (flagged)</span><div class="cx-flag-h">${ic('alert', 18, 2.2)}<b>${esc(j.flag.title)}</b></div>
        <div class="cx-jc-h"><span class="cx-rank bad" aria-label="Not ranked">!</span><div class="cx-jc-n"><b>${esc(j.name)}</b><span class="cx-jc-w">${esc(j.why)}</span></div><span class="cx-fit bad"><b class="num">${j.fit}%</b><small>fit</small></span></div>
        ${stats}
        <button type="button" class="sc-why cx-flag-why" data-act="cx-flag" aria-expanded="${x.flagOpen}">${ic('alert', 12)} Why we flagged this</button>
        ${x.flagOpen ? `<div class="cx-flag-x"><ul>${j.flag.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul><p>${ic('check', 13, 2.6)} ${esc(j.flag.check)}</p></div>` : ''}
        <div class="sc-acts"><button type="button" class="btn sm ghost" data-act="cx-j-hide" data-id="${j.id}">Hide this result</button></div></article>`;
    }
    const isT = ocr.target === j.id, m = withTarget('p-ocr', j.id).months;
    const note = x.notes[j.id];
    return `<article class="scard cx-jc ${isT ? 'chosen' : ''}" data-j="${j.id}"><span class="sc-sl" hidden>Journal finder</span><div class="cx-jc-h"><span class="cx-rank num">${rank}</span><div class="cx-jc-n"><b>${esc(j.name)}</b><span class="cx-jc-w">${esc(note || j.why)}</span></div><span class="cx-fit"><b class="num">${j.fit}%</b><small>fit</small></span></div>
      ${stats}
      <p class="cx-jc-e">${ic('clock', 13, 2.4)} If you choose it: promotion ETA <b>~${m} months</b>${m < (eta().months || 99) && !isT ? ` <span class="cx-gain">${eta().months ? (eta().months - m) + ' months sooner' : ''}</span>` : ''}</p>
      <div class="sc-acts">${isT ? `<span class="tg ok">${ic('check', 13, 2.6)} Target for Bangla OCR</span><button type="button" class="btn sm" data-act="cx-tab" data-v="format">${ic('letter', 14)} Format for this journal</button>`
        : `<button type="button" class="btn sm primary" data-act="cx-pick" data-id="${j.id}">${ic('check', 15, 2.3)} Choose as target</button><button type="button" class="btn sm" data-act="cx-j-edit" data-id="${j.id}">Edit note</button><button type="button" class="btn sm ghost" data-act="cx-j-hide" data-id="${j.id}">Not for me</button>`}</div></article>`;
  }
  function pick(jid, opts) {
    const ocr = OCR(); if (ocr.target === jid) return;
    if (!(opts && opts.noSnap)) B.snap();
    const before = eta().months; ocr.target = jid; ocr.idle = 0; ocr.next = 'Finish the results section, then format and submit';
    const after = etaChange(before);
    X().acts.journal = 'done'; X().fmt.journal = jid; track(`Bangla OCR: chose ${J(jid).name} (${J(jid).q}) as the target journal`);
    B.commit(`Target set: ${J(jid).name}`, false, [etaTrail(before, after), `Formatter set to ${J(jid).style} for this journal`]);
  }

  /* ---------- 3. manuscript formatter ---------- */
  function fmtJournal() { const f = X().fmt; return J(f.journal || OCR().target || 'j-jadi'); }
  function checklist() {
    const f = X().fmt, j = fmtJournal(), m = D.manuscript;
    return m.checklist.map((c) => {
      let st = f.checks[c.id] || c.st, ok = c.ok, warn = c.warn;
      if (c.id === 'words') { ok = `${m.words.toLocaleString('en-US')} of ${j.wordMax.toLocaleString('en-US')} words`; st = m.words <= j.wordMax ? 'ok' : 'warn'; }
      if (c.id === 'abs') warn = `${m.abstractWords} of ${j.abstractMax} words: shorten the 2 marked sentences`;
      if (c.id === 'abs' && m.abstractWords <= j.abstractMax) { st = 'ok'; ok = `${m.abstractWords} of ${j.abstractMax} words`; }
      if (c.id === 'hl') { if (!j.highlights) { st = 'ok'; ok = 'Not required by this journal'; } else st = f.hl === 'approved' ? 'ok' : 'missing'; }
      if (c.id === 'data' && f.dataSt != null) ok = 'Added: ' + D.manuscript.dataStatements[f.dataSt].slice(0, 70) + '…';
      return Object.assign({}, c, { st, okT: ok, warnT: warn });
    });
  }
  function vFormat() {
    const f = X().fmt, j = fmtJournal(), m = D.manuscript, ocr = OCR();
    const opts = D.journals.filter((z) => !z.flag && !z.hidden).map((z) => `<option value="${z.id}" ${z.id === j.id ? 'selected' : ''}>${esc(z.name)} (${esc(z.q)}, ${esc(z.style)})${z.id === ocr.target ? ' · your target' : ''}</option>`).join('');
    const up = f.st === 'idle' ? `<button type="button" class="cx-drop" data-act="cx-upload">${ic('upload', 22)}<b>Upload your draft (.docx)</b><span>For this demo, Margin uses the sample draft of the Bangla OCR paper.</span></button>`
      : f.st === 'loading' ? loader(`Reading ${m.file}…`, `${m.words.toLocaleString('en-US')} words · ${m.refs} references · ${m.figures} figures`)
      : `<div class="cx-file">${ic('letter', 18)}<div><b>${esc(m.file)}</b><span>${m.words.toLocaleString('en-US')} words · ${m.refs} references · ${m.figures} figures · abstract ${m.abstractWords} words ${sample}</span></div><button type="button" class="lnk" data-act="cx-upload">Replace</button></div>`;
    const top = `<section class="b rise" style="--i:2" aria-labelledby="cx-fm-h"><div class="b-h"><h2 id="cx-fm-h">${ic('letter', 18)} Manuscript formatter</h2><span class="b-sub">Formats and checks. It does not rewrite your text.</span></div>
      <div class="field"><label for="cx-fj">Target journal</label><select id="cx-fj" data-cx-fj>${opts}</select></div>
      <div style="margin-top:14px">${up}</div></section>`;
    if (f.st !== 'done') return top;
    const ch = changes(j);
    const prev = B.sCard({ key: 'cx-fmt', icon: 'letter', color: 'var(--p-lav)', source: `Formatter · ${j.name}`, title: f.approved ? `Formatted for ${j.name}: approved` : `Formatted for ${j.name} (${j.style})`,
      body: `<div class="cx-ba" role="table" aria-label="Before and after"><div class="cx-ba-r cx-ba-hd" role="row"><span role="columnheader">What</span><span role="columnheader">Before</span><span role="columnheader">After</span></div>${ch.map((c) => `<div class="cx-ba-r ${f.skip.includes(c.k) ? 'skip' : ''}" role="row"><span role="cell" class="cx-ba-k">${esc(c.k)}${f.skip.includes(c.k) ? ' <em>(kept as is)</em>' : ''}</span><span role="cell" class="cx-ba-b" data-l="Before">${esc(c.before)}${c.sample ? `<code>${esc(c.sample.before)}</code>` : ''}</span><span role="cell" class="cx-ba-a ${c.warn ? 'warn' : ''}" data-l="After">${esc(c.after)}${c.sample ? `<code>${esc(c.sample.after)}</code><small class="cx-sample">Sample reference, not a real citation</small>` : ''}<small>${esc(c.note)}</small></span></div>`).join('')}</div>`,
      actions: f.approved ? [] : [{ label: 'Approve formatting', act: 'cx-fmt-ok', primary: true, icon: 'check' }, { label: 'Edit changes', act: 'cx-fmt-edit' }], dismiss: f.approved ? null : { act: 'cx-fmt-dis', label: 'Discard' }, privacy: null });
    const cl = checklist(), done = cl.filter((c) => c.st === 'ok').length;
    const hlCard = j.highlights && f.hl !== 'approved' ? (f.hl === 'dismissed' ? `<p class="cx-empty">Highlights dismissed. Write 3 to 5 of your own, or <button type="button" class="lnk" data-act="cx-hl-back">bring Margin's draft back</button>.</p>` : B.sCard({ key: 'cx-hl', icon: 'spark', color: 'var(--p-yellow)', source: 'Formatter · Highlights', title: 'Highlights: we drafted 4 for you',
      body: `<ul class="sc-list">${(f.hlText || m.highlights).map((h) => `<li>${esc(h)}</li>`).join('')}</ul>`,
      why: 'Taken from sentences already in your abstract and results, shortened to the journal\'s 85-character limit. No new claims.',
      actions: [{ label: 'Approve', act: 'cx-hl-ok', primary: true, icon: 'check' }, { label: 'Edit', act: 'cx-hl-edit' }], dismiss: { act: 'cx-hl-dis' }, privacy: null })) : '';
    const list = `<section class="b rise" style="--i:4" aria-labelledby="cx-cl-h"><div class="b-h"><h2 id="cx-cl-h">Submission checklist</h2><span class="tg ${done === cl.length ? 'ok' : 'today'} num">${done} / ${cl.length} ready</span></div>
      <ul class="cx-cl">${cl.map((c) => `<li class="${c.st}"><span class="cx-cl-i" aria-hidden="true">${c.st === 'ok' ? ic('check', 14, 2.8) : c.st === 'missing' ? ic('x', 14, 2.8) : ic('alert', 14, 2.4)}</span><span class="cx-cl-m"><b>${esc(c.t)}</b><span>${esc(c.st === 'ok' ? c.okT : c.warnT)}</span></span>${c.st !== 'ok' && c.fix ? `<button type="button" class="btn sm" data-act="cx-fix" data-k="${c.id}" ${f.busy === c.id ? 'disabled' : ''}>${f.busy === c.id ? 'Working…' : esc(c.fix)}</button>` : ''}<span class="sr">${c.st === 'ok' ? 'Ready' : c.st === 'missing' ? 'Missing' : 'Needs attention'}</span></li>`).join('')}</ul>
      ${hlCard ? `<div class="cx-hl">${hlCard}</div>` : ''}
      <div class="row-acts cx-dl"><button type="button" class="btn primary" data-act="cx-dl" ${f.dl === 'loading' ? 'disabled' : ''}>${ic('upload', 15)} ${f.dl === 'loading' ? 'Preparing…' : 'Download formatted .docx'}</button>
        ${f.approved && ocr.stage <= 1 && ocr.target ? `<button type="button" class="btn" data-act="cx-move" data-id="p-ocr" data-to="2">${ic('send', 15)} Mark as submitted</button>` : ''}</div></section>`;
    return top + `<div class="cx-two cx-fm">${'<div class="rise" style="--i:3">' + prev + '</div>'}${list}</div>`;
  }
  function changes(j) {
    return D.manuscript.changes.map((c) => {
      if (c.k === 'Headings' && !j.sections) return Object.assign({}, c, { after: 'Kept your headings', note: 'This journal has no fixed section template.' });
      if (c.k === 'Abstract') return Object.assign({}, c, { after: `${D.manuscript.abstractWords} of ${j.abstractMax} words: ${D.manuscript.abstractWords - j.abstractMax} over`, warn: D.manuscript.abstractWords > j.abstractMax, note: c.note });
      if (c.k === 'References' && j.style !== 'IEEE') return { k: c.k, before: c.before, after: `${j.style}: already matches`, note: 'No conversion needed; 2 references missing a DOI are marked.' };
      if (c.k === 'Figure captions' && j.style !== 'IEEE') return Object.assign({}, c, { after: 'Figure 1. OCR pipeline (above the figure)', note: '5 captions restyled to the journal\'s house style.' });
      return c;
    });
  }

  /* ---------- 4. reviewer response ---------- */
  function vReviews() {
    const r = X().rev, ocr = OCR(), j = J(ocr.target);
    const form = `<section class="b rise" style="--i:2" aria-labelledby="cx-rv-h"><div class="b-h"><h2 id="cx-rv-h">${ic('mail', 18)} Reviewer response</h2><span class="b-sub">${r.arrived ? `Bangla OCR · ${esc(j ? j.name : 'target journal')} · Major revision ${sample}` : 'Paste the comments from the decision email'}</span></div>
      <div class="field"><label for="cx-rc">Reviewer comments</label><textarea id="cx-rc" rows="7" data-cx-in="rev.text">${esc(r.text)}</textarea></div>
      <div class="row-acts" style="margin-top:12px;align-items:center"><button type="button" class="btn primary" data-act="cx-rv-run" ${r.st === 'loading' ? 'disabled' : ''}>${ic('spark', 15)} ${r.st === 'done' ? 'Draft again' : 'Draft responses'}</button>
        <div class="modeseg cx-tone" role="group" aria-label="Tone"><button type="button" data-act="cx-tone" data-v="polite" aria-pressed="${r.tone === 'polite'}">Polite</button><button type="button" data-act="cx-tone" data-v="firm" aria-pressed="${r.tone === 'firm'}">Firm</button></div></div></section>`;
    if (r.st === 'loading') return form + `<section class="b">${loader('Drafting a response to each comment…', 'Reading 5 comments from 2 reviewers · finding the section and lines each one affects')}<div class="cx-skel"></div><div class="cx-skel"></div></section>`;
    if (r.st !== 'done') return form;
    const rows = D.reviewerComments.map((c, i) => {
      const s = r.rows[c.id] || {}, txt = s.text || c[r.tone];
      return `<article class="scard cx-rr ${s.st === 'approved' ? 'ok' : ''}" data-rr="${c.id}"><span class="sc-sl" hidden>Reviewer response</span><div class="cx-rr-c" data-l="Reviewer comment"><span class="cx-rr-who">${esc(c.r)} · ${i < 3 ? i + 1 : i - 2}</span>${esc(c.text)}</div>
        <div class="cx-rr-r" data-l="Our response (drafted)">${placeholders(txt)}${s.text ? ' <em class="cx-ed">edited by you</em>' : ''}</div>
        <div class="cx-rr-w" data-l="Change in manuscript">${ic('letter', 13)} ${esc(c.where)}</div>
        <div class="sc-acts cx-rr-a">${s.st === 'approved' ? `<span class="tg ok">${ic('check', 13, 2.6)} Approved</span><button type="button" class="btn sm" data-act="cx-rr-undo" data-id="${c.id}">Undo</button>` : `<button type="button" class="btn sm primary" data-act="cx-rr-ok" data-id="${c.id}">${ic('check', 14, 2.4)} Approve</button><button type="button" class="btn sm" data-act="cx-rr-edit" data-id="${c.id}">Edit</button>`}</div></article>`;
    }).join('');
    const ok = D.reviewerComments.filter((c) => (r.rows[c.id] || {}).st === 'approved').length;
    const ph = D.reviewerComments.reduce((a, c) => a + (((r.rows[c.id] || {}).text || c[r.tone]).match(/\[[^\]]+\]/g) || []).length, 0);
    return form + `<section class="rise cx-rv" style="--i:3" aria-labelledby="cx-rt-h"><div class="b-h cx-sec-h"><h2 id="cx-rt-h">Point-by-point response</h2><span class="tg ${ok === 5 ? 'ok' : 'today'} num">${ok} / 5 approved</span></div>
      <div class="cx-banner">${ic('pen', 16)}<span>Margin drafts the wording and finds the lines. Each <mark class="cx-ph">[bracket]</mark> is research only you can add: ${ph} left.</span></div>
      <div class="cx-rt"><div class="cx-rt-hd" aria-hidden="true"><span>Reviewer comment</span><span>Our response (drafted)</span><span>Change in manuscript</span><span></span></div>${rows}</div>
      <div class="row-acts" style="margin-top:14px"><button type="button" class="btn primary" data-act="cx-rv-export" ${r.exp === 'loading' ? 'disabled' : ''}>${ic('upload', 15)} ${r.exp === 'loading' ? 'Exporting…' : 'Export response letter'}</button>${ok < 5 ? `<button type="button" class="btn" data-act="cx-rr-all">Approve all ${5 - ok}</button>` : ''}</div></section>`;
  }

  /* ---------- 5. teaching → research ideas ---------- */
  function vIdeas() {
    const x = X().ideas;
    if (x.st !== 'done') { if (x.st === 'idle') { x.st = 'loading'; later(1300, () => { X().ideas.st = 'done'; }); } return `<section class="b">${loader('Looking for studies in your teaching data…', 'BUS 2101, FIN 2201, MKT 3105 · CLO results, marks and rubric scores')}<div class="cx-skel"></div><div class="cx-skel"></div></section>`; }
    const cards = D.ideas.map((it) => {
      const st = x.d[it.id];
      if (st === 'dismissed') return '';
      return `<div class="cx-idea">${B.sCard({ key: 'cx-i-' + it.id, icon: 'spark', color: 'var(--p-orange)', source: 'From your teaching · ' + it.t.match(/[A-Z]{3} \d{4}/)[0], title: x.titles[it.id] || it.t,
        body: `<p>${esc(it.why)}</p><p class="cx-idea-j">${ic('letter', 13)} Suggested journal type: <b>${esc(it.journal)}</b></p><div class="cx-idea-d"><small>Data Margin already holds</small>${it.data.map((d) => `<span class="cx-chip static">${ic('check', 11, 2.6)} ${esc(d)}</span>`).join('')}</div><p class="cx-idea-n">${ic('alert', 13)} ${esc(it.needs)}</p>`,
        actions: st === 'added' ? [] : [{ label: 'Add to pipeline', act: 'cx-idea-ok', attrs: `data-id="${it.id}"`, primary: true, icon: 'check' }, { label: 'Edit title', act: 'cx-idea-edit', attrs: `data-id="${it.id}"` }],
        dismiss: st === 'added' ? null : { act: 'cx-idea-dis', attrs: `data-id="${it.id}"`, label: 'Not interested' }, privacy: st === 'added' ? 'Added to your pipeline as an idea' : 'Private to you' })}</div>`;
    }).join('');
    return `<section class="rise" style="--i:2" aria-labelledby="cx-id-h"><div class="b-h cx-sec-h"><h2 id="cx-id-h">Teaching → research ideas</h2>${sample}</div>
      <p class="cx-lede">Studies hiding in courses you already teach. Margin suggests the question and shows the data it holds; the study design and writing are yours.</p>
      <div class="cx-ideas">${cards || '<p class="cx-empty">No ideas left. New ones appear as your course data grows.</p>'}</div></section>`;
  }

  /* ---------- 6. friday review ---------- */
  function vFriday() {
    const x = X(), f = x.fri, e = eta();
    if (f.st !== 'done') { if (f.st === 'idle') { f.st = 'loading'; later(1200, () => { X().fri.st = 'done'; }); } return `<section class="b">${loader('Drafting your Friday review…', 'What moved, what is stuck, and next week, from your pipeline and research blocks')}<div class="cx-skel"></div></section>`; }
    const moved = x.moved.slice(0, 5).map((m) => m.t);
    moved.push(`${fmtH(hoursDone())} of ${D.weeklyTargetH} research hours logged`);
    const stuck = x.papers.filter((p) => p.stage < 4 && p.idle >= 14 && !(p.id === 'p-mb' && x.acts.follow)).map((p) => `${p.short}: ${lastMoved(p.idle).toLowerCase()}.`).concat(D.friday.stuck);
    const start = x.etaStart || 14;
    const etaBox = `<div class="cx-fr-eta"><small>Updated promotion ETA</small><b class="num">${e.months != null ? '~' + e.months + ' months' : 'not set'}</b><span>${e.months != null ? 'around ' + etaDate(e.months) : ''}${e.months != null && start !== e.months ? ` · was ~${start} at the start of the week` : ''}</span></div>`;
    const body = `<div class="cx-fr">${etaBox}
      <div><h4>${ic('check', 14, 2.6)} What moved</h4><ul>${moved.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
      <div><h4>${ic('alert', 14)} What's stuck</h4><ul>${stuck.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
      <div><h4>${ic('cal', 14)} Next week's plan</h4><ul>${D.friday.plan.map((p) => `<li><b>${esc(p.t)}</b><br><small>${esc(p.when)}</small></li>`).join('')}</ul></div>
      </div>`;
    const card = B.sCard({ key: 'cx-fri', icon: 'cal', color: 'var(--p-blue)', source: 'Friday review · ten minutes', title: f.approved ? 'Your week in research (saved)' : 'Your week in research',
      body, why: 'Built from your pipeline moves, research blocks and the journal timelines Margin tracks. It stays private unless you share it.',
      actions: f.approved ? [{ label: 'Share with co-author', act: 'cx-share', icon: 'people' }] : [{ label: 'Approve and save', act: 'cx-fri-ok', primary: true, icon: 'check' }, { label: 'Edit plan', act: 'cx-fri-edit' }, { label: 'Share with co-author', act: 'cx-share', icon: 'people' }],
      privacy: 'Sharing is optional' });
    return `<section class="rise" style="--i:2" aria-labelledby="cx-fr-h"><div class="b-h cx-sec-h"><h2 id="cx-fr-h">Friday review</h2>${sample}</div>${card}</section>`;
  }

  /* ---------------- after render: ETA animation ---------------- */
  function afterRender() {
    const x = X(); if (S().view !== 'compass') return;
    const el = document.querySelector('[data-cx-eta]');
    if (el && x.etaFrom != null && x.tab === 'home') {
      const from = x.etaFrom, to = +el.textContent; x.etaFrom = null; B.save();
      animateNum(el, from, to);
      const h = document.getElementById('cx-hero'); if (h) { h.classList.remove('cx-pulse'); void h.offsetWidth; h.classList.add('cx-pulse'); }
    }
  }
  function animateNum(el, from, to) {
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 1400; el.classList.add('cx-count');
    const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); else el.classList.remove('cx-count'); };
    el.textContent = from; setTimeout(() => requestAnimationFrame(step), 350);
  }

  /* ---------------- demo mode ---------------- */
  const STEPS = [
    { t: 'Compass shows the gap', b: 'Two of three indexed papers. At today\'s pace he can apply for Associate Professor in about 14 months.' },
    { t: 'Journal finder ranks and checks', b: 'Margin ranks five journals against his abstract. The best-looking one is flagged: its site is not the indexed journal\'s official URL.' },
    { t: 'Pick the Q2 journal', b: 'He chooses the Q2 journal. The OCR paper goes on the clock and the promotion date moves from 14 to 9 months.' },
    { t: 'Format and check', b: 'The draft is converted to the journal\'s style and checked. Margin drafted the missing highlights: approve them to finish the checklist.' },
    { t: '10 weeks later', b: 'A major revision arrives. Margin drafts a reply to each of the 5 comments and finds the lines to change. The research in [brackets] stays his.' },
    { t: 'Friday review', b: 'Ten minutes on Friday: what moved, what is stuck, next week\'s blocks, and the updated promotion date.' },
  ];
  function demoBar() {
    const d = X().demo, s = STEPS[d.step];
    return `<div class="cx-demo" role="region" aria-label="Guided demo"><div class="cx-demo-top"><span class="cx-demo-k">Demo · step ${d.step + 1} of ${STEPS.length}</span><span class="cx-steps" aria-hidden="true">${STEPS.map((_, i) => `<i class="${i < d.step ? 'done' : i === d.step ? 'on' : ''}"></i>`).join('')}</span><button type="button" class="icon-btn" data-act="cx-demo-x" aria-label="Exit demo">${ic('x', 18)}</button></div>
      <b class="cx-demo-t">${esc(s.t)}</b><p>${esc(s.b)}</p>
      <div class="cx-demo-a">${d.step ? `<button type="button" class="btn sm ghost" data-act="cx-demo-go" data-d="-1">${ic('chevL', 14, 2.4)} Back</button>` : '<span></span>'}${d.step < STEPS.length - 1 ? `<button type="button" class="btn sm accent" data-act="cx-demo-go" data-d="1">Next ${ic('chev', 14, 2.4)}</button>` : `<button type="button" class="btn sm accent" data-act="cx-demo-x">Finish</button>`}</div></div>`;
  }
  let demoTimers = [];
  function dl(ms, fn) { demoTimers.push(setTimeout(() => { if (X().demo.on) fn(); }, ms)); }
  function scrollTo(sel, block) {
    setTimeout(() => {
      const el = document.querySelector(sel); if (!el) return;
      const r = el.getBoundingClientRect(), top = window.scrollY + r.top;
      const bar = document.querySelector('.cx-demo'), room = window.innerHeight - (bar ? window.innerHeight - bar.getBoundingClientRect().top : 0);
      const y = block === 'start' || r.height > room - 100 ? top - 88 : top - Math.max(88, (room - r.height) / 2);
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }, 140);
  }
  function show() { B.save(); B.render(); }
  function demoEnter(i) {
    demoTimers.forEach(clearTimeout); demoTimers = [];
    const x = X(); x.demo.step = i;
    if (i === 0) { const keep = x.demo; S().cx = fresh(); X().demo = keep; X().etaStart = eta().months; X().tab = 'home'; show(); window.scrollTo({ top: 0, behavior: 'smooth' }); scrollTo('#cx-hero', 'start'); return; }
    if (i === 1) { x.tab = 'finder'; if (OCR().target) { OCR().target = null; X().acts.journal = null; } x.finder.st = 'loading'; x.finder.flagOpen = false; show(); scrollTo('#cx-jf-h', 'start');
      dl(1600, () => { X().finder.st = 'done'; show(); scrollTo('.cx-jlist', 'start'); dl(1200, () => { X().finder.flagOpen = true; show(); scrollTo('#cx-flag'); }); }); return; }
    if (i === 2) { x.tab = 'finder'; x.finder.st = 'done'; show(); scrollTo('[data-j="j-jadi"]');
      dl(1300, () => { const c = document.querySelector('[data-j="j-jadi"]'); if (c) c.classList.add('cx-pulse'); });
      dl(2300, () => { if (!OCR().target) { const before = eta().months; OCR().target = 'j-jadi'; OCR().idle = 0; X().acts.journal = 'done'; X().fmt.journal = 'j-jadi'; etaChange(before); track('Bangla OCR: chose Journal of Applied Document Intelligence (Q2) as the target journal'); }
        X().tab = 'home'; show(); window.scrollTo({ top: 0 }); scrollTo('#cx-hero', 'start'); }); return; }
    if (i === 3) { if (!OCR().target) { OCR().target = 'j-jadi'; X().fmt.journal = 'j-jadi'; X().acts.journal = 'done'; }
      x.tab = 'format'; x.fmt.journal = OCR().target; if (x.fmt.st !== 'done') x.fmt.st = 'loading'; show(); window.scrollTo({ top: 0 });
      dl(1300, () => { X().fmt.st = 'done'; show(); scrollTo('.cx-fm'); });
      dl(2400, () => { X().fmt.checks.cover = 'ok'; show(); });
      dl(3100, () => { X().fmt.checks.data = 'ok'; X().fmt.dataSt = 0; show(); });
      dl(3800, () => { X().fmt.checks.abs = 'ok'; X().fmt.approved = true; show(); scrollTo('.cx-hl', 'start'); }); return; }
    if (i === 4) { const f = X().fmt; f.st = 'done'; f.approved = true; ['cover', 'data', 'abs'].forEach((k) => { f.checks[k] = 'ok'; }); if (f.dataSt == null) f.dataSt = 0; if (f.hl === 'pending') f.hl = 'approved';
      timeJump(() => { const o = OCR(); if (!o.target) o.target = 'j-jadi'; const before = eta().months; o.stage = 3; o.idle = 0; o.weeksInReview = 10; o.decision = 'Major revision'; etaChange(before);
        X().rev.arrived = true; X().rev.st = 'loading'; X().tab = 'reviews'; track('Bangla OCR submitted to ' + J(o.target).name); track('Decision: major revision, 5 comments from 2 reviewers'); show(); window.scrollTo({ top: 0 });
        dl(1700, () => { X().rev.st = 'done'; show(); scrollTo('#cx-rt-h', 'start'); }); }); return; }
    if (i === 5) { x.tab = 'friday'; x.fri.st = 'idle'; show(); window.scrollTo({ top: 0 }); dl(1400, () => scrollTo('#cx-fr-h', 'start')); }
  }
  function timeJump(fn) {
    const el = document.createElement('div'); el.className = 'cx-jump'; el.setAttribute('role', 'status');
    el.innerHTML = `<div><small>Bangla OCR is submitted</small><b>10 weeks later…</b></div>`;
    document.body.appendChild(el); setTimeout(fn, 900); setTimeout(() => el.classList.add('out'), 1500); setTimeout(() => el.remove(), 2000);
  }

  /* ---------------- actions ---------------- */
  function onClick(e) {
    const b = e.target.closest('[data-act^="cx-"]'); if (!b) return;
    const a = b.dataset.act, id = b.dataset.id, x = X();
    switch (a) {
      case 'cx-tab': { B.closeLayer && B.closeLayer(); x.tab = b.dataset.v; if (S().view !== 'compass') { B.save(); B.go('compass'); } else { B.save(); B.render(); window.scrollTo({ top: 0, behavior: 'smooth' }); } break; }
      case 'cx-demo': if (x.demo.on) { demoEnd(); } else { x.demo = { on: true, step: 0 }; demoEnter(0); } break;
      case 'cx-demo-x': demoEnd(true); break;
      case 'cx-demo-go': { const n = Math.max(0, Math.min(STEPS.length - 1, x.demo.step + (+b.dataset.d)));
        if (x.demo.step === 3 && n === 4 && x.fmt.hl === 'pending') { x.fmt.hl = 'approved'; }
        demoEnter(n); break; }
      case 'cx-pipe': x.pipeOpen = !x.pipeOpen; B.save(); B.render(); break;
      case 'cx-more-acts': x.moreActs = !x.moreActs; B.save(); B.render(); break;
      case 'cx-fu-open': x.fuOpen = !x.fuOpen; B.save(); B.render(); break;
      case 'cx-blk': { B.snap(); const bl = blocks().find((z) => z.id === id); bl.done = !bl.done; if (bl.done) track(`Research block done: ${bl.d}, ${fmtH(bl.h)} h`); B.commit(bl.done ? `${fmtH(hoursDone())} of ${D.weeklyTargetH} research hours this week` : 'Block reopened'); break; }
      case 'cx-move': moveStage(id, b.dataset.to != null ? +b.dataset.to : null); break;
      case 'cx-a-journal': x.tab = 'finder'; runFind(); break;
      case 'cx-a-dis': { x.acts[b.dataset.k] = 'dismissed'; B.commit('Dismissed. Margin will learn from that', true); break; }
      case 'cx-fu-ok': { B.snap(); B.copyText(x.fuText || D.followUp.body); x.acts.follow = 'approved'; const p = P('p-mb'); p.idle = 0; p.next = 'Follow-up sent: Margin checks again in 2 weeks'; track('Mobile banking: follow-up sent to the handling editor');
        B.commit('Approved and copied. Paste it into your email; nothing was sent.', false, ['Margin will remind you again in 2 weeks if there is no reply']); break; }
      case 'cx-fu-edit': B.sheet(`${sheetHead('Draft · private to you', 'Follow-up to the editor')}<div class="field"><label for="cx-fu-t">Edit before you approve</label><textarea id="cx-fu-t" rows="12">${esc(x.fuText || D.followUp.body)}</textarea></div><div class="row-acts" style="margin-top:12px"><button type="button" class="btn primary" data-act="cx-fu-save">${ic('check', 15, 2.4)} Approve & copy</button></div>`, 'cx-edit'); break;
      case 'cx-fu-save': { x.fuText = document.getElementById('cx-fu-t').value.trim() || D.followUp.body; B.closeLayer(); document.querySelector('[data-act="cx-fu-ok"]') ? document.querySelector('[data-act="cx-fu-ok"]').click() : null; break; }
      case 'cx-find': runFind(); break;
      case 'cx-flag': x.finder.flagOpen = !x.finder.flagOpen; B.save(); B.render(); break;
      case 'cx-pick': pick(id); break;
      case 'cx-j-hide': { B.snap(); x.finder.hidden.push(id); B.commit(J(id).flag ? 'Hidden. Margin will keep warning you if this site shows up again.' : 'Hidden from your results'); break; }
      case 'cx-j-edit': { const j = J(id); B.sheet(`${sheetHead('Journal finder · private to you', j.name)}<div class="field"><label for="cx-jn">Why it fits (your note)</label><textarea id="cx-jn" rows="4">${esc(x.finder.notes[id] || j.why)}</textarea></div><div class="row-acts" style="margin-top:12px"><button type="button" class="btn primary" data-act="cx-jn-save" data-id="${id}" data-pick="1">${ic('check', 15, 2.4)} Save and choose as target</button><button type="button" class="btn" data-act="cx-jn-save" data-id="${id}">Save note only</button></div>`, 'cx-edit'); break; }
      case 'cx-jn-save': { x.finder.notes[id] = document.getElementById('cx-jn').value.trim(); B.closeLayer(); if (b.dataset.pick) pick(id); else { B.save(); B.render(); B.toast('Note saved'); } break; }
      case 'cx-upload': { x.fmt.st = 'loading'; x.fmt.approved = false; B.save(); B.render(); later(1400, () => { X().fmt.st = 'done'; }); break; }
      case 'cx-fmt-ok': { B.snap(); x.fmt.approved = true; track(`Bangla OCR formatted for ${fmtJournal().name}`); B.commit('Formatting approved', false, [`${fmtJournal().style} references, journal headings and captions applied`, 'Your text was not rewritten']); break; }
      case 'cx-fmt-edit': { const ch = changes(fmtJournal()); B.sheet(`${sheetHead('Formatter · private to you', 'Choose which changes to keep')}<div class="cx-sk">${ch.map((c) => `<label class="cx-ck"><input type="checkbox" data-k="${esc(c.k)}" ${x.fmt.skip.includes(c.k) ? '' : 'checked'}><span><b>${esc(c.k)}</b><small>${esc(c.after)}</small></span></label>`).join('')}</div><div class="row-acts" style="margin-top:16px"><button type="button" class="btn primary" data-act="cx-fmt-save">${ic('check', 15, 2.4)} Approve with these changes</button></div>`, 'cx-edit'); break; }
      case 'cx-fmt-save': { x.fmt.skip = [...document.querySelectorAll('.cx-sk input')].filter((i) => !i.checked).map((i) => i.dataset.k); x.fmt.approved = true; B.closeLayer(); track(`Bangla OCR formatted for ${fmtJournal().name}`); B.commit('Formatting approved with your changes'); break; }
      case 'cx-fmt-dis': { x.fmt.st = 'idle'; x.fmt.approved = false; B.commit('Formatting discarded. Your draft is unchanged.', true); break; }
      case 'cx-fix': fixItem(b.dataset.k); break;
      case 'cx-hl-ok': { B.snap(); x.fmt.hl = 'approved'; B.commit('Highlights approved', false, ['Submission checklist updated']); break; }
      case 'cx-hl-edit': B.sheet(`${sheetHead('Highlights · private to you', 'Edit the highlights')}<div class="field"><label for="cx-hl-t">One per line, under 85 characters each</label><textarea id="cx-hl-t" rows="6">${esc((x.fmt.hlText || D.manuscript.highlights).join('\n'))}</textarea></div><div class="row-acts" style="margin-top:12px"><button type="button" class="btn primary" data-act="cx-hl-save">${ic('check', 15, 2.4)} Approve</button></div>`, 'cx-edit'); break;
      case 'cx-hl-save': { const v = document.getElementById('cx-hl-t').value.split('\n').map((s) => s.trim()).filter(Boolean); x.fmt.hlText = v.length ? v : null; x.fmt.hl = 'approved'; B.closeLayer(); B.commit('Highlights approved with your edits'); break; }
      case 'cx-hl-dis': { x.fmt.hl = 'dismissed'; B.commit('Highlights dismissed', true); break; }
      case 'cx-hl-back': { x.fmt.hl = 'pending'; B.save(); B.render(); break; }
      case 'cx-dsel': { x.fmt.dataSt = +b.dataset.i; x.fmt.checks.data = 'ok'; B.closeLayer(); B.commit('Data availability statement added', true); break; }
      case 'cx-dl': { x.fmt.dl = 'loading'; B.save(); B.render(); const left = checklist().filter((c) => c.st !== 'ok').length, j = fmtJournal();
        later(1200, () => { X().fmt.dl = false; B.toast(`${D.manuscript.file.replace('draft_v7', j.id.slice(2).toUpperCase() + '_formatted')} is ready (demo: no file is created)`, false, left ? [`${left} checklist item${left > 1 ? 's' : ''} still need${left > 1 ? '' : 's'} you before you submit`] : ['Checklist complete: ready to submit']); }); break; }
      case 'cx-rv-run': { if (!(x.rev.text || '').trim()) { B.toast('Paste the reviewer comments first'); break; } x.rev.st = 'loading'; B.save(); B.render(); later(1700, () => { X().rev.st = 'done'; }); break; }
      case 'cx-tone': { x.rev.tone = b.dataset.v; B.save(); B.render(); break; }
      case 'cx-rr-ok': { x.rev.rows[id] = Object.assign(x.rev.rows[id] || {}, { st: 'approved' }); B.save(); B.render(); break; }
      case 'cx-rr-undo': { x.rev.rows[id] = Object.assign(x.rev.rows[id] || {}, { st: null }); B.save(); B.render(); break; }
      case 'cx-rr-all': { D.reviewerComments.forEach((c) => { x.rev.rows[c.id] = Object.assign(x.rev.rows[c.id] || {}, { st: 'approved' }); }); B.commit('All 5 responses approved', true); break; }
      case 'cx-rr-edit': { const c = D.reviewerComments.find((z) => z.id === id); const s = x.rev.rows[id] || {};
        B.sheet(`${sheetHead('Response · private to you', c.r + ': edit the response')}<p class="row-s">${esc(c.text)}</p><div class="field"><label for="cx-rr-t">Our response</label><textarea id="cx-rr-t" rows="7">${esc(s.text || c[x.rev.tone])}</textarea></div><p class="row-s">Change goes in: ${esc(c.where)}</p><div class="row-acts" style="margin-top:12px"><button type="button" class="btn primary" data-act="cx-rr-save" data-id="${id}">${ic('check', 15, 2.4)} Approve</button></div>`, 'cx-edit'); break; }
      case 'cx-rr-save': { const v = document.getElementById('cx-rr-t').value.trim(); x.rev.rows[id] = { st: 'approved', text: v || null }; B.closeLayer(); B.save(); B.render(); B.toast('Response approved with your edits'); break; }
      case 'cx-rv-export': { const ok = D.reviewerComments.filter((c) => (x.rev.rows[c.id] || {}).st === 'approved').length; x.rev.exp = 'loading'; B.save(); B.render();
        later(1100, () => { X().rev.exp = null; track('Response letter exported for Bangla OCR'); B.toast('Response_to_reviewers.docx is ready (demo: no file is created)', false, [ok < 5 ? `${5 - ok} response${5 - ok > 1 ? 's are' : ' is'} not approved yet and marked in the letter` : 'All 5 responses approved', 'Fill every [bracket] with your results before you send it']); }); break; }
      case 'cx-idea-ok': { B.snap(); const it = D.ideas.find((z) => z.id === id); x.ideas.d[id] = 'added'; const t = x.ideas.titles[id] || it.t;
        x.papers.push({ id: 'p-' + id, t, short: t.split(':')[0].split(' ').slice(0, 4).join(' '), stage: 0, idle: 0, target: null, co: '', next: 'Apply for ethics approval' });
        track('New idea in the pipeline: ' + t.split(':')[0]); B.commit('Added to your pipeline as an idea', false, ['Shown on Compass home, in the Idea column', 'Margin can draft the ethics form when you are ready']); break; }
      case 'cx-idea-edit': { const it = D.ideas.find((z) => z.id === id); B.sheet(`${sheetHead('Idea · private to you', 'Edit the research question')}<div class="field"><label for="cx-it">Title</label><textarea id="cx-it" rows="3">${esc(x.ideas.titles[id] || it.t)}</textarea></div><div class="row-acts" style="margin-top:12px"><button type="button" class="btn primary" data-act="cx-it-save" data-id="${id}">${ic('check', 15, 2.4)} Save and add to pipeline</button></div>`, 'cx-edit'); break; }
      case 'cx-it-save': { x.ideas.titles[id] = document.getElementById('cx-it').value.trim() || null; B.closeLayer(); const btn = document.querySelector(`[data-act="cx-idea-ok"][data-id="${id}"]`); if (btn) btn.click(); break; }
      case 'cx-idea-dis': { x.ideas.d[id] = 'dismissed'; B.commit('Dismissed', true); break; }
      case 'cx-fri-ok': { x.fri.approved = true; B.commit('Friday review saved', true, ['Next week\'s 3 blocks are protected on your calendar']); break; }
      case 'cx-fri-edit': B.sheet(`${sheetHead('Friday review · private to you', "Edit next week's plan")}${D.friday.plan.map((p, i) => `<div class="field"><label for="cx-fp${i}">${esc(p.when)}</label><input id="cx-fp${i}" value="${esc((x.friPlan || [])[i] || p.t)}"></div>`).join('')}<div class="row-acts" style="margin-top:12px"><button type="button" class="btn primary" data-act="cx-fri-save">${ic('check', 15, 2.4)} Approve and save</button></div>`, 'cx-edit'); break;
      case 'cx-fri-save': { x.friPlan = D.friday.plan.map((p, i) => document.getElementById('cx-fp' + i).value.trim() || p.t); x.fri.approved = true; B.closeLayer(); B.commit('Friday review saved with your plan', true); break; }
      case 'cx-share': { const e2 = eta(), o = OCR(), co = (o.co || 'your co-author').replace(/ \(.*\)$/, '');
        const msg = `Hi ${co.replace(/^Dr\. /, '').split(' ')[0]},\n\nQuick update on the Bangla OCR paper: ${o.decision ? 'we have a major revision with 5 comments. I have drafted responses; the open items are the split results (R1.2) and the related-work positioning (R2.1). Could you take R2.1?' : o.target ? 'we are targeting ' + J(o.target).name + ' (' + J(o.target).q + '). I aim to submit within six weeks.' : 'I am choosing a target journal this week.'}\n\nBest,\n${D.persona.first}`;
        B.sheet(`${sheetHead('Optional · nothing is sent without you', 'Share with ' + co)}<p class="row-s">Only the paper status is shared. Your promotion date and research hours stay private.</p><div class="field"><label for="cx-sh-t">Message</label><textarea id="cx-sh-t" rows="9">${esc(msg)}</textarea></div><div class="row-acts" style="margin-top:12px"><button type="button" class="btn primary" data-act="cx-share-ok">${ic('check', 15, 2.4)} Approve & copy</button><button type="button" class="btn ghost" data-act="close">Not now</button></div>`, 'cx-edit'); break; }
      case 'cx-share-ok': { B.copyText(document.getElementById('cx-sh-t').value); B.closeLayer(); B.toast('Copied. Paste it into your email or chat; nothing was sent.'); break; }
    }
  }
  function runFind() {
    const x = X(); x.finder.st = 'loading'; B.save();
    if (S().view !== 'compass') B.go('compass'); else B.render();
    later(1600, () => { X().finder.st = 'done'; });
  }
  function fixItem(k) {
    const x = X();
    if (k === 'data') { B.sheet(`${sheetHead('Formatter · private to you', 'Which statement is true for your data?')}<p class="row-s">Margin only offers the journal's standard wording. You choose; nothing is assumed.</p><div class="cx-sk">${D.manuscript.dataStatements.map((s, i) => `<button type="button" class="cx-opt" data-act="cx-dsel" data-i="${i}">${esc(s)}</button>`).join('')}</div>`, 'cx-edit'); return; }
    if (k === 'abs') { x.fmt.checks.abs = 'ok'; B.commit('Marked as done by you', true); return; }
    x.fmt.busy = k; B.save(); B.render();
    later(1000, () => { X().fmt.busy = null; X().fmt.checks[k] = 'ok'; B.toast(k === 'cover' ? 'Cover letter template filled. Read it before you submit.' : 'Done'); });
  }
  function moveStage(id, to) {
    const x = X(), p = P(id); if (!p || p.stage >= 4) return;
    const n = to != null ? to : p.stage + 1;
    if (n >= 2 && p.stage < 2 && !p.target) { B.toast('Pick a target journal first', false, ['A paper goes on the promotion clock once it has a target']); x.tab = 'finder'; B.save(); B.render(); return; }
    B.snap(); const before = eta().months;
    p.stage = n; p.idle = 0;
    if (n === 2) { p.next = 'Wait for the editor\'s first check'; p.weeksInReview = 0; }
    if (n === 3) { p.next = 'Under review: Margin watches the reply time'; p.weeksInReview = 0; }
    if (n === 4) { const j = J(p.target) || {}; p.published = { year: new Date().getFullYear(), quartile: j.q || '—', index: (j.index || ['Indexed']).join(', ') }; p.decision = null; p.next = 'Accepted: added to your promotion dossier'; }
    const after = etaChange(before);
    track(`${p.short} moved to ${n === 4 ? 'Accepted' : D.stages[n]}`);
    B.commit(`${p.short}: ${n === 4 ? 'accepted' : 'moved to ' + D.stages[n]}`, false, [etaTrail(before, after)]);
  }
  function demoEnd(finished) {
    demoTimers.forEach(clearTimeout); demoTimers = [];
    X().demo = { on: false, step: 0 }; B.save(); B.render();
    if (finished) B.toast('Demo finished. Compass keeps the demo\'s changes; press Demo to run it again from the start.');
  }
  function onInput(e) {
    const el = e.target.closest && e.target.closest('[data-cx-in]'); if (!el) return;
    const [a, k] = el.dataset.cxIn.split('.'); X()[a][k] = el.value; clearTimeout(onInput.t); onInput.t = setTimeout(B.save, 300);
  }
  function onChange(e) {
    const t = e.target;
    if (t.dataset && t.dataset.cxF) { X().finder.f[t.dataset.cxF] = t.value; B.save(); B.render(); return; }
    if (t.matches && t.matches('[data-cx-fj]')) { const x = X(); x.fmt.journal = t.value; x.fmt.approved = false; x.fmt.skip = []; B.save(); B.render(); B.toast('Formatting redone for ' + J(t.value).name, false, ['Approve it again before you download']); }
  }

  /* Today's research line: same markup as before, driven by the new promotion maths */
  function compassLine() {
    const e = eta(), pc = pubCount(), need = D.rule.needPapers;
    return `<button type="button" class="cline rise" style="--i:4" data-act="go" data-v="compass">${B.ring(pc / need, 44, 5, `<b class="num" style="font-size:11px">${pc}/${need}</b>`)}<span class="cl-m"><span class="cl-t">Associate Professor${e.months != null ? `, in ~${e.months} months` : ''}</span><span class="cl-s">${fmtH(hoursDone())} of ${D.weeklyTargetH} research hours this week · ${ic('lock', 11, 2.4)} private</span></span><span class="go">${ic('chev', 18)}</span></button>`;
  }

  /* Today's research card (desktop): same numbers as Compass, one action, no competing stats */
  function todayResearchCard() {
    const e = eta(), pc = pubCount(), need = D.rule.needPapers, tb = D.todayBlock, blk = blocks().find((b) => b.today), o = OCR();
    const t = (m) => { const h = Math.floor(m / 60), mm = m % 60, h12 = ((h + 11) % 12) + 1; return h12 + (mm ? ':' + String(mm).padStart(2, '0') : '') + (h >= 12 ? ' pm' : ' am'); };
    const next = !o.target ? 'Next: pick a target journal' : o.stage <= 1 ? 'Next: finish the results section' : o.decision ? 'Next: reply to the reviewers' : 'Waiting for the journal';
    return `<section class="rs cx-rs rise" style="--i:3" data-tour="research" aria-label="Research and promotion"><div class="art" aria-hidden="true">${B.ring(pc / need, 64, 7, `<b class="num">${pc}/${need}</b>`)}</div>
      <div><h3>Research writing${blk ? ` · ${t(tb.s)} to ${t(tb.e)}` : ''}</h3><div class="sub">${esc(o.t)} · ${esc(next)}</div>
        <div class="rwho">${ic('spark', 13)} Associate Professor ${e.months != null ? `in ~${e.months} months` : ': pick a journal to set a date'} · ${fmtH(hoursDone())} of ${D.weeklyTargetH} h this week</div></div>
      <div class="rs-act"><button type="button" class="lnk rs-lnk" data-act="go" data-v="compass">Open Grow ${ic('chev', 13, 2.4)}</button>${blk && blk.done ? `<span class="tg ok">${ic('check', 13, 2.6)} ${fmtH(blk.h)} h logged</span>` : blk ? `<button type="button" class="btn sm accent" data-act="focus">${ic('focus', 15)} Start focus</button>` : ''}</div></section>`;
  }
  /* One-time alignment of the app's older research data with Compass (persona paper title, today's block, the week's blocks). */
  function alignAppData() {
    const s = S(), c = s.compass; if (!c || c.v13) return;
    const wd = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString('en-GB', { weekday: 'short' }); };
    c.blocks = D.blocks.map((b) => ({ id: b.id, d: wd(b.offset), l: b.l, h: b.h, done: b.done, today: b.offset === 0 }));
    const r1 = (c.papers || []).find((p) => p.id === 'r1'); if (r1) { r1.t = OCR().t; r1.next = 'Pick a target journal'; }
    const ev = (s.sched || []).find((e) => e.k === 'research'); if (ev) { ev.s = D.todayBlock.s; ev.e = D.todayBlock.e; ev.sub = D.todayBlock.sub; }
    c.v13 = 1; B.save();
  }

  /* ---------------- install ---------------- */
  root.MarginCompass = {
    install(bridge) {
      B = bridge;
      const s = S();
      if (s && s.full === 'Dr. Tanvir Rahman') { s.full = D.persona.full; s.name = D.persona.short; }
      X(); alignAppData();
      B.VIEWS.compass = view;
      if (B.setQ9Rs) B.setQ9Rs(todayResearchCard);
      B.setCompassLine(compassLine);
      if (B.TOUR) {
        B.TOUR.forEach((st) => { ['t', 'b', 'k'].forEach((f) => { if (typeof st[f] === 'string') st[f] = st[f].replace(/Dr\. Rahman/g, D.persona.short); }); });
        const st = B.TOUR.find((z) => z.view === 'compass' && z.sel === '[data-tour="promo"]');
        if (st) { st.t = 'A visible path to promotion'; st.b = 'The promotion rule becomes his plan: 2 of 3 indexed papers, about 14 months to go. Watch the date move when he picks a Q2 journal for the OCR paper.';
          st.try = { l: 'Pick the Q2 journal', run: () => { X().tab = 'home'; pick('j-jadi'); } }; }
      }
      document.addEventListener('click', onClick);
      document.addEventListener('input', onInput);
      document.addEventListener('change', onChange);
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S().view === 'compass' && X().demo.on && !document.querySelector('#layer .sheet')) demoEnd(); });
    },
    data: D, eta: () => eta(),
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);

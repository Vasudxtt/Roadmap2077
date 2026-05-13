/* ──── PDF.js ──── */
if (typeof pdfjsLib !== 'undefined') pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
async function extractPDF(file) {
    if (typeof pdfjsLib === 'undefined') return null;
    try {
        const ab = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
        let t = '';
        for (let i = 1; i <= Math.min(pdf.numPages, 8); i++) {
            const p = await pdf.getPage(i);
            const c = await p.getTextContent();
            t += c.items.map(s => s.str).join(' ') + '\n';
        }
        return t.trim();
    } catch (e) { return null; }
}

/* ──── CURSOR ──── */
const curDot = document.getElementById('cur-dot');
const curRing = document.getElementById('cur-ring');
let mx = 0, my = 0, rx = 0, ry = 0;
document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; curDot.style.left = mx + 'px'; curDot.style.top = my + 'px'; });
(function loop() { rx += (mx - rx) * .25; ry += (my - ry) * .25; curRing.style.left = rx + 'px'; curRing.style.top = ry + 'px'; requestAnimationFrame(loop); })();
document.addEventListener('mouseover', e => { if (e.target.closest('button,a,.feat-card,.proj-card,.idea-card,.paper-card,.stream-btn,.quiz-opt,.topic-btn,.fbtn,.idea-ai,.qt,.sotd-hero')) document.body.classList.add('ch'); });
document.addEventListener('mouseout', e => { if (e.target.closest('button,a,.feat-card,.proj-card,.idea-card,.paper-card,.stream-btn,.quiz-opt,.topic-btn,.fbtn,.idea-ai,.qt,.sotd-hero')) document.body.classList.remove('ch'); });
document.addEventListener('mousedown', () => document.body.classList.add('ck'));
document.addEventListener('mouseup', () => document.body.classList.remove('ck'));

/* ──── SCROLL REVEAL ──── */
const ro = new IntersectionObserver(e => { e.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); ro.unobserve(x.target); } }); }, { threshold: .08 });
function obs() { document.querySelectorAll('.rev:not(.in)').forEach(el => ro.observe(el)); }
obs();

/* ──── NAV ──── */
const TITLES = { home: 'Dashboard', roadmap: 'Career Roadmaps', student: 'Student Path', exams: 'Exam Planner', papers: 'Question Papers', projects: 'Project Hub', resume: 'Resume AI', chat: 'AI Assistant' };
function nav(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + name).classList.add('active');
    document.querySelectorAll('.ni').forEach(n => n.classList.remove('on'));
    const ni = document.getElementById('nav-' + name); if (ni) ni.classList.add('on');
    document.getElementById('tb-page').textContent = TITLES[name] || name;
    if (name === 'projects') loadProjects(false);
    if (name === 'papers') renderPapers('all');
    closeSB(); setTimeout(obs, 100);
}
function toggleSB() { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('overlay').classList.toggle('show'); }
function closeSB() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('overlay').classList.remove('show'); }

/* ──── AUTOCOMPLETE ──── */
const CAREERS = ['Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'React Developer', 'Node.js Developer', 'Vue.js Developer', 'Angular Developer', 'Data Scientist', 'Machine Learning Engineer', 'AI/ML Engineer', 'Data Analyst', 'Business Analyst', 'DevOps Engineer', 'Cloud Engineer', 'AWS Architect', 'GCP Engineer', 'Cybersecurity Analyst', 'Blockchain Developer', 'Web3 Developer', 'Game Developer', 'Unity Developer', 'Unreal Engine Developer', 'Mobile Developer (Android)', 'Mobile Developer (iOS)', 'React Native Developer', 'Flutter Developer', 'UX/UI Designer', 'Graphic Designer', 'Motion Designer', '3D Artist', 'Product Manager', 'Product Designer', 'MBBS Doctor', 'Dentist', 'Physiotherapist', 'Pharmacist', 'Nurse', 'Biomedical Engineer', 'Chartered Accountant', 'Financial Analyst', 'Investment Banker', 'Stock Trader', 'Quantitative Analyst', 'Digital Marketer', 'SEO Specialist', 'Content Creator', 'YouTuber', 'Influencer', 'Social Media Manager', 'HR Manager', 'Civil Engineer', 'Mechanical Engineer', 'Electrical Engineer', 'Aerospace Engineer', 'UPSC Civil Services Officer', 'IPS Officer', 'IFS Officer', 'Lawyer / Advocate', 'Journalist', 'Content Writer', 'Fashion Designer', 'Interior Designer', 'Architect', 'Urban Planner', 'Teacher / Professor', 'Startup Founder', 'Venture Capitalist'];
function handleAC() {
    const v = document.getElementById('career-input').value.toLowerCase();
    const l = document.getElementById('ac-list');
    if (!v || v.length < 2) { l.classList.add('hidden'); return; }
    const m = CAREERS.filter(c => c.toLowerCase().includes(v)).slice(0, 7);
    if (!m.length) { l.classList.add('hidden'); return; }
    l.innerHTML = m.map(x => `<div class="ac-item" onclick="setC('${x.replace(/'/g, "\\'")}' )">${x}</div>`).join('');
    l.classList.remove('hidden');
}
document.addEventListener('click', e => { if (!e.target.closest('.ac-wrap')) document.getElementById('ac-list').classList.add('hidden'); });
function setC(v) { document.getElementById('career-input').value = v; document.getElementById('ac-list').classList.add('hidden'); }

/* ──── AI CALL (proxied via /api/ai from server.js) ──── */
// use_smart_model=true forces llama-3.3-70b on the server (for student path JSON)
async function callAI(messages, system, maxTokens = 1400, useSmartModel = false) {
    const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, system, max_tokens: maxTokens, use_smart_model: useSmartModel })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
    const t = data?.content?.[0]?.text ?? data?.text ?? '';
    if (!t) throw new Error('Empty response from AI');
    return t;
}
function parseJ(raw) { let c = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim(); const s = c.indexOf('{'), e = c.lastIndexOf('}'); if (s >= 0 && e >= 0) c = c.slice(s, e + 1); return JSON.parse(c); }
function parseJA(raw) { let c = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim(); const s = c.indexOf('['), e = c.lastIndexOf(']'); if (s >= 0 && e >= 0) c = c.slice(s, e + 1); return JSON.parse(c); }
function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function show(id) { const el = typeof id === 'string' ? document.getElementById(id) : id; if (el) el.classList.remove('hidden'); }
function hide(id) { const el = typeof id === 'string' ? document.getElementById(id) : id; if (el) el.classList.add('hidden'); }

/* ──── ROADMAP ──── */
let rmSteps = [], rmDone = new Set();
async function generateRoadmap() {
    const career = document.getElementById('career-input').value.trim();
    if (!career) { alert('Please enter a career goal!'); return; }
    const timeline = document.getElementById('timeline-input').value;
    const level = document.getElementById('level-input').value;
    const domain = document.getElementById('domain-input').value;
    const custom = document.getElementById('custom-prompt').value.trim();
    show('rm-loading'); hide('rm-ph'); hide('rm-result');
    const prompt = `Generate detailed sequential career roadmap to become a "${career}".
Timeline: ${timeline}, Level: ${level}, Domain: ${domain}${custom ? '\nContext: ' + custom : ''}
Output ONLY valid JSON:
{"title":"Roadmap: <title>","duration":"<total>","timeline_note":"<warning if unrealistic, else empty>","steps":[{"num":1,"title":"<step>","desc":"<2-3 sentences>","skills":["s1","s2"],"time":"<e.g. 2-3 weeks>","project":"<hands-on task or empty>","video_resource":"<YouTube search query>","resources":"<best resource name>"}]}
Include 8-12 steps. Be specific and realistic.`;
    try {
        const raw = await callAI([{ role: 'user', content: prompt }], 'Expert career coach. Output ONLY valid JSON.', 1600);
        const data = parseJ(raw);
        rmSteps = data.steps || []; rmDone = new Set();
        document.getElementById('rm-title').textContent = data.title || career;
        document.getElementById('rm-meta').textContent = `Est. ${data.duration} · ${rmSteps.length} milestones · tap ○ to mark done`;
        const w = document.getElementById('rm-warn');
        if (data.timeline_note) { w.textContent = '⚡ ' + data.timeline_note; show(w); } else hide(w);
        renderSteps(); hide('rm-loading'); show('rm-result');
    } catch (e) {
        hide('rm-loading');
        document.getElementById('step-list').innerHTML = `<div style="color:var(--red);padding:1rem;font-size:.8rem">⚠️ ${esc(e.message)}</div>`;
        show('rm-result');
    }
}
function renderSteps() {
    const pct = rmSteps.length ? Math.round(rmDone.size / rmSteps.length * 100) : 0;
    document.getElementById('prog-fill').style.width = pct + '%';
    document.getElementById('rm-pct').textContent = pct + '%';
    document.getElementById('step-list').innerHTML = rmSteps.map((s, i) => {
        const done = rmDone.has(i);
        const chips = (s.skills || []).map(sk => `<span class="chip chip-w" style="font-size:.52rem">${esc(sk)}</span>`).join('');
        const proj = s.project ? `<span style="font-size:.6rem;padding:.08rem .42rem;border-radius:3px;background:rgba(200,255,0,.06);border:1px solid rgba(200,255,0,.15);color:var(--acid)">🛠 ${esc(s.project)}</span>` : '';
        const vid = s.video_resource ? `<a class="step-yt" href="https://www.youtube.com/results?search_query=${encodeURIComponent(s.video_resource)}" target="_blank" rel="noopener">▶ Tutorial</a>` : '';
        return `<div class="step-card${done ? ' done' : ''}"><div class="step-num${done ? ' done' : ''}" onclick="togStep(${i})">${done ? '✓' : s.num}</div><div class="step-body"><div class="step-title${done ? ' done' : ''}">${esc(s.title)}</div><div class="step-desc">${esc(s.desc)}</div><div class="step-chips">${chips}${proj}</div><div class="step-meta"><span>⏱ ${esc(s.time || '')}</span>${s.resources ? `<span>📚 ${esc(s.resources)}</span>` : ''} ${vid}</div></div></div>`;
    }).join('');
}
function togStep(i) { rmDone.has(i) ? rmDone.delete(i) : rmDone.add(i); renderSteps(); }

/* ──── STUDENT ──── */
const QUIZ = [
    { q: 'What activity excites you most?', opts: ['Solving maths & physics', 'Studying biology & health', 'Running a business', 'Creating art or writing', 'Building software'] },
    { q: 'Where do you see yourself in 10 years?', opts: ['Engineer or researcher', 'Doctor or healthcare', 'Entrepreneur or leader', 'Artist or journalist', 'Tech developer or PM'] },
    { q: 'Which subject feels most natural?', opts: ['Physics & Maths', 'Biology & Chemistry', 'Economics & Accounts', 'History & Literature', 'Computer Science'] },
    { q: 'How do you prefer to work?', opts: ['With data & systems', 'With patients/people', 'In business settings', 'With creative freedom', 'Building digital products'] },
    { q: 'Your relationship with maths?', opts: ['Love it — strongest subject', 'Manage basic maths', 'Prefer stats/economics', 'Avoid complex maths', 'Like programming/applied maths'] },
    { q: 'What problems do you want to solve?', opts: ['Engineering problems', 'Medical/health problems', 'Business/financial problems', 'Social/cultural problems', 'Tech/product problems'] },
    { q: 'Which career appeals most?', opts: ['IIT → Engineer', 'AIIMS → Doctor', 'IIM → Manager', 'NID → Designer/Writer', 'Startup → Developer'] }
];
let qIdx = 0, qAns = [];

// ── Stream metadata: correct career goals & exams per stream ──
const STREAM_META = {
    pcm:      { goal: 'Engineering / Tech / Research',         exams: 'JEE Main · JEE Advanced · BITSAT · VITEEE' },
    pcb:      { goal: 'Medicine / MBBS / Healthcare',          exams: 'NEET UG · AIIMS · JIPMER · NEET PG later' },
    pcmb:     { goal: 'Medicine or Engineering (keep both options open)', exams: 'NEET UG + JEE Main' },
    commerce: { goal: 'Business / Finance / CA / MBA / Banking', exams: 'CA Foundation · CUET · CAT · CLAT · CFA' },
    arts:     { goal: 'Law / Journalism / Civil Services / Design / Teaching', exams: 'CLAT · UPSC · NID · NIFT · CUET' },
};

function selStream(s, btn) {
    document.querySelectorAll('.stream-btn').forEach(b => b.classList.remove('sel')); btn.classList.add('sel');
    hide('stu-ph'); hide('quiz-panel'); hide('stu-loading');
    const r = document.getElementById('stu-result'); r.classList.add('hidden'); r.innerHTML = '';
    if (s === 'undecided') { qIdx = 0; qAns = []; renderQuiz(); show('quiz-panel'); }
    else { show('stu-loading'); buildStream(s); }
}
function renderQuiz() {
    if (qIdx >= QUIZ.length) { finishQuiz(); return; }
    const q = QUIZ[qIdx];
    document.getElementById('quiz-q').textContent = q.q;
    document.getElementById('quiz-cnt').textContent = `Q ${qIdx + 1} / ${QUIZ.length}`;
    document.getElementById('quiz-prog').style.width = ((qIdx + 1) / QUIZ.length * 100) + '%';
    document.getElementById('quiz-opts').innerHTML = q.opts.map((o, i) => `<button class="quiz-opt" onclick="ansQ(${i},'${o.replace(/'/g, "\\'")}' )">${o}</button>`).join('');
}
function ansQ(i, v) { qAns.push(v); qIdx++; renderQuiz(); }

/* ──── finishQuiz: smaller prompt + smart model ──── */
async function finishQuiz() {
    hide('quiz-panel'); show('stu-loading');
    const prompt = `Indian student quiz answers: ${qAns.join(' | ')}
Pick the best Class 11-12 stream (PCM/PCB/PCMB/Commerce/Arts).
Output ONLY compact JSON, zero extra text:
{"recommended_stream":"PCM","reasoning":"Max 2 sentences.","top_careers":["c1","c2","c3"],"title":"PCM Path","duration":"Class 11 to first job","daily_hours":{"class11":"5-6 hrs","class12":"7-8 hrs"},"subjects":[{"name":"Physics","icon":"⚛️","chapters":[{"title":"Motion","priority":"high","weeks":"2 weeks"},{"title":"Waves","priority":"medium","weeks":"2 weeks"},{"title":"Optics","priority":"low","weeks":"1 week"}],"practice_strategy":"Solve PYQs daily."},{"name":"Chemistry","icon":"🧪","chapters":[{"title":"Atoms","priority":"high","weeks":"2 weeks"},{"title":"Bonds","priority":"medium","weeks":"2 weeks"},{"title":"Reactions","priority":"low","weeks":"1 week"}],"practice_strategy":"Revise NCERT first."},{"name":"Maths","icon":"📐","chapters":[{"title":"Algebra","priority":"high","weeks":"2 weeks"},{"title":"Calculus","priority":"high","weeks":"2 weeks"},{"title":"Geometry","priority":"medium","weeks":"1 week"}],"practice_strategy":"Practice 20 problems daily."}],"steps":[{"num":1,"title":"Foundation","desc":"Clear NCERT basics.","skills":["Reading","Notes"],"time":"3 months","resources":"NCERT"},{"num":2,"title":"Coaching","desc":"Join JEE/NEET prep.","skills":["Problem Solving"],"time":"1 year","resources":"Allen/Aakash"},{"num":3,"title":"Mock Tests","desc":"Take full mocks weekly.","skills":["Speed","Accuracy"],"time":"6 months","resources":"PW/Unacademy"},{"num":4,"title":"Revision","desc":"Revise all topics.","skills":["Memory","Recall"],"time":"2 months","resources":"Short Notes"}]}
Return exactly 3 subjects with exactly 3 chapters each. Return exactly 4 steps. All strings under 50 chars.`;
    try {
        // use_smart_model=true → server uses llama-3.3-70b-versatile
        const raw = await callAI([{ role: 'user', content: prompt }], 'Output ONLY valid compact JSON. No markdown. No extra text.', 1800, true);
        renderStuResult(parseJ(raw), true);
    } catch (e) {
        hide('stu-loading');
        const r = document.getElementById('stu-result');
        r.innerHTML = `<div class="card" style="color:var(--red);font-size:.8rem">⚠️ ${esc(e.message)}</div>`;
        r.classList.remove('hidden');
    }
}

/* ──── buildStream: correct careers per stream + smart model ──── */
async function buildStream(stream) {
    const labels = {
        pcm:      'PCM (Physics, Chemistry, Maths)',
        pcb:      'PCB (Physics, Chemistry, Biology)',
        pcmb:     'PCMB (Physics, Chemistry, Maths, Biology)',
        commerce: 'Commerce (Business, Accounts, Economics)',
        arts:     'Arts & Humanities (History, Literature, Social Sci)'
    };

    // Correct career mapping — this is what was wrong before
    const careerMap = {
        pcm:      { careers: ['Engineer','Data Scientist','Researcher'],      exams: ['JEE Main','JEE Advanced','BITSAT'] },
        pcb:      { careers: ['MBBS Doctor','Dentist','Pharmacist'],          exams: ['NEET UG','AIIMS','JIPMER'] },
        pcmb:     { careers: ['Doctor','Engineer','Biomedical Engineer'],      exams: ['NEET UG','JEE Main'] },
        commerce: { careers: ['CA','Investment Banker','Business Analyst'],    exams: ['CA Foundation','CUET','CAT'] },
        arts:     { careers: ['Lawyer','Civil Servant','Journalist'],          exams: ['CLAT','UPSC','CUET'] },
    };
    const cm = careerMap[stream] || careerMap.pcm;

    // Subject templates per stream to avoid wrong AI hallucinations
    const subjectTemplates = {
        pcm: [
            { name:'Physics', icon:'⚛️', chapters:[{title:'Kinematics',priority:'high',weeks:'2 weeks'},{title:'Thermodynamics',priority:'medium',weeks:'2 weeks'},{title:'Optics',priority:'low',weeks:'1 week'}], practice_strategy:'Solve 20 numericals daily.' },
            { name:'Chemistry', icon:'🧪', chapters:[{title:'Atomic Structure',priority:'high',weeks:'2 weeks'},{title:'Chemical Bonding',priority:'medium',weeks:'2 weeks'},{title:'Equilibrium',priority:'low',weeks:'1 week'}], practice_strategy:'Revise NCERT reactions.' },
            { name:'Maths', icon:'📐', chapters:[{title:'Algebra',priority:'high',weeks:'2 weeks'},{title:'Calculus',priority:'high',weeks:'2 weeks'},{title:'Coordinate Geometry',priority:'medium',weeks:'1 week'}], practice_strategy:'Practice 20 problems daily.' }
        ],
        pcb: [
            { name:'Physics', icon:'⚛️', chapters:[{title:'Mechanics',priority:'high',weeks:'2 weeks'},{title:'Electricity',priority:'medium',weeks:'2 weeks'},{title:'Optics',priority:'low',weeks:'1 week'}], practice_strategy:'Focus on NEET weightage topics.' },
            { name:'Chemistry', icon:'🧪', chapters:[{title:'Organic Chemistry',priority:'high',weeks:'3 weeks'},{title:'Inorganic Chemistry',priority:'high',weeks:'2 weeks'},{title:'Physical Chemistry',priority:'medium',weeks:'2 weeks'}], practice_strategy:'Memorise reactions & mechanisms.' },
            { name:'Biology', icon:'🔬', chapters:[{title:'Cell Biology',priority:'high',weeks:'2 weeks'},{title:'Genetics',priority:'high',weeks:'2 weeks'},{title:'Human Physiology',priority:'high',weeks:'3 weeks'}], practice_strategy:'Draw diagrams and label daily.' }
        ],
        pcmb: [
            { name:'Physics', icon:'⚛️', chapters:[{title:'Mechanics',priority:'high',weeks:'2 weeks'},{title:'Waves',priority:'medium',weeks:'1 week'},{title:'Modern Physics',priority:'high',weeks:'2 weeks'}], practice_strategy:'Cover both JEE and NEET patterns.' },
            { name:'Chemistry', icon:'🧪', chapters:[{title:'Organic Chemistry',priority:'high',weeks:'3 weeks'},{title:'Physical Chemistry',priority:'high',weeks:'2 weeks'},{title:'Inorganic Chemistry',priority:'medium',weeks:'2 weeks'}], practice_strategy:'Revise NCERT thoroughly.' },
            { name:'Biology + Maths', icon:'🔬', chapters:[{title:'Cell Biology',priority:'high',weeks:'2 weeks'},{title:'Calculus',priority:'high',weeks:'2 weeks'},{title:'Genetics',priority:'medium',weeks:'2 weeks'}], practice_strategy:'Alternate Biology and Maths daily.' }
        ],
        commerce: [
            { name:'Accountancy', icon:'📊', chapters:[{title:'Journal & Ledger',priority:'high',weeks:'2 weeks'},{title:'Financial Statements',priority:'high',weeks:'2 weeks'},{title:'Cash Flow',priority:'medium',weeks:'1 week'}], practice_strategy:'Solve balance sheets daily.' },
            { name:'Business Studies', icon:'💼', chapters:[{title:'Nature of Business',priority:'high',weeks:'1 week'},{title:'Management Functions',priority:'high',weeks:'2 weeks'},{title:'Marketing',priority:'medium',weeks:'1 week'}], practice_strategy:'Write case studies regularly.' },
            { name:'Economics', icon:'📈', chapters:[{title:'Microeconomics',priority:'high',weeks:'2 weeks'},{title:'Macroeconomics',priority:'high',weeks:'2 weeks'},{title:'Indian Economy',priority:'medium',weeks:'1 week'}], practice_strategy:'Link theory to current affairs.' }
        ],
        arts: [
            { name:'History', icon:'🏛️', chapters:[{title:'Ancient India',priority:'high',weeks:'2 weeks'},{title:'Medieval India',priority:'high',weeks:'2 weeks'},{title:'Modern India',priority:'high',weeks:'2 weeks'}], practice_strategy:'Make timelines and maps.' },
            { name:'Political Science', icon:'⚖️', chapters:[{title:'Constitution',priority:'high',weeks:'2 weeks'},{title:'Government Structure',priority:'high',weeks:'2 weeks'},{title:'International Relations',priority:'medium',weeks:'1 week'}], practice_strategy:'Read newspapers daily.' },
            { name:'English / Literature', icon:'📖', chapters:[{title:'Prose & Poetry',priority:'high',weeks:'2 weeks'},{title:'Grammar & Writing',priority:'high',weeks:'2 weeks'},{title:'Comprehension',priority:'medium',weeks:'1 week'}], practice_strategy:'Write essays and summaries.' }
        ]
    };

    // Use hardcoded subject templates (no hallucination risk) + AI only for steps
    const subjectsData = subjectTemplates[stream] || subjectTemplates.pcm;

    // Ask AI only for steps (small, safe JSON)
    const stepsPrompt = `Generate 5 practical career steps for a Class 11-12 ${labels[stream]} student in India aiming for ${cm.careers.join('/')}.
Output ONLY a JSON array, no extra text:
[{"num":1,"title":"Step title","desc":"One sentence only.","skills":["s1","s2"],"time":"duration","resources":"resource name"}]
Exactly 5 steps. All strings under 50 chars. No trailing commas.`;

    try {
        const stepsRaw = await callAI([{ role: 'user', content: stepsPrompt }], 'Output ONLY a valid JSON array. No markdown, no extra text.', 800, true);
        const steps = parseJA(stepsRaw);

        const data = {
            title: `Class 11-12 ${stream.toUpperCase()} Path`,
            duration: 'Class 11 to first job',
            exam_options: cm.exams,
            top_careers: cm.careers,
            daily_hours: { class11: '5-6 hrs', class12: '7-8 hrs' },
            subjects: subjectsData,
            steps: steps
        };
        renderStuResult(data, false);
    } catch (e) {
        hide('stu-loading');
        const r = document.getElementById('stu-result');
        r.innerHTML = `<div class="card" style="color:var(--red);font-size:.8rem">⚠️ ${esc(e.message)}</div>`;
        r.classList.remove('hidden');
    }
}

function renderStuResult(data, isQuiz) {
    hide('stu-loading');

    // ── Goal banner: shown for direct stream selection (not quiz) ──
    const streamKey = (data.title || '').toLowerCase().replace('class 11-12 ', '').replace(' path', '').trim();
    const sm = STREAM_META[streamKey] || null;
    const goalBanner = (!isQuiz && sm) ? `<div class="card mb-md" style="border-color:rgba(200,255,0,.2);background:rgba(200,255,0,.03)"><div style="font-size:.62rem;text-transform:uppercase;letter-spacing:.06em;color:var(--white4);margin-bottom:.25rem">Career goal for this stream</div><div style="font-family:'Syne',sans-serif;font-weight:800;font-size:.9rem;color:var(--acid);margin-bottom:.15rem">${esc(sm.goal)}</div><div style="font-size:.68rem;color:var(--white4)">${esc(sm.exams)}</div></div>` : '';

    const exC = (data.exam_options || []).map(e => `<span class="chip chip-w">${esc(e)}</span>`).join('');
    const carC = (data.top_careers || []).map(c => `<span class="chip chip-a">${esc(c)}</span>`).join('');
    const subs = (data.subjects || []).map(s => `<div class="sub-card"><h4>${s.icon || '📖'} ${esc(s.name)}</h4>${(s.chapters || []).map(c => `<div class="ch-row"><span>${esc(c.title)}</span><div style="display:flex;align-items:center;gap:.35rem"><span class="text-xs text-w4">${esc(c.weeks || '')}</span><span class="${c.priority === 'high' ? 'ph ph-hi' : c.priority === 'medium' ? 'ph ph-md' : 'ph ph-lo'}">${c.priority}</span></div></div>`).join('')}<div class="text-xs text-w4 mt-sm">📌 ${esc(s.practice_strategy || '')}</div></div>`).join('');
    const steps = (data.steps || []).map(s => `<div class="step-card"><div class="step-num">${s.num}</div><div class="step-body"><div class="step-title">${esc(s.title)}</div><div class="step-desc">${esc(s.desc || '')}</div><div class="step-chips">${(s.skills || []).map(sk => `<span class="chip chip-w">${esc(sk)}</span>`).join('')}</div><div class="step-meta"><span>⏱ ${esc(s.time || '')}</span>${s.resources ? `<span>📚 ${esc(s.resources)}</span>` : ''}</div></div></div>`).join('');
    const hoursHtml = data.daily_hours ? `<div class="card card-sm mb-md" style="display:flex;gap:2rem"><div><div class="text-xs text-w4">Class 11</div><div style="font-family:'Syne',sans-serif;font-weight:800;color:var(--acid)">${esc(data.daily_hours.class11 || '')}</div></div><div><div class="text-xs text-w4">Class 12</div><div style="font-family:'Syne',sans-serif;font-weight:800;color:var(--acid)">${esc(data.daily_hours.class12 || '')}</div></div></div>` : '';
    const recBanner = isQuiz ? `<div class="card mb-md" style="border-color:rgba(200,255,0,.15);background:rgba(200,255,0,.03)"><div style="font-family:'Syne',sans-serif;font-weight:800;font-size:.95rem;color:var(--acid);margin-bottom:.2rem">AI Recommendation: ${esc(data.recommended_stream || '')}</div><div class="text-sm text-w4">${esc(data.reasoning || '')}</div></div>` : '';

    const r = document.getElementById('stu-result');
    r.innerHTML = `${goalBanner}${recBanner}<div class="card mb-md"><div class="flex-b mb-sm" style="flex-wrap:wrap;gap:.5rem"><div style="font-family:'Syne',sans-serif;font-weight:800;font-size:1rem">${esc(data.title || '')}</div><span class="text-sm text-w4">${esc(data.duration || '')}</span></div><div style="display:flex;gap:.25rem;flex-wrap:wrap">${exC}${carC}</div></div>${hoursHtml}<div class="mb-md"><label class="lbl mb-sm">Subject-wise Roadmap</label>${subs}</div><div class="card"><label class="lbl mb-sm">Step-by-Step Path</label><div>${steps}</div></div>`;
    r.classList.remove('hidden');
}

/* ──── EXAM PLANNER ──── */
function toggleCE() { const w = document.getElementById('ce-wrap'); document.getElementById('exam-name').value === 'custom' ? show(w) : hide(w); }
async function generateExamPlan() {
    let exam = document.getElementById('exam-name').value;
    if (exam === 'custom') exam = document.getElementById('custom-exam').value.trim() || 'Competitive Exam';
    const dateVal = document.getElementById('exam-date').value;
    const hours = document.getElementById('study-hours').value;
    const prep = document.getElementById('prep-level').value;
    const weak = document.getElementById('weak-areas').value.trim();
    const daysLeft = dateVal ? Math.ceil((new Date(dateVal) - Date.now()) / 86400000) : 90;
    hide('ep-ph'); show('ep-loading'); hide('ep-result');
    const prompt = `Create realistic study planner for ${exam}. Date: ${dateVal || '~3 months'} (${daysLeft} days). Daily: ${hours} hrs. Prep: ${prep}.${weak ? ' Weak: ' + weak : ''}
Be BRUTALLY HONEST. Output ONLY valid JSON:
{"exam":"${exam}","days_left":${daysLeft},"verdict":"<2 sentence honest assessment>","target":"<realistic score>","alert":"<warning if < 30 days, else empty>","subject_breakdown":[{"subject":"<s>","icon":"<e>","weightage":"40%","topics":[{"topic":"<t>","subtopics":["st1","st2"],"days":"<days>","priority":"high|medium|low"}],"revision_cycles":2,"practice_tests":"<e.g. 3 mocks>"}],"weekly_blocks":[{"week":"Week 1-2","focus":"<topic>","intensity":"light|moderate|intense|brutal","daily":[{"day":"Mon-Tue","plan":"<plan>"},{"day":"Wed-Thu","plan":"<plan>"},{"day":"Fri-Sat","plan":"<plan>"},{"day":"Sun","plan":"Revision + Mock"}]}],"revision_plan":"<2 sentences>","weak_area_focus":"<advice>","tips":["t1","t2","t3"]}
3-4 subjects, 3-5 weekly blocks.`;
    try { const raw = await callAI([{ role: 'user', content: prompt }], 'Brutally honest exam strategist. Output ONLY valid JSON.', 1800); renderExamPlan(parseJ(raw)); }
    catch (e) { hide('ep-loading'); document.getElementById('ep-result').innerHTML = `<div class="card" style="color:var(--red);font-size:.8rem">⚠️ ${esc(e.message)}</div>`; show('ep-result'); }
}
function renderExamPlan(d) {
    hide('ep-loading');
    const iColor = { light: 'var(--acid)', moderate: 'var(--gold)', intense: 'var(--gold)', brutal: 'var(--red)' };
    const iBg = { light: 'rgba(200,255,0,.08)', moderate: 'rgba(255,204,0,.08)', intense: 'rgba(255,204,0,.1)', brutal: 'rgba(255,51,51,.08)' };
    const alertHtml = d.alert ? `<div style="padding:.7rem;background:rgba(255,51,51,.06);border:1px solid rgba(255,51,51,.22);border-radius:var(--r);margin-bottom:.8rem;font-size:.76rem;color:var(--red)">⚠️ <strong>Warning:</strong> ${esc(d.alert)}</div>` : '';
    const subjects = (d.subject_breakdown || []).map(s => {
        const topics = (s.topics || []).map(t => { const pc = t.priority === 'high' ? 'ph ph-hi' : t.priority === 'medium' ? 'ph ph-md' : 'ph ph-lo'; const subs = (t.subtopics || []).map(st => `<span class="chip chip-w" style="font-size:.52rem">${esc(st)}</span>`).join(' '); return `<div style="display:flex;align-items:flex-start;gap:.55rem;padding:.5rem 0;border-bottom:1px solid var(--line)"><div style="flex:1"><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:.77rem;margin-bottom:.15rem">${esc(t.topic)} <span class="${pc}">${t.priority}</span></div><div style="display:flex;flex-wrap:wrap;gap:.18rem">${subs}</div></div><div class="text-xs text-w4 mono" style="flex-shrink:0">${esc(t.days || '')}</div></div>`; }).join('');
        return `<div class="card card-sm mb-md"><div class="flex-b mb-sm"><div style="font-family:'Syne',sans-serif;font-weight:800;font-size:.82rem">${s.icon || '📖'} ${esc(s.subject)}</div><span class="chip chip-a">${esc(s.weightage || '')}</span></div>${topics}<div style="display:flex;gap:.8rem;margin-top:.55rem;font-size:.65rem;color:var(--white4)"><span>🔁 ${esc(String(s.revision_cycles || 2))}x revision</span><span>📝 ${esc(s.practice_tests || '')}</span></div></div>`;
    }).join('');
    const weeks = (d.weekly_blocks || []).map(w => { const rows = (w.daily || []).map(day => `<tr><td>${esc(day.day)}</td><td>${esc(day.plan)}</td></tr>`).join(''); return `<div class="week-card"><div class="wk-head"><div class="wk-title">${esc(w.week)} — ${esc(w.focus)}</div><span class="int-pill" style="background:${iBg[w.intensity] || iBg.light};color:${iColor[w.intensity] || iColor.light}">${w.intensity}</span></div><table class="day-tbl"><tbody>${rows}</tbody></table></div>`; }).join('');
    const tips = (d.tips || []).map(t => `<div style="display:flex;gap:.5rem;padding:.25rem 0;font-size:.73rem"><span style="color:var(--acid)">→</span><span class="text-w4">${esc(t)}</span></div>`).join('');
    document.getElementById('ep-result').innerHTML = `<div class="card mb-md"><div style="font-family:'Syne',sans-serif;font-weight:800;font-size:1rem;color:var(--acid);margin-bottom:.25rem">${esc(d.exam)} — <span class="mono" style="font-size:.85rem">${esc(String(d.days_left))} days left</span></div>${alertHtml}<div class="verdict">${esc(d.verdict)}</div><div class="text-sm">Realistic target: <strong style="color:var(--acid)">${esc(d.target || '')}</strong></div></div><label class="lbl mb-sm">Subject Breakdown</label>${subjects}${d.weak_area_focus ? `<div class="card card-sm mb-md" style="border-left:2px solid var(--acid)"><label class="lbl mb-sm">Weak Area Focus</label><div class="text-sm text-w4">${esc(d.weak_area_focus)}</div></div>` : ''}<label class="lbl mb-sm">Weekly Schedule</label>${weeks}<div class="card"><label class="lbl mb-sm">Smart Tips</label>${tips}</div>`;
    show('ep-result');
}

/* ──── QUESTION PAPERS ──── */
const PAPERS = [
    { exam: 'JEE Mains', cat: 'jee', years: [2025, 2024, 2023, 2022, 2021], topics: 'Physics, Chemistry, Mathematics', official: 'https://jeemain.nta.ac.in', searchQ: 'JEE Mains question paper PDF' },
    { exam: 'JEE Advanced', cat: 'jee', years: [2024, 2023, 2022, 2021, 2020], topics: 'Physics, Chemistry, Mathematics', official: 'https://jeeadv.ac.in', searchQ: 'JEE Advanced question paper PDF' },
    { exam: 'NEET UG', cat: 'neet', years: [2025, 2024, 2023, 2022, 2021], topics: 'Physics, Chemistry, Biology', official: 'https://neet.nta.nic.in', searchQ: 'NEET UG question paper PDF' },
    { exam: 'UPSC CSE Prelims', cat: 'upsc', years: [2024, 2023, 2022, 2021, 2020], topics: 'GS Paper I, CSAT Paper II', official: 'https://upsc.gov.in', searchQ: 'UPSC CSE Prelims question paper PDF' },
    { exam: 'UPSC CSE Mains', cat: 'upsc', years: [2024, 2023, 2022, 2021, 2020], topics: 'GS I, II, III, IV + Essay', official: 'https://upsc.gov.in', searchQ: 'UPSC Mains question paper PDF' },
    { exam: 'GATE CS', cat: 'gate', years: [2025, 2024, 2023, 2022, 2021], topics: 'DSA, OS, DBMS, Networks, COA', official: 'https://gate2025.iisc.ac.in', searchQ: 'GATE CS question paper PDF' },
    { exam: 'GATE ECE', cat: 'gate', years: [2025, 2024, 2023, 2022, 2021], topics: 'Signals, Electronics, Communications', official: 'https://gate2025.iisc.ac.in', searchQ: 'GATE ECE question paper PDF' },
    { exam: 'CAT', cat: 'cat', years: [2024, 2023, 2022, 2021, 2020], topics: 'VARC, DILR, Quantitative', official: 'https://iimcat.ac.in', searchQ: 'CAT question paper PDF free' },
    { exam: 'SSC CGL', cat: 'ssc', years: [2024, 2023, 2022, 2021, 2020], topics: 'GK, Reasoning, Quant, English', official: 'https://ssc.nic.in', searchQ: 'SSC CGL question paper PDF' },
    { exam: 'CUET UG', cat: 'cuet', years: [2024, 2023, 2022], topics: 'Domain, Language, GTS', official: 'https://cuet.samarth.ac.in', searchQ: 'CUET UG question paper PDF' },
    { exam: 'CLAT', cat: 'clat', years: [2025, 2024, 2023, 2022, 2021], topics: 'English, GK, Legal, Reasoning, Quant', official: 'https://consortiumofnlus.ac.in', searchQ: 'CLAT question paper PDF' },
];
function renderPapers(cat) {
    const list = cat === 'all' ? PAPERS : PAPERS.filter(p => p.cat === cat);
    document.getElementById('papers-grid').innerHTML = list.map(p => {
        const yBtns = p.years.map(y => `<button class="btn btn-ghost btn-xs" onclick="openPM('${esc(p.exam)}',${y},'${esc(p.searchQ)}')">${y}</button>`).join('');
        return `<div class="paper-card"><div class="paper-year">${p.years[0]}</div><div class="paper-exam">${esc(p.exam)}</div><div class="paper-meta">${esc(p.topics)}</div><div class="paper-btns">${yBtns}</div><div class="paper-btns mt-sm"><button class="btn btn-ghost btn-xs" onclick="window.open('${p.official}','_blank')">🌐 Official</button><button class="btn btn-ghost btn-xs" onclick="window.open('https://www.google.com/search?q=${encodeURIComponent(p.searchQ)}','_blank')">🔍 PDF</button><button class="btn btn-outline btn-xs" onclick="askPaper('${esc(p.exam)}')">🤖 AI Help</button></div></div>`;
    }).join('');
}
function filterPapers(cat, btn) { document.querySelectorAll('#papers-filter .fbtn').forEach(b => b.classList.remove('on')); btn.classList.add('on'); renderPapers(cat); }
async function openPM(exam, year, searchQ) {
    show('paper-modal');
    document.getElementById('pm-title').textContent = `${exam} — ${year}`;
    document.getElementById('pm-sub').textContent = 'AI-generated sample questions';
    show('pm-loading'); hide('pm-content');
    try {
        const text = await callAI([{ role: 'user', content: `Generate 8-10 realistic sample questions similar to ${exam} ${year} paper. Mix difficulty levels. For MCQs include 4 options. Number each Q1, Q2... Start directly with Q1.` }], `Generate realistic ${exam} exam questions.`, 1200);
        document.getElementById('pm-qp').textContent = text;
        const p = PAPERS.find(p => p.exam === exam);
        document.getElementById('pm-links').innerHTML = `<a href="${p?.official || '#'}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">🌐 Official Site</a><button class="btn btn-ghost btn-sm" onclick="window.open('https://www.google.com/search?q=${encodeURIComponent(searchQ + ' ' + year)}','_blank')">🔍 Find PDF</button><button class="btn btn-outline btn-sm" onclick="askPaper('${esc(exam)}')">🤖 AI Strategy</button>`;
        hide('pm-loading'); show('pm-content');
    } catch (e) { document.getElementById('pm-qp').textContent = `⚠️ ${e.message}`; hide('pm-loading'); show('pm-content'); }
}
function closePM(e) { if (e.target === document.getElementById('paper-modal')) closePMD(); }
function closePMD() { hide('paper-modal'); }
function askPaper(exam) { nav('chat'); document.getElementById('chat-input').value = `Give me topic-wise analysis of ${exam} — most important chapters, question frequency, and scoring strategy.`; sendMsg(); }

/* ──── PROJECT HUB ──── */
let allSites = [];
const BUILD_IDEAS = [
    { title: 'Single-Page CV', desc: 'A stunning single-page HTML resume to showcase your career and skills.', level: 'beginner', cat: 'Frontend', type: 'HTML/CSS', tech: ['HTML', 'CSS'], started: 22834 },
    { title: 'Personal Portfolio', desc: 'Responsive multi-page portfolio with scroll animations and project gallery.', level: 'beginner', cat: 'Frontend', type: 'CSS', tech: ['HTML', 'CSS', 'JS'], started: 14200 },
    { title: 'Age Calculator', desc: 'Date-based calculator with clean UI and date validation.', level: 'beginner', cat: 'Frontend', type: 'JavaScript', tech: ['HTML', 'CSS', 'JS'], started: 8022 },
    { title: 'Quiz App', desc: 'Full interactive quiz with timer, score tracking, and animated results.', level: 'intermediate', cat: 'Frontend', type: 'React', tech: ['React', 'JS'], started: 11111 },
    { title: 'Weather Web App', desc: 'Real-time weather with geolocation, 5-day forecast and animated icons.', level: 'intermediate', cat: 'Frontend', type: 'API', tech: ['JS', 'REST API'], started: 10217 },
    { title: 'GitHub Profile Viewer', desc: 'Beautiful GitHub profile cards using the GitHub API with repo stats.', level: 'intermediate', cat: 'Frontend', type: 'API Integration', tech: ['React', 'GitHub API'], started: 8892 },
    { title: 'Kanban Board', desc: 'Drag-and-drop project management board with persistent state.', level: 'advanced', cat: 'Frontend', type: 'React', tech: ['React', 'DnD', 'TypeScript'], started: 7534 },
    { title: 'AI Chat Interface', desc: 'LLM-powered streaming chat with message history and markdown rendering.', level: 'advanced', cat: 'Frontend', type: 'AI', tech: ['Next.js', 'OpenAI', 'TypeScript'], started: 8723 },
    { title: 'Task Tracker CLI', desc: 'Command-line task manager with JSON persistence and categories.', level: 'beginner', cat: 'Backend', type: 'Node.js', tech: ['Node.js', 'JSON'], started: 4992 },
    { title: 'URL Shortener', desc: 'Bitly-clone with analytics, custom slugs, QR codes, and rate limiting.', level: 'intermediate', cat: 'Backend', type: 'Full Stack', tech: ['Node.js', 'Redis', 'PostgreSQL'], started: 8445 },
    { title: 'Realtime Chat Server', desc: 'Socket.io-powered chat backend with rooms, user presence, and history.', level: 'advanced', cat: 'Backend', type: 'WebSocket', tech: ['Node.js', 'Socket.io', 'Redis'], started: 9821 },
    { title: 'E-Commerce API', desc: 'Full REST API — products, carts, orders, payments, and user auth.', level: 'advanced', cat: 'Backend', type: 'API', tech: ['Node.js', 'Stripe', 'PostgreSQL'], started: 7678 },
    { title: 'Blog Platform', desc: 'Full-stack blog with CMS, markdown editor, auth, and SEO optimization.', level: 'intermediate', cat: 'Full Stack', type: 'MERN', tech: ['React', 'Node.js', 'MongoDB'], started: 9201 },
    { title: 'Social Media App', desc: 'Twitter/Instagram clone with posts, likes, follows, real-time feed.', level: 'advanced', cat: 'Full Stack', type: 'Next.js', tech: ['Next.js', 'Prisma', 'tRPC'], started: 7834 },
    { title: 'Job Board', desc: 'Full job board with listings, applications, company profiles, and search.', level: 'advanced', cat: 'Full Stack', type: 'Full Stack', tech: ['React', 'Node.js', 'Elasticsearch'], started: 5621 },
    { title: 'Basic Dockerfile', desc: 'Containerize a simple Node.js web app with multi-stage Docker build.', level: 'beginner', cat: 'DevOps', type: 'Docker', tech: ['Docker', 'Node.js'], started: 6200 },
    { title: 'GitHub Actions CI', desc: 'Set up CI pipeline: lint → test → build → notify on every push.', level: 'beginner', cat: 'DevOps', type: 'CI/CD', tech: ['GitHub Actions', 'YAML'], started: 5500 },
    { title: 'Multi-Container App', desc: 'Orchestrate Node.js + PostgreSQL + Redis with Docker Compose.', level: 'intermediate', cat: 'DevOps', type: 'Docker', tech: ['Docker Compose', 'Nginx'], started: 7100 },
    { title: 'Kubernetes Deployment', desc: 'Deploy microservices to K8s with HPA, rolling updates, and secrets.', level: 'advanced', cat: 'DevOps', type: 'Kubernetes', tech: ['K8s', 'Helm', 'Docker'], started: 6700 },
    { title: 'Sentiment Analyser', desc: 'Analyse customer reviews with NLP — classify positive, negative, neutral.', level: 'beginner', cat: 'AI/ML', type: 'Python', tech: ['Python', 'HuggingFace', 'Flask'], started: 7821 },
    { title: 'Image Classifier', desc: 'Train a CNN to classify images across 10+ categories with real-time inference.', level: 'intermediate', cat: 'AI/ML', type: 'Deep Learning', tech: ['Python', 'TensorFlow', 'Keras'], started: 9432 },
    { title: 'Chatbot with RAG', desc: 'Build a domain-specific chatbot using Retrieval-Augmented Generation.', level: 'advanced', cat: 'AI/ML', type: 'LLM', tech: ['Python', 'LangChain', 'ChromaDB', 'OpenAI'], started: 11230 },
    { title: 'Stock Price Predictor', desc: 'LSTM model to predict stock prices with web dashboard.', level: 'advanced', cat: 'AI/ML', type: 'Time Series', tech: ['Python', 'TensorFlow', 'FastAPI', 'React'], started: 6543 },
    { title: 'To-Do App', desc: 'Cross-platform mobile to-do app with local notifications and sync.', level: 'beginner', cat: 'Mobile', type: 'React Native', tech: ['React Native', 'AsyncStorage'], started: 12400 },
    { title: 'Expense Manager', desc: 'Mobile expense tracker with categories, budgets, charts, and export.', level: 'intermediate', cat: 'Mobile', type: 'Flutter', tech: ['Flutter', 'Dart', 'SQLite'], started: 8920 },
    { title: 'Fitness Tracker', desc: 'Track workouts, calories, and progress with HealthKit/Google Fit integration.', level: 'advanced', cat: 'Mobile', type: 'React Native', tech: ['React Native', 'HealthKit', 'Firebase'], started: 6710 },
];
let pgTitle = '', pgData = null;
/* ──── PROJECT AI GUIDE ──── */
async function openPG(title, desc, tech, cat, level) {
    console.log('openPG called with:', title);

    pgTitle = title;
    pgData = { title, desc, tech, cat, level };

    const overlay = document.getElementById('pg-overlay');
    if (!overlay) {
        alert("Modal HTML not found!");
        return;
    }

    document.getElementById('pg-title-m').textContent = title;
    document.getElementById('pg-meta-m').textContent = `${level} · ${cat} · ${tech.join(', ')}`;

    hide('pg-content-m');
    const loading = document.getElementById('pg-loading-m');
    loading.style.display = 'flex';

    const textEl = document.getElementById('pg-text-m');
    textEl.innerHTML = '';

    const prompt = `You are an expert coding mentor.

Create a detailed build guide for this project:

Project: ${title}
Description: ${desc}
Tech: ${tech.join(', ')}
Category: ${cat}
Level: ${level}

Use this exact Markdown structure:

# ${title}

## Overview
2-3 sentences explaining the project.

## Tech Stack & Setup
- Technologies used
- Step-by-step setup instructions

## Step-by-Step Implementation
Numbered steps with code examples.

## Key Concepts to Learn
- Important concepts

## Bonus Features
3-4 ideas to take it further.

Keep it practical and encouraging.`;

    try {
        const raw = await callAI([{ role: 'user', content: prompt }], 
            'Expert coding mentor. Output clean Markdown.', 2200);
        
        textEl.innerHTML = raw.replace(/\n/g, '<br><br>');
        hide('pg-loading-m');
        show('pg-content-m');
        
    } catch (e) {
        console.error(e);
        hide('pg-loading-m');
        textEl.innerHTML = `<div style="color:var(--red);padding:1.5rem">❌ ${esc(e.message)}</div>`;
        show('pg-content-m');
    }
}

window.openPG = openPG;
function extractSteps(text) {
    const steps = [];
    const matches = text.match(/\*\*Step \d+:([^*]+)\*\*\n([^*]+)/g) || [];
    matches.forEach(m => { const t = m.match(/\*\*Step \d+:[^*]+\*\*/); const d = m.replace(/\*\*Step \d+:[^*]+\*\*/, '').trim(); if (t) steps.push({ title: t[1].trim(), desc: d }); });
    if (!steps.length) return [{ title: 'Setup', desc: 'Initialize project and install dependencies' }, { title: 'Core Logic', desc: 'Build main functionality' }, { title: 'UI & Styling', desc: 'Make it polished' }, { title: 'Testing', desc: 'Test edge cases' }, { title: 'Deploy', desc: 'Ship to production' }];
    return steps;
}
function extractConcepts(text) {
    const s = text.match(/KEY CONCEPTS YOU'LL LEARN([\s\S]*?)(?:##|$)/i);
    if (!s) return ['State Management', 'API Integration', 'Component Design', 'Error Handling', 'Performance'];
    const lines = s[1].split('\n').filter(l => l.trim().match(/^[-•*]|^\d+\./));
    return lines.slice(0, 7).map(l => l.replace(/^[-•*\d.]\s*/, '').trim()).filter(Boolean);
}
function openInChat() { closePG(); nav('chat'); document.getElementById('chat-input').value = `I want to build "${pgTitle}" (${pgData?.tech?.join(', ')}). Give me a detailed walkthrough, help me debug as I go, and suggest how to make it impressive for my portfolio.`; sendMsg(); }
function closePG() { document.getElementById('pg-overlay').style.display = 'none'; }

const AWW_SITES = [
    { id: 1, name: 'Lusion', country: '🇬🇧', cat: 'Creative Studio · WebGL', url: 'https://lusion.co', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&q=90', design: 9.9, usability: 9.2, creativity: 10.0, tags: ['WebGL', '3D', 'GSAP'], award: 'SOTD', why: 'Groundbreaking real-time 3D WebGL visuals that redefined studio portfolios' },
    { id: 2, name: 'Bruno Simon', country: '🇫🇷', cat: 'Portfolio · 3D Game', url: 'https://bruno-simon.com', img: 'https://images.unsplash.com/photo-1614854262318-831574f15f1f?w=900&q=90', design: 9.9, usability: 9.5, creativity: 10.0, tags: ['Three.js', 'Game', 'Fun'], award: 'SOTD', why: 'Drive a mini car through your portfolio — the most loved creative dev site ever' },
    { id: 3, name: 'Linear', country: '🇺🇸', cat: 'SaaS · Project Management', url: 'https://linear.app', img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&q=90', design: 9.8, usability: 9.9, creativity: 9.6, tags: ['Dark', 'Minimal', 'Motion'], award: 'SOTD', why: 'Sets the global benchmark for dark-mode SaaS UI with 60fps micro-interactions' },
    { id: 4, name: 'Apple Vision Pro', country: '🇺🇸', cat: 'Product · Cinematic Scroll', url: 'https://apple.com/vision-pro', img: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=900&q=90', design: 10.0, usability: 9.7, creativity: 9.8, tags: ['Scroll', '3D', 'Video'], award: 'SOTM', why: 'Cinematic scroll storytelling that feels like watching a blockbuster film' },
    { id: 5, name: 'Stripe', country: '🇺🇸', cat: 'FinTech · Developer Platform', url: 'https://stripe.com', img: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=900&q=90', design: 9.7, usability: 9.9, creativity: 9.5, tags: ['Gradient', 'Docs'], award: 'SOTD', why: 'The standard for developer-first marketing sites — beautiful yet functional' },
    { id: 6, name: 'Zenly', country: '🇫🇷', cat: 'App Landing · Social Maps', url: 'https://zen.ly', img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900&q=90', design: 9.9, usability: 9.4, creativity: 9.9, tags: ['3D', 'Playful', 'App'], award: 'SOTD', why: 'Joyful 3D characters and bubbly interactions that sparked a design era' },
    { id: 7, name: 'Resn', country: '🇳🇿', cat: 'Creative Agency · Experimental', url: 'https://resn.co.nz', img: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=900&q=90', design: 9.8, usability: 9.0, creativity: 10.0, tags: ['Experimental', 'WebGL'], award: 'SOTD', why: 'Perpetually experimental — each project reinvents browser capabilities' },
    { id: 8, name: 'Active Theory', country: '🇺🇸', cat: 'Creative Studio · Immersive', url: 'https://activetheory.net', img: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=900&q=90', design: 9.9, usability: 9.3, creativity: 10.0, tags: ['Immersive', 'WebGL'], award: 'SOTD', why: 'Award-winning immersive digital experiences for the world\'s biggest brands' },
    { id: 9, name: 'Pentagram', country: '🇬🇧', cat: 'Design Firm · Editorial', url: 'https://pentagram.com', img: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=900&q=90', design: 9.7, usability: 9.5, creativity: 9.8, tags: ['Typography', 'Editorial'], award: 'SOTM', why: 'World\'s largest independent design consultancy — a typographic masterpiece' },
    { id: 10, name: 'Refik Anadol', country: '🇹🇷', cat: 'AI Data Art · Machine Aesthetics', url: 'https://refikanadol.com', img: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=900&q=90', design: 9.9, usability: 9.2, creativity: 10.0, tags: ['AI Art', 'Generative'], award: 'SOTD', why: 'AI-generated data sculptures in MoMA — where ML becomes fine art' },
    { id: 11, name: 'Obys Agency', country: '🇺🇦', cat: 'Creative Agency · Typography', url: 'https://obys.agency', img: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=900&q=90', design: 9.9, usability: 9.2, creativity: 10.0, tags: ['Typography', 'Bold'], award: 'SOTD', why: 'Made hover-reveal typography a global design trend — 10+ Awwwards' },
    { id: 12, name: 'Basement Studio', country: '🇦🇷', cat: 'Creative Agency · Brutalist', url: 'https://basement.studio', img: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=900&q=90', design: 9.8, usability: 9.3, creativity: 9.9, tags: ['Glitch', 'Brutalist'], award: 'SOTD', why: 'Brutalist-meets-modern — their glitch effect became iconic worldwide' },
    { id: 13, name: 'The Pudding', country: '🇺🇸', cat: 'Data Journalism · Scrollytelling', url: 'https://pudding.cool', img: 'https://images.unsplash.com/photo-1504354949085-aa9ac8c3d7c8?w=900&q=90', design: 9.8, usability: 9.7, creativity: 10.0, tags: ['Data', 'Essays'], award: 'SOTM', why: 'Reinvented long-form journalism with interactive data scrollytelling' },
    { id: 14, name: 'Nothing Tech', country: '🇬🇧', cat: 'Consumer Electronics · Dot Matrix', url: 'https://nothing.tech', img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900&q=90', design: 9.9, usability: 9.7, creativity: 9.9, tags: ['Dot Matrix', 'Minimal'], award: 'SOTM', why: 'Iconic dot-matrix language translated perfectly to web — typographic art' },
    { id: 15, name: 'Rive', country: '🇬🇧', cat: 'Interactive Animation Tool', url: 'https://rive.app', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&q=90', design: 9.9, usability: 9.5, creativity: 9.9, tags: ['Animation', 'State Machine'], award: 'SOTD', why: 'State machine animations in browser — permanently changed how apps feel' },
    { id: 16, name: 'Framer', country: '🇳🇱', cat: 'Visual Web Design · No-Code', url: 'https://framer.com', img: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=900&q=90', design: 9.7, usability: 9.6, creativity: 9.8, tags: ['No-Code', 'Design'], award: 'SOTD', why: 'Made professional web design accessible to every designer without code' },
    { id: 17, name: 'Vercel', country: '🇺🇸', cat: 'Frontend Cloud · Dev Experience', url: 'https://vercel.com', img: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=900&q=90', design: 9.6, usability: 9.8, creativity: 9.7, tags: ['Dark', 'Developer'], award: 'SOTD', why: 'Frosted-glass aesthetics meet developer-first UX — new standard for dev tools' },
    { id: 18, name: 'Raycast', country: '🇬🇧', cat: 'Productivity App · macOS', url: 'https://raycast.com', img: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=900&q=90', design: 9.8, usability: 9.8, creativity: 9.6, tags: ['macOS', 'Dark'], award: 'SOTD', why: 'Turned a utility launcher into a design icon — proves utility can be beautiful' },
    { id: 19, name: 'Arc Browser', country: '🇺🇸', cat: 'Web Browser · Reimagined UX', url: 'https://arc.net', img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900&q=90', design: 9.9, usability: 9.6, creativity: 9.9, tags: ['Browser', 'Bold'], award: 'SOTD', why: 'Completely reimagined the browser — both app and landing page win awards' },
];
async function loadProjects(force) {
    if (allSites.length && !force) { renderSites('all'); return; }
    show('proj-loading'); hide('sotd-container');
    try {
        const res = await fetch('/api/awwwards');
        if (!res.ok) throw new Error('Server error');
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('json')) throw new Error('Server returned non-JSON. Is server.js running?');
        const data = await res.json();
        const sotd = data.sotd;
        document.getElementById('sotd-name').textContent = sotd.name;
        document.getElementById('sotd-cat').textContent = sotd.cat;
        document.getElementById('sotd-why').textContent = '"' + sotd.why + '"';
        document.getElementById('sotd-date').textContent = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        document.getElementById('sotd-design').textContent = sotd.design;
        document.getElementById('sotd-usability').textContent = sotd.usability;
        document.getElementById('sotd-creativity').textContent = sotd.creativity;
        document.getElementById('sotd-url').href = sotd.url;
        document.getElementById('sotd-img').src = sotd.img;
        document.getElementById('sotd-ribbon').textContent = sotd.award === 'SOTM' ? 'SOTM' : 'SOTD';
        const sotm = data.sotm;
        document.getElementById('sotm-name').textContent = sotm.name;
        document.getElementById('sotm-url').href = sotm.url;
        document.getElementById('sotm-month').textContent = data.month || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        document.getElementById('sotm-tags').innerHTML = (sotm.tags || []).map(t => `<span class="chip chip-g" style="font-size:.48rem">${esc(t)}</span>`).join('');
        allSites = data.sites || [];
        hide('proj-loading'); show('sotd-container');
        renderSites('all'); renderIdeas('all');
    } catch (e) {
        hide('proj-loading');
        const fallback = AWW_SITES;
        const sotd = fallback[0];
        document.getElementById('sotd-name').textContent = sotd.name;
        document.getElementById('sotd-cat').textContent = sotd.cat;
        document.getElementById('sotd-why').textContent = '"' + sotd.why + '"';
        document.getElementById('sotd-date').textContent = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        document.getElementById('sotd-design').textContent = sotd.design;
        document.getElementById('sotd-usability').textContent = sotd.usability;
        document.getElementById('sotd-creativity').textContent = sotd.creativity;
        document.getElementById('sotd-url').href = sotd.url;
        document.getElementById('sotd-img').src = sotd.img;
        document.getElementById('sotd-ribbon').textContent = 'SOTD';
        document.getElementById('sotm-name').textContent = fallback[3].name;
        document.getElementById('sotm-url').href = fallback[3].url;
        document.getElementById('sotm-month').textContent = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        document.getElementById('sotm-tags').innerHTML = (fallback[3].tags || []).map(t => `<span class="chip chip-g" style="font-size:.48rem">${esc(t)}</span>`).join('');
        allSites = fallback.slice(1);
        show('sotd-container');
        renderSites('all'); renderIdeas('all');
    }
}
function filterAward(award, btn) { document.querySelectorAll('#proj-filters .fbtn').forEach(b => b.classList.remove('on')); btn.classList.add('on'); renderSites(award); }
function renderSites(filter) {
    const list = filter === 'all' ? allSites : allSites.filter(s => s.award === filter);
    const ac = { 'SOTD': 'aw-sotd', 'SOTM': 'aw-sotm', 'HM': 'aw-hm' };
    document.getElementById('proj-grid').innerHTML = list.map(s => `
    <div class="proj-card" onclick="window.open('${s.url}','_blank')">
      <div class="proj-thumb">
        <img src="${s.img}" alt="${esc(s.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="proj-thumb-fb" style="display:none">🌐</div>
        <span class="award-badge ${ac[s.award] || 'aw-hm'}">${s.award === 'HM' ? 'Honorable' : s.award}</span>
        <span class="proj-flag">${s.country || ''}</span>
      </div>
      <div class="proj-body">
        <div class="proj-cat">${esc(s.cat)}</div>
        <div class="proj-name">${esc(s.name)}</div>
        <div class="proj-why">${esc(s.why)}</div>
        <div class="proj-scores">
          <span class="ps">Design <span class="ps-v">${s.design}</span></span>
          <span class="ps">· UX <span class="ps-v">${s.usability}</span></span>
          <span class="ps">· Creative <span class="ps-v">${s.creativity}</span></span>
        </div>
        <div class="proj-foot">
          <span class="proj-url">${s.url.replace('https://', '')}</span>
          <div class="proj-tags">${(s.tags || []).map(t => `<span class="ptag">${esc(t)}</span>`).join('')}</div>
        </div>
      </div>
    </div>`).join('');
}
function filterIdeas(filter, btn) { document.querySelectorAll('#idea-filters .fbtn').forEach(b => b.classList.remove('on')); btn.classList.add('on'); renderIdeas(filter); }
function renderIdeas(filter) {
    let list;
    if (filter === 'all') list = BUILD_IDEAS;
    else if (['beginner', 'intermediate', 'advanced'].includes(filter)) list = BUILD_IDEAS.filter(i => i.level === filter);
    else list = BUILD_IDEAS.filter(i => i.cat === filter);
    const cats = ['Frontend', 'Backend', 'Full Stack', 'DevOps', 'AI/ML', 'Mobile'];
    const catEmoji = { Frontend: '⚡', Backend: '⚙️', 'Full Stack': '🔗', DevOps: '🚀', 'AI/ML': '🤖', Mobile: '📱' };
    const lc = { beginner: 'lv-b', intermediate: 'lv-i', advanced: 'lv-a' };
    const container = document.getElementById('ideas-container');
    if (['beginner', 'intermediate', 'advanced'].includes(filter)) { container.innerHTML = `<div class="ideas-grid">${list.map(p => ideaCard(p, lc)).join('')}</div>`; return; }
    const showCats = cats.filter(c => filter === 'all' || c === filter);
    container.innerHTML = showCats.map(cat => {
        const items = list.filter(i => i.cat === cat); if (!items.length) return '';
        return `<div><div class="cat-banner">${catEmoji[cat] || '▸'} ${cat}</div><div class="ideas-grid">${items.map(p => ideaCard(p, lc)).join('')}</div></div>`;
    }).join('');
}
function ideaCard(p, lc) {
    const st = p.title.replace(/'/g, "\\'"); 
    const sd = p.desc.replace(/'/g, "\\'");
    const techStr = JSON.stringify(p.tech || []);
    
    return `<div class="idea-card">
        <div class="idea-hd">
            <span class="idea-lv ${lc[p.level]}">${p.level}</span>
            <span class="idea-type">${esc(p.type)}</span>
        </div>
        <div class="idea-title">${esc(p.title)}</div>
        <div class="idea-desc">${esc(p.desc)}</div>
        <div class="idea-tech">${(p.tech || []).map(t => `<span>${esc(t)}</span>`).join('')}</div>
        <div class="idea-foot">
            <div class="idea-count">👥 ${p.started >= 1000 ? (p.started / 1000).toFixed(1) + 'k' : p.started}</div>
            <button class="idea-ai" 
                onclick="event.stopPropagation(); openPG('${st}', '${sd}', ${techStr}, '${p.cat}', '${p.level}')">
                ✦ Ask AI
            </button>
        </div>
    </div>`;
}

/* ──── RESUME FILE HANDLING ──── */
async function handleResFile(e) {
    const file = e.target.files[0]; if (!file) return;
    const z = document.getElementById('upload-zone'), st = document.getElementById('pdf-status');
    z.innerHTML = `⏳ Extracting: ${file.name}…`; z.classList.add('act'); show(st); st.textContent = 'Extracting PDF text…';
    if (file.type === 'application/pdf') {
        const t = await extractPDF(file);
        if (t && t.length > 50) { document.getElementById('resume-text').value = t; st.textContent = `✅ Extracted ${t.length} chars`; }
        else { st.textContent = '⚠️ Could not extract. Paste text below.'; }
    } else { const r = new FileReader(); r.onload = ev => { document.getElementById('resume-text').value = ev.target.result; st.textContent = '✅ Loaded'; }; r.readAsText(file); }
}
let genBase = '', genGH = null;
async function handleGenFile(e) {
    const file = e.target.files[0]; if (!file) return;
    const z = document.getElementById('gen-upload-zone'), st = document.getElementById('gen-status');
    z.innerHTML = `⏳ Extracting: ${file.name}…`; z.classList.add('act'); show(st); st.textContent = 'Extracting…';
    if (file.type === 'application/pdf') {
        const t = await extractPDF(file);
        if (t && t.length > 50) { genBase = t; st.textContent = '✅ Extracted — real data will be preserved'; }
        else { st.textContent = '⚠️ Could not extract.'; genBase = `Uploaded: ${file.name}`; }
    } else { const r = new FileReader(); r.onload = ev => { genBase = ev.target.result; st.textContent = '✅ Loaded'; }; r.readAsText(file); }
}

/* ──── GITHUB FETCH ──── */
async function ghResumeFetch(username) {
    try {
        const res = await fetch('/api/github/auto-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        const data = await res.json();
        if (res.status === 429 || (data && data.rateLimited)) throw new Error('rate_limited');
        if (!res.ok) throw new Error(data.error || 'Server error');
        return data;
    } catch (serverErr) {
        console.warn('[GitHub] Server fallback triggered:', serverErr.message);
        const [profileRes, reposRes] = await Promise.all([
            fetch(`https://api.github.com/users/${encodeURIComponent(username)}`),
            fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=stars&per_page=50`)
        ]);
        if (profileRes.status === 403 || reposRes.status === 403) {
            throw new Error('GitHub API rate limit exceeded. Add GITHUB_TOKEN to your .env — get a free token at github.com/settings/tokens (no scopes needed).');
        }
        if (!profileRes.ok) throw new Error(`GitHub user "@${username}" not found.`);
        const profile = await profileRes.json();
        const raw = await reposRes.json();
        const repos = Array.isArray(raw)
            ? raw.filter(r => !r.fork).slice(0, 30).map(r => ({
                name: r.name, language: r.language || 'Unknown',
                stars: r.stargazers_count || 0, description: r.description || '',
                updated: r.updated_at, topics: r.topics || [], url: r.html_url
            }))
            : [];
        return { profile, repos };
    }
}

async function fetchGenGH() {
    const u = document.getElementById('gen-gh-user').value.trim(); if (!u) return;
    const st = document.getElementById('gen-gh-status'); show(st); st.textContent = '⏳ Fetching GitHub repos…';
    try {
        const data = await ghResumeFetch(u);
        genGH = data;
        st.textContent = `✅ @${u}: ${data.repos.length} repos found`;
        st.style.color = '';
        const c = document.getElementById('gen-sel-repos'); show(c);
        c.innerHTML = `<div class="text-xs text-w4 mb-sm">Repos (AI will pick best for your JD):</div>` + data.repos.slice(0, 8).map(r => `<span class="repo-chip">⭐${r.stars} ${esc(r.name)}</span>`).join('');
    } catch (err) {
        st.textContent = `⚠️ ${err.message}`;
        st.style.color = 'var(--red)';
    }
}

async function generateSmart() {
    const jd = document.getElementById('gen-jd').value.trim();
    const exp = document.getElementById('gen-exp').value;
    const skills = document.getElementById('gen-skills').value.trim();
    if (!jd) { alert('Please enter a job description!'); return; }
    hide('gen-ph'); hide('gen-result'); show('gen-steps'); show('gen-loading');
    const steps = [{ icon: '🔍', title: 'Analyzing Job Description', text: 'Extracting required skills…' }, { icon: '🐙', title: 'Matching GitHub Repositories', text: 'AI selecting most relevant projects…' }, { icon: '📝', title: 'Building Resume Structure', text: 'Organizing your real data…' }, { icon: '✨', title: 'ATS Optimization', text: 'Injecting keywords…' }];
    renderSmSteps(steps, 0);
    try {
        let jda = { role: '', skills: [], tech: [] };
        try { const jdRaw = await callAI([{ role: 'user', content: `Analyze this JD. Output ONLY JSON: {"role":"<role>","company":"<company or empty>","skills":["s1","s2","s3","s4","s5"],"tech":["t1","t2","t3"],"level":"<junior/mid/senior>"}\n\nJD: ${jd}` }], 'Output ONLY valid JSON.', 400); jda = parseJ(jdRaw); show('gen-jd-box'); document.getElementById('gen-jd-role').textContent = `Role: ${jda.role || 'Software Developer'}${jda.company ? ' @ ' + jda.company : ''}`; document.getElementById('gen-jd-skills').innerHTML = [...(jda.skills || []), ...(jda.tech || [])].map(s => `<span class="chip chip-a" style="font-size:.56rem">${esc(s)}</span>`).join(''); } catch (e) { }
        renderSmSteps(steps, 1);
        let repoSec = '';
        if (genGH && genGH.repos.length) { const summary = genGH.repos.map(r => `${r.name} (${r.language}): ${r.description} [⭐${r.stars}]`).join('\n'); try { const selRaw = await callAI([{ role: 'user', content: `JD/Role: ${jd}\nRequired: ${[...jda.skills, ...jda.tech].join(', ')}\n\nRepos:\n${summary}\n\nSelect 4-6 most relevant. Return ONLY JSON array: ["repo1","repo2"]` }], 'Output ONLY a JSON array.', 400); const sel = parseJA(selRaw); const selR = genGH.repos.filter(r => sel.includes(r.name)).slice(0, 6); if (selR.length) repoSec = `\n\nAUTO-SELECTED GITHUB PROJECTS:\n${selR.map(r => `• ${r.name} (${r.language}): ${r.description} [⭐${r.stars}]`).join('\n')}`; } catch (e) { repoSec = `\n\nGITHUB PROJECTS:\n${genGH.repos.slice(0, 5).map(r => `• ${r.name} (${r.language}): ${r.description}`).join('\n')}`; } }
        renderSmSteps(steps, 2);
        document.getElementById('gen-ltxt').textContent = 'Generating ATS-optimized resume…';
        const existCtx = genBase ? `\n\nEXISTING RESUME (PRESERVE REAL NAME, DATES, COMPANIES):\n${genBase.slice(0, 3000)}` : '';
        const prompt = `Expert ATS resume writer. Create a professional, ATS-optimized resume.\nTARGET ROLE / JD: ${jd}\nEXPERIENCE LEVEL: ${exp}\nREQUIRED SKILLS (from JD analysis): ${[...(jda.skills || []), ...(jda.tech || [])].join(', ')}\n${skills ? 'ADDITIONAL SKILLS: ' + skills : ''}${existCtx}${repoSec}\nStructure: HEADER → PROFESSIONAL SUMMARY → TECHNICAL SKILLS → WORK EXPERIENCE → PROJECTS → EDUCATION → CERTIFICATIONS\nUse ═══════════════════════════════ as section separators. Strong action verbs + measurable outcomes.`;
        renderSmSteps(steps, 3);
        const text = await callAI([{ role: 'user', content: prompt }], 'Expert ATS resume writer. Output clean formatted plain text.', 2200);
        document.getElementById('gen-preview').textContent = text;
        hide('gen-loading'); show('gen-result'); renderSmStepsDone(steps);
    } catch (e) { hide('gen-loading'); show('gen-result'); document.getElementById('gen-preview').textContent = '⚠️ ' + e.message; }
}
function renderSmSteps(steps, ai) { document.getElementById('gen-step-list').innerHTML = steps.map((s, i) => { const cls = i < ai ? 'ss-done' : i === ai ? 'ss-active' : 'ss-pend'; const ico = i < ai ? '✓' : i === ai ? '…' : (i + 1); return `<div class="smart-step"><div class="ss-ico ${cls}">${ico}</div><div><div class="ss-title">${s.icon} ${s.title}</div><div class="ss-text">${s.text}</div></div></div>`; }).join(''); }
function renderSmStepsDone(steps) { document.getElementById('gen-step-list').innerHTML = steps.map(s => `<div class="smart-step"><div class="ss-ico ss-done">✓</div><div><div class="ss-title">${s.icon} ${s.title}</div></div></div>`).join(''); }

/* ──── GITHUB RESUME ──── */
async function generateGHResume() {
    const username = document.getElementById('gh-username').value.trim();
    const jd = document.getElementById('gh-jd').value.trim();
    const exp = document.getElementById('gh-exp').value;
    if (!username) { alert('Enter a GitHub username!'); return; }
    if (!jd) { alert('Enter a target role or job description!'); return; }
    hide('gh-ph'); hide('gh-result'); show('gh-progress'); show('gh-loading');
    const steps = [{ icon: '🐙', title: 'Fetching GitHub Profile', text: 'Loading profile, repos…' }, { icon: '🔍', title: 'Analyzing Job Description', text: 'Extracting required skills…' }, { icon: '🤖', title: 'Auto-Selecting Repositories', text: 'AI picking best repos…' }, { icon: '📝', title: 'Generating Resume', text: 'Building ATS-optimized resume…' }];
    renderGHSteps(steps, 0);
    try {
        document.getElementById('gh-ltxt').textContent = 'Fetching GitHub data…';
        const data = await ghResumeFetch(username);
        const { profile, repos } = data;
        const pArea = document.getElementById('gh-profile-area');
        pArea.innerHTML = `<div class="gh-banner"><img class="gh-avatar" src="${profile.avatar_url}" alt="avatar" onerror="this.style.display='none'"><div><div style="font-family:'Syne',sans-serif;font-weight:800;font-size:.83rem">${esc(profile.name || profile.login)}</div><div class="text-xs text-w4">@${esc(profile.login)} · ${profile.public_repos} repos · ${profile.followers || 0} followers</div>${profile.bio ? `<div class="text-xs text-w4">${esc(profile.bio)}</div>` : ''}</div></div>`;
        show(pArea); renderGHSteps(steps, 1);
        let jda = { role: 'Software Developer', skills: [], tech: [] };
        try { const jdRaw = await callAI([{ role: 'user', content: `Extract key info from this JD. Output ONLY JSON: {"role":"<role>","skills":["s1","s2","s3"],"tech":["t1","t2","t3"]}\n\nJD: ${jd}` }], 'Output ONLY valid JSON.', 400); jda = parseJ(jdRaw); } catch (e) { }
        renderGHSteps(steps, 2);
        const rSum = repos.map(r => `${r.name} (${r.language}): ${r.description} [⭐${r.stars}]`).join('\n');
        let selRepos = repos.slice(0, 5);
        try { const selRaw = await callAI([{ role: 'user', content: `Target role: ${jd}\nRequired: ${[...jda.skills, ...jda.tech].join(', ')}\n\nRepos:\n${rSum}\n\nSelect 5-7 most relevant. Return ONLY JSON array: ["name1","name2"]` }], 'Output ONLY a JSON array.', 400); const sel = parseJA(selRaw); const matched = repos.filter(r => sel.includes(r.name)).slice(0, 7); if (matched.length) selRepos = matched; } catch (e) { }
        const srEl = document.getElementById('gh-sel-repos');
        srEl.innerHTML = `<div class="text-xs text-w4 mb-sm">🤖 Auto-selected ${selRepos.length} repos:</div>` + selRepos.map(r => `<span class="repo-chip">⭐${r.stars} ${esc(r.name)}</span>`).join('');
        show(srEl); renderGHSteps(steps, 3);
        const prompt = `Create a professional ATS-optimized resume for: ${jd}\nExperience: ${exp}\nProfile: Name: ${profile.name || profile.login}, Bio: ${profile.bio || 'Developer'}, GitHub: github.com/${profile.login}\nRequired: ${[...jda.skills, ...jda.tech].join(', ')}\n\nGITHUB PROJECTS:\n${selRepos.map(r => `• ${r.name} (${r.language}): ${r.description} [⭐${r.stars}]`).join('\n')}\n\nUse ═══════════════════════════════ separators.`;
        const text = await callAI([{ role: 'user', content: prompt }], 'Expert ATS resume writer.', 2200);
        document.getElementById('gh-preview').textContent = text;
        hide('gh-loading'); show('gh-result'); renderGHStepsDone(steps);
    } catch (e) { hide('gh-loading'); document.getElementById('gh-ph').innerHTML = `<div class="empty-icon">⚠️</div><div style="color:var(--red);font-size:.8rem">${esc(e.message)}</div>`; show('gh-ph'); hide('gh-progress'); }
}
function renderGHSteps(steps, ai) { document.getElementById('gh-step-list').innerHTML = steps.map((s, i) => { const cls = i < ai ? 'ss-done' : i === ai ? 'ss-active' : 'ss-pend'; const ico = i < ai ? '✓' : i === ai ? '…' : (i + 1); return `<div class="smart-step"><div class="ss-ico ${cls}">${ico}</div><div><div class="ss-title">${s.icon} ${s.title}</div><div class="ss-text">${s.text}</div></div></div>`; }).join(''); }
function renderGHStepsDone(steps) { document.getElementById('gh-step-list').innerHTML = steps.map(s => `<div class="smart-step"><div class="ss-ico ss-done">✓</div><div><div class="ss-title">${s.icon} ${s.title}</div></div></div>`).join(''); }

/* ──── RESUME ANALYZE ──── */
async function analyzeResume() {
    const resume = document.getElementById('resume-text').value.trim();
    const jd = document.getElementById('jd-text').value.trim();
    const role = document.getElementById('target-role').value.trim();
    if (!resume) { alert('Please paste your resume text or upload a PDF first!'); return; }
    hide('res-ph'); hide('res-result'); show('res-loading');
    const prompt = `Analyze this resume${role ? ' for ' + role + ' role' : ''}${jd ? ', against JD' : ''}.\nRESUME:\n${resume}${jd ? '\nJD:\n' + jd : ''}\nOutput ONLY valid JSON:\n{"ats_score":72,"verdict":"<1 honest sentence>","strengths":["s1","s2","s3"],"improvements":[{"type":"critical","text":"..."},{"type":"warning","text":"..."},{"type":"tip","text":"..."}],"missing_keywords":["k1","k2","k3","k4","k5"],"quick_wins":["w1","w2","w3"]}`;
    try { const raw = await callAI([{ role: 'user', content: prompt }], 'Expert ATS resume coach. Output ONLY valid JSON.'); renderResAna(parseJ(raw)); }
    catch (e) { hide('res-loading'); show('res-result'); document.getElementById('res-result').innerHTML = `<div style="color:var(--red);font-size:.8rem">⚠️ ${esc(e.message)}</div>`; }
}
function renderResAna(d) {
    hide('res-loading');
    const score = d.ats_score || 70;
    const sc = score >= 80 ? 'var(--acid)' : score >= 60 ? 'var(--gold)' : 'var(--red)';
    const dotC = { critical: 'var(--red)', warning: 'var(--gold)', tip: 'var(--acid)' };
    const imps = (d.improvements || []).map(i => `<div class="imp-row"><div class="imp-dot" style="background:${dotC[i.type] || 'var(--white4)'}"></div><div class="text-sm">${esc(i.text)}</div></div>`).join('');
    const kws = (d.missing_keywords || []).map(k => `<span class="chip chip-r">${esc(k)}</span>`).join('');
    const wins = (d.quick_wins || []).map(w => `<div style="display:flex;gap:.42rem;padding:.22rem 0;font-size:.73rem"><span style="color:var(--acid)">✓</span>${esc(w)}</div>`).join('');
    const str = (d.strengths || []).map(s => `<div style="display:flex;gap:.42rem;padding:.22rem 0;font-size:.73rem"><span style="color:var(--acid)">★</span>${esc(s)}</div>`).join('');
    document.getElementById('res-result').innerHTML = `<div class="score-ring"><div class="score-big" style="color:${sc}">${score}<span style="font-size:1rem">/100</span></div><div class="score-sub">ATS Compatibility Score</div></div><div style="padding:.6rem .82rem;background:var(--void4);border-radius:var(--r);border-left:2px solid ${sc};font-size:.77rem;margin-bottom:.8rem;line-height:1.65">${esc(d.verdict || '')}</div>${str ? `<label class="lbl mb-sm">Strengths</label>${str}<div style="height:1px;background:var(--line);margin:.85rem 0"></div>` : ''}<label class="lbl mb-sm">Improvements</label>${imps}${kws ? `<label class="lbl" style="margin-top:.85rem;margin-bottom:.22rem">Missing Keywords</label><div style="display:flex;flex-wrap:wrap;gap:.22rem">${kws}</div>` : ''}<label class="lbl" style="margin-top:.85rem;margin-bottom:.22rem">Quick Wins</label>${wins}`;
    show('res-result');
}
function showRTab(tab, btn) { document.querySelectorAll('.rtab').forEach(b => b.classList.remove('on')); btn.classList.add('on'); document.querySelectorAll('.res-panel').forEach(p => p.classList.remove('on')); document.getElementById('rtab-' + tab).classList.add('on'); }

/* ──── CHAT ──── */
let chatHistory = [];
const CHAT_SYS = `You are Roadmap2077 AI — expert career mentor for ALL domains (tech, medical, finance, law, content creation, government, arts, etc).
Be DIRECT, SPECIFIC, BRUTALLY HONEST about timelines.
Give CONCRETE next steps. Recommend alternatives when a path is impractical.
Know Indian education: JEE, NEET, UPSC, CAT, GATE, IITs, NITs, AIIMS, IIMs, NLUs.
End responses with 1-2 actions the person can do TODAY.`;
function qMsg(text) { document.getElementById('chat-input').value = text; sendMsg(); }
async function sendMsg() {
    const inp = document.getElementById('chat-input');
    const msg = inp.value.trim(); if (!msg) return;
    inp.value = ''; inp.style.height = 'auto';
    addBubble('user', msg); chatHistory.push({ role: 'user', content: msg });
    const typId = addTyping();
    try {
        const raw = await callAI(chatHistory, CHAT_SYS, 1600);
        removeEl(typId); addBubble('ai', raw);
        chatHistory.push({ role: 'assistant', content: raw });
        if (chatHistory.length > 22) chatHistory = chatHistory.slice(-20);
    } catch (e) { removeEl(typId); addBubble('ai', '⚠️ ' + e.message); }
}
function addBubble(role, text) { const msgs = document.getElementById('msgs'); const div = document.createElement('div'); div.className = 'msg ' + role; div.innerHTML = `<div class="bubble">${esc(text)}</div>`; msgs.appendChild(div); msgs.scrollTop = msgs.scrollHeight; }
function addTyping() { const id = 'typ-' + Date.now(); const msgs = document.getElementById('msgs'); const div = document.createElement('div'); div.id = id; div.className = 'msg ai'; div.innerHTML = '<div class="bubble"><div class="typing-dots"><div class="td"></div><div class="td"></div><div class="td"></div></div></div>'; msgs.appendChild(div); msgs.scrollTop = msgs.scrollHeight; return id; }
function removeEl(id) { const el = document.getElementById(id); if (el) el.remove(); }
function chatKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }
document.getElementById('chat-input').addEventListener('input', function () { this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 92) + 'px'; });

/* ──── DOWNLOAD ──── */
function dlPDF(previewId, filename) {
    const text = document.getElementById(previewId).textContent;
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${filename}</title><style>@page{margin:1.8cm 2cm}body{font-family:'Calibri',Arial,sans-serif;font-size:10.5pt;line-height:1.55;color:#111;max-width:210mm;margin:0 auto}pre{font-family:inherit;white-space:pre-wrap;word-break:break-word;margin:0}</style></head><body><pre>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre><script>window.onload=function(){setTimeout(function(){window.print();},600)}<\/script></body></html>`);
    win.document.close();
}
function copyTxt(id) { navigator.clipboard.writeText(document.getElementById(id).textContent).then(() => { const b = event.target; const o = b.textContent; b.textContent = '✅ Copied!'; setTimeout(() => b.textContent = o, 2000); }); }
function dlTxt(id, filename) { const blob = new Blob([document.getElementById(id).textContent], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); }

/* ──── INIT ──── */
(function init() {
    const d = new Date(); d.setMonth(d.getMonth() + 3);
    document.getElementById('exam-date').value = d.toISOString().split('T')[0];
    renderPapers('all');
})();

const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
const GROQ_MODEL   = 'llama-3.3-70b-versatile';

app.use(express.json({ limit: '16mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── AI proxy ──────────────────────────────────────────────────────────────────
app.post('/api/ai', async (req, res) => {
  try {
    const { messages, system, max_tokens } = req.body;
    if (!messages || !Array.isArray(messages))
      return res.status(400).json({ error: 'messages array is required' });
    const groqMessages = [];
    if (system) groqMessages.push({ role: 'system', content: system });
    groqMessages.push(...messages);
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({ model: GROQ_MODEL, messages: groqMessages, max_tokens: max_tokens || 1400, temperature: 0.7 }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || `Groq error ${response.status}` });
    res.json({ content: [{ type: 'text', text: data?.choices?.[0]?.message?.content || '' }] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GitHub helpers ────────────────────────────────────────────────────────────
function githubHeaders() {
  const h = { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': '10xThink-App' };
  if (process.env.GITHUB_TOKEN) h['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  return h;
}
async function ghFetch(url) {
  const r = await fetch(url, { headers: githubHeaders() });
  const ct = r.headers.get('content-type') || '';
  if (!ct.includes('json')) throw new Error('GitHub returned non-JSON. Username may not exist.');
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || `GitHub error ${r.status}`);
  return d;
}

app.get('/api/github/:username/repos', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const data = await ghFetch(`https://api.github.com/users/${encodeURIComponent(req.params.username)}/repos?sort=updated&per_page=50`);
    return res.json(data);
  } catch (err) { return res.status(400).json({ error: err.message }); }
});

app.get('/api/github/:username/profile', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const data = await ghFetch(`https://api.github.com/users/${encodeURIComponent(req.params.username)}`);
    return res.json(data);
  } catch (err) { return res.status(400).json({ error: err.message }); }
});

app.post('/api/github/auto-resume', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'username required' });
    const [profile, repos] = await Promise.all([
      ghFetch(`https://api.github.com/users/${encodeURIComponent(username)}`),
      ghFetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=stars&per_page=50`)
    ]);
    if (!Array.isArray(repos)) return res.status(400).json({ error: 'Could not fetch repos' });
    const ownRepos = repos.filter(r => !r.fork).slice(0, 30).map(r => ({
      name: r.name, language: r.language || 'Unknown', stars: r.stargazers_count || 0,
      description: r.description || '', updated: r.updated_at, topics: r.topics || [], url: r.html_url
    }));
    return res.json({ profile, repos: ownRepos });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

// ── Awwwards-style discovery — real globally celebrated sites, rotates daily ──
const AWW_SITES = [
  { id:1,  name:'Lusion',            country:'🇬🇧 UK',         cat:'Creative Studio · WebGL Experiences',    url:'https://lusion.co',               img:'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&q=90', design:9.9, usability:9.2, creativity:10.0, tags:['WebGL','3D','Immersive','GSAP'],    award:'SOTD', why:'Groundbreaking real-time 3D WebGL visuals — redefined what a studio portfolio can be' },
  { id:2,  name:'Bruno Simon',        country:'🇫🇷 France',     cat:'Portfolio · 3D Interactive Game',        url:'https://bruno-simon.com',         img:'https://images.unsplash.com/photo-1614854262318-831574f15f1f?w=900&q=90', design:9.9, usability:9.5, creativity:10.0, tags:['Three.js','Game','Portfolio','Fun'],award:'SOTD', why:'Drive a mini car through your portfolio — the most loved creative dev portfolio ever' },
  { id:3,  name:'Linear',             country:'🇺🇸 USA',        cat:'SaaS · Project Management Tool',         url:'https://linear.app',              img:'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&q=90', design:9.8, usability:9.9, creativity:9.6, tags:['Dark','Minimal','Motion','SaaS'],  award:'SOTD', why:'Sets the global benchmark for dark-mode SaaS UI with 60fps micro-interactions' },
  { id:4,  name:'Apple Vision Pro',   country:'🇺🇸 USA',        cat:'Product Landing · Cinematic Scroll',     url:'https://apple.com/vision-pro',    img:'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=900&q=90', design:10.0,usability:9.7, creativity:9.8, tags:['Scroll','Cinematic','3D','Video'],award:'SOTM', why:'Cinematic scroll-driven storytelling that feels like watching a blockbuster film' },
  { id:5,  name:'Stripe',             country:'🇺🇸 USA',        cat:'FinTech · Developer Platform',           url:'https://stripe.com',              img:'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=900&q=90', design:9.7, usability:9.9, creativity:9.5, tags:['Gradient','Docs','Marketing'],    award:'SOTD', why:'The standard for developer-first marketing sites — beautiful yet functional' },
  { id:6,  name:'Zenly',              country:'🇫🇷 France',     cat:'App Landing · Social Maps',              url:'https://zen.ly',                  img:'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900&q=90', design:9.9, usability:9.4, creativity:9.9, tags:['3D','Playful','Colorful','App'],  award:'SOTD', why:'Joyful 3D characters and bubbly interactions that sparked a whole design era' },
  { id:7,  name:'Resn',               country:'🇳🇿 NZ',         cat:'Creative Agency · Experimental Web',     url:'https://resn.co.nz',              img:'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=900&q=90', design:9.8, usability:9.0, creativity:10.0, tags:['Experimental','Art','WebGL'],     award:'SOTD', why:'Perpetually experimental — each project reinvents browser capabilities' },
  { id:8,  name:'Active Theory',      country:'🇺🇸 USA',        cat:'Creative Studio · Immersive Experiences',url:'https://activetheory.net',        img:'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=900&q=90', design:9.9, usability:9.3, creativity:10.0, tags:['Immersive','WebGL','Studio'],     award:'SOTD', why:'Award-winning immersive digital experiences for the world\'s biggest brands' },
  { id:9,  name:'Pentagram',          country:'🇬🇧 UK',         cat:'Design Firm · Editorial Branding',       url:'https://pentagram.com',           img:'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=900&q=90', design:9.7, usability:9.5, creativity:9.8, tags:['Typography','Grid','Editorial'], award:'SOTM', why:'World\'s largest independent design consultancy — an iconic typographic masterpiece' },
  { id:10, name:'Refik Anadol',        country:'🇹🇷 Turkey',    cat:'Data Art · AI Machine Aesthetics',       url:'https://refikanadol.com',         img:'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=900&q=90', design:9.9, usability:9.2, creativity:10.0, tags:['AI Art','Data','Generative'],     award:'SOTD', why:'AI-generated data sculptures shown in MoMA — where machine learning becomes art' },
  { id:11, name:'Obys Agency',         country:'🇺🇦 Ukraine',   cat:'Creative Agency · Bold Typography',      url:'https://obys.agency',             img:'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=900&q=90', design:9.9, usability:9.2, creativity:10.0, tags:['Typography','Bold','Hover'],      award:'SOTD', why:'Made hover-reveal typography a global design trend — collected 10+ Awwwards' },
  { id:12, name:'Basement Studio',     country:'🇦🇷 Argentina', cat:'Creative Agency · Brutalist Modern',     url:'https://basement.studio',         img:'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=900&q=90', design:9.8, usability:9.3, creativity:9.9, tags:['Glitch','Bold','Brutalist'],      award:'SOTD', why:'Brutalist-meets-modern — their glitch effect and bold type became iconic worldwide' },
  { id:13, name:'The Pudding',         country:'🇺🇸 USA',       cat:'Data Journalism · Visual Scrollytelling',url:'https://pudding.cool',            img:'https://images.unsplash.com/photo-1504354949085-aa9ac8c3d7c8?w=900&q=90', design:9.8, usability:9.7, creativity:10.0, tags:['Data','Scrollytelling','Essays'],award:'SOTM', why:'Reinvented long-form journalism with interactive data scrollytelling essays' },
  { id:14, name:'Nothing Tech',        country:'🇬🇧 UK',        cat:'Consumer Electronics · Dot Matrix',      url:'https://nothing.tech',            img:'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900&q=90', design:9.9, usability:9.7, creativity:9.9, tags:['Dot Matrix','Bold','Minimal'],    award:'SOTM', why:'Nothing\'s iconic dot-matrix language translated perfectly to web — typographic art' },
  { id:15, name:'Impossible Bureau',   country:'🇫🇷 France',    cat:'Creative Studio · Cursor Art',           url:'https://impossible-bureau.com',   img:'https://images.unsplash.com/photo-1614854262318-831574f15f1f?w=900&q=90', design:9.7, usability:9.1, creativity:10.0, tags:['Cursor','Experimental','Art'],   award:'SOTD', why:'Every cursor interaction is a work of art — redefines what hover states can achieve' },
  { id:16, name:'Codrops',             country:'🇩🇪 Germany',   cat:'Web Dev Inspiration · CSS Demos',        url:'https://tympanus.net/codrops',    img:'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&q=90', design:9.6, usability:9.7, creativity:9.8, tags:['CSS','GSAP','Demos','Tutorials'], award:'HM',   why:'The bible of creative web interactions — 15+ years of pushing CSS to its limits' },
  { id:17, name:'Rive',                country:'🇬🇧 UK',        cat:'Interactive Animation Tool · Runtime',   url:'https://rive.app',                img:'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&q=90', design:9.9, usability:9.5, creativity:9.9, tags:['Animation','State Machine','UI'],  award:'SOTD', why:'State machine animations in the browser — permanently changed how apps feel' },
  { id:18, name:'Framer',              country:'🇳🇱 Netherlands','cat':'Visual Web Design · No-Code Platform', url:'https://framer.com',              img:'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=900&q=90', design:9.7, usability:9.6, creativity:9.8, tags:['No-Code','Design','Interactive'], award:'SOTD', why:'Made professional web design accessible to every designer — no code required' },
  { id:19, name:'Spotify Design',      country:'🇸🇪 Sweden',    cat:'Music Platform · Brand Design Blog',     url:'https://spotify.design',          img:'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=900&q=90', design:9.7, usability:9.8, creativity:9.6, tags:['Music','Brand','Case Studies'],  award:'HM',   why:'Spotify\'s design team blog is as beautifully crafted as the product itself' },
  { id:20, name:'Moooi',               country:'🇳🇱 Netherlands','cat':'Luxury Furniture · 3D Configurator',  url:'https://moooi.com',               img:'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=900&q=90', design:9.9, usability:9.4, creativity:10.0, tags:['3D','Luxury','Configurator'],    award:'SOTD', why:'Museum-quality furniture site with real-time 3D room configurators — stunning' },
  { id:21, name:'Pitch',               country:'🇩🇪 Germany',   cat:'Presentation SaaS · Collaboration',      url:'https://pitch.com',               img:'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=900&q=90', design:9.8, usability:9.6, creativity:9.7, tags:['SaaS','Slides','Collab'],         award:'SOTD', why:'Reinvented the boring presentation tool with a joyful, fluid interface' },
  { id:22, name:'Vercel',              country:'🇺🇸 USA',       cat:'Frontend Cloud · Developer Experience',  url:'https://vercel.com',              img:'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=900&q=90', design:9.6, usability:9.8, creativity:9.7, tags:['Dark','Blur','Developer'],        award:'SOTD', why:'Frosted-glass aesthetics meet developer-first UX — the new standard for dev tools' },
  { id:23, name:'NASA JPL',            country:'🇺🇸 USA',       cat:'Space Science · Data Visualization',     url:'https://jpl.nasa.gov',            img:'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=900&q=90', design:9.7, usability:9.6, creativity:9.5, tags:['Space','Data Viz','Science'],    award:'SOTD', why:'Brought the cosmos to the browser with breathtaking data visualizations' },
  { id:24, name:'Gucci',               country:'🇮🇹 Italy',     cat:'Luxury Fashion · Editorial Web',         url:'https://gucci.com',               img:'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=900&q=90', design:9.8, usability:9.5, creativity:9.7, tags:['Luxury','Editorial','Fashion'],  award:'SOTM', why:'Consistently award-winning editorial fashion direction in digital form — year after year' },
  { id:25, name:'Stripe Checkout',     country:'🇺🇸 USA',       cat:'UX Pattern · Payment Flow',              url:'https://checkout.stripe.dev',     img:'https://images.unsplash.com/photo-1504354949085-aa9ac8c3d7c8?w=900&q=90', design:9.8, usability:9.9, creativity:9.6, tags:['UX','Clean','Payments'],          award:'HM',   why:'The most copied checkout UI in the world — a masterclass in conversion-focused UX' },
  { id:26, name:'Raycast',             country:'🇬🇧 UK',        cat:'Productivity App · macOS Launcher',      url:'https://raycast.com',             img:'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=900&q=90', design:9.8, usability:9.8, creativity:9.6, tags:['macOS','Dark','Productivity'],    award:'SOTD', why:'Turned a utility launcher into a design icon — proves utility can be beautiful' },
  { id:27, name:'Warp Terminal',       country:'🇺🇸 USA',       cat:'AI Terminal · Developer UX',             url:'https://warp.dev',                img:'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=900&q=90', design:9.8, usability:9.7, creativity:9.6, tags:['Terminal','AI','Dark','Dev'],    award:'SOTD', why:'Made the terminal beautiful and AI-powered — a revolution for developers' },
  { id:28, name:'Arc Browser',         country:'🇺🇸 USA',       cat:'Web Browser · Reimagined UX',            url:'https://arc.net',                 img:'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900&q=90', design:9.9, usability:9.6, creativity:9.9, tags:['Browser','Creative','Bold'],      award:'SOTD', why:'Completely reimagined the browser from scratch — both the app and landing page win awards' },
  { id:29, name:'Monokai Pro',         country:'🇦🇺 Australia', cat:'Developer Theme · Product Landing',      url:'https://monokai.pro',             img:'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&q=90', design:9.8, usability:9.7, creativity:9.7, tags:['Dev','Dark','Minimal'],           award:'SOTD', why:'A product page for a code color theme that became a design reference in itself' },
  { id:30, name:'Figma Config',        country:'🇺🇸 USA',       cat:'Design Conference · Annual Event',       url:'https://config.figma.com',        img:'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=900&q=90', design:9.8, usability:9.6, creativity:9.8, tags:['Event','Bold','Colorful'],        award:'SOTD', why:'Figma\'s annual conference site itself wins design awards every single year' },
];

function getDailySite() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return AWW_SITES[dayOfYear % AWW_SITES.length];
}
function getMonthlySite() {
  return AWW_SITES[new Date().getMonth() % AWW_SITES.length];
}

app.get('/api/awwwards', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const sotd = getDailySite();
  const sotm = getMonthlySite();
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const others = AWW_SITES
    .filter(s => s.id !== sotd.id)
    .sort((a, b) => ((a.id * 2654435761 + dayOfYear) >>> 0) - ((b.id * 2654435761 + dayOfYear) >>> 0));
  return res.json({
    sotd,
    sotm,
    sites: others,
    date: new Date().toISOString().split('T')[0],
    month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  });
});

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀  10xThink server → http://localhost:${PORT}`);
  console.log(`    AI Model : ${GROQ_MODEL}\n`);
});
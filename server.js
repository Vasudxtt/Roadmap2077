const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
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

function githubHeaders() {
  const h = { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': '10xThink-App' };
  if (process.env.GITHUB_TOKEN) h['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  return h;
}
async function ghFetch(url) {
  const r = await fetch(url, { headers: githubHeaders() });
  const ct = r.headers.get('content-type') || '';
  if (!ct.includes('json')) throw new Error('GitHub returned non-JSON.');
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

const AWW_SITES = [
  { id:1,  name:'Lusion',            country:'🇬🇧',cat:'Creative Studio · WebGL',         url:'https://lusion.co',               img:'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&q=90', design:9.9, usability:9.2, creativity:10.0, tags:['WebGL','3D','GSAP'],    award:'SOTD', why:'Groundbreaking real-time 3D WebGL visuals that redefined studio portfolios' },
  { id:2,  name:'Bruno Simon',        country:'🇫🇷',cat:'Portfolio · 3D Game',             url:'https://bruno-simon.com',         img:'https://images.unsplash.com/photo-1614854262318-831574f15f1f?w=900&q=90', design:9.9, usability:9.5, creativity:10.0, tags:['Three.js','Game','Fun'],award:'SOTD', why:'Drive a mini car through your portfolio — the most loved creative dev site ever' },
  { id:3,  name:'Linear',             country:'🇺🇸',cat:'SaaS · Project Management',       url:'https://linear.app',              img:'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&q=90', design:9.8, usability:9.9, creativity:9.6, tags:['Dark','Minimal','Motion'], award:'SOTD', why:'Sets the global benchmark for dark-mode SaaS UI with 60fps micro-interactions' },
  { id:4,  name:'Apple Vision Pro',   country:'🇺🇸',cat:'Product · Cinematic Scroll',      url:'https://apple.com/vision-pro',    img:'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=900&q=90', design:10.0,usability:9.7, creativity:9.8, tags:['Scroll','3D','Video'],  award:'SOTM', why:'Cinematic scroll storytelling that feels like watching a blockbuster film' },
  { id:5,  name:'Stripe',             country:'🇺🇸',cat:'FinTech · Developer Platform',    url:'https://stripe.com',              img:'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=900&q=90', design:9.7, usability:9.9, creativity:9.5, tags:['Gradient','Docs'],        award:'SOTD', why:'The standard for developer-first marketing sites — beautiful yet functional' },
  { id:6,  name:'Zenly',              country:'🇫🇷',cat:'App Landing · Social Maps',       url:'https://zen.ly',                  img:'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900&q=90', design:9.9, usability:9.4, creativity:9.9, tags:['3D','Playful','App'],     award:'SOTD', why:'Joyful 3D characters and bubbly interactions that sparked a design era' },
  { id:7,  name:'Resn',               country:'🇳🇿',cat:'Creative Agency · Experimental',  url:'https://resn.co.nz',              img:'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=900&q=90', design:9.8, usability:9.0, creativity:10.0, tags:['Experimental','WebGL'],   award:'SOTD', why:'Perpetually experimental — each project reinvents browser capabilities' },
  { id:8,  name:'Active Theory',      country:'🇺🇸',cat:'Creative Studio · Immersive',     url:'https://activetheory.net',        img:'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=900&q=90', design:9.9, usability:9.3, creativity:10.0, tags:['Immersive','WebGL'],      award:'SOTD', why:'Award-winning immersive digital experiences for the world\'s biggest brands' },
  { id:9,  name:'Pentagram',          country:'🇬🇧',cat:'Design Firm · Editorial',         url:'https://pentagram.com',           img:'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=900&q=90', design:9.7, usability:9.5, creativity:9.8, tags:['Typography','Editorial'],  award:'SOTM', why:'World\'s largest independent design consultancy — a typographic masterpiece' },
  { id:10, name:'Refik Anadol',        country:'🇹🇷',cat:'AI Data Art · Machine Aesthetics',url:'https://refikanadol.com',        img:'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=900&q=90', design:9.9, usability:9.2, creativity:10.0, tags:['AI Art','Generative'],    award:'SOTD', why:'AI-generated data sculptures in MoMA — where ML becomes fine art' },
  { id:11, name:'Obys Agency',         country:'🇺🇦',cat:'Creative Agency · Typography',   url:'https://obys.agency',             img:'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=900&q=90', design:9.9, usability:9.2, creativity:10.0, tags:['Typography','Bold'],      award:'SOTD', why:'Made hover-reveal typography a global design trend — 10+ Awwwards' },
  { id:12, name:'Basement Studio',     country:'🇦🇷',cat:'Creative Agency · Brutalist',    url:'https://basement.studio',         img:'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=900&q=90', design:9.8, usability:9.3, creativity:9.9, tags:['Glitch','Brutalist'],      award:'SOTD', why:'Brutalist-meets-modern — their glitch effect became iconic worldwide' },
  { id:13, name:'The Pudding',         country:'🇺🇸',cat:'Data Journalism · Scrollytelling',url:'https://pudding.cool',           img:'https://images.unsplash.com/photo-1504354949085-aa9ac8c3d7c8?w=900&q=90', design:9.8, usability:9.7, creativity:10.0, tags:['Data','Essays'],        award:'SOTM', why:'Reinvented long-form journalism with interactive data scrollytelling' },
  { id:14, name:'Nothing Tech',        country:'🇬🇧',cat:'Consumer Electronics · Dot Matrix',url:'https://nothing.tech',          img:'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900&q=90', design:9.9, usability:9.7, creativity:9.9, tags:['Dot Matrix','Minimal'],  award:'SOTM', why:'Iconic dot-matrix language translated perfectly to web — typographic art' },
  { id:15, name:'Impossible Bureau',   country:'🇫🇷',cat:'Creative Studio · Cursor Art',   url:'https://impossible-bureau.com',   img:'https://images.unsplash.com/photo-1614854262318-831574f15f1f?w=900&q=90', design:9.7, usability:9.1, creativity:10.0, tags:['Cursor','Experimental'], award:'SOTD', why:'Every cursor interaction is art — redefines what hover states can achieve' },
  { id:16, name:'Codrops',             country:'🇩🇪',cat:'Web Dev Inspiration · CSS Demos', url:'https://tympanus.net/codrops',   img:'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&q=90', design:9.6, usability:9.7, creativity:9.8, tags:['CSS','GSAP','Demos'],     award:'HM',   why:'The bible of creative web interactions — 15+ years pushing CSS to limits' },
  { id:17, name:'Rive',                country:'🇬🇧',cat:'Interactive Animation Tool',      url:'https://rive.app',                img:'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&q=90', design:9.9, usability:9.5, creativity:9.9, tags:['Animation','State Machine'],award:'SOTD', why:'State machine animations in browser — permanently changed how apps feel' },
  { id:18, name:'Framer',              country:'🇳🇱',cat:'Visual Web Design · No-Code',     url:'https://framer.com',              img:'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=900&q=90', design:9.7, usability:9.6, creativity:9.8, tags:['No-Code','Design'],       award:'SOTD', why:'Made professional web design accessible to every designer without code' },
  { id:19, name:'Spotify Design',      country:'🇸🇪',cat:'Music Platform · Brand Blog',     url:'https://spotify.design',          img:'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=900&q=90', design:9.7, usability:9.8, creativity:9.6, tags:['Music','Brand'],          award:'HM',   why:'Spotify\'s design blog is as beautifully crafted as the product itself' },
  { id:20, name:'Moooi',               country:'🇳🇱',cat:'Luxury Furniture · 3D Config',    url:'https://moooi.com',               img:'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=900&q=90', design:9.9, usability:9.4, creativity:10.0, tags:['3D','Luxury'],           award:'SOTD', why:'Museum-quality furniture site with real-time 3D room configurators' },
  { id:21, name:'Pitch',               country:'🇩🇪',cat:'Presentation SaaS',               url:'https://pitch.com',               img:'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=900&q=90', design:9.8, usability:9.6, creativity:9.7, tags:['SaaS','Slides'],          award:'SOTD', why:'Reinvented the boring presentation tool with a joyful, fluid interface' },
  { id:22, name:'Vercel',              country:'🇺🇸',cat:'Frontend Cloud · Dev Experience',  url:'https://vercel.com',              img:'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=900&q=90', design:9.6, usability:9.8, creativity:9.7, tags:['Dark','Developer'],        award:'SOTD', why:'Frosted-glass aesthetics meet developer-first UX — new standard for dev tools' },
  { id:23, name:'NASA JPL',            country:'🇺🇸',cat:'Space Science · Data Viz',         url:'https://jpl.nasa.gov',            img:'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=900&q=90', design:9.7, usability:9.6, creativity:9.5, tags:['Space','Data Viz'],      award:'SOTD', why:'Brought the cosmos to browser with breathtaking data visualizations' },
  { id:24, name:'Gucci',               country:'🇮🇹',cat:'Luxury Fashion · Editorial',       url:'https://gucci.com',               img:'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=900&q=90', design:9.8, usability:9.5, creativity:9.7, tags:['Luxury','Fashion'],      award:'SOTM', why:'Consistently award-winning editorial fashion direction in digital form' },
  { id:25, name:'Raycast',             country:'🇬🇧',cat:'Productivity App · macOS',         url:'https://raycast.com',             img:'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=900&q=90', design:9.8, usability:9.8, creativity:9.6, tags:['macOS','Dark'],           award:'SOTD', why:'Turned a utility launcher into a design icon — proves utility can be beautiful' },
  { id:26, name:'Warp Terminal',       country:'🇺🇸',cat:'AI Terminal · Developer UX',       url:'https://warp.dev',                img:'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=900&q=90', design:9.8, usability:9.7, creativity:9.6, tags:['Terminal','AI'],         award:'SOTD', why:'Made the terminal beautiful and AI-powered — a revolution for developers' },
  { id:27, name:'Arc Browser',         country:'🇺🇸',cat:'Web Browser · Reimagined UX',      url:'https://arc.net',                 img:'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900&q=90', design:9.9, usability:9.6, creativity:9.9, tags:['Browser','Bold'],         award:'SOTD', why:'Completely reimagined the browser — both app and landing page win awards' },
  { id:28, name:'Figma Config',        country:'🇺🇸',cat:'Design Conference · Annual Event', url:'https://config.figma.com',        img:'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=900&q=90', design:9.8, usability:9.6, creativity:9.8, tags:['Event','Colorful'],       award:'SOTD', why:'Figma\'s annual conference site itself wins design awards every year' },
  { id:29, name:'Monokai Pro',         country:'🇦🇺',cat:'Developer Theme · Product Landing',url:'https://monokai.pro',             img:'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&q=90', design:9.8, usability:9.7, creativity:9.7, tags:['Dev','Dark'],             award:'SOTD', why:'A product page for a code theme that became a design reference in itself' },
  { id:30, name:'Stripe Checkout',     country:'🇺🇸',cat:'UX Pattern · Payment Flow',        url:'https://checkout.stripe.dev',     img:'https://images.unsplash.com/photo-1504354949085-aa9ac8c3d7c8?w=900&q=90', design:9.8, usability:9.9, creativity:9.6, tags:['UX','Payments'],         award:'HM',   why:'The most copied checkout UI — a masterclass in conversion-focused design' },
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
    sotd, sotm, sites: others,
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
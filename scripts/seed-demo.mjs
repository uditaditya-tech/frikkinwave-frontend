#!/usr/bin/env node
/**
 * Demo data seeder for frikkinwave.
 *
 * Populates every feature with multiple rows + relationships + CRUD-visible
 * states (pending / accepted / declined / completed, rosters, reveal-on-accept)
 * so a product demo shows the whole surface area.
 *
 * Idempotent: re-running logs in to existing users and skips records that
 * already exist (matched by name/title/relationship), so it won't duplicate.
 *
 * Usage:
 *   API_BASE=https://api.frikkinwave.com node scripts/seed-demo.mjs
 *   # defaults: API_BASE=https://api.frikkinwave.com, DEMO_PASSWORD=Frikkin!Demo2026
 *
 * All demo users share the email domain @demo.frikkinwave.com so they're easy to
 * identify and purge later (see TEARDOWN at the bottom of this file).
 */

const API_BASE = (process.env.API_BASE || "https://api.frikkinwave.com").replace(/\/$/, "");
const API = `${API_BASE}/api`;
const PASSWORD = process.env.DEMO_PASSWORD || "Frikkin!Demo2026";
const DOMAIN = "demo.frikkinwave.com";

// ---------------------------------------------------------------------------
// tiny HTTP helper
// ---------------------------------------------------------------------------
async function req(method, path, { token, body } = {}) {
  const url = path.startsWith("http") ? path : `${API}${path}`;
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { status: res.status, ok: res.ok, data };
}

async function paginate(path, { token } = {}) {
  const out = [];
  let next = path;
  while (next) {
    const { data } = await req("GET", next, { token });
    if (!data || !Array.isArray(data.results)) break;
    out.push(...data.results);
    next = data.next || null;
  }
  return out;
}

const log = (...a) => console.log(...a);
const warn = (...a) => console.warn("  !", ...a);

// ---------------------------------------------------------------------------
// auth — register or (if already there) log in
// ---------------------------------------------------------------------------
async function registerOrLogin(u) {
  const email = `${u.username}@${DOMAIN}`;
  const reg = await req("POST", "/auth/register/", {
    body: { email, username: u.username, password: PASSWORD, password_confirm: PASSWORD },
  });
  if (reg.ok && reg.data?.access) {
    log(`+ registered @${u.username}`);
    return reg.data.access;
  }
  // Already exists (or any 400) → try login.
  const login = await req("POST", "/auth/token/", { body: { email, password: PASSWORD } });
  if (login.ok && login.data?.access) {
    log(`= logged in @${u.username}`);
    return login.data.access;
  }
  warn(`could not register or log in @${u.username}:`, reg.data || login.data);
  return null;
}

// ---------------------------------------------------------------------------
// catalog lookup (instruments + genres) — match by keyword so we don't depend
// on exact seed slugs
// ---------------------------------------------------------------------------
let INSTRUMENTS = [];
let GENRES = [];

function pickByKeyword(list, keyword) {
  const k = keyword.toLowerCase();
  return list.find((x) => x.name.toLowerCase().includes(k)) || null;
}
function instrumentIds(keywords) {
  const ids = [];
  for (const kw of keywords) {
    const hit = pickByKeyword(INSTRUMENTS, kw);
    if (hit) ids.push(hit.id);
  }
  return ids;
}
function genreIds(keywords) {
  const ids = [];
  for (const kw of keywords) {
    const hit = pickByKeyword(GENRES, kw);
    if (hit && !ids.includes(hit.id)) ids.push(hit.id);
  }
  return ids;
}

// ===========================================================================
// DATA
// ===========================================================================
const USERS = [
  { username: "maya_keys", city: "Mumbai", country: "India", available: true,
    bio: "Session keys + synths. Quick in the studio, comfortable across jazz, soul and electronic.",
    instruments: [["keyboard", "advanced"], ["piano", "advanced"], ["synth", "intermediate"]],
    genres: ["jazz", "soul", "electronic"],
    sound_url: "https://soundcloud.com/forss/flickermood",
    session: { open: true, rate: "₹6000 per session" } },

  { username: "leo_drums", city: "Mumbai", country: "India", available: true,
    bio: "Drummer with a tight pocket. Gigging indie + funk around Mumbai. Up for jams.",
    instruments: [["drum", "advanced"]], genres: ["funk", "indie", "rock"] },

  { username: "ravi_bass", city: "Bangalore", country: "India", available: true,
    bio: "Bassist — fretless and electric. Love groove-heavy sessions and dep work.",
    instruments: [["bass", "advanced"]], genres: ["funk", "jazz", "blues"],
    session: { open: true, rate: "₹4500 per session" } },

  { username: "sara_vocals", city: "Delhi", country: "India", available: true,
    bio: "Vocalist + songwriter. Soul/pop range, harmonies for days. Fronting and forming projects.",
    instruments: [["vocal", "advanced"]], genres: ["soul", "pop"],
    sound_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },

  { username: "arjun_guitar", city: "Mumbai", country: "India", available: true,
    bio: "Guitarist + band leader. Indie rock with a shoegaze streak. Building a live set.",
    instruments: [["guitar", "advanced"]], genres: ["indie", "rock"] },

  { username: "nina_violin", city: "Pune", country: "India", available: true,
    bio: "Violinist crossing classical and fusion. Open to studio sessions and string arrangements.",
    instruments: [["violin", "advanced"]], genres: ["classical", "fusion"],
    session: { open: true, rate: "₹5000 per session" } },

  { username: "dev_synth", city: "Bangalore", country: "India", available: false,
    bio: "Producer / synthesist. Electronic and ambient textures. Mostly studio, occasional live.",
    instruments: [["synth", "advanced"], ["keyboard", "intermediate"]], genres: ["electronic"] },

  { username: "priya_sax", city: "Delhi", country: "India", available: true,
    bio: "Saxophone — alto & tenor. Jazz, soul, horn-section work. Available for hire.",
    instruments: [["saxophone", "advanced"], ["sax", "advanced"]], genres: ["jazz", "soul"],
    session: { open: true, rate: "₹5500 per session" } },

  { username: "kabir_guitar", city: "Mumbai", country: "India", available: true,
    bio: "Rhythm guitarist + venue runner. Books originals nights. Always meeting players.",
    instruments: [["guitar", "intermediate"]], genres: ["rock", "blues"] },

  { username: "tara_drums", city: "Bangalore", country: "India", available: true,
    bio: "Drummer into electronic-acoustic hybrids. Pads + kit. Looking for a band.",
    instruments: [["drum", "intermediate"]], genres: ["electronic", "pop"] },
];

// recipientUsername-keyed actions are resolved against live usernames at runtime
const CONNECTIONS = [
  { from: "arjun_guitar", to: "maya_keys", message: "Loved your playing — want to jam this weekend?", accept: true },
  { from: "leo_drums", to: "ravi_bass", message: "Rhythm section link-up?", accept: true },
  { from: "tara_drums", to: "dev_synth", message: "Into your ambient stuff, let's talk.", accept: false }, // stays pending
  { from: "sara_vocals", to: "priya_sax", message: "Need horns on a track — keen?", accept: true },
  { from: "nina_violin", to: "maya_keys", message: "Strings + keys session?", accept: false }, // pending
];

const LISTINGS = [
  { author: "arjun_guitar", listing_type: "gig", title: "Bassist for an indie rock gig",
    description: "Two-show run next month — originals plus a couple of covers. Tight rhythm section, fun crowd.",
    city: "Mumbai", country: "India", is_paid: true, pay_description: "₹3000 per show", deadline: "+30",
    applications: [
      { applicant: "ravi_bass", message: "Bassist here — solid pocket, free those dates.", resolve: "accept" },
      { applicant: "leo_drums", message: "Not bass but know a great player, happy to connect.", resolve: "pending" },
    ] },
  { author: "sara_vocals", listing_type: "audition", title: "Auditioning a lead guitarist",
    description: "Forming a soul-pop outfit. Looking for taste, tone and stage presence. Demos welcome.",
    city: "Delhi", country: "India", is_paid: false,
    applications: [
      { applicant: "arjun_guitar", message: "Would love to audition — sending a reel.", resolve: "pending" },
      { applicant: "kabir_guitar", message: "Rhythm guitarist, keen to try out.", resolve: "decline" },
    ] },
  { author: "dev_synth", listing_type: "gig", title: "Session drummer for an electronic EP",
    description: "Recording 3 tracks — hybrid kit + pads. Studio in Indiranagar. Paid per day.",
    city: "Bangalore", country: "India", is_paid: true, pay_description: "₹4000 per day", deadline: "+45",
    applications: [
      { applicant: "tara_drums", message: "This is exactly my thing — available.", resolve: "accept" },
    ] },
  { author: "priya_sax", listing_type: "venue", title: "Sunday jazz brunch — house band slots",
    description: "Weekly brunch residency wants rotating players. Standards + a few originals.",
    city: "Delhi", country: "India", is_paid: true, pay_description: "₹2500 per set" },
  { author: "kabir_guitar", listing_type: "gig", title: "Originals night — opener wanted",
    description: "Friday originals night needs an opening act. 30-minute set, house backline.",
    city: "Mumbai", country: "India", is_paid: false },
];

const BANDS = [
  { owner: "arjun_guitar", name: "The Midnight Set", city: "Mumbai", country: "India",
    bio: "Late-night indie/funk outfit. Originals, occasional covers, loud choruses.",
    invites: [
      { member: "maya_keys", role: "Keys", accept: true },
      { member: "leo_drums", role: "Drums", accept: true },
      { member: "ravi_bass", role: "Bass", accept: false }, // pending invite
    ] },
  { owner: "sara_vocals", name: "Velvet Echo", city: "Delhi", country: "India",
    bio: "Soul-pop with a horn section. Tight arrangements, big vocals.",
    invites: [
      { member: "priya_sax", role: "Saxophone", accept: true },
      { member: "nina_violin", role: "Strings", accept: false }, // pending
    ] },
  { owner: "dev_synth", name: "Null Pointer", city: "Bangalore", country: "India",
    bio: "Electronic duo exploring ambient-acoustic hybrids.",
    invites: [
      { member: "tara_drums", role: "Drums / pads", accept: true },
    ] },
];

const ENGAGEMENTS = [
  { from: "leo_drums", to: "maya_keys", message: "Need keys on a studio session Saturday.", date: "+14", rate: "₹6000", action: "accept" },
  { from: "arjun_guitar", to: "priya_sax", message: "Horn overdub for a single — quick session.", date: "+7", rate: "₹5500", action: "complete" },
  { from: "sara_vocals", to: "ravi_bass", message: "Bass for two tracks, dates flexible.", date: "+21", rate: "₹4500", action: "pending" },
  { from: "dev_synth", to: "nina_violin", message: "String layer for an ambient piece.", date: "+10", rate: "₹5000", action: "decline" },
  { from: "kabir_guitar", to: "maya_keys", message: "Keys for a live one-off, paid.", date: "+28", rate: "₹6000", action: "accept" },
];

const VENUES = [
  { owner: "dev_synth", name: "The Backline Room", city: "Mumbai", country: "India", capacity: 120,
    address: "14 Hill Rd, Bandra West", website: "https://example.com/backline",
    description: "Intimate 120-cap room with a house backline and a great PA. Books originals Thu–Sat." },
  { owner: "sara_vocals", name: "Echo Hall", city: "Delhi", country: "India", capacity: 300,
    address: "Connaught Place", website: "https://example.com/echohall",
    description: "Mid-size hall for ticketed shows. Full lighting + FOH engineer on staff." },
  { owner: "kabir_guitar", name: "Studio 9", city: "Bangalore", country: "India", capacity: 40,
    address: "Indiranagar 100ft Rd", website: "https://example.com/studio9",
    description: "Rehearsal + small-show space. Hourly rehearsals, intimate gigs on weekends." },
  { owner: "priya_sax", name: "The Brass Tap", city: "Delhi", country: "India", capacity: 80,
    address: "Hauz Khas Village", description: "Jazz-leaning bar with a corner stage. Brunches + late sets." },
];

// ---------------------------------------------------------------------------
function isoFromOffset(spec) {
  // "+30" => 30 days from today, YYYY-MM-DD
  const days = parseInt(String(spec).replace("+", ""), 10) || 0;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ===========================================================================
// RUN
// ===========================================================================
const tok = {}; // username -> access token

async function main() {
  log(`\n=== frikkinwave demo seed → ${API} ===\n`);

  // 1) users
  log("# Users");
  for (const u of USERS) {
    const access = await registerOrLogin(u);
    if (access) tok[u.username] = access;
  }

  // catalogs
  const ins = await req("GET", "/musicians/instruments/");
  const gen = await req("GET", "/musicians/genres/");
  INSTRUMENTS = Array.isArray(ins.data) ? ins.data : [];
  GENRES = Array.isArray(gen.data) ? gen.data : [];
  log(`\n# Catalog: ${INSTRUMENTS.length} instruments, ${GENRES.length} genres`);

  // 2) profiles
  log("\n# Profiles");
  for (const u of USERS) {
    if (!tok[u.username]) continue;
    const instruments = [];
    const usedIds = new Set();
    for (const [kw, prof] of u.instruments) {
      const hit = pickByKeyword(INSTRUMENTS, kw);
      if (hit && !usedIds.has(hit.id)) {
        usedIds.add(hit.id);
        instruments.push({ instrument: hit.id, proficiency: prof });
      }
    }
    const body = {
      bio: u.bio, city: u.city, country: u.country,
      is_available: u.available,
      sound_url: u.sound_url || "",
      is_open_to_session_work: !!u.session?.open,
      session_rate: u.session?.rate || "",
      instruments,
      genres: genreIds(u.genres),
    };
    const create = await req("POST", "/musicians/profile/", { token: tok[u.username], body });
    if (create.ok) log(`+ profile @${u.username}`);
    else if (create.status === 409) {
      const patch = await req("PATCH", "/musicians/profile/me/", { token: tok[u.username], body });
      log(patch.ok ? `= profile @${u.username} (updated)` : `! profile @${u.username}: ${JSON.stringify(patch.data)}`);
    } else warn(`profile @${u.username}:`, create.data);
  }

  // 3) connection requests
  log("\n# Connection requests");
  for (const c of CONNECTIONS) {
    if (!tok[c.from]) continue;
    const outgoing = await paginate("/connections/requests/?box=outgoing", { token: tok[c.from] });
    let request = outgoing.find((r) => r.recipient_username === c.to);
    if (!request) {
      const r = await req("POST", "/connections/requests/", {
        token: tok[c.from], body: { recipient_username: c.to, message: c.message },
      });
      if (r.ok) { request = r.data; log(`+ ${c.from} → ${c.to}`); }
      else { warn(`connection ${c.from}→${c.to}:`, r.data); continue; }
    } else log(`= ${c.from} → ${c.to} (exists)`);
    if (c.accept && request?.status === "pending" && tok[c.to]) {
      const incoming = await paginate("/connections/requests/?box=incoming", { token: tok[c.to] });
      const mine = incoming.find((r) => r.id === request.id || r.sender_username === c.from);
      if (mine && mine.status === "pending") {
        const a = await req("POST", `/connections/requests/${mine.id}/accept/`, { token: tok[c.to] });
        log(a.ok ? `  ✓ ${c.to} accepted` : `  ! accept failed: ${JSON.stringify(a.data)}`);
      }
    }
  }

  // 4) listings + applications
  log("\n# Listings + applications");
  const allListings = await paginate("/listings/");
  for (const L of LISTINGS) {
    if (!tok[L.author]) continue;
    let listing = allListings.find((x) => x.title === L.title && x.author_username === L.author);
    if (!listing) {
      const body = {
        listing_type: L.listing_type, title: L.title, description: L.description,
        city: L.city, country: L.country, is_paid: !!L.is_paid,
        pay_description: L.pay_description || "",
        deadline: L.deadline ? isoFromOffset(L.deadline) : null,
      };
      const r = await req("POST", "/listings/", { token: tok[L.author], body });
      if (r.ok) { listing = r.data; log(`+ listing "${L.title}"`); }
      else { warn(`listing "${L.title}":`, r.data); continue; }
    } else log(`= listing "${L.title}" (exists)`);

    for (const ap of L.applications || []) {
      if (!tok[ap.applicant]) continue;
      // skip if applicant already applied
      const myOut = await paginate("/listings/applications/?box=outgoing", { token: tok[ap.applicant] });
      let app = myOut.find((a) => a.listing_id === listing.id);
      if (!app) {
        const r = await req("POST", `/listings/${listing.id}/apply/`, {
          token: tok[ap.applicant], body: { message: ap.message || "" },
        });
        if (r.ok) { app = r.data; log(`  + ${ap.applicant} applied`); }
        else { warn(`  apply ${ap.applicant}:`, r.data); continue; }
      } else log(`  = ${ap.applicant} applied (exists)`);

      if (ap.resolve && ap.resolve !== "pending" && app.status === "pending") {
        const inbox = await paginate("/listings/applications/?box=incoming", { token: tok[L.author] });
        const target = inbox.find((a) => a.id === app.id);
        if (target && target.status === "pending") {
          const r = await req("POST", `/listings/applications/${target.id}/${ap.resolve}/`, { token: tok[L.author] });
          log(r.ok ? `    ✓ author ${ap.resolve}ed ${ap.applicant}` : `    ! ${JSON.stringify(r.data)}`);
        }
      }
    }
  }

  // 5) bands + invites
  log("\n# Bands + invites");
  const allBands = await paginate("/bands/");
  for (const B of BANDS) {
    if (!tok[B.owner]) continue;
    let band = allBands.find((x) => x.name === B.name && x.owner_username === B.owner);
    if (!band) {
      const r = await req("POST", "/bands/", {
        token: tok[B.owner], body: { name: B.name, bio: B.bio, city: B.city, country: B.country },
      });
      if (r.ok) { band = r.data; log(`+ band "${B.name}" (${band.slug})`); }
      else { warn(`band "${B.name}":`, r.data); continue; }
    } else log(`= band "${B.name}" (exists)`);

    for (const inv of B.invites || []) {
      if (!tok[inv.member]) continue;
      const mine = await paginate("/bands/memberships/", { token: tok[inv.member] });
      let m = mine.find((x) => x.band_slug === band.slug);
      if (!m) {
        const r = await req("POST", `/bands/${band.slug}/invite/`, {
          token: tok[B.owner], body: { member_username: inv.member, role: inv.role || "" },
        });
        if (r.ok) { log(`  + invited ${inv.member} (${inv.role})`); }
        else { warn(`  invite ${inv.member}:`, r.data); continue; }
        const refreshed = await paginate("/bands/memberships/", { token: tok[inv.member] });
        m = refreshed.find((x) => x.band_slug === band.slug);
      } else log(`  = ${inv.member} invited (exists)`);

      if (inv.accept && m && m.status === "pending") {
        const r = await req("POST", `/bands/memberships/${m.id}/accept/`, { token: tok[inv.member] });
        log(r.ok ? `    ✓ ${inv.member} joined` : `    ! ${JSON.stringify(r.data)}`);
      }
    }
  }

  // 6) engagements
  log("\n# Engagements (session hires)");
  for (const E of ENGAGEMENTS) {
    if (!tok[E.from]) continue;
    const out = await paginate("/engagements/?box=outgoing", { token: tok[E.from] });
    let eng = out.find((x) => x.musician_username === E.to && x.rate_offer === E.rate && x.message === E.message);
    if (!eng) {
      const r = await req("POST", "/engagements/", {
        token: tok[E.from],
        body: { musician_username: E.to, message: E.message, proposed_date: isoFromOffset(E.date), rate_offer: E.rate },
      });
      if (r.ok) { eng = r.data; log(`+ ${E.from} → hire ${E.to}`); }
      else { warn(`engagement ${E.from}→${E.to}:`, r.data); continue; }
    } else log(`= ${E.from} → hire ${E.to} (exists)`);

    if (E.action === "pending") continue;
    // musician accepts/declines from their incoming box
    if (E.action === "accept" || E.action === "decline" || E.action === "complete") {
      if (eng.status === "pending" && tok[E.to]) {
        const verb = E.action === "decline" ? "decline" : "accept";
        const inbox = await paginate("/engagements/?box=incoming", { token: tok[E.to] });
        const t = inbox.find((x) => x.id === eng.id);
        if (t && t.status === "pending") {
          const r = await req("POST", `/engagements/${t.id}/${verb}/`, { token: tok[E.to] });
          log(r.ok ? `  ✓ ${E.to} ${verb}ed` : `  ! ${JSON.stringify(r.data)}`);
          if (r.ok) eng = r.data;
        }
      }
      if (E.action === "complete" && eng.status === "accepted") {
        const r = await req("POST", `/engagements/${eng.id}/complete/`, { token: tok[E.from] });
        log(r.ok ? `  ✓ marked complete` : `  ! ${JSON.stringify(r.data)}`);
      }
    }
  }

  // 7) venues
  log("\n# Venues");
  const allVenues = await paginate("/venues/");
  for (const V of VENUES) {
    if (!tok[V.owner]) continue;
    const exists = allVenues.find((x) => x.name === V.name && x.owner_username === V.owner);
    if (exists) { log(`= venue "${V.name}" (exists)`); continue; }
    const r = await req("POST", "/venues/", {
      token: tok[V.owner],
      body: {
        name: V.name, description: V.description || "", address: V.address || "",
        city: V.city, country: V.country, capacity: V.capacity ?? null, website: V.website || "",
      },
    });
    log(r.ok ? `+ venue "${V.name}"` : `! venue "${V.name}": ${JSON.stringify(r.data)}`);
  }

  // summary (public counts)
  log("\n=== Summary (public endpoints) ===");
  const counts = await Promise.all([
    paginate("/musicians/profiles/"), paginate("/listings/"),
    paginate("/bands/"), paginate("/venues/"),
  ]);
  log(`profiles: ${counts[0].length} · listings: ${counts[1].length} · bands: ${counts[2].length} · venues: ${counts[3].length}`);
  log(`\nDemo users: <username>@${DOMAIN}  ·  password: ${PASSWORD}`);
  log("Log in as e.g. arjun_guitar (band owner, listing author) or maya_keys (session player) to demo owner/applicant views.\n");
}

main().catch((e) => {
  console.error("seed failed:", e);
  process.exit(1);
});

/*
TEARDOWN (run in the BACKEND repo, Django shell — removes every demo record via
FK cascade; there is no public API to delete users):

  python manage.py shell -c "from apps.users.models import User; \
    n,_ = User.objects.filter(email__endswith='@demo.frikkinwave.com').delete(); print('deleted', n)"
*/

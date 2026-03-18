import { useState, useMemo } from "react";

const STORAGE_KEY = "scholarship_tracker_v1";
function loadFromStorage() {
  try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : {}; } catch { return {}; }
}
function saveToStorage(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

const DOC_CATEGORIES = {
  "Academic":       ["Transcripts", "Diploma", "Certificates", "Study Plan", "Research Plan", "Research Proposal", "Thesis", "Dissertation"],
  "Identity":       ["Passport", "Birth Certificate", "Photos", "Photo", "ID"],
  "Motivation":     ["Motivation Letter", "Statement of Purpose", "Personal Statement", "CV", "Résumé", "Resume"],
  "References":     ["Recommendation Letter", "Recommendation"],
  "Health & Legal": ["Medical", "HIV", "Police Clearance", "Non-Criminal", "Hepatitis"],
  "Official Forms": ["Application Form", "Nomination Form", "NOC", "Proficiency", "IELTS", "TOEFL", "Admission Letter"],
};
function getDocCategory(doc) {
  const d = doc.toLowerCase();
  for (const [cat, keys] of Object.entries(DOC_CATEGORIES)) {
    if (keys.some(k => d.includes(k.toLowerCase()))) return cat;
  }
  return "Other";
}
function calcRadarData(docs, completedDocs) {
  return Object.keys(DOC_CATEGORIES).map(cat => {
    const catDocs = docs.filter(d => getDocCategory(d) === cat);
    if (!catDocs.length) return { cat, score: 100, total: 0, done: 0 };
    const done = catDocs.filter(d => completedDocs.includes(d)).length;
    return { cat, score: Math.round((done / catDocs.length) * 100), total: catDocs.length, done };
  });
}

function RadarChart({ docs, completedDocs, size = 160 }) {
  const data = calcRadarData(docs, completedDocs).filter(d => d.total > 0);
  if (!data.length) return null;
  const cx = size / 2, cy = size / 2, r = size * 0.36, n = data.length;
  const angle = i => (i * 2 * Math.PI) / n - Math.PI / 2;
  const pt = (i, radius) => ({ x: cx + radius * Math.cos(angle(i)), y: cy + radius * Math.sin(angle(i)) });
  const toPath = pts => pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";
  const scorePts = data.map((d, i) => pt(i, (d.score / 100) * r));
  const overall = data.length ? Math.round(data.reduce((s, d) => s + d.score, 0) / data.length) : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={size} height={size} style={{ overflow: "visible" }}>
        {[0.25, 0.5, 0.75, 1].map(lv => <polygon key={lv} points={data.map((_, i) => { const p = pt(i, r * lv); return `${p.x},${p.y}`; }).join(" ")} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />)}
        {data.map((_, i) => { const o = pt(i, r); return <line key={i} x1={cx} y1={cy} x2={o.x} y2={o.y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />; })}
        <path d={toPath(scorePts)} fill="rgba(59,130,246,0.2)" stroke="#3b82f6" strokeWidth="1.5" />
        {scorePts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={data[i].score === 100 ? "#00d278" : "#3b82f6"} />)}
        {data.map((d, i) => { const p = pt(i, r + 18); return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill={d.score === 100 ? "#00d278" : d.score === 0 ? "#f87171" : "#94a3b8"} fontSize="7.5" fontFamily="Outfit,sans-serif" fontWeight="600">{d.cat.split(" ")[0]}</text>; })}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#f1f5f9" fontSize="16" fontWeight="800" fontFamily="Syne,sans-serif">{overall}%</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#475569" fontSize="7" fontFamily="Outfit,sans-serif" letterSpacing="0.05em">READY</text>
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", justifyContent: "center", maxWidth: size + 40 }}>
        {data.map(d => (
          <div key={d.cat} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: d.score === 100 ? "#00d278" : d.score === 0 ? "#f87171" : "#3b82f6", flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: "#64748b" }}>{d.cat} {d.done}/{d.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadinessScore({ docs, completedDocs }) {
  const pct = docs.length ? Math.min(100, Math.round((completedDocs.length / docs.length) * 100)) : 0;
  const color = pct === 100 ? "#00d278" : pct >= 60 ? "#fbbf24" : pct >= 30 ? "#60a5fa" : "#f87171";
  const label = pct === 100 ? "Ready to Apply!" : pct >= 60 ? "Almost There" : pct >= 30 ? "In Progress" : "Just Started";
  const missing = docs.filter(d => !completedDocs.includes(d));
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 16, marginBottom: 18 }}>
      <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.08em", marginBottom: 12 }}>APPLICATION READINESS</div>
      <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <RadarChart docs={docs} completedDocs={completedDocs} size={170} />
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>{pct}%</div>
          <div style={{ fontSize: 12, color, marginTop: 4, fontWeight: 600 }}>{label}</div>
          <div style={{ marginTop: 12, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.4s ease" }} />
          </div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 8 }}>{completedDocs.length} of {docs.length} documents ready</div>
          {missing.length > 0 && <div style={{ marginTop: 10, fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>Missing: {missing.slice(0, 2).join(", ")}{missing.length > 2 ? ` +${missing.length - 2} more` : ""}</div>}
        </div>
      </div>
    </div>
  );
}

function TimelineView({ scholarships, trackingData, onOpen }) {
  const sorted = [...scholarships].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  const now = new Date(), first = new Date(sorted[0]?.deadline), last = new Date(sorted[sorted.length - 1]?.deadline);
  const totalMs = Math.max(last - first, 1);
  const getPos = d => Math.max(0, Math.min(100, ((new Date(d) - first) / totalMs) * 100));
  const todayPos = Math.max(0, Math.min(100, ((now - first) / totalMs) * 100));
  const urgentCount = scholarships.filter(s => { const d = getDaysLeft(s.deadline); return d > 0 && d <= 7; }).length;
  return (
    <div>
      {urgentCount > 0 && (
        <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div><div style={{ fontSize: 13, fontWeight: 700, color: "#f87171" }}>{urgentCount} scholarship{urgentCount > 1 ? "s" : ""} closing within 7 days</div><div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Act immediately</div></div>
        </div>
      )}
      <div style={{ marginBottom: 28, padding: "0 8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 10, color: "#475569" }}>{first.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
          <span style={{ fontSize: 10, color: "#475569" }}>{last.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
        </div>
        <div style={{ position: "relative", height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 4, marginBottom: 24 }}>
          {todayPos >= 0 && todayPos <= 100 && (
            <div style={{ position: "absolute", left: `${todayPos}%`, top: -6, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10 }}>
              <div style={{ width: 2, height: 16, background: "#00d278", boxShadow: "0 0 8px #00d278" }} />
              <span style={{ fontSize: 9, color: "#00d278", whiteSpace: "nowrap", marginTop: 2, fontWeight: 700 }}>TODAY</span>
            </div>
          )}
          {sorted.map(s => {
            const days = getDaysLeft(s.deadline), isPast = days < 0, isUrgent = days >= 0 && days <= 7, isSoon = days >= 0 && days <= 45;
            const dotColor = isPast ? "#334155" : isUrgent ? "#f87171" : isSoon ? "#fbbf24" : "#3b82f6";
            const isTracked = trackingData[s.id]?.status && trackingData[s.id].status !== "none";
            return (
              <div key={s.id} onClick={() => onOpen(s)} title={`${s.name} — ${days >= 0 ? `${days} days left` : "Passed"}`}
                style={{ position: "absolute", left: `${getPos(s.deadline)}%`, top: "50%", transform: "translate(-50%,-50%)", width: isUrgent ? 12 : 8, height: isUrgent ? 12 : 8, borderRadius: "50%", background: dotColor, cursor: "pointer", border: isTracked ? "2px solid #00d278" : "none", boxShadow: isUrgent ? `0 0 10px ${dotColor}` : "none", transition: "transform 0.15s", zIndex: 5 }}
                onMouseEnter={e => e.currentTarget.style.transform = "translate(-50%,-50%) scale(1.6)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translate(-50%,-50%) scale(1)"}
              />
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map(s => {
          const days = getDaysLeft(s.deadline), isPast = days < 0, isUrgent = days >= 0 && days <= 7, isSoon = days >= 0 && days <= 45;
          const barColor = isPast ? "#334155" : isUrgent ? "#f87171" : isSoon ? "#fbbf24" : "#3b82f6";
          const t = trackingData[s.id], isTracked = t?.status && t.status !== "none", status = STATUS_CONFIG[t?.status || "none"];
          return (
            <div key={s.id} onClick={() => onOpen(s)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, cursor: "pointer", transition: "background 0.15s", opacity: isPast ? 0.4 : 1 }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.055)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{s.flag}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", fontFamily: "'Syne',sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                  <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, maxWidth: 200 }}>
                    <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, getPos(s.deadline)))}%`, background: barColor, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 11, color: barColor, whiteSpace: "nowrap", fontWeight: 600 }}>{isPast ? "Passed" : isUrgent ? `🔥 ${days}d` : `${days}d left`}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: "#475569" }}>{new Date(s.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                {isTracked && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: status.bg, color: status.color }}>{status.label}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const SCHOLARSHIPS = [
  { id: 1, intensity: "Medium", opens: "2026-01-10", name: "Türkiye Bursları", country: "Turkey", flag: "🇹🇷", region: "Europe", levels: ["Bachelor's", "Master's", "PhD"], ielts: false, funded: true, amount: "Full tuition + accommodation + health insurance + monthly stipend", deadline: "2026-02-20", fields: ["All Fields"], description: "One of the most generous scholarships globally. Covers tuition, accommodation, health insurance, and monthly stipend. Open to all nationalities. Includes a free Turkish language course.", link: "https://turkiyeburslari.gov.tr", difficulty: "Competitive", docs: ["Valid Passport / ID Copy", "Recent Passport-Sized Photo", "Academic Transcripts", "Diplomas / Graduation Certificates", "Statement of Purpose", "Recommendation Letter x2"] },
  { id: 2, intensity: "Medium", opens: "2025-11-14", name: "Stipendium Hungaricum", country: "Hungary", flag: "🇭🇺", region: "Europe", levels: ["Bachelor's", "Master's", "PhD"], ielts: false, funded: true, amount: "Full tuition + monthly allowance + accommodation", deadline: "2026-01-15", fields: ["All Fields"], description: "Hungary's flagship scholarship. No separate IELTS required — proof of language proficiency accepted. Apply through your home country's Tempus Public Foundation office. Documents must be in English or Hungarian.", link: "https://stipendiumhungaricum.hu", difficulty: "Moderate", docs: ["Completed Online Application Form", "Motivation Letter", "Proof of Language Proficiency", "Academic Transcripts", "Graduation Certificates", "Medical Certificate", "Passport Copy"] },
  { id: 3, intensity: "High", opens: "2025-12-15", name: "Chinese Government Scholarship (CSC)", country: "China", flag: "🇨🇳", region: "Asia", levels: ["Bachelor's", "Master's", "PhD"], ielts: false, funded: true, amount: "Full tuition + free accommodation + monthly stipend (2,500–3,500 CNY)", deadline: "2026-04-30", fields: ["All Fields"], description: "China's largest scholarship with thousands of seats. Deadlines range Dec 2025–April 2026 depending on track. Apply via the CSC online system or your nearest Chinese embassy. Early application strongly recommended.", link: "https://www.campuschina.org", difficulty: "Moderate", docs: ["Notarized Highest Diploma", "Academic Transcripts", "Detailed Study Plan (800+ words for postgrad)", "Recommendation Letter x2 (postgrad)", "Foreigner Physical Examination Form", "Non-Criminal Record Report", "Valid Passport Copy", "English / Chinese Proficiency Proof", "Pre-Admission Letter (if applicable)"] },
  { id: 4, intensity: "Low", opens: "2026-02-16", name: "Romanian Government Scholarship", country: "Romania", flag: "🇷🇴", region: "Europe", levels: ["Bachelor's", "Master's", "PhD"], ielts: false, funded: true, amount: "Full tuition + accommodation + monthly stipend (65 EUR)", deadline: "2026-03-31", fields: ["All Fields"], description: "Fully funded in Eastern Europe. No IELTS or TOEFL required. All documents must be authorized translations in Romanian, English, French, or Spanish. Submit via the Study in Romania portal.", link: "https://scholarships.studyinromania.gov.ro", difficulty: "Moderate", docs: ["Academic Transcripts", "Diplomas / Baccalaureate Certificate", "Birth Certificate", "Passport (first 3 pages)", "CV"] },
  { id: 5, intensity: "High", opens: "2025-10-15", name: "Russian Government Scholarship", country: "Russia", flag: "🇷🇺", region: "Europe", levels: ["Bachelor's", "Master's", "PhD"], ielts: false, funded: true, amount: "Full tuition + dormitory + monthly stipend", deadline: "2026-01-15", fields: ["Engineering", "Medicine", "Sciences", "Arts"], description: "Large annual quota for developing countries. Register on the official Education in Russia portal. All documents must be notarized and translated into Russian. Apply early — January 15 deadline.", link: "https://education-in-russia.com", difficulty: "Low-Moderate", docs: ["Valid Passport (18+ months validity beyond arrival)", "Academic Certificates / Transcripts (HSSC / Bachelor's)", "Medical Health Certificate", "HIV-Negative Certificate", "Completed Application Form", "Notarized Russian-Translated Document Portfolio"] },
  { id: 20, intensity: "High", opens: "2026-02-01", name: "Australia Awards Scholarship", country: "Australia", flag: "🇦🇺", region: "Oceania", levels: ["Bachelor's", "Master's", "PhD"], ielts: true, funded: true, amount: "Full tuition + living allowance + airfare + health insurance + establishment allowance", deadline: "2026-04-30", fields: ["All Fields"], description: "One of the most prestigious fully funded scholarships globally. Primarily focused on developing countries in the Indo-Pacific region. Requires strong academic record, 5+ years work experience, IELTS 6.5+, and a focus on development impact in your home country.", link: "https://www.dfat.gov.au/people-to-people/australia-awards/australia-awards-scholarships", difficulty: "Very Competitive", docs: ["Certified Academic Transcripts", "Degree Certificates", "CV / Resume", "English Proficiency Proof (IELTS 6.5+ / TOEFL / PTE)", "Passport / Identity Proof", "Completed Referee Reports x2", "NOC from Employer (public sector applicants)", "Completed Online Application Form"] },
  { id: 21, intensity: "High", opens: "2026-01-01", name: "Fulbright Foreign Student Program", country: "USA", flag: "🇺🇸", region: "North America", levels: ["Master's", "PhD"], ielts: true, funded: true, amount: "Full tuition + monthly stipend + airfare + health insurance", deadline: "2026-04-01", fields: ["All Fields"], description: "The world's most prestigious exchange scholarship. 2027-2028 academic year applications open January 2026 with major deadlines April 1, 2026. Highly competitive — requires strong academic background, leadership potential, and clear research objectives.", link: "https://foreign.fulbrightonline.org", difficulty: "Very Competitive", docs: ["Completed Online Application Form", "CV / Resume", "Personal Statement", "Study / Research Objectives Essay", "Recommendation Letter x3", "Academic Transcripts / Diplomas (with English translations)", "TOEFL / IELTS Score", "GRE Score (program dependent)", "Passport Copy"] },
  { id: 22, intensity: "High", opens: "2025-10-01", name: "DAAD Scholarship", country: "Germany", flag: "🇩🇪", region: "Europe", levels: ["Bachelor's", "Master's", "PhD"], ielts: true, funded: true, amount: "Full tuition + monthly stipend (€934 for graduates) + health insurance + travel allowance + rent subsidy", deadline: "2026-03-01", fields: ["All Fields"], description: "Germany's largest scholarship organization offering hundreds of programs. Deadlines vary significantly by program — check the official DAAD portal for your specific course. German or English language programs available.", link: "https://www.daad.de/en/studying-in-germany/requirements/application-process", difficulty: "Very Competitive", docs: ["Completed DAAD Application Form", "Signed Europass CV", "Motivation Letter (1–3 pages)", "Academic Transcripts / Degrees", "Language Proficiency Proof (IELTS / TOEFL or German)", "Recommendation Letter (professional)", "Employment Proof", "Signed DAAD Checklist"] },
  { id: 23, intensity: "High", opens: "2026-01-29", name: "Government of Ireland Scholarship (GOI-IES)", country: "Ireland", flag: "🇮🇪", region: "Europe", levels: ["Master's", "PhD"], ielts: true, funded: true, amount: "Full fee waiver + €10,000 stipend for one academic year", deadline: "2026-03-12", fields: ["All Fields"], description: "Ireland's flagship international scholarship for one academic year of postgraduate study. Requires a valid Irish university offer letter before applying. Competitive but accessible for strong applicants with a confirmed university place.", link: "https://hea.ie/policy/internationalisation/goi-ies", difficulty: "Very Competitive", docs: ["Valid Irish University Offer Letter", "Recommendation Letter x2 (academic)", "Personal Statement (500 words)", "Academic Transcripts", "CV", "IELTS / TOEFL Proof (6.5+)"] },
  { id: 24, intensity: "High", opens: "2026-03-01", name: "Manaaki New Zealand Scholarships", country: "New Zealand", flag: "🇳🇿", region: "Oceania", levels: ["Master's", "PhD"], ielts: true, funded: true, amount: "Full tuition + living allowance + return airfare + health insurance", deadline: "2026-03-31", fields: ["All Fields"], description: "New Zealand government scholarship for students from eligible developing countries. Focused on development impact. Requires work experience evidence alongside strong academic background. Applications open March 1 and close March 31, 2026.", link: "https://www.nzscholarships.govt.nz", difficulty: "Competitive", docs: ["Valid International Passport", "Certified Academic Certificates / Diplomas / Transcripts", "CV", "IELTS / TOEFL Certificate", "Evidence of Work Experience (paid, unpaid, or voluntary)", "Birth Certificate or equivalent ID"] },
  { id: 19, intensity: "Low", opens: "2026-09-01", name: "Open Doors Russian Scholarship", country: "Russia", flag: "🇷🇺", region: "Europe", levels: ["Bachelor's", "Master's", "PhD"], ielts: false, funded: true, amount: "Full tuition + dormitory + monthly stipend", deadline: "2026-11-16", fields: ["Engineering", "Medicine", "Sciences", "Arts", "Humanities"], description: "Russia's Open Doors international scholarship. Next cycle opens September 1, 2026 — deadline November 16, 2026. All documents uploaded online in English or Russian. Supporting documents like certificates and awards are highly recommended.", link: "https://od.globaluni.ru", difficulty: "Low-Moderate", docs: ["Completed Online Application", "Valid Passport / ID Copy", "Academic Transcripts", "Degree Certificates", "Motivation Letter", "CV", "Supporting Certificates / Awards (recommended)"] },
  { id: 6, intensity: "Medium", opens: "2026-02-16", name: "Azerbaijan Government Scholarship", country: "Azerbaijan", flag: "🇦🇿", region: "Asia", levels: ["Bachelor's", "Master's", "PhD"], ielts: false, funded: true, amount: "Tuition + accommodation + monthly stipend", deadline: "2026-04-15", fields: ["All Fields"], description: "Full funding in Azerbaijan. Minimum 70% GPA required. Documents in English, Russian, or Turkish. No IELTS needed if your previous education was in English — submit an MOI certificate instead.", link: "https://studyinazerbaijan.edu.az", difficulty: "Low-Moderate", docs: ["Completed Nomination Form", "Certified Academic Diplomas / Transcripts (min 70% GPA)", "Valid Passport Copy", "Medical Certificate (incl. HIV, Hepatitis B/C)", "CV / Résumé", "Motivation Letter", "MOI Certificate (if prev. education in English) OR IELTS / TOEFL"] },
  { id: 7, intensity: "High", opens: "2026-03-04", name: "Malaysian International Scholarship (MIS)", country: "Malaysia", flag: "🇲🇾", region: "Asia", levels: ["Master's", "PhD"], ielts: false, funded: true, amount: "Full tuition + monthly allowance (RM 1,500–2,000) + return airfare", deadline: "2026-04-03", fields: ["STEM", "Economics", "Social Sciences"], description: "Malaysia's flagship postgraduate scholarship. Application period: 4 March – 3 April 2026. No IELTS needed if your previous degree was taught in English — submit MOI certificate. Apply via KPT MIS Online Application System.", link: "https://biasiswa.mohe.gov.my/INTER/index.php", difficulty: "Moderate", docs: ["Certified Passport Copy (6+ months validity)", "Academic Transcripts", "MOI Certificate (if prev. degree in English) OR IELTS / TOEFL", "Recommendation Letter x2", "CV", "Research Proposal (for research-based programs)", "Admission Letter from Malaysian University"] },
  { id: 8, intensity: "High", opens: "2026-02-02", name: "Indonesian KNB Scholarship", country: "Indonesia", flag: "🇮🇩", region: "Asia", levels: ["Bachelor's", "Master's", "PhD"], ielts: false, funded: true, amount: "Full tuition + monthly living allowance", deadline: "2026-03-31", fields: ["All Fields"], description: "Indonesian government scholarship. No IELTS needed if previous education was in English — submit MOI certificate. Unique requirement: record a 5-minute motivation video in English or Bahasa Indonesia, upload to YouTube, and submit the link.", link: "https://knb.kemdiktisaintek.go.id", difficulty: "Low-Moderate", docs: ["Recommendation Letter from Indonesian Embassy", "Valid Passport Copy (or Birth Certificate)", "Academic Certificates / Transcripts (in English)", "MOI Certificate (if prev. education in English) OR TOEFL / IELTS", "CV", "Medical Report", "5-Minute Motivation Video (uploaded to YouTube — link required)", "Recommendation from Employer / Supervisor", "Statement of Purpose (PhD)", "Potential Supervisor's Letter (PhD)"] },
  { id: 9, intensity: "High", opens: "2026-02-01", name: "Korean Government Scholarship (KGSP)", country: "South Korea", flag: "🇰🇷", region: "Asia", levels: ["Bachelor's", "Master's", "PhD"], ielts: false, funded: true, amount: "Full tuition + monthly stipend (900,000 KRW) + Korean language training + airfare", deadline: "2026-03-31", fields: ["All Fields"], description: "NIIED's flagship program. Undergraduate track: check embassy for next cycle (previous: Sep 15–30). Graduate track: approx. February–March 2026. Includes free 1-year Korean language course. Transcripts and graduation certificates must be apostilled or confirmed by your local consulate.", link: "https://www.studyinkorea.go.kr", difficulty: "Competitive", docs: ["Completed GKS Application Form", "Personal Statement", "Study Plan", "Research Proposal (graduate)", "Recommendation Letter x2", "Personal Medical Assessment Form", "Proof of Citizenship (applicant + parents)", "Apostilled Academic Transcripts", "Apostilled Graduation Certificates"] },
  { id: 10, intensity: "Medium", opens: "2026-04-01", name: "Japanese MEXT Scholarship", country: "Japan", flag: "🇯🇵", region: "Asia", levels: ["Bachelor's", "Master's", "PhD"], ielts: false, funded: true, amount: "Full tuition + monthly stipend (117,000–145,000 JPY) + airfare", deadline: "2026-06-30", fields: ["All Fields"], description: "Japan's Ministry of Education flagship scholarship. Opening dates vary by country — contact your nearest Japanese Embassy for exact 2026 dates. Typically opens April and closes May–June. University recommendation track has separate deadlines.", link: "https://www.studyinjapan.go.jp/en/smap_stopj-applications_research.html", difficulty: "Very Competitive", docs: ["Completed MEXT Application Form", "Research Plan / Study Plan", "Academic Transcripts", "Graduation Certificates", "Recommendation Letter x2", "Medical Certificate", "Passport Copy"] },
  { id: 11, intensity: "Medium", opens: "2026-01-01", name: "Saudi Arabia Scholarship (MoHE)", country: "Saudi Arabia", flag: "🇸🇦", region: "Middle East", levels: ["Bachelor's", "Master's", "PhD"], ielts: false, funded: true, amount: "Full tuition + accommodation + monthly stipend + medical insurance + airfare", deadline: "2026-10-31", fields: ["All Fields"], description: "Study at Saudi Arabia's top universities. Bachelor's deadline: approx. June 14, 2026. Master's & PhD deadline: approx. October 31, 2026. Apply via the Saudi Cultural Bureau. All academic docs translated to Arabic.", link: "https://studyinsaudi.moe.gov.sa", difficulty: "Moderate", docs: ["Valid Passport Copy", "Academic Transcripts / Certificates (translated to Arabic)", "Recent Medical Report (under 6 months)", "Police Character Certificate", "CV", "Recommendation Letter x2", "NOC from Government (if applicable)"] },
  { id: 12, intensity: "Medium", opens: "2026-03-01", name: "Qatar University Scholarship", country: "Qatar", flag: "🇶🇦", region: "Middle East", levels: ["Master's", "PhD"], ielts: false, funded: true, amount: "Full tuition + accommodation + textbooks + round-trip airfare", deadline: "2026-02-25", fields: ["Engineering", "Business", "Sciences", "Humanities"], description: "Qatar University fully funded scholarship for Fall 2026. Undergraduate scholarships: opens March 1, closes March 25, 2026. Graduate programs (Master's/PhD): already active, closes February 25, 2026. Apply via QU portal.", link: "https://www.qu.edu.qa/en-us/students/admission/scholarships", difficulty: "Moderate", docs: ["Final Official Academic Transcripts", "Completed QU Application Form", "Valid Passport Copy", "Passport-Sized Photos", "Recommendation Letters", "CV", "English Proficiency Proof (program-dependent)"] },
  { id: 13, intensity: "Low", opens: "2025-12-15", name: "Brunei Darussalam Government Scholarship (BDGS)", country: "Brunei", flag: "🇧🇳", region: "Asia", levels: ["Bachelor's", "Master's", "PhD"], ielts: false, funded: true, amount: "Full tuition + accommodation + monthly allowance + return airfare + medical", deadline: "2026-02-15", fields: ["All Fields"], description: "Brunei's flagship government scholarship. English-medium country, no IELTS, very low competition. Deadline: February 15, 2026. Apply via Ministry of Foreign Affairs Brunei online portal.", link: "https://www.mfa.gov.bn/pages/scholarship.aspx", difficulty: "Low", docs: ["Completed Online Application Form", "Certified Academic Transcripts / Certificates", "Birth Certificate", "Passport Copy", "Passport-Sized Photos"] },
  { id: 14, intensity: "Medium", opens: "2025-12-01", name: "Taiwan ICDF Scholarship", country: "Taiwan", flag: "🇹🇼", region: "Asia", levels: ["Master's", "PhD"], ielts: false, funded: true, amount: "Full tuition + accommodation + monthly stipend (NT$18,000–20,000) + airfare + insurance", deadline: "2026-03-15", fields: ["Agriculture", "Public Health", "Engineering", "Business"], description: "Taiwan's official development scholarship. ~25% acceptance rate. Must possess a bachelor's degree and meet university admission requirements. No IELTS required. Apply via Taiwan ICDF portal.", link: "https://www.icdf.org.tw/wSite/np?ctNode=31561&mp=2", difficulty: "Moderate", docs: ["Bachelor's Degree Certificate", "Academic Transcripts", "Study Plan", "Passport Copy", "Recommendation Letter x2", "Medical Certificate"] },
  { id: 15, intensity: "Medium", opens: "2026-02-01", name: "Belarus Government Scholarship", country: "Belarus", flag: "🇧🇾", region: "Europe", levels: ["Bachelor's", "Master's", "PhD"], ielts: false, funded: true, amount: "Full tuition + dormitory", deadline: "2026-08-01", fields: ["Engineering", "Medicine", "Sciences"], description: "Full tuition waiver in Belarus. Applications typically open early summer for September intake. Begin process by June 2026. All documents must be translated into Russian or Belarusian. Apply via Belarusian embassy.", link: "https://studyinby.com", difficulty: "Low", docs: ["Completed Application Form", "Legalized / Notarized Academic Transcripts", "Birth Certificate", "Medical Certificate (incl. HIV/AIDS test)", "Valid Passport (18+ months validity)", "Passport-Sized Photos", "Motivation Letter"] },
  { id: 16, intensity: "Low", opens: "2026-02-01", name: "Serbia 'World in Serbia' Scholarship", country: "Serbia", flag: "🇷🇸", region: "Europe", levels: ["Bachelor's", "Master's", "PhD"], ielts: false, funded: true, amount: "Free tuition + accommodation + meals + monthly stipend (18,000 RSD) + health insurance", deadline: "2026-05-25", fields: ["All Fields"], description: "Serbia's government scholarship open to Non-Aligned Movement countries. Includes Serbian language prep course. Submit documents to your nearest Serbian diplomatic mission.", link: "https://welcometoserbia.gov.rs/scholarships", difficulty: "Low", docs: ["Completed Application Form", "CV", "Passport Copy", "Academic Transcripts / Diplomas", "Proof of Serbian or English Proficiency", "Medical Certificate (not older than 6 months)"] },
  { id: 17, intensity: "High", opens: "2026-05-01", name: "Morocco Government Scholarship (AMCI)", country: "Morocco", flag: "🇲🇦", region: "Africa", levels: ["Bachelor's", "Master's", "PhD"], ielts: false, funded: true, amount: "Tuition + accommodation + monthly stipend", deadline: "2026-07-05", fields: ["Engineering", "Medicine", "Agriculture"], description: "Moroccan Agency for International Cooperation scholarship. Application period: May–July 2026 (estimated). Apply via your country's Ministry of Education or relevant scholarship agency. Deadline historically falls late June to early July. All documents typically in French.", link: "https://www.amci.ma", difficulty: "Low-Moderate", docs: ["Completed AMCI Application Form (in French)", "Application Form from your country's scholarship agency (printed)", "Academic Transcripts / Certificates (attested)", "Birth Certificate / National ID Copy", "Passport Bio-data Page", "Medical Certificate (under 3 months)", "Police Clearance Certificate (under 6 months)", "Motivation Letter", "Recommendation Letter x2", "Passport-Sized Photos (2–6)", "PhD Dissertation + Thesis Project (PhD only)", "NOC from Employer (if employed)"] },
];

const STATUS_CONFIG = {
  none:          { label: "Not Tracking", color: "#475569", bg: "rgba(71,85,105,0.2)" },
  researching:   { label: "Researching",  color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  "in-progress": { label: "In Progress",  color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  applied:       { label: "Applied",      color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  accepted:      { label: "Accepted 🎉",  color: "#00d278", bg: "rgba(0,210,120,0.15)" },
  rejected:      { label: "Rejected",     color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};
const REGIONS = ["All", "Asia", "Europe", "Middle East", "Africa", "Oceania", "North America"];
const LEVELS  = ["All", "Bachelor's", "Master's", "PhD"];
function getDaysLeft(d) { return Math.ceil((new Date(d) - new Date()) / 86400000); }

function Badge({ text, accent }) {
  const palette = { green: { bg: "rgba(0,210,120,0.12)", color: "#00d278" }, amber: { bg: "rgba(251,191,36,0.12)", color: "#fbbf24" }, blue: { bg: "rgba(96,165,250,0.12)", color: "#60a5fa" }, red: { bg: "rgba(248,113,113,0.12)", color: "#f87171" }, orange: { bg: "rgba(251,146,60,0.12)", color: "#fb923c" }, gray: { bg: "rgba(148,163,184,0.08)", color: "#94a3b8" } };
  const c = palette[accent] || palette.gray;
  return <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", padding: "3px 9px", borderRadius: 20, background: c.bg, color: c.color, whiteSpace: "nowrap" }}>{text}</span>;
}

function DocBar({ docs, completed }) {
  const pct = docs.length ? Math.min(100, Math.round((completed.length / docs.length) * 100)) : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 10, color: "#475569", letterSpacing: "0.08em" }}>READINESS</span>
        <span style={{ fontSize: 10, color: "#64748b" }}>{completed.length}/{docs.length} — {pct}%</span>
      </div>
      <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#00d278" : "#3b82f6", borderRadius: 2, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}


function IntensityMeter({ intensity }) {
  const config = {
    "Low":    { bars: 1, color: "#00d278", label: "Low Effort" },
    "Medium": { bars: 2, color: "#fbbf24", label: "Medium Effort" },
    "High":   { bars: 3, color: "#f87171", label: "High Effort" },
  };
  const c = config[intensity] || config["Medium"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ display: "flex", gap: 2 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ width: 6, height: 14, borderRadius: 3, background: i <= c.bars ? c.color : "rgba(255,255,255,0.08)", transition: "background 0.2s" }} />
        ))}
      </div>
      <span style={{ fontSize: 10, color: c.color, fontWeight: 700, letterSpacing: "0.05em" }}>{c.label.toUpperCase()}</span>
    </div>
  );
}

function ScholarshipCard({ s, tracking, onOpen }) {
  const days = getDaysLeft(s.deadline), urgent = days <= 45 && days > 0;
  const isTracking = tracking?.status && tracking.status !== "none";
  const status = STATUS_CONFIG[tracking?.status || "none"];
  return (
    <div onClick={() => onOpen(s)} style={{ background: "linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))", border: urgent ? "1px solid rgba(251,191,36,0.3)" : isTracking ? "1px solid rgba(59,130,246,0.25)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px 22px", cursor: "pointer", transition: "transform 0.2s,box-shadow 0.2s", position: "relative", display: "flex", flexDirection: "column", gap: 12 }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.35)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      {urgent && <div style={{ position: "absolute", top: 0, left: 20, right: 20, height: 2, background: "linear-gradient(90deg,transparent,#fbbf24,transparent)" }} />}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
          <span style={{ fontSize: 26, lineHeight: 1 }}>{s.flag}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", fontFamily: "'Syne',sans-serif", lineHeight: 1.3 }}>{s.name}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>{s.country} · {s.region}</div>
          </div>
        </div>
        {isTracking && <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: status.bg, color: status.color, whiteSpace: "nowrap", alignSelf: "flex-start" }}>{status.label}</span>}
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {s.ielts === false ? <Badge text="NO IELTS" accent="green" /> : <Badge text="IELTS REQUIRED" accent="orange" />}
        <Badge text="FULLY FUNDED" accent="amber" />
        {s.levels.map(l => <Badge key={l} text={l.toUpperCase()} accent="blue" />)}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Badge text={s.difficulty.toUpperCase()} accent={s.difficulty === "Very Low" || s.difficulty === "Low" ? "green" : s.difficulty === "Very Competitive" ? "red" : "gray"} />
        <IntensityMeter intensity={s.intensity} />
      </div>
      <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>{s.description.slice(0, 100)}…</p>
      {isTracking && <DocBar docs={s.docs} completed={tracking.completedDocs || []} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 10 }}>
        <div style={{ fontSize: 12, color: days < 0 ? "#f87171" : days <= 45 ? "#fbbf24" : "#64748b" }}>
          📅 {new Date(s.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          {days >= 0 && <span style={{ opacity: 0.6, marginLeft: 5 }}>· {days}d</span>}
        </div>
        <span style={{ fontSize: 11, color: "#3b82f6", fontWeight: 600 }}>View Details →</span>
      </div>
    </div>
  );
}

function DetailModal({ s, tracking, onClose, onUpdateTracking }) {
  const [tab, setTab] = useState("info");
  const [localStatus, setLocalStatus] = useState(tracking?.status || "none");
  const [localNotes,  setLocalNotes]  = useState(tracking?.notes   || "");
  const [localDocs,   setLocalDocs]   = useState(tracking?.completedDocs || []);
  if (!s) return null;
  const days = getDaysLeft(s.deadline);
  const toggleDoc = doc => setLocalDocs(prev => { const filtered = prev.filter(x => x !== doc); return prev.includes(doc) ? filtered : [...filtered, doc]; });
  const save = () => { onUpdateTracking(s.id, { status: localStatus, completedDocs: localDocs, notes: localNotes }); };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }} onClick={onClose}>
      <div style={{ background: "#07111d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto", position: "relative" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "24px 26px 0", borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 16 }}>
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.07)", border: "none", color: "#94a3b8", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: 13 }}>✕</button>
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 36 }}>{s.flag}</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#f8fafc", fontFamily: "'Syne',sans-serif" }}>{s.name}</h2>
              <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>{s.country} · {s.region} · <span style={{ color: days <= 45 && days > 0 ? "#fbbf24" : "#64748b" }}>{days >= 0 ? `${days} days left` : "Deadline passed"}</span></div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {[{ key: "info", label: "📋 Info" }, { key: "tracker", label: "✅ My Tracker" }].map(tb => (
              <button key={tb.key} onClick={() => setTab(tb.key)} style={{ padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", background: tab === tb.key ? "rgba(59,130,246,0.2)" : "transparent", color: tab === tb.key ? "#60a5fa" : "#475569", fontSize: 13, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{tb.label}</button>
            ))}
          </div>
        </div>
        <div style={{ padding: "22px 26px" }}>
          {tab === "info" ? (
            <>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 16 }}>
                {s.ielts === false ? <Badge text="NO IELTS" accent="green" /> : <Badge text="IELTS REQUIRED" accent="orange" />}
                <Badge text="FULLY FUNDED" accent="amber" />
                {s.levels.map(l => <Badge key={l} text={l.toUpperCase()} accent="blue" />)}
              </div>
              <div style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 12, padding: "13px 15px", marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.08em", marginBottom: 5 }}>FUNDING COVERS</div>
                <div style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.6 }}>{s.amount}</div>
              </div>
              <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.8, marginBottom: 16 }}>{s.description}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div style={{ background: "rgba(0,210,120,0.06)", border: "1px solid rgba(0,210,120,0.15)", borderRadius: 10, padding: "11px 13px" }}>
                  <div style={{ fontSize: 10, color: "#00d278", letterSpacing: "0.08em", marginBottom: 4 }}>📅 OPENS</div>
                  <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>{s.opens ? new Date(s.opens).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Check official website"}</div>
                </div>
                <div style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 10, padding: "11px 13px" }}>
                  <div style={{ fontSize: 10, color: "#f87171", letterSpacing: "0.08em", marginBottom: 4 }}>⏰ DEADLINE</div>
                  <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>{new Date(s.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "11px 13px" }}>
                  <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.08em", marginBottom: 4 }}>COMPETITION</div>
                  <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>{s.difficulty}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "11px 13px" }}>
                  <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.08em", marginBottom: 8 }}>INTENSITY</div>
                  <IntensityMeter intensity={s.intensity} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.08em", marginBottom: 8 }}>ELIGIBLE FIELDS</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{s.fields.map(f => <span key={f} style={{ fontSize: 12, color: "#94a3b8", background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: 6 }}>{f}</span>)}</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.08em", marginBottom: 10 }}>REQUIRED DOCUMENTS</div>
                {s.docs.map(doc => <div key={doc} style={{ fontSize: 12.5, color: "#94a3b8", display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><span style={{ color: "#334155" }}>▸</span>{doc}</div>)}
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.08em", marginBottom: 6 }}>OFFICIAL WEBSITE</div>
                <a href={s.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: "#60a5fa", wordBreak: "break-all" }}>{s.link}</a>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <a href={s.link} target="_blank" rel="noopener noreferrer" style={{ flex: 1, background: "#3b82f6", color: "#fff", padding: "12px", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none", textAlign: "center", fontFamily: "'Syne',sans-serif", display: "block" }}>Apply Now ↗</a>
                <button onClick={() => setTab("tracker")} style={{ padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", borderRadius: 10, cursor: "pointer", fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>Track This</button>
              </div>
            </>
          ) : (
            <>
              <ReadinessScore docs={s.docs} completedDocs={localDocs} />
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.08em", marginBottom: 10 }}>MY STATUS</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <button key={k} onClick={() => setLocalStatus(k)} style={{ padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", background: localStatus === k ? v.bg : "rgba(255,255,255,0.04)", color: localStatus === k ? v.color : "#475569", outline: localStatus === k ? `1px solid ${v.color}50` : "none", fontSize: 12, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{v.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.08em", marginBottom: 10 }}>DOCUMENT CHECKLIST</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {s.docs.map(doc => (
                    <div key={doc} onClick={() => toggleDoc(doc)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                      <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, background: localDocs.includes(doc) ? "#00d278" : "transparent", border: localDocs.includes(doc) ? "none" : "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {localDocs.includes(doc) && <span style={{ fontSize: 10, color: "#07111d", fontWeight: 900 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 13, color: localDocs.includes(doc) ? "#475569" : "#c8d4e0", textDecoration: localDocs.includes(doc) ? "line-through" : "none" }}>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.08em", marginBottom: 8 }}>PERSONAL NOTES</div>
                <textarea value={localNotes} onChange={e => setLocalNotes(e.target.value)} rows={3} placeholder="Add notes, reminders, important links..." style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", padding: "10px 12px", borderRadius: 10, fontSize: 13, resize: "vertical", fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
              </div>
              <button onClick={save} style={{ width: "100%", background: "#00d278", color: "#07111d", padding: "12px", borderRadius: 10, fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>Save Progress</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TrackerView({ scholarships, trackingData, onOpen }) {
  const tracked = scholarships.filter(s => trackingData[s.id]?.status && trackingData[s.id].status !== "none");
  const counts = { researching: tracked.filter(s => trackingData[s.id].status === "researching").length, inProgress: tracked.filter(s => trackingData[s.id].status === "in-progress").length, applied: tracked.filter(s => trackingData[s.id].status === "applied").length, accepted: tracked.filter(s => trackingData[s.id].status === "accepted").length };
  if (!tracked.length) return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <svg width="80" height="80" viewBox="0 0 80 80" style={{ margin: "0 auto 20px", display: "block", opacity: 0.5 }}>
        <circle cx="40" cy="40" r="36" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 4" />
        <circle cx="40" cy="40" r="24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
        <circle cx="40" cy="40" r="12" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.4" />
        <circle cx="40" cy="40" r="3" fill="#3b82f6" />
        <line x1="40" y1="4" x2="40" y2="14" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="66" x2="40" y2="76" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
        <line x1="4" y1="40" x2="14" y2="40" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
        <line x1="66" y1="40" x2="76" y2="40" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div style={{ color: "#475569", fontSize: 15, fontWeight: 700, marginBottom: 8, fontFamily: "'Syne',sans-serif" }}>No targets acquired.</div>
      <div style={{ color: "#334155", fontSize: 13, lineHeight: 1.7 }}>Browse scholarships, open one,<br />and click "Track This" to start.</div>
    </div>
  );
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 26 }}>
        {[{ label: "RESEARCHING", value: counts.researching, color: "#94a3b8" }, { label: "IN PROGRESS", value: counts.inProgress, color: "#fbbf24" }, { label: "APPLIED", value: counts.applied, color: "#60a5fa" }, { label: "ACCEPTED", value: counts.accepted, color: "#00d278" }].map(stat => (
          <div key={stat.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "13px 15px" }}>
            <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.1em", marginBottom: 6 }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: stat.color, fontFamily: "'Syne',sans-serif" }}>{stat.value}</div>
          </div>
        ))}
      </div>
      {tracked.map(s => {
        const t = trackingData[s.id], st = STATUS_CONFIG[t.status], days = getDaysLeft(s.deadline);
        const pct = s.docs.length ? Math.min(100, Math.round((t.completedDocs.length / s.docs.length) * 100)) : 0;
        return (
          <div key={s.id} onClick={() => onOpen(s)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px 20px", cursor: "pointer", marginBottom: 10, transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.055)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 22 }}>{s.flag}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", fontFamily: "'Syne',sans-serif" }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.country}</div>
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
            </div>
            <div style={{ display: "flex", gap: 20, marginBottom: 10 }}>
              <div><div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.08em", marginBottom: 3 }}>DEADLINE</div><div style={{ fontSize: 12, color: days <= 45 && days > 0 ? "#fbbf24" : "#94a3b8" }}>{new Date(s.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {days >= 0 ? `${days}d left` : "Passed"}</div></div>
              <div><div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.08em", marginBottom: 3 }}>READINESS</div><div style={{ fontSize: 12, color: pct === 100 ? "#00d278" : "#94a3b8" }}>{t.completedDocs.length}/{s.docs.length} ({pct}%)</div></div>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#00d278" : "#3b82f6", borderRadius: 2, transition: "width 0.4s" }} />
            </div>
            {t.notes ? <div style={{ marginTop: 10, fontSize: 11.5, color: "#64748b", borderLeft: "2px solid rgba(255,255,255,0.07)", paddingLeft: 10 }}>{t.notes}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

// Navigation Menu Component
function NavMenu({ onNavigate, currentTab }) {
  const [open, setOpen] = useState(false);
  const items = [
    { icon: "🏠", label: "Home", tab: "browse" },
    { icon: "🔍", label: "Browse Scholarships", tab: "browse" },
    { icon: "⏱", label: "Timeline", tab: "timeline" },
    { icon: "📊", label: "My Tracker", tab: "tracker" },
    { icon: "ℹ️", label: "About FundedOut", tab: "about" },
  ];
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(v => !v)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f5f9", width: 38, height: 38, borderRadius: 10, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: 0 }}>
        {[0,1,2].map(i => <div key={i} style={{ width: 16, height: 1.5, background: "#94a3b8", borderRadius: 2 }} />)}
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
          <div style={{ position: "absolute", top: 46, right: 0, background: "#0a1525", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "8px", minWidth: 220, zIndex: 100, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: 10, color: "#334155", letterSpacing: "0.1em", padding: "6px 12px 8px", fontWeight: 700 }}>NAVIGATION</div>
            {items.map(item => (
              <button key={item.label} onClick={() => { onNavigate(item.tab); setOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", background: currentTab === item.tab && item.tab !== "about" ? "rgba(59,130,246,0.15)" : "transparent", color: currentTab === item.tab && item.tab !== "about" ? "#60a5fa" : "#94a3b8", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "'Outfit',sans-serif", textAlign: "left", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                onMouseLeave={e => e.currentTarget.style.background = currentTab === item.tab && item.tab !== "about" ? "rgba(59,130,246,0.15)" : "transparent"}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span> {item.label}
              </button>
            ))}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "8px 0" }} />
            <div style={{ padding: "6px 12px" }}>
              <div style={{ fontSize: 10, color: "#334155", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 700 }}>SHARE APP</div>
              <button onClick={() => { navigator.clipboard?.writeText("https://fundedout-app.vercel.app"); setOpen(false); }} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#64748b", cursor: "pointer", fontSize: 12, fontFamily: "'Outfit',sans-serif" }}>
                📋 Copy App Link
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AboutView() {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 0" }}>
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "28px 28px", marginBottom: 16 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", fontFamily: "'Syne',sans-serif", marginBottom: 10 }}>About FundedOut</h2>
        <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.8, marginBottom: 16 }}>FundedOut is a free scholarship discovery and tracking app. Every scholarship listed is verified, fully funded, and carefully researched.</p>
        <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.8 }}>Our mission is simple — remove the barriers between talented students and world-class education. No IELTS? No problem. No money? No problem. Just your ambition and the right information.</p>
      </div>
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "24px 28px", marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.08em", marginBottom: 14 }}>WHAT'S INSIDE</div>
        {[
          { icon: "🎓", text: "Fully funded, verified scholarships worldwide" },
          { icon: "✅", text: "Exact documents required for each scholarship" },
          { icon: "📊", text: "Application readiness radar chart" },
          { icon: "⏱", text: "Visual deadline timeline" },
          { icon: "📋", text: "Personal tracker with notes" },
          { icon: "💾", text: "Data saved locally on your device" },
        ].map(item => (
          <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span style={{ fontSize: 13, color: "#94a3b8" }}>{item.text}</span>
          </div>
        ))}
      </div>
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "24px 28px", marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.08em", marginBottom: 16 }}>YOUR APPLICATION ROADMAP</div>
        {[
          { step: "01", title: "Pre-Check", desc: "Get your passport and transcripts ready first. These are required by every scholarship.", color: "#00d278" },
          { step: "02", title: "Draft Your Motivation Letter", desc: "Write a compelling motivation letter. Use Grammarly to make it error-free before submitting.", color: "#3b82f6", link: "https://grammarly.com", linkText: "Check Grammarly →" },
          { step: "03", title: "Secure Recommendations", desc: "Contact professors or employers early. Give them at least 2–3 weeks notice.", color: "#fbbf24" },
          { step: "04", title: "Gather Remaining Docs", desc: "Medical certificate, police clearance, passport photos — check the document list for each scholarship.", color: "#818cf8" },
          { step: "05", title: "Submit", desc: "Apply directly through the official scholarship portal. Never pay anyone to apply on your behalf.", color: "#f87171" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 14, marginBottom: i < 4 ? 18 : 0 }}>
            <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: "50%", background: `${item.color}20`, border: `1px solid ${item.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: item.color, fontFamily: "'Syne',sans-serif" }}>{item.step}</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 3, fontFamily: "'Syne',sans-serif" }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>{item.desc}</div>
              {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#3b82f6", fontWeight: 600, textDecoration: "none", display: "inline-block", marginTop: 4 }}>{item.linkText}</a>}
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "24px 28px" }}>
        <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.08em", marginBottom: 14 }}>IMPORTANT NOTICE</div>
        <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.8 }}>Deadlines shown are based on historical patterns and verified research. Always confirm the official deadline on each scholarship's website before applying. FundedOut is not affiliated with any scholarship program.</p>
      </div>
    </div>
  );
}

export default function App() {
  const [tab,          setTab]          = useState("browse");
  const [search,       setSearch]       = useState("");
  const [region,       setRegion]       = useState("All");
  const [level,        setLevel]        = useState("All");
  const [noIelts,      setNoIelts]      = useState(false);
  const [selected,     setSelected]     = useState(null);
  const [trackingData, setTrackingData] = useState(() => loadFromStorage());

  const updateTracking = (id, data) => { setTrackingData(prev => { const updated = { ...prev, [id]: data }; saveToStorage(updated); return updated; }); };
  const trackedCount = Object.values(trackingData).filter(t => t.status && t.status !== "none").length;
  const upcoming     = SCHOLARSHIPS.filter(s => { const d = getDaysLeft(s.deadline); return d > 0 && d <= 45; }).length;
  const noIeltsCount = SCHOLARSHIPS.filter(s => s.ielts === false).length;

  const filtered = useMemo(() => SCHOLARSHIPS.filter(s => {
    if (noIelts && s.ielts !== false) return false;
    if (region !== "All" && s.region !== region) return false;
    if (level  !== "All" && !s.levels.includes(level)) return false;
    if (search) { const q = search.toLowerCase(); if (!s.name.toLowerCase().includes(q) && !s.country.toLowerCase().includes(q)) return false; }
    return true;
  }), [search, region, level, noIelts]);

  const TABS = [
    { key: "browse",   label: `Browse (${SCHOLARSHIPS.length})` },
    { key: "timeline", label: "⏱ Timeline" },
    { key: "tracker",  label: `My Tracker${trackedCount > 0 ? ` (${trackedCount})` : ""}` },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#07111d", fontFamily: "'Outfit',sans-serif", color: "#f1f5f9" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Outfit:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
        input::placeholder{color:#334155}
        input:focus,select:focus,textarea:focus{outline:none}
      `}</style>

      {/* Top Navigation Bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(7,17,29,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "12px 20px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d278", boxShadow: "0 0 6px #00d278" }} />
            <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Syne',sans-serif", background: "linear-gradient(135deg,#3b82f6,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>FundedOut</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {trackedCount > 0 && <span style={{ fontSize: 11, color: "#fbbf24", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>{trackedCount} tracking</span>}
            <NavMenu onNavigate={setTab} currentTab={tab} />
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: "linear-gradient(180deg,rgba(59,130,246,0.07) 0%,transparent 100%)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "36px 20px 28px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <h1 style={{ fontSize: "clamp(26px,5vw,46px)", fontWeight: 800, lineHeight: 1.1, fontFamily: "'Syne',sans-serif", marginBottom: 10 }}>
            Your passport out<br />
            <span style={{ background: "linear-gradient(135deg,#3b82f6,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>starts here.</span>
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", maxWidth: 460, lineHeight: 1.7, marginBottom: 18 }}>
            {SCHOLARSHIPS.length} verified, fully funded scholarships — real deadlines, exact documents, zero guesswork.
          </p>

          <button onClick={() => setNoIelts(v => !v)} style={{ padding: "10px 20px", borderRadius: 50, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'Outfit',sans-serif", background: noIelts ? "linear-gradient(135deg,rgba(0,210,120,0.2),rgba(0,210,120,0.1))" : "rgba(255,255,255,0.05)", border: noIelts ? "1px solid rgba(0,210,120,0.5)" : "1px solid rgba(255,255,255,0.1)", color: noIelts ? "#00d278" : "#64748b", boxShadow: noIelts ? "0 0 20px rgba(0,210,120,0.15)" : "none", transition: "all 0.2s" }}>
            {noIelts ? "✓ " : ""}No IELTS? No Problem — Show Only IELTS-Free ({noIeltsCount})
          </button>

          <div style={{ display: "flex", gap: 22, marginTop: 20, flexWrap: "wrap" }}>
            {[{ label: "Scholarships", value: SCHOLARSHIPS.length }, { label: "Countries", value: [...new Set(SCHOLARSHIPS.map(s => s.country))].length }, { label: "IELTS-Free", value: noIeltsCount }, { label: "Closing Soon", value: upcoming, hot: upcoming > 0 }, { label: "Tracking", value: trackedCount, hot: trackedCount > 0 }].map(stat => (
              <div key={stat.label}>
                <span style={{ fontSize: 22, fontWeight: 800, color: stat.hot ? "#fbbf24" : "#f1f5f9", fontFamily: "'Syne',sans-serif" }}>{stat.value}</span>
                <span style={{ fontSize: 12, color: "#475569", marginLeft: 6 }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "26px 20px" }}>
        {/* Tabs */}
        {tab !== "about" && (
          <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 4, width: "fit-content" }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: "8px 20px", borderRadius: 9, border: "none", cursor: "pointer", background: tab === t.key ? "rgba(59,130,246,0.2)" : "transparent", color: tab === t.key ? "#60a5fa" : "#475569", fontSize: 13, fontWeight: 600, fontFamily: "'Outfit',sans-serif", transition: "all 0.15s", whiteSpace: "nowrap" }}>{t.label}</button>
            ))}
          </div>
        )}

        {tab === "browse" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search country or scholarship…" style={{ flex: 1, minWidth: 160, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#f1f5f9", padding: "9px 14px", borderRadius: 10, fontSize: 13 }} />
              {[{ value: region, setter: setRegion, opts: REGIONS, label: "Region" }, { value: level, setter: setLevel, opts: LEVELS, label: "Level" }].map(f => (
                <select key={f.label} value={f.value} onChange={e => f.setter(e.target.value)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#f1f5f9", padding: "9px 14px", borderRadius: 10, fontSize: 13, cursor: "pointer" }}>
                  {f.opts.map(o => <option key={o} value={o} style={{ background: "#07111d" }}>{o === "All" ? `${f.label}: All` : o}</option>)}
                </select>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "#334155", marginBottom: 16 }}>Showing {filtered.length} scholarship{filtered.length !== 1 ? "s" : ""}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 12 }}>
              {filtered.map(s => <ScholarshipCard key={s.id} s={s} tracking={trackingData[s.id]} onOpen={setSelected} />)}
            </div>
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                <div style={{ color: "#475569", marginBottom: 10 }}>No results found.</div>
                <button onClick={() => { setSearch(""); setRegion("All"); setLevel("All"); setNoIelts(false); }} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", padding: "7px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Clear Filters</button>
              </div>
            )}
            {filtered.length > 0 && (
              <div style={{ marginTop: 32, textAlign: "center", padding: "22px", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 14 }}>
                <div style={{ fontSize: 16, marginBottom: 8 }}>🚀</div>
                <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>This is just the beginning.<br />More fully funded opportunities dropping soon.</p>
              </div>
            )}
          </>
        )}

        {tab === "timeline" && <TimelineView scholarships={SCHOLARSHIPS} trackingData={trackingData} onOpen={setSelected} />}
        {tab === "tracker"  && <TrackerView  scholarships={SCHOLARSHIPS} trackingData={trackingData} onOpen={setSelected} />}
        {tab === "about"    && <AboutView />}

        <div style={{ marginTop: 48, textAlign: "center", color: "#0a1525", fontSize: 11, letterSpacing: "0.05em" }}>
          FUNDEDOUT · YOUR PASSPORT OUT STARTS HERE
        </div>
      </div>

      <DetailModal key={selected?.id} s={selected} tracking={selected ? trackingData[selected.id] : null} onClose={() => setSelected(null)} onUpdateTracking={(id, data) => { updateTracking(id, data); setSelected(null); }} />
    </div>
  );
}

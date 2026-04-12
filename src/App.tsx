import { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dxprcptlkjsdsvjdzkqf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4cHJjcHRsa2pzZHN2amR6a3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTI3NzgsImV4cCI6MjA5MTMyODc3OH0.TYE0cTas2vEWiSYH4HhD4KcsmO_76YjD6Nzj4Mm0fgc";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const MONTHS_SHORT = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
const ORANGE = "#C9714A";
const GREEN = "#4A9B7F";
const BG = "#F5F0E8";
const CARD = "#FFFFFF";
const TEXT = "#1a1a1a";
const MUTED = "#888";

function fmtEur(n: number) {
  if (!n && n !== 0) return "€0";
  return `€${Number(n).toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
}
function fmtDate(dateStr: string) {
  const [y,m,d] = dateStr.split("-").map(Number);
  return `${d} ${MONTHS_SHORT[m-1]}`;
}
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function parseDate(dateStr: string) {
  const [y,m,d] = dateStr.split("-").map(Number);
  return new Date(y, m-1, d);
}

function KpiCard({ label, value, icon, color }: any) {
  return (
    <div style={{ background: CARD, borderRadius: 16, padding: "18px 16px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)", flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 1.5, color: MUTED, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: color || ORANGE, lineHeight: 1 }}>{value}</div>
        </div>
        <div style={{ fontSize: 20, opacity: 0.45 }}>{icon}</div>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>Giorno {label}</div>
      {payload.map((p: any, i: number) => <div key={i} style={{ color: p.color }}>{p.name}: {fmtEur(p.value)}</div>)}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [screen, setScreen] = useState("login");
  const [sideMenu, setSideMenu] = useState<string|null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [inputDate, setInputDate] = useState(todayStr());
  const [inputCoperti, setInputCoperti] = useState("");
  const [inputIncasso, setInputIncasso] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [archivioYear, setArchivioYear] = useState("");
  const [archivioOpen, setArchivioOpen] = useState(false);
  const [confAnno1, setConfAnno1] = useState("");
  const [confAnno2, setConfAnno2] = useState("");
  const [importAnno, setImportAnno] = useState("");
  const [importMese, setImportMese] = useState("");
  const [importTesto, setImportTesto] = useState("");
  const [importPreview, setImportPreview] = useState<any[]|null>(null);
  const [importMsg, setImportMsg] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session);
      setLoadingAuth(false);
      if (session) { setScreen("home"); fetchRecords(); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
      if (session) { setScreen("home"); fetchRecords(); }
      else { setScreen("login"); setRecords([]); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchRecords() {
    const { data } = await supabase.from("records").select("*").order("date", { ascending: false });
    if (data) setRecords(data);
  }

  async function handleLogin() {
    if (!loginEmail || !loginPass) { setLoginError("Compila tutti i campi"); return; }
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPass });
    if (error) setLoginError("Email o password errati");
    setLoginLoading(false);
  }

  async function handleRegister() {
    if (!loginEmail || !loginPass) { setLoginError("Compila tutti i campi"); return; }
    if (loginPass.length < 6) { setLoginError("Password minimo 6 caratteri"); return; }
    setLoginLoading(true);
    const { error } = await supabase.auth.signUp({ email: loginEmail, password: loginPass });
    if (error) setLoginError(error.message);
    else { setLoginError(""); }
    setLoginLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSideMenu(null);
  }

  async function handleSave() {
    if (!inputCoperti || !inputIncasso) { setSaveMsg("Compila coperti e incasso"); setTimeout(() => setSaveMsg(""), 2000); return; }
    const { error } = await supabase.from("records").upsert({ user_id: session.user.id, date: inputDate, coperti: Number(inputCoperti), incasso: Number(inputIncasso) }, { onConflict: "user_id,date" });
    if (!error) { setSaveMsg("✓ Salvato!"); setTimeout(() => setSaveMsg(""), 2000); setInputCoperti(""); setInputIncasso(""); fetchRecords(); }
    else { setSaveMsg("Errore"); setTimeout(() => setSaveMsg(""), 2000); }
  }

  async function handleDelete(id: string) {
    await supabase.from("records").delete().eq("id", id);
    fetchRecords();
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const statsCurrentMonth = useMemo(() => {
    const entries = records.filter(r => { const d = new Date(r.date + "T00:00:00"); return d.getFullYear() === currentYear && d.getMonth() === currentMonth; });
    const totalInc = entries.reduce((a, r) => a + Number(r.incasso), 0);
    const totalCop = entries.reduce((a, r) => a + r.coperti, 0);
    return { giorni: entries.length, coperti: totalCop, incasso: totalInc, mediaCoperto: totalCop ? totalInc / totalCop : 0 };
  }, [records, currentYear, currentMonth]);

  const chartData = useMemo(() => {
    const days: any = {};
    records.forEach(r => {
      const d = new Date(r.date + "T00:00:00");
      const day = d.getDate();
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) days[day] = { ...(days[day] || {}), curr: Number(r.incasso) };
      if (d.getFullYear() === currentYear - 1 && d.getMonth() === currentMonth) days[day] = { ...(days[day] || {}), prev: Number(r.incasso) };
    });
    return Object.keys(days).sort((a, b) => Number(a) - Number(b)).map(d => ({ label: d, [currentYear]: days[d]?.curr || 0, [currentYear - 1]: days[d]?.prev || 0 }));
  }, [records, currentYear, currentMonth]);

  const totalCurrMonth = chartData.reduce((a, b) => a + (b[currentYear] || 0), 0);
  const totalPrevMonth = chartData.reduce((a, b) => a + (b[currentYear - 1] || 0), 0);
  const pctChange = totalPrevMonth ? ((totalCurrMonth - totalPrevMonth) / totalPrevMonth * 100) : null;
  const recentRecords = useMemo(() => records.filter(r => new Date(r.date + "T00:00:00").getFullYear() === currentYear).slice(0, 30), [records, currentYear]);
  const archivioYears = useMemo(() => { const ys = new Set(records.map(r => new Date(r.date + "T00:00:00").getFullYear())); return [...ys].sort((a: any, b: any) => b - a); }, [records]);
  const archivioData = useMemo(() => {
    if (!archivioYear) return null;
    const yr = Number(archivioYear);
    return MONTHS.map((_, mi) => {
      const entries = records.filter(r => { const d = new Date(r.date + "T00:00:00"); return d.getFullYear() === yr && d.getMonth() === mi; });
      const inc = entries.reduce((a, r) => a + Number(r.incasso), 0);
      const cop = entries.reduce((a, r) => a + r.coperti, 0);
      return { name: MONTHS_SHORT[mi], incasso: inc, coperti: cop, mediaCoperto: cop ? inc / cop : 0, giorni: entries.length };
    });
  }, [records, archivioYear]);

  const confrontoData = useMemo(() => {
    if (!confAnno1 || !confAnno2) return null;
    return MONTHS_SHORT.map((name, mi) => {
      const sum = (yr: string) => records.filter(r => { const d = new Date(r.date + "T00:00:00"); return d.getFullYear() === Number(yr) && d.getMonth() === mi; }).reduce((a, r) => a + Number(r.incasso), 0);
      return { name, [confAnno1]: sum(confAnno1), [confAnno2]: sum(confAnno2) };
    });
  }, [records, confAnno1, confAnno2]);

  function handlePreview() {
    const lines = importTesto.trim().split("\n").filter(Boolean);
    const parsed = lines.map(line => {
      const parts = line.trim().split(/[\s\t]+/);
      return { giorno: parseInt(parts[0]), coperti: parseInt(parts[1]), incasso: parseFloat(parts.slice(2).join("").replace(/[€]/g, "").replace(",", ".")) };
    }).filter(p => !isNaN(p.giorno) && !isNaN(p.coperti) && !isNaN(p.incasso));
    setImportPreview(parsed);
  }

  async function handleImport() {
    if (!importPreview?.length || !importAnno || !importMese) return;
    const rows = importPreview.map(p => ({ user_id: session.user.id, date: `${importAnno}-${String(importMese).padStart(2,"0")}-${String(p.giorno).padStart(2,"0")}`, coperti: p.coperti, incasso: p.incasso }));
    const { error } = await supabase.from("records").upsert(rows, { onConflict: "user_id,date" });
    if (!error) { setImportMsg(`✓ Importati ${importPreview.length} giorni!`); setImportPreview(null); setImportTesto(""); fetchRecords(); }
    else setImportMsg("Errore importazione");
    setTimeout(() => setImportMsg(""), 3000);
  }if (loadingAuth) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ textAlign: "center", color: MUTED }}><div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div><div>Caricamento...</div></div>
    </div>
  );

  if (screen === "login" || screen === "register") return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "system-ui,sans-serif" }}>
      <style>{`*{box-sizing:border-box}input,button{font-family:inherit;outline:none}`}</style>
      <div style={{ background: CARD, borderRadius: 20, padding: "40px 32px", width: "100%", maxWidth: 400, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ display: "inline-flex", background: ORANGE, borderRadius: 18, width: 72, height: 72, alignItems: "center", justifyContent: "center", fontSize: 32, color: "#fff" }}>€</div>
        </div>
        <h2 style={{ textAlign: "center", margin: "0 0 4px", fontSize: 26, fontWeight: 700, color: TEXT }}>Gestione Ristorante</h2>
        <p style={{ textAlign: "center", color: MUTED, margin: "0 0 28px", fontSize: 14 }}>{screen === "login" ? "Accedi per continuare" : "Crea un nuovo account"}</p>
        <label style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 700, color: MUTED }}>EMAIL</label>
        <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #e0d8cc", borderRadius: 10, padding: "10px 14px", marginTop: 6, marginBottom: 16 }}>
          <span style={{ color: MUTED, marginRight: 8 }}>✉️</span>
          <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && (screen === "login" ? handleLogin() : handleRegister())} placeholder="Inserisci email" style={{ border: "none", background: "none", flex: 1, fontSize: 15, color: TEXT }} />
        </div>
        <label style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 700, color: MUTED }}>PASSWORD</label>
        <div style={{ border: "1.5px solid #e0d8cc", borderRadius: 10, padding: "10px 14px", marginTop: 6, marginBottom: 20 }}>
          <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} onKeyDown={e => e.key === "Enter" && (screen === "login" ? handleLogin() : handleRegister())} placeholder={screen === "register" ? "Minimo 6 caratteri" : "Inserisci password"} style={{ border: "none", background: "none", width: "100%", fontSize: 15, color: TEXT }} />
        </div>
        {loginError && <div style={{ color: loginError.startsWith("✓") ? GREEN : "#c0392b", fontSize: 13, marginBottom: 12, textAlign: "center", fontWeight: 600 }}>{loginError}</div>}
        <button onClick={screen === "login" ? handleLogin : handleRegister} disabled={loginLoading}
          style={{ width: "100%", background: loginLoading ? "#d4a090" : ORANGE, color: "#fff", border: "none", borderRadius: 12, padding: 14, fontSize: 16, fontWeight: 600, cursor: "pointer", marginBottom: 16 }}>
          {loginLoading ? "..." : screen === "login" ? "Accedi" : "Crea Account"}
        </button>
        <div style={{ borderTop: "1px solid #eee", paddingTop: 16, textAlign: "center" }}>
          <p style={{ color: MUTED, fontSize: 13, marginBottom: 10 }}>{screen === "login" ? "Non hai un account?" : "Hai già un account?"}</p>
          <button onClick={() => { setScreen(screen === "login" ? "register" : "login"); setLoginError(""); }}
            style={{ width: "100%", background: "none", border: "1.5px solid #e0d8cc", borderRadius: 12, padding: 12, fontSize: 15, fontWeight: 600, cursor: "pointer", color: TEXT }}>
            {screen === "login" ? "Crea Nuovo Account" : "Accedi"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: BG, maxWidth: 480, margin: "0 auto", fontFamily: "system-ui,sans-serif" }}>
      <style>{`*{box-sizing:border-box}input,select,textarea,button{font-family:inherit;outline:none}`}</style>
      <div style={{ background: CARD, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #eee", position: "sticky", top: 0, zIndex: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 18, color: TEXT }}>Gestione Ristorante</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setSideMenu(sideMenu ? null : "archivio")} style={{ background: "#f5f0e8", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 18 }}>☰</button>
          <button onClick={handleLogout} style={{ background: "#f5f0e8", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 18 }}>⎋</button>
        </div>
      </div>

      {sideMenu && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div onClick={() => setSideMenu(null)} style={{ flex: 1, background: "rgba(0,0,0,0.5)" }} />
          <div style={{ width: "90%", maxWidth: 440, background: BG, overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #e0d8cc", background: CARD }}>
              <span style={{ fontWeight: 700, fontSize: 18 }}>Archivio Storico</span>
              <button onClick={() => setSideMenu(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: MUTED }}>✕</button>
            </div>
            <div style={{ display: "flex", background: "#e8e0d4", borderRadius: 12, margin: "16px 16px 0", padding: 3 }}>
              {["archivio","confronto","importa","account"].map(t => (
                <button key={t} onClick={() => setSideMenu(t)} style={{ flex: 1, padding: "8px 2px", border: "none", borderRadius: 9, cursor: "pointer", fontSize: 12, fontWeight: 600, background: sideMenu === t ? CARD : "transparent", color: sideMenu === t ? TEXT : MUTED }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div style={{ padding: "20px 16px 60px" }}>
              {sideMenu === "archivio" && (
                <div>
                  <label style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 700, color: MUTED }}>SELEZIONA ANNO</label>
                  <div style={{ position: "relative", marginTop: 8, marginBottom: 20 }}>
                    <div onClick={() => setArchivioOpen(!archivioOpen)} style={{ border: "1.5px solid #e0d8cc", borderRadius: 10, padding: "12px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", background: CARD }}>
                      <span style={{ color: archivioYear ? TEXT : MUTED }}>{archivioYear || "Scegli un anno..."}</span><span>▾</span>
                    </div>
                    {archivioOpen && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: CARD, border: "1px solid #e0d8cc", borderRadius: 10, zIndex: 10, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                        {archivioYears.length === 0 && <div style={{ padding: "12px 16px", color: MUTED }}>Nessun dato</div>}
                        {archivioYears.map((y: any) => <div key={y} onClick={() => { setArchivioYear(String(y)); setArchivioOpen(false); }} style={{ padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #f0ebe3", fontSize: 15, fontWeight: 600 }}>{y}</div>)}
                      </div>
                    )}
                  </div>
                  {!archivioYear && <div style={{ textAlign: "center", color: MUTED, marginTop: 40 }}><div style={{ fontSize: 40, marginBottom: 12 }}>📊</div><div>Seleziona un anno per vedere i dati</div></div>}
                  {archivioData && archivioData.filter((m: any) => m.giorni > 0).map((m: any, i: number) => (
                    <div key={i} style={{ background: CARD, borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>{MONTHS[i]}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                        <div><div style={{ color: MUTED, fontSize: 9 }}>GIORNI</div><div style={{ color: GREEN, fontWeight: 700 }}>{m.giorni}</div></div>
                        <div><div style={{ color: MUTED, fontSize: 9 }}>COPERTI</div><div style={{ color: GREEN, fontWeight: 700 }}>{m.coperti}</div></div>
                        <div><div style={{ color: MUTED, fontSize: 9 }}>INCASSO</div><div style={{ color: ORANGE, fontWeight: 700, fontSize: 13 }}>{fmtEur(m.incasso)}</div></div>
                        <div><div style={{ color: MUTED, fontSize: 9 }}>€/COP</div><div style={{ color: "#C9A84A", fontWeight: 700, fontSize: 13 }}>{fmtEur(m.mediaCoperto)}</div></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {sideMenu === "confronto" && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                    {["ANNO 1","ANNO 2"].map((label, idx) => (
                      <div key={idx}>
                        <label style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 700, color: MUTED }}>{label}</label>
                        <select value={idx === 0 ? confAnno1 : confAnno2} onChange={e => idx === 0 ? setConfAnno1(e.target.value) : setConfAnno2(e.target.value)} style={{ width: "100%", marginTop: 6, border: "1.5px solid #e0d8cc", borderRadius: 10, padding: "10px 12px", background: CARD, fontSize: 14 }}>
                          <option value="">Anno...</option>
                          {archivioYears.map((y: any) => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                  {!confrontoData && <div style={{ textAlign: "center", color: MUTED, marginTop: 40 }}><div style={{ fontSize: 40, marginBottom: 12 }}>📈</div><div>Seleziona due anni da confrontare</div></div>}
                  {confrontoData && (
                    <div style={{ background: CARD, borderRadius: 12, padding: 16 }}>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={confrontoData} barCategoryGap="30%">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `€${(v/1000).toFixed(0)}k`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey={confAnno1} fill={ORANGE} radius={[3,3,0,0]} />
                          <Bar dataKey={confAnno2} fill="#bbb" radius={[3,3,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}
              {sideMenu === "importa" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}><span style={{ fontSize: 20 }}>⬆️</span><span style={{ fontWeight: 700, fontSize: 16 }}>Importa Dati Anni Precedenti</span></div>
                  <div style={{ background: "#FFF8EC", border: "1px solid #F5C97A", borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
                    <div style={{ color: ORANGE, fontWeight: 700, marginBottom: 6 }}>Come importare:</div>
                    {["1. Seleziona anno e mese","2. Incolla i dati (giorno, coperti, incasso)","3. Clicca Anteprima per verificare","4. Clicca Importa per salvare"].map((t,i) => <div key={i} style={{ color: ORANGE, fontSize: 13, marginBottom: 2 }}>{t}</div>)}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div><label style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 700, color: MUTED }}>ANNO</label><input value={importAnno} onChange={e => setImportAnno(e.target.value)} placeholder="es. 2023" style={{ width: "100%", marginTop: 6, border: "1.5px solid #e0d8cc", borderRadius: 10, padding: "10px 12px", background: CARD, fontSize: 14 }} /></div>
                    <div><label style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 700, color: MUTED }}>MESE</label><select value={importMese} onChange={e => setImportMese(e.target.value)} style={{ width: "100%", marginTop: 6, border: "1.5px solid #e0d8cc", borderRadius: 10, padding: "10px 12px", background: CARD, fontSize: 14 }}><option value="">Mese...</option>{MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}</select></div>
                  </div>
                  <textarea value={importTesto} onChange={e => setImportTesto(e.target.value)} rows={6} placeholder={"1    85  2450\n2    72  1980"} style={{ width: "100%", border: "1.5px solid #e0d8cc", borderRadius: 10, padding: "10px 12px", background: CARD, fontSize: 13, fontFamily: "monospace", resize: "vertical", marginBottom: 16 }} />
                  {importPreview && <div style={{ background: CARD, borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 13 }}><div style={{ fontWeight: 700, marginBottom: 8 }}>Anteprima ({importPreview.length} righe)</div>{importPreview.slice(0,5).map((p,i) => <div key={i} style={{ color: MUTED }}>Giorno {p.giorno}: {p.coperti} cop, {fmtEur(p.incasso)}</div>)}</div>}
                  {importMsg && <div style={{ color: importMsg.startsWith("✓") ? GREEN : "#c0392b", fontWeight: 700, marginBottom: 12 }}>{importMsg}</div>}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <button onClick={handlePreview} style={{ border: "1.5px solid #e0d8cc", borderRadius: 12, padding: 12, background: CARD, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>📄 Anteprima</button>
                    <button onClick={handleImport} disabled={!importPreview?.length} style={{ border: "none", borderRadius: 12, padding: 12, background: importPreview?.length ? ORANGE : "#e8c4b0", color: "#fff", cursor: importPreview?.length ? "pointer" : "default", fontWeight: 600, fontSize: 14 }}>⬆️ Importa ({importPreview?.length || 0})</button>
                  </div>
                </div>
              )}
              {sideMenu === "account" && (
                <div>
                  <div style={{ background: CARD, borderRadius: 16, padding: 20, textAlign: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
                    <div style={{ fontWeight: 700, fontSize: 16, wordBreak: "break-all" }}>{session?.user?.email}</div>
                  </div>
                  <div style={{ background: CARD, borderRadius: 16, padding: 16, marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}><span style={{ color: MUTED }}>Giorni registrati</span><span style={{ fontWeight: 700 }}>{records.length}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}><span style={{ color: MUTED }}>Anni nel sistema</span><span style={{ fontWeight: 700 }}>{archivioYears.length}</span></div>
                  </div>
                  <button onClick={handleLogout} style={{ width: "100%", background: "#fee", border: "1px solid #fcc", borderRadius: 12, padding: 14, color: "#c0392b", fontWeight: 700, cursor: "pointer", fontSize: 15 }}>Esci dall'account</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "20px 16px 60px" }}>
        <div style={{ fontSize: 12, color: MUTED, marginBottom: 12 }}>📅 {MONTHS[currentMonth]} {currentYear}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <KpiCard label="Giorni" value={statsCurrentMonth.giorni} icon="📅" color={GREEN} />
          <KpiCard label="Coperti" value={statsCurrentMonth.coperti} icon="👥" color={GREEN} />
          <KpiCard label="Incasso" value={fmtEur(statsCurrentMonth.incasso)} icon="€" color={ORANGE} />
          <KpiCard label="€/Coperto" value={fmtEur(statsCurrentMonth.mediaCoperto)} icon="📈" color="#C9A84A" />
        </div>
        <div style={{ background: CARD, borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}><span style={{ color: ORANGE, fontSize: 22, fontWeight: 700 }}>+</span><span style={{ fontWeight: 700, fontSize: 17 }}>Inserisci Dati</span></div>
          <label style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 700, color: MUTED }}>DATA</label>
          <div style={{ border: "1.5px solid #e0d8cc", borderRadius: 10, padding: "10px 14px", marginTop: 6, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span>📅</span><input type="date" value={inputDate} onChange={e => setInputDate(e.target.value)} style={{ border: "none", background: "none", fontSize: 15, color: TEXT, flex: 1 }} />
          </div>
          <label style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 700, color: MUTED }}>COPERTI</label>
          <div style={{ border: "1.5px solid #e0d8cc", borderRadius: 10, padding: "10px 14px", marginTop: 6, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span>👥</span><input type="number" value={inputCoperti} onChange={e => setInputCoperti(e.target.value)} placeholder="0" style={{ border: "none", background: "none", fontSize: 15, color: TEXT, flex: 1 }} />
          </div>
          <label style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 700, color: MUTED }}>INCASSO (€)</label>
          <div style={{ border: "1.5px solid #e0d8cc", borderRadius: 10, padding: "10px 14px", marginTop: 6, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <span>€</span><input type="number" step="0.5" value={inputIncasso} onChange={e => setInputIncasso(e.target.value)} placeholder="0.00" style={{ border: "none", background: "none", fontSize: 15, color: TEXT, flex: 1 }} />
          </div>
          {saveMsg && <div style={{ color: saveMsg.startsWith("✓") ? GREEN : "#c0392b", fontWeight: 700, marginBottom: 10, textAlign: "center" }}>{saveMsg}</div>}
          <button onClick={handleSave} style={{ width: "100%", background: ORANGE, color: "#fff", border: "none", borderRadius: 12, padding: 14, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>Salva Dati</button>
        </div>
        <div style={{ background: CARD, borderRadius: 16, padding: "20px 16px", marginBottom: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><span style={{ color: "#C9A84A" }}>📊</span><span style={{ fontWeight: 700, fontSize: 17 }}>{MONTHS[currentMonth]}</span><span style={{ color: MUTED, fontSize: 13 }}>{currentYear} vs {currentYear-1}</span></div>
          <div style={{ fontSize: 13, marginBottom: 14, display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ color: MUTED }}>{currentYear-1}: {fmtEur(totalPrevMonth)}</span>
            <span style={{ color: ORANGE, fontWeight: 700 }}>{currentYear}: {fmtEur(totalCurrMonth)}</span>
            {pctChange !== null && <span style={{ color: pctChange >= 0 ? GREEN : "#e74c3c", fontWeight: 700 }}>{pctChange >= 0 ? "+" : ""}{pctChange.toFixed(1)}%</span>}
          </div>
          {chartData.length === 0 ? <div style={{ textAlign: "center", color: MUTED, padding: "30px 0" }}>Nessun dato per questo mese</div> :
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `€${(v/1000).toFixed(1)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey={currentYear-1} fill="#bbb" radius={[3,3,0,0]} name={String(currentYear-1)} />
                <Bar dataKey={currentYear} fill={ORANGE} radius={[3,3,0,0]} name={String(currentYear)} />
              </BarChart>
            </ResponsiveContainer>
          }
        </div>
        {recentRecords.length > 0 && (
          <div style={{ background: CARD, borderRadius: 16, padding: "20px 16px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 16 }}>Dati {currentYear}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1.2fr 1fr 32px", gap: 4, marginBottom: 8 }}>
              {["DATA","COPERTI","INCASSO","€/COP",""].map((h,i) => <div key={i} style={{ fontSize: 10, letterSpacing: 1.5, color: MUTED, fontWeight: 700 }}>{h}</div>)}
            </div>
            {recentRecords.map((r: any) => {
              const mc = r.coperti ? Number(r.incasso)/r.coperti : 0;
              return (
                <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1.2fr 1fr 32px", gap: 4, alignItems: "center", padding: "10px 0", borderTop: "1px solid #f5f0e8" }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{fmtDate(r.date)}</span>
                  <span style={{ color: GREEN, fontWeight: 700 }}>{r.coperti}</span>
                  <span style={{ color: ORANGE, fontWeight: 700, fontSize: 13 }}>{fmtEur(r.incasso)}</span>
                  <span style={{ color: MUTED, fontSize: 13 }}>{fmtEur(mc)}</span>
                  <button onClick={() => handleDelete(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 16 }}>🗑</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import { Companion } from "../ui";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useApp } from "../store";
import { redact } from "../engine/redact";
import { checkSafety, crisisCopy, type SafetyLevel } from "../engine/safety";
import { SAFETY_CASES } from "../data/safetyCases";
import { Icon } from "../icons";
import { Seg, Switch, Tokens } from "../ui";

const LEVEL_LABEL: Record<SafetyLevel, string> = { none: "Stay quiet", support: "Show support", emergency: "Hand off now" };

function Row({ title, children, control }: { title: string; children: ReactNode; control: ReactNode }) {
  return (
    <div className="setrow">
      <div>
        <b>{title}</b>
        <p>{children}</p>
      </div>
      {control}
    </div>
  );
}

function SafetyLab() {
  const [filter, setFilter] = useState<"all" | "fail">("all");
  const [probe, setProbe] = useState("");
  const results = useMemo(() => SAFETY_CASES.map((c) => ({ c, r: checkSafety(c.text) })), []);
  const pass = results.filter((x) => x.r.level === x.c.expect).length;
  const probeResult = probe.trim() ? checkSafety(probe) : null;
  const groups = ["Everyday", "Ambiguous", "Support", "Emergency"] as const;
  const shown = filter === "fail" ? results.filter((x) => x.r.level !== x.c.expect) : results;

  return (
    <section className="panel" id="lab" aria-labelledby="lab-h">
      <div className="panel__head">
        <h2 id="lab-h" style={{ fontSize: "1.05rem" }}>Safety lab</h2>
        <span className="tiny">Fixed rules, no model. Runs in your browser.</span>
      </div>
      <div className="panel__body">
        <p className="small muted" style={{ maxWidth: "62ch" }}>
          Every message HEARD receives passes through these rules first. This page runs {SAFETY_CASES.length} sample messages through them so misses and false alarms are visible. When something slips through, add it as a case.
        </p>

        <div className="lab__try" style={{ marginTop: "1rem" }}>
          <label className="lbl" htmlFor="probe">Try your own sentence</label>
          <input id="probe" className="input" value={probe} onChange={(e) => setProbe(e.target.value)} placeholder="Type something to see what the rules would do" />
          {probeResult && (
            <div className="row" aria-live="polite">
              <span className="verdict" data-level={probeResult.level}>{LEVEL_LABEL[probeResult.level]}</span>
              {probeResult.matched[0] && <span className="small muted">Matched: “{probeResult.matched[0]}”</span>}
              {probeResult.level !== "none" && <span className="small muted">Shows: “{crisisCopy(probeResult).heading}”</span>}
            </div>
          )}
        </div>

        <div className="lab__sum" style={{ margin: "1.2rem 0 0.6rem" }}>
          <b className="nums">{pass} of {results.length} as expected</b>
          <div className="lab__bar" aria-hidden="true">
            <i style={{ width: `${(pass / results.length) * 100}%` }} />
          </div>
          <Seg label="Show" value={filter} onChange={setFilter} options={[{ id: "all", label: "All" }, { id: "fail", label: "Misses", n: results.length - pass }]} />
        </div>

        {shown.length === 0 && <p className="muted">No misses in this set. That says the set is passing, not that the rules are complete.</p>}
        {groups.map((g) => {
          const rows = shown.filter((x) => x.c.group === g);
          if (rows.length === 0) return null;
          return (
            <div key={g}>
              <h3 style={{ fontSize: "0.98rem", margin: "1rem 0 0.2rem" }}>{g}</h3>
              {rows.map(({ c, r }) => {
                const ok = r.level === c.expect;
                return (
                  <div className="labrow" key={c.id}>
                    <span className="dot" data-ok={ok} role="img" aria-label={ok ? "As expected" : "Not as expected"}>
                      <svg viewBox="0 0 24 24">
                        <path d={ok ? "M5 12.5l4.5 4.5L19 7.5" : "M7 7l10 10M17 7L7 17"} />
                      </svg>
                    </span>
                    <div className="labrow__t">
                      {c.text}
                      {c.note && <div className="labrow__note">{c.note}</div>}
                    </div>
                    <span className="chip chip--plain" title="Expected">Expected: {LEVEL_LABEL[c.expect]}</span>
                    <span className={`chip ${ok ? "chip--plain" : "chip--coral"}`} title="Got">Got: {LEVEL_LABEL[r.level]}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function Settings() {
  const { p, setP, setSettings, wipe, toast, storageOk, nav, clearNav, account, signOut, deleteAccount, setEntered, setGate, chooseAge } = useApp();
  const [ageAsk, setAgeAsk] = useState(false);
  const [delAcct, setDelAcct] = useState(false);
  const s = p.settings;
  const [sample, setSample] = useState("I'm Dara Okoye. Text me at (215) 555-0143 or dara.okoye@example.edu. I live at 4412 Larkspur Lane.");
  const [confirm, setConfirm] = useState(false);
  const labRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (nav?.lab) {
      labRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      clearNav();
    }
  }, [nav, clearNav]);

  const demo = useMemo(() => redact(sample), [sample]);

  const exportData = () => {
    try {
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ...p }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "heard-my-data.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast("Downloaded heard-my-data.json.");
    } catch {
      toast("This browser blocked the download.");
    }
  };

  const stored: [string, number][] = [
    ["People in your circle", p.people.length],
    ["Plan steps", p.steps.length],
    ["Saved library pieces", p.saved.length],
    ["Links you saved", p.links.length],
    ["Logged conversations", p.reachouts.length],
    ["Notes sent", p.notes.sent.length],
    ["Services in your list", p.myResources.length],
    ["Saved chats", p.history.length],
  ];

  return (
    <div className="page">
      <div className="settings">
        <div className="page__head">
          <Companion tab="settings" />
          <div>
            <h1>Privacy and settings</h1>
            <p>HEARD keeps everything in this browser. There is no server, and nothing is sent anywhere in this version. An account just locks what you save behind a passphrase.</p>
          </div>
        </div>

        {!storageOk && (
          <div className="sample-note" role="alert" style={{ marginBottom: "1rem" }}>
            <Icon n="info" size={20} />
            <span>This browser isn't letting HEARD save anything (a private window can do that). Everything works, but it resets when you close the tab.</span>
          </div>
        )}

        <div className="stack" style={{ gap: "1.2rem" }}>
          <section className="panel" aria-labelledby="age-h">
            <div className="panel__head"><h2 id="age-h" style={{ fontSize: "1.05rem" }}>Your age group</h2></div>
            <div className="panel__body">
              {p.age === "teen" ? (
                <>
                  <p>You're using the <b>13 to 17</b> version. Open Notes (posting to and hearing from strangers) is off, adult-only reading and services are hidden, and trusted adults are suggested first.</p>
                  {!ageAsk ? (
                    <button type="button" className="btn btn--quiet btn--sm" style={{ marginTop: "0.7rem" }} onClick={() => setAgeAsk(true)}>I'm 18 or older</button>
                  ) : (
                    <span className="row confirm" style={{ gap: "0.5rem", marginTop: "0.7rem" }}>
                      <p>Only switch if you're 18 or older. Switch?</p>
                      <button type="button" className="btn btn--primary btn--sm" onClick={() => { chooseAge("adult"); setAgeAsk(false); toast("Switched to the 18+ version."); }}>Yes, I'm 18+</button>
                      <button type="button" className="btn btn--quiet btn--sm" onClick={() => setAgeAsk(false)}>Stay in 13 to 17</button>
                    </span>
                  )}
                </>
              ) : (
                <>
                  <p>You're using the <b>18 and older</b> version. Only your age group is saved, never a birthdate.</p>
                  <button type="button" className="btn btn--quiet btn--sm" style={{ marginTop: "0.7rem" }} onClick={() => { chooseAge("teen"); toast("Switched to the 13 to 17 version."); }}>I'm 13 to 17</button>
                </>
              )}
            </div>
          </section>
          <section className="panel" aria-labelledby="acct-h">
            <div className="panel__head"><h2 id="acct-h" style={{ fontSize: "1.05rem" }}>Your account</h2></div>
            <div className="panel__body">
              {account ? (
                <>
                  <p>Signed in as <b>{account.name}</b>. Your circle, plan, saved reading, notes and settings are encrypted on this device with your passphrase.</p>
                  <p className="small muted" style={{ marginTop: "0.4rem" }}>If you forget the passphrase, the data can't be opened by anyone. Use "Download a backup" below if that worries you.</p>
                  <div className="row" style={{ gap: "0.5rem", marginTop: "0.8rem" }}>
                    <button type="button" className="btn btn--line btn--sm" onClick={signOut}>Log out</button>
                    {!delAcct ? (
                      <button type="button" className="btn btn--quiet btn--sm" onClick={() => setDelAcct(true)}>Delete this account</button>
                    ) : (
                      <span className="row confirm" style={{ gap: "0.5rem" }}>
                        <p>Delete {account.name} and everything saved under it?</p>
                        <button type="button" className="btn btn--coral btn--sm" onClick={() => { deleteAccount(); }}>Yes, delete it</button>
                        <button type="button" className="btn btn--quiet btn--sm" onClick={() => setDelAcct(false)}>Keep it</button>
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p>You're using HEARD as a guest. That's fine. An account lets you keep your circle, plan and notes locked behind a passphrase.</p>
                  <div className="row" style={{ gap: "0.5rem", marginTop: "0.8rem" }}>
                    <button type="button" className="btn btn--primary btn--sm" onClick={() => { setEntered(false); setTimeout(() => document.getElementById("account")?.scrollIntoView({ behavior: "smooth" }), 80); }}>Make an account</button>
                    <button type="button" className="btn btn--line btn--sm" onClick={() => setGate(true)}>Log in</button>
                  </div>
                </>
              )}
            </div>
          </section>
          <section className="panel" aria-labelledby="priv-h">
            <div className="panel__head"><h2 id="priv-h" style={{ fontSize: "1.05rem" }}>What happens to what you write</h2></div>
            <div className="panel__body">
              <Row
                title="Keep my conversations on this device"
                control={<Switch checked={s.keepHistory} label="Keep my conversations on this device" onChange={(v) => {
                  setSettings({ keepHistory: v });
                  if (!v) setP((x) => ({ ...x, history: [] }));
                  toast(v ? "New conversations will be kept here, with personal details already hidden." : "Saved chats deleted. Nothing new will be kept.");
                }} />}
              >
                Off by default. When on, conversations are saved in this browser only, after personal details are hidden. Turning it off deletes them.
              </Row>
              <Row
                title="Hide personal details before analysis"
                control={<Switch checked={s.mask} label="Hide personal details before analysis" onChange={(v) => setSettings({ mask: v })} />}
              >
                Emails, phone numbers, addresses, links, handles, schools, and names you introduce yourself with are swapped for placeholders. This is a rule-based first pass and it can miss things. A production version would use Microsoft Presidio on a server.
              </Row>
              <div className="lab__try" style={{ marginTop: "0.4rem" }}>
                <label className="lbl" htmlFor="mask-demo">See it work</label>
                <textarea id="mask-demo" className="textarea" rows={2} value={sample} onChange={(e) => setSample(e.target.value)} />
                <p className="small" aria-live="polite">
                  <b>HEARD would see:</b> <Tokens text={demo.text} />
                </p>
                <p className="tiny">
                  {demo.masks.length === 0 ? "Nothing to hide in this text." : `Hid ${demo.masks.length}: ${demo.masks.map((m) => m.kind).join(", ")}.`}
                </p>
              </div>
            </div>
          </section>

          <section className="panel" aria-labelledby="look-h">
            <div className="panel__head"><h2 id="look-h" style={{ fontSize: "1.05rem" }}>How it looks</h2></div>
            <div className="panel__body">
              <Row title="Text size" control={<Seg label="Text size" value={s.textSize} onChange={(v) => setSettings({ textSize: v })} options={[{ id: "regular", label: "Regular" }, { id: "large", label: "Large" }]} />}>
                Large raises everything by about 15 percent.
              </Row>
              <Row title="Theme" control={<Seg label="Theme" value={s.theme} onChange={(v) => setSettings({ theme: v })} options={[{ id: "system", label: "Auto" }, { id: "light", label: "Light" }, { id: "dark", label: "Dark" }]} />}>
                Auto follows your device.
              </Row>
              <Row title="Reduce motion" control={<Switch checked={s.reduceMotion} label="Reduce motion" onChange={(v) => setSettings({ reduceMotion: v })} />}>
                Turns off sliding, bouncing, and the pup's idle animations.
              </Row>
              <Row title="Show Milo" control={<Switch checked={s.milo} label="Show Milo" onChange={(v) => setSettings({ milo: v })} />}>
                Milo is the pup. If you'd rather a plainer screen, hide them.
              </Row>
            </div>
          </section>

          <section className="panel" aria-labelledby="data-h">
            <div className="panel__head"><h2 id="data-h" style={{ fontSize: "1.05rem" }}>What's stored on this device</h2></div>
            <div className="panel__body">
              <ul className="stores">
                {stored.map(([k, n]) => (
                  <li key={k}>
                    <span>{k}</span>
                    <b className="nums">{n}</b>
                  </li>
                ))}
              </ul>
              <div className="row" style={{ marginTop: "1rem" }}>
                <button type="button" className="btn btn--line" onClick={exportData}>
                  <Icon n="download" size={16} />
                  Download my data
                </button>
                <button type="button" className="btn btn--coralline" onClick={() => setConfirm(true)}>
                  <Icon n="trash" size={16} />
                  Erase everything
                </button>
              </div>
              {confirm && (
                <div className="confirm" role="alertdialog" aria-label="Confirm erase" style={{ marginTop: "0.9rem" }}>
                  <p>This deletes your circle, plan, saved pieces, logged conversations, and any saved chats, and puts back the starting examples. It can't be undone.</p>
                  <div className="row">
                    <button
                      type="button"
                      className="btn btn--coral btn--sm"
                      onClick={() => {
                        wipe();
                        setConfirm(false);
                        toast("Erased. HEARD is back to its starting examples.");
                      }}
                    >
                      Yes, erase everything
                    </button>
                    <button type="button" className="btn btn--line btn--sm" onClick={() => setConfirm(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="panel" aria-labelledby="about-h">
            <div className="panel__head"><h2 id="about-h" style={{ fontSize: "1.05rem" }}>About this prototype</h2></div>
            <div className="panel__body stack">
              <p>
                HEARD is an early prototype of an idea: use technology to send people toward each other, not to stand in for each other. It is for adults (18+) while the safety work is tested with counselors.
              </p>
              <p className="muted small">
                Topic reading, matching, and drafting here are rule-based so every result can be traced to the words that caused it. The library links to real public sources and summarizes them in its own words. HEARD is not a crisis service, not therapy, and it can't tell if you are safe. If you need someone now, the coral button in the corner is always there.
              </p>
            </div>
          </section>

          <div ref={labRef}>
            <SafetyLab />
          </div>
        </div>
      </div>
    </div>
  );
}

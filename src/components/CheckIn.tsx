import { useEffect, useState } from "react";
import { useApp } from "../store";
import { Icon } from "../icons";
import { Pup } from "../ui";
import { shortName } from "../engine/compose";
import { uid } from "../util";
import type { Outcome, Reachout } from "../types";

const DUE_AFTER_MS = 20 * 60 * 1000;
const WINDOW_MS = 21 * 86400000;

export const OUTCOME_LABEL: Record<Outcome, string> = {
  great: "Went well",
  okay: "It was okay",
  hard: "Hard / didn't land",
  "not-yet": "No answer yet",
};

/** Conversations you logged that HEARD hasn't asked about yet. Sample rows are never asked about. */
export function useDue(): Reachout[] {
  const { p } = useApp();
  const now = Date.now();
  return p.reachouts
    .filter((r) => !r.example && !r.followUp)
    .filter((r) => now - new Date(r.at).getTime() >= DUE_AFTER_MS && now - new Date(r.at).getTime() <= WINDOW_MS)
    .filter((r) => !r.snoozeUntil || new Date(r.snoozeUntil).getTime() <= now)
    .sort((a, b) => b.at.localeCompare(a.at));
}

const REPLY: Record<Outcome, { head: string; body: string }> = {
  great: { head: "I'm really glad.", body: "That counts, and it's worth noticing. A line about what made it easier will help next time." },
  okay: { head: "Okay is real progress.", body: "Hard things rarely land perfectly the first time. Is there something you didn't get to say?" },
  hard: { head: "That took courage, even so.", body: "It not going how you hoped doesn't mean you did it wrong, or that it was the wrong thing to do. Different people are good at different things." },
  "not-yet": { head: "Waiting is its own kind of hard.", body: "Silence usually isn't a no. People get busy and put replies off. A gentle nudge in a few days is normal." },
};

export function CheckInCard({ r, onDone, compact }: { r: Reachout; onDone?: () => void; compact?: boolean }) {
  const { setP, go, toast } = useApp();
  const first = shortName(r.name);
  const [picked, setPicked] = useState<Outcome | null>(null);
  const [note, setNote] = useState("");

  const patch = (fn: (x: Reachout) => Reachout) => setP((p) => ({ ...p, reachouts: p.reachouts.map((x) => (x.id === r.id ? fn(x) : x)) }));

  const choose = (o: Outcome) => {
    setPicked(o);
    patch((x) => ({ ...x, followUp: { outcome: o, at: new Date().toISOString() } }));
  };
  const saveNote = () => {
    if (!picked) return;
    patch((x) => ({ ...x, followUp: { outcome: picked, note: note.trim() || undefined, at: x.followUp?.at ?? new Date().toISOString() } }));
    toast(note.trim() ? "Saved your note." : "Saved.");
    onDone?.();
  };
  const snooze = () => {
    patch((x) => ({ ...x, snoozeUntil: new Date(Date.now() + 86400000).toISOString() }));
    toast("Okay, I'll ask again tomorrow.");
    onDone?.();
  };
  const addStep = (text: string, when: "today" | "week" | "later") => {
    setP((p) => ({ ...p, steps: [{ id: uid(), text, when, done: false }, ...p.steps] }));
    toast("Added to your plan.", { label: "Open plan", run: () => go("plan") });
  };

  const mood = picked === "great" ? "cheer" : picked === "hard" ? "listening" : "happy";

  return (
    <section className={`checkin${compact ? " checkin--compact" : ""}`} aria-label={`How did it go with ${first}?`}>
      <Pup mood={picked ? mood : "happy"} size={compact ? 52 : 72} />
      <div className="checkin__body">
        {!picked ? (
          <>
            <h3>How did it go with {first}?</h3>
            <p className="small muted">You {r.how === "in person" ? "talked in person" : `reached out by ${r.how}`} · no wrong answers. This just stays on your device.</p>
            <div className="checkin__opts" role="group" aria-label="How it went">
              {(Object.keys(OUTCOME_LABEL) as Outcome[]).map((o) => (
                <button key={o} type="button" className="btn btn--line btn--sm" onClick={() => choose(o)}>
                  {OUTCOME_LABEL[o]}
                </button>
              ))}
              {!compact && (
                <button type="button" className="btn btn--quiet btn--sm" onClick={snooze}>
                  Ask me tomorrow
                </button>
              )}
            </div>
          </>
        ) : (
          <div role="status">
            <h3>{REPLY[picked].head}</h3>
            <p className="small">{REPLY[picked].body}</p>
            <label className="sr" htmlFor={`ci-note-${r.id}`}>A note to yourself (optional)</label>
            <textarea id={`ci-note-${r.id}`} className="textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="A note to yourself (optional): what helped, or what you'd say next time" />
            <div className="checkin__opts">
              <button type="button" className="btn btn--primary btn--sm" onClick={saveNote}>
                Save
              </button>
              {(picked === "great" || picked === "okay") && (
                <button type="button" className="btn btn--line btn--sm" onClick={() => addStep(`Follow up with ${first}`, "week")}>
                  <Icon n="plus" size={15} />
                  Plan a follow-up
                </button>
              )}
              {picked === "not-yet" && (
                <button type="button" className="btn btn--line btn--sm" onClick={() => addStep(`Gentle nudge to ${first}`, "week")}>
                  <Icon n="plus" size={15} />
                  Plan a nudge
                </button>
              )}
              {picked === "hard" && (
                <>
                  <button type="button" className="btn btn--line btn--sm" onClick={() => go("people")}>
                    Pick someone else
                  </button>
                  <button type="button" className="btn btn--line btn--sm" onClick={() => go("talk", { prefill: "I tried to tell someone and it didn't go the way I hoped." })}>
                    Talk it through
                  </button>
                  <button type="button" className="btn btn--line btn--sm" onClick={() => go("help")}>
                    Find support
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** The next conversation that's due a check-in, if any. Stays on screen after an answer until the person is done with it. */
export function DueCheckIn() {
  const { p } = useApp();
  const due = useDue();
  const [shown, setShown] = useState<string | null>(null);
  useEffect(() => {
    if (!shown && due[0]) setShown(due[0].id);
  }, [shown, due]);
  const id = shown ?? due[0]?.id ?? null;
  const r = id ? p.reachouts.find((x) => x.id === id) : undefined;
  if (!r) return null;
  return <CheckInCard key={r.id} r={r} onDone={() => setShown(null)} />;
}

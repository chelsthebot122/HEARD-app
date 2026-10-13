import { useEffect, useRef } from "react";
import { useApp } from "../store";
import { ALWAYS_AVAILABLE, crisisCopy, type CrisisCopy, type Resource } from "../engine/safety";
import { Icon } from "../icons";
import { Pup } from "../ui";
import { copyText } from "../util";
import { shortName } from "../engine/compose";
import { crisisLines } from "../age";

// All wording here is fixed. Nothing on this sheet is generated.
const MANUAL: CrisisCopy = {
  heading: "Talk to someone right now",
  body: "These lines are free, open all day and night, and staffed by trained people. You don't need to be in a crisis to call or text.",
  resources: ALWAYS_AVAILABLE,
  canContinue: true,
};

const TRUSTED_MESSAGE = "I'm not doing okay right now and I don't want to be alone. Can you call me, or come over?";

function actionFor(r: Resource): { href: string; label: string } | null {
  if (/^[\d-]+$/.test(r.copy) && r.copy !== "741741") return { href: `tel:${r.copy.replace(/-/g, "")}`, label: "Call" };
  if (r.copy === "741741") return { href: "sms:741741?&body=HOME", label: "Text" };
  if (r.copy.includes(".")) return { href: `https://${r.copy}`, label: "Open" };
  return null;
}

export function CrisisSheet() {
  const { thread, p, openCrisis, toast } = useApp();
  const closeRef = useRef<HTMLButtonElement>(null);
  const base = thread.safety.level === "none" ? MANUAL : crisisCopy(thread.safety);
  const copy = { ...base, resources: crisisLines(base.resources, p.age) };
  const emergency = thread.safety.level === "emergency";
  const trusted = p.people.filter((x) => x.kind === "person");

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") openCrisis(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [openCrisis]);

  const doCopy = async (text: string, what: string) => {
    toast((await copyText(text)) ? `Copied ${what}.` : "Couldn't copy here. You can select the text instead.");
  };

  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && openCrisis(false)}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="crisis-h">
        <div className="sheet__head">
          <Pup mood="worried" size={72} />
          <div className="grow">
            <h2 id="crisis-h">{copy.heading}</h2>
          </div>
        </div>
        <div className="sheet__body">
          <p>{copy.body}</p>
          <ul className="res">
            {copy.resources.map((r) => {
              const act = actionFor(r);
              return (
                <li key={r.name} data-primary={r.primary ? "true" : "false"}>
                  <div>
                    <div className="res__name">{r.name}</div>
                    <div className="res__how">{r.how}</div>
                  </div>
                  <div className="row" style={{ gap: "0.4rem", flexWrap: "nowrap" }}>
                    {act && (
                      <a className={`btn btn--sm ${r.primary ? "btn--coral" : "btn--line"}`} href={act.href} {...(act.label === "Open" ? { target: "_blank", rel: "noreferrer" } : {})}>
                        {act.label}
                      </a>
                    )}
                    <button type="button" className="btn btn--sm btn--quiet" onClick={() => doCopy(r.copy, r.copy)} aria-label={`Copy ${r.name}`}>
                      <Icon n="copy" size={16} />
                    </button>
                  </div>
                  {r.detail && <p className="res__detail">{r.detail}</p>}
                </li>
              );
            })}
          </ul>

          {trusted.length > 0 && (
            <div>
              <h3 className="small" style={{ marginBottom: "0.4rem" }}>
                Ask someone you trust to be with you
              </h3>
              <p className="small muted" style={{ marginBottom: "0.5rem" }}>
                Tap a name to copy a short message you can paste into a text.
              </p>
              <div className="row" style={{ gap: "0.4rem" }}>
                {trusted.map((x) => (
                  <button key={x.id} type="button" className="chip" onClick={() => doCopy(TRUSTED_MESSAGE, `a message for ${shortName(x.name)}`)}>
                    {shortName(x.name).replace(/^(Aunt|Uncle|Coach|Dr\.) /, "")}
                  </button>
                ))}
              </div>
              <blockquote className="small muted" style={{ margin: "0.6rem 0 0", paddingLeft: "0.8rem", borderLeft: "3px solid var(--line)" }}>
                {TRUSTED_MESSAGE}
              </blockquote>
            </div>
          )}
        </div>
        <div className="sheet__foot">
          <p className="tiny" style={{ maxWidth: "34ch" }}>
            HEARD is a tool, not a person, and it can't keep you safe. People can.
          </p>
          <button ref={closeRef} type="button" className="btn btn--primary" onClick={() => openCrisis(false)}>
            {emergency ? "Close" : copy.canContinue ? "Back to HEARD" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

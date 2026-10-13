import { useState, type CSSProperties } from "react";
import { TYPE_HELP, TYPE_LABEL, type Source } from "../data/library";
import { useApp } from "../store";
import { Icon, TypeIcon } from "../icons";
import { fmtDay } from "../ui";
import { Sheet, useCompact } from "./Sheet";

export function SourceItem({
  source,
  because,
  index = 0,
  openByDefault = false,
  canHide = true,
}: {
  source: Source;
  because?: string[];
  index?: number;
  openByDefault?: boolean;
  canHide?: boolean;
}) {
  const { p, setP, toast } = useApp();
  const [open, setOpen] = useState(openByDefault);
  const compact = useCompact();
  const saved = p.saved.includes(source.id);

  const toggleSave = () => {
    setP((x) => ({ ...x, saved: saved ? x.saved.filter((i) => i !== source.id) : [source.id, ...x.saved] }));
    toast(saved ? "Removed from saved." : "Saved. You'll find it under Library, Saved.");
  };
  const removeMine = () => {
    const id = source.id.replace(/^u-/, "");
    const prev = p.links;
    setP((x) => ({ ...x, links: x.links.filter((l) => l.id !== id), saved: x.saved.filter((i) => i !== source.id) }));
    toast("Removed your link.", { label: "Undo", run: () => setP((x) => ({ ...x, links: prev })) });
  };
  const hide = () => {
    setP((x) => ({ ...x, dismissed: [...x.dismissed, source.id] }));
    toast("Hidden from your results.", {
      label: "Undo",
      run: () => setP((x) => ({ ...x, dismissed: x.dismissed.filter((i) => i !== source.id) })),
    });
  };

  return (
    <li className="src" style={{ "--d": index } as CSSProperties}>
      <div className="src__top">
        <span className="badge">
          <TypeIcon type={source.type} />
          {TYPE_LABEL[source.type]}
        </span>
        {source.mine ? <span className="chip chip--mine">Saved by you</span> : source.minutes > 0 && <span className="nums">{source.minutes} min read</span>}
        <span>{source.mine ? "Saved" : "Checked"} {fmtDay(source.added)}</span>
      </div>
      <h3>{source.title}</h3>
      <div className="src__by">{source.by}</div>
      <p className="src__ex">{source.excerpt}</p>
      {because && because.length > 0 && <div className="src__because">Matches: {because.join(", ")}</div>}

      {compact && open ? (
        <Sheet title={source.title} onClose={() => setOpen(false)}>
          <p className="src__by" style={{ marginTop: 0 }}>{source.by}</p>
          <div className="src__body src__body--sheet">
            {source.body.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
            {source.url && (
              <p>
                <a className="btn btn--line btn--sm" href={source.url} target="_blank" rel="noopener noreferrer">
                  Open at {source.publisher ?? "the source"}
                  <span aria-hidden="true">↗</span>
                </a>
              </p>
            )}
            <p className="src__help">{TYPE_HELP[source.type]}{source.url ? " This is HEARD's short summary. The full piece is at the link." : ""}</p>
            {source.terms && <p className="tiny">{source.terms}</p>}
          </div>
        </Sheet>
      ) : (
      <div className="src__more" data-open={open && !compact} aria-hidden={!open || compact}>
        <div>
          <div className="src__body">
            {source.body.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
            {source.url && (
              <p>
                <a className="btn btn--line btn--sm" href={source.url} target="_blank" rel="noopener noreferrer">
                  Open at {source.publisher ?? "the source"}
                  <span aria-hidden="true">↗</span>
                </a>
              </p>
            )}
            <p className="src__help">{TYPE_HELP[source.type]}{source.url ? " This is HEARD's short summary. The full piece is at the link." : ""}</p>
            {source.terms && <p className="tiny">{source.terms}</p>}
          </div>
        </div>
      </div>

      )}

      <div className="src__act">
        <button type="button" className="btn btn--quiet btn--sm" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? "Show less" : source.url ? "Summary and link" : "Read more"}
          <Icon n="chevron" size={16} className={open ? "flip" : undefined} />
        </button>
        <button type="button" className="btn btn--quiet btn--sm btn--save" aria-pressed={saved} onClick={toggleSave}>
          <Icon n="heart" size={16} filled={saved} />
          {saved ? "Saved" : "Save"}
        </button>
        {source.mine && (
          <button type="button" className="btn btn--quiet btn--sm" onClick={removeMine}>
            Remove
          </button>
        )}
        {canHide && !source.mine && (
          <button type="button" className="btn btn--quiet btn--sm" onClick={hide}>
            Not for me
          </button>
        )}
      </div>
    </li>
  );
}

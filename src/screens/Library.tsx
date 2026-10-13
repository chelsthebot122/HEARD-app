import { useEffect, useMemo, useState } from "react";
import { useApp } from "../store";
import { LIBRARY, TYPE_LABEL, type SourceType } from "../data/library";
import { AddLink } from "../components/AddLink";
import { linkToSource } from "../links";
import { TOPICS, TOPIC_BY_ID, type TopicId } from "../engine/topics";
import { SourceItem } from "../components/SourceItem";
import { Icon } from "../icons";
import { Pup, Companion, Seg } from "../ui";
import { forAge, teenFirst } from "../age";
import { Sheet } from "../components/Sheet";

export function Library() {
  const { p, setP, nav, clearNav } = useApp();
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState<"all" | TopicId>("all");
  const [type, setType] = useState<"all" | SourceType>("all");
  const [scope, setScope] = useState<"all" | "saved" | "yours">(nav?.onlySaved ? "saved" : "all");
  const [adding, setAdding] = useState(!!nav?.addLink);
  const [fOpen, setFOpen] = useState(false);
  const mine = useMemo(() => p.links.map(linkToSource), [p.links]);
  const everything = useMemo(() => teenFirst(forAge([...mine, ...LIBRARY], p.age), p.age), [mine, p.age]);
  const [sort, setSort] = useState<"new" | "short">("new");
  const [openId, setOpenId] = useState<string | null>(nav?.open ?? null);

  useEffect(() => {
    if (nav) {
      if (nav.onlySaved) setScope("saved");
      if (nav.addLink) setAdding(true);
      if (nav.open) setOpenId(nav.open);
      clearNav();
    }
  }, [nav, clearNav]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = everything.filter((s) => {
      if (scope === "saved" && !p.saved.includes(s.id)) return false;
      if (scope === "yours" && !s.mine) return false;
      if (type !== "all" && s.type !== type) return false;
      if (topic !== "all" && !s.topics.includes(topic)) return false;
      if (!needle) return true;
      const hay = [s.title, s.excerpt, s.by, ...s.body, ...s.topics.map((t) => TOPIC_BY_ID[t].label)].join(" ").toLowerCase();
      return needle.split(/\s+/).every((w) => hay.includes(w));
    });
    return [...list].sort((a, b) => (sort === "new" ? b.added.localeCompare(a.added) : a.minutes - b.minutes || b.added.localeCompare(a.added)));
  }, [q, topic, type, scope, sort, p.saved, everything]);

  const filtered = q !== "" || topic !== "all" || type !== "all";
  const clear = () => {
    setQ("");
    setTopic("all");
    setType("all");
  };

  return (
    <div className="page">
      <div className="page__head">
        <Companion tab="library" />
        <div>
          <h1>Library</h1>
          <p>Everything HEARD can point you to, in one place. Each piece is labelled as a personal story, general information, or professional guidance.</p>
        </div>
      </div>

      <div className="sample-note" role="note">
        <Icon n="info" size={20} />
        <span>
          <b>Real sources, linked.</b> Every piece below sits at its original publisher. HEARD adds a short summary in its own words and tells you who wrote it and what they say about reuse. Some topics have nothing vetted yet, and that's on purpose: you can save a link you trust.
        </span>
      </div>

      <div style={{ margin: "0.9rem 0" }}>
        {adding ? (
          <Sheet title="Save a link" onClose={() => setAdding(false)}>
            <AddLink onClose={() => { setAdding(false); }} onSaved={() => setScope("yours")} />
          </Sheet>
        ) : (
          <button type="button" className="btn btn--line" onClick={() => setAdding(true)}>
            <Icon n="plus" size={17} />
            Save a link
          </button>
        )}
      </div>

      <button type="button" className="btn btn--line m-only filterbtn" onClick={() => setFOpen(true)}>
        <Icon n="sliders" size={17} />
        Search and filter
        {filtered || scope !== "all" ? <span className="chip chip--coral" style={{ padding: "0 0.5rem", fontSize: "0.8rem" }}>On</span> : null}
        <span className="nums grow" style={{ textAlign: "right" }}>{results.length} {results.length === 1 ? "piece" : "pieces"}</span>
      </button>
      <Sheet title="Search and filter" open={fOpen} onClose={() => setFOpen(false)}>
      <div className="panel">
        <div className="panel__body">
          <div className="filters">
            <div className="field">
              <label htmlFor="lib-q">Search</label>
              <input id="lib-q" className="input" type="search" placeholder="Try “stress”, “grief”, or “bullying”" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="lib-topic">Topic</label>
              <select id="lib-topic" className="select" value={topic} onChange={(e) => setTopic(e.target.value as "all" | TopicId)}>
                <option value="all">All topics</option>
                {TOPICS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="lib-type">Kind</label>
              <select id="lib-type" className="select" value={type} onChange={(e) => setType(e.target.value as "all" | SourceType)}>
                <option value="all">All kinds</option>
                {(Object.keys(TYPE_LABEL) as SourceType[]).map((k) => (
                  <option key={k} value={k}>
                    {TYPE_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="filters__row">
            <Seg
              label="Show"
              value={scope}
              onChange={setScope}
              options={[
                { id: "all", label: "Everything", n: everything.length },
                { id: "yours", label: "Yours", n: mine.length },
                { id: "saved", label: "Saved", n: p.saved.length },
              ]}
            />
            <Seg
              label="Sort"
              value={sort}
              onChange={setSort}
              options={[
                { id: "new", label: "Newest" },
                { id: "short", label: "Shortest" },
              ]}
            />
            <span className="count nums" aria-live="polite">
              {results.length} {results.length === 1 ? "piece" : "pieces"}
            </span>
            {filtered && (
              <button type="button" className="btn btn--quiet btn--sm" onClick={clear}>
                Clear filters
              </button>
            )}
            {p.dismissed.length > 0 && (
              <button type="button" className="btn btn--quiet btn--sm" onClick={() => setP((x) => ({ ...x, dismissed: [] }))}>
                Restore {p.dismissed.length} hidden from Talk
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="m-only sheetdone">
        <button type="button" className="btn btn--primary" onClick={() => setFOpen(false)}>Show {results.length} {results.length === 1 ? "piece" : "pieces"}</button>
      </div>
      </Sheet>

      {results.length === 0 ? (
        <div className="empty">
          <Pup mood="listening" size={96} />
          <h3>{scope === "saved" && !filtered ? "Nothing saved yet" : "No match"}</h3>
          <p>
            {scope === "saved" && !filtered
              ? "Tap Save on anything that helps and it will wait for you here."
              : "Try fewer words, or clear the filters."}
          </p>
          {(filtered || scope === "saved") && (
            <button
              type="button"
              className="btn btn--line"
              style={{ marginTop: "0.8rem" }}
              onClick={() => {
                clear();
                setScope("all");
              }}
            >
              Show everything
            </button>
          )}
        </div>
      ) : (
        <>
        <h2 className="sr">Sources</h2>
        <ul className="srcs lib-grid" style={{ marginTop: "0.8rem" }}>
          {results.map((s, i) => (
            <SourceItem key={s.id + (openId === s.id ? "-open" : "")} source={s} index={Math.min(i, 8)} canHide={false} openByDefault={openId === s.id} />
          ))}
        </ul>
        </>
      )}
    </div>
  );
}

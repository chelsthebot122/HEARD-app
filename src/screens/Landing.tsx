import { useEffect, useRef, useState } from "react";
import { Pet } from "../Pet";
import { Milo } from "../Milo";
import { Icon, TypeIcon } from "../icons";
import { useApp } from "../store";
import { redact } from "../engine/redact";
import { Tokens } from "../ui";
import { AuthForm } from "../components/Auth";
import { listAccounts } from "../auth";

const PHRASES = ["when you eat lunch alone.", "when your best friend goes quiet.", "three weeks after a loss.", "when you can't find the words."];

const ROWS: { what: string; search: string; bot: string; heard: string }[] = [
  { what: "Shows experiences like yours", search: "Sometimes", bot: "Rarely", heard: "Yes" },
  { what: "Says what kind of source each thing is", search: "No", bot: "No", heard: "Yes" },
  { what: "Helps you write the first message to a person", search: "No", bot: "Sometimes", heard: "Yes" },
  { what: "Points you toward people, not toward itself", search: "No", bot: "Rarely", heard: "By design" },
  { what: "Keeps nothing unless you say so", search: "Varies", bot: "Varies", heard: "Yes" },
];

export function Landing() {
  const { setEntered, go, openCrisis, setGate, account } = useApp();
  const acct = useRef<HTMLElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const finale = useRef<HTMLElement>(null);
  const next = useRef<HTMLElement>(null);
  const [i, setI] = useState(0);
  const [pill, setPill] = useState(false);
  const [sample, setSample] = useState("I'm Dara Okoye. Text me at (215) 555-0143 or dara.okoye@example.edu, I'm at 4412 Larkspur Lane.");
  const hid = redact(sample);

  const enter = () => {
    if (listAccounts().length && !account) return setGate(true);
    setEntered(true);
    go("talk");
  };
  const guest = () => {
    setEntered(true);
    go("talk");
  };

  // rotate the hero phrase
  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const t = window.setInterval(() => setI((x) => (x + 1) % PHRASES.length), 3400);
    return () => window.clearInterval(t);
  }, []);

  // reveal on scroll; everything stays visible if scripting or observers are missing
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    el.setAttribute("data-js", "1");
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12 },
    );
    el.querySelectorAll(".reveal").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  // the floating button appears after a little scrolling and steps aside at the finale
  useEffect(() => {
    const onScroll = () => {
      const f = finale.current?.getBoundingClientRect();
      const nearEnd = f ? f.top < window.innerHeight * 0.75 : false;
      setPill(window.scrollY > 260 && !nearEnd);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="lp" ref={root}>
      <header className="lp-hdr">
        <div className="lp-wrap lp-hdr__in">
          <span className="brand" style={{ cursor: "default" }}>
            <Milo mood="happy" size={38} />
            <span>HEARD</span>
          </span>
          <div className="hdr__right">
            <button type="button" className="btn btn--quiet btn--sm" onClick={() => acct.current?.scrollIntoView({ behavior: "smooth" })}>
              {listAccounts().length ? "Log in" : "Make an account"}
            </button>
            <button type="button" className="btn btn--quiet btn--sm" onClick={enter}>
              Skip to HEARD
            </button>
            <button type="button" className="btn btn--coral btn--sm btn--crisis" onClick={() => openCrisis(true)}>
              <Icon n="phone" size={17} />
              <span className="long">Need someone now?</span>
              <span className="sr">Help</span>
            </button>
          </div>
        </div>
      </header>

      <main id="main">
      <section className="lp-hero lp-wrap" aria-labelledby="lp-h1">
        <div className="lp-hero__text">
          <p className="lp-eyebrow">HEARD · a first step toward people</p>
          <h1 id="lp-h1" aria-label="Everyone wants to feel heard">
            Everyone wants to feel heard
            <span className="lp-rot" aria-hidden="true">
              <span key={i} className="lp-rot__in">
                {PHRASES[i]}
              </span>
            </span>
          </h1>
          <p className="lp-lead">
            HEARD helps you put a hard thing into words, shows you that other people have been through something like it, and helps you work out who to tell. It's a bridge to the people in your life, not a stand-in for them.
          </p>
          <div className="lp-cta-row">
            <button type="button" className="btn btn--primary lp-btn" onClick={() => next.current?.scrollIntoView({ behavior: "smooth" })}>
              See how it works
              <Icon n="chevron" size={18} />
            </button>
            <button type="button" className="btn btn--line lp-btn" onClick={enter}>
              Take me to HEARD
            </button>
          </div>
        </div>

        <div className="lp-stage" aria-hidden="true">
          <span className="lp-bubble lp-b1">I eat lunch in the library</span>
          <span className="lp-bubble lp-b2">she left me on read</span>
          <span className="lp-bubble lp-b3">I can't explain it without sounding ungrateful</span>
          <div className="lp-milo">
            <Pet decorative><Milo mood="listening" size={210} /></Pet>
          </div>
          <div className="lp-bridge">
            <span className="lp-bridge__from">your words</span>
            <svg className="lp-bridge__line" viewBox="0 0 120 12" preserveAspectRatio="none">
              <line x1="0" y1="6" x2="120" y2="6" />
            </svg>
            <span className="lp-people">
              <i>M</i>
              <i>T</i>
              <i>R</i>
            </span>
          </div>
        </div>
        <button type="button" className="lp-scroll" onClick={() => next.current?.scrollIntoView({ behavior: "smooth" })} aria-label="Scroll down">
          <span>Scroll</span>
          <Icon n="chevron" size={18} />
        </button>
      </section>

      <section className="lp-sec lp-wrap lp-gap reveal" ref={next} aria-labelledby="lp-gap-h">
        <div>
          <h2 id="lp-gap-h">There's a gap between searching and talking.</h2>
          <p className="lp-p">
            Search gives generic advice. Social media has real experiences, but they're hard to find and hard to trust. A chatbot answers instantly and can start to feel like enough. None of them help with the hardest part: telling someone.
          </p>
          <p className="lp-p">HEARD sits in that gap and points the other way.</p>
        </div>
        <div className="lp-tablewrap">
          <table className="lp-table">
            <thead>
              <tr>
                <th scope="col"><span className="sr">What it does</span></th>
                <th scope="col">Search</th>
                <th scope="col">Chatbots</th>
                <th scope="col" className="is-heard">HEARD</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.what}>
                  <th scope="row">{r.what}</th>
                  <td>{r.search}</td>
                  <td>{r.bot}</td>
                  <td className="is-heard">{r.heard}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="tiny">General tendencies, not a review of any one product.</p>
        </div>
      </section>

      <section className="lp-sec lp-wrap" aria-labelledby="lp-how-h">
        <h2 id="lp-how-h" className="reveal">Three steps, and the last one is a person.</h2>
        <ol className="lp-steps">
          <li className="reveal">
            <div className="lp-step__n">1</div>
            <div>
              <h3>Say what's going on</h3>
              <p>In your own words, as messy as they come. HEARD shows you which phrases it picked up on, and you can correct it.</p>
            </div>
            <div className="lp-mock" aria-hidden="true">
              <p>
                I <mark className="hl">switched schools</mark> in January and I eat lunch in the library so nobody can see I'm <mark className="hl">alone</mark>.
              </p>
              <div className="topics">
                <span className="chip chip--topic">Feeling alone</span>
                <span className="chip chip--topic">A big change</span>
              </div>
            </div>
          </li>
          <li className="reveal">
            <div className="lp-step__n">2</div>
            <div>
              <h3>See you're not the only one</h3>
              <p>Stories, plain-language information, and professional guidance, each one labelled so you know what you're reading.</p>
            </div>
            <div className="lp-mock" aria-hidden="true">
              <div className="lp-mini"><TypeIcon type="experience" /> Personal experience</div>
              <div className="lp-mini"><TypeIcon type="general" /> General information</div>
              <div className="lp-mini"><TypeIcon type="professional" /> Professional guidance</div>
            </div>
          </li>
          <li className="reveal">
            <div className="lp-step__n">3</div>
            <div>
              <h3>Choose someone to tell</h3>
              <p>Pick a person from your circle and get a first sentence you can change. HEARD never sends it for you.</p>
            </div>
            <div className="lp-mock" aria-hidden="true">
              <p className="serif">"Hi Marisol, I've been carrying something around and I'd feel better saying it out loud to you."</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="lp-band" aria-labelledby="lp-priv-h">
        <div className="lp-wrap lp-priv reveal">
          <div>
            <h2 id="lp-priv-h">Private before it's anything else.</h2>
            <p className="lp-p">
              Names, emails, phone numbers, and addresses are hidden before anything is analysed. Nothing you write is kept unless you turn that on. Try it. Type something with a detail in it.
            </p>
          </div>
          <div className="lp-demo">
            <label className="lbl" htmlFor="lp-sample">What you write</label>
            <textarea id="lp-sample" className="textarea" rows={3} value={sample} onChange={(e) => setSample(e.target.value)} />
            <p className="lbl" style={{ marginTop: "0.8rem" }}>What HEARD sees</p>
            <p className="lp-demo__out" aria-live="polite">
              <Tokens text={hid.text} />
            </p>
            <p className="tiny">{hid.masks.length ? `Hid ${hid.masks.length}: ${hid.masks.map((m) => m.kind).join(", ")}.` : "Nothing to hide here."}</p>
          </div>
        </div>
      </section>

      <section className="lp-sec lp-wrap lp-safe reveal" aria-labelledby="lp-safe-h">
        <Milo mood="worried" size={96} />
        <div>
          <h2 id="lp-safe-h">Real help is always one tap away.</h2>
          <p className="lp-p">
            If something you write sounds serious, HEARD stops and shows you who to call or text, and doesn't try to handle it itself. It isn't therapy and it isn't a crisis service. It's for ages 13 and up, and teens get extra protections while the safety work is tested with counselors.
          </p>
          <button type="button" className="btn btn--coralline" onClick={() => openCrisis(true)}>
            <Icon n="phone" size={17} />
            See who to call or text
          </button>
        </div>
      </section>

      <section className="lp-sec lp-wrap lp-acct reveal" ref={acct} id="account" aria-labelledby="lp-acct-h">
        <div>
          <h2 id="lp-acct-h">Keep things for yourself.</h2>
          <p className="lp-p">
            An account is optional. It lets you save your circle, your plan and your notes, and keeps them locked behind a passphrase only you know.
          </p>
          <ul className="lp-points">
            <li><Icon n="lock" size={20} /><span>Encrypted on this device. No email or phone number needed.</span></li>
            <li><Icon n="check" size={20} /><span>Your circle, plan, saved reading and notes are there when you come back.</span></li>
            <li><Icon n="people" size={20} /><span>Prefer not to? Use HEARD as a guest. Nothing is lost by skipping this.</span></li>
          </ul>
          <button type="button" className="btn btn--line" onClick={guest}>Continue without an account</button>
        </div>
        <div className="panel">
          <AuthForm id="lp" />
        </div>
      </section>

      <section className="lp-final reveal" ref={finale} aria-labelledby="lp-final-h">
        <div className="lp-wrap lp-final__in">
          <Milo mood="happy" size={150} />
          <h2 id="lp-final-h">It's time to be heard.</h2>
          <p className="lp-p">Free. An account is optional. Start with one sentence.</p>
          <button type="button" className="btn btn--primary lp-btn lp-btn--big" onClick={enter}>
            Take me to HEARD
            <Icon n="send" size={18} />
          </button>
        </div>
      </section>
      </main>

      <button type="button" className="btn btn--primary lp-pill" data-show={pill} tabIndex={pill ? 0 : -1} aria-hidden={!pill} onClick={enter}>
        Take me to HEARD
        <Icon n="send" size={16} />
      </button>
    </div>
  );
}

import { useApp } from "../store";
import { ALWAYS_AVAILABLE } from "../engine/safety";
import { Icon } from "../icons";
import { Pup } from "../ui";
import { Milo } from "../Milo";
import { Pet } from "../Pet";

export function Onboarding() {
  const { chooseAge, setMinor } = useApp();
  return (
    <main className="onb" id="main">
      <div className="onb__in">
        <div className="onb__dog">
          <Pet><Milo mood="happy" size={190} label="Milo, HEARD's pup" /></Pet>
          <p className="serif" style={{ marginTop: "0.8rem", fontWeight: 700, fontSize: "1.1rem" }}>
            Hi, I'm Milo.
          </p>
          <p className="small muted" style={{ textAlign: "center", maxWidth: "26ch" }}>
            I'm a drawing of a dog on a tool. I help you find words and people.
          </p>
        </div>
        <div>
          <p className="tiny" style={{ letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 800 }}>
            HEARD · prototype
          </p>
          <h1 style={{ marginTop: "0.3rem" }}>Say it here first. Then say it to someone.</h1>
          <p className="muted" style={{ marginTop: "0.6rem", maxWidth: "52ch" }}>
            HEARD helps you put a hard thing into words, shows you that other people have been through something like it, and helps you work out who to tell.
          </p>
          <ul className="cols">
            <li>
              <Icon n="people" size={22} />
              <span>
                <b>Not a friend or a therapist.</b> It's a bridge to the people in your life. You'll be nudged toward them, on purpose.
              </span>
            </li>
            <li>
              <Icon n="lock" size={22} />
              <span>
                <b>Private by default.</b> Names, emails, and phone numbers are hidden before anything is analysed. Nothing you write is kept unless you turn that on.
              </span>
            </li>
            <li>
              <Icon n="phone" size={22} />
              <span>
                <b>Real help is one tap away.</b> If something sounds serious, HEARD shows you who to call and stops there. The button is always in the top corner.
              </span>
            </li>
          </ul>
          <div className="onb__ask">
            <p className="onb__q" id="age-q">How old are you?</p>
            <div className="onb__ages" role="group" aria-labelledby="age-q">
              <button type="button" className="btn btn--primary" onClick={() => chooseAge("adult")}>
                I'm 18 or older
              </button>
              <button type="button" className="btn btn--primary" onClick={() => chooseAge("teen")}>
                I'm 13 to 17
              </button>
              <button type="button" className="btn btn--line" onClick={() => setMinor(true)}>
                I'm under 13
              </button>
            </div>
          </div>
          <p className="tiny" style={{ marginTop: "0.8rem", maxWidth: "52ch" }}>
            HEARD is for ages 13 and up. Teens get the same app with extra protections, like no open notes from strangers and a trusted adult suggested first. HEARD only remembers which group you picked, never your birthday. It isn't a crisis service.
          </p>
        </div>
      </div>
    </main>
  );
}

export function MinorScreen() {
  const { setMinor } = useApp();
  const lines = ALWAYS_AVAILABLE.filter((r) => /988|Crisis Text|findahelpline/.test(r.name + r.copy));
  return (
    <main className="onb" id="main">
      <div className="onb__in">
        <div className="onb__dog">
          <Pup mood="listening" size={170} label="Milo" />
        </div>
        <div>
          <h1>HEARD is for ages 13 and up.</h1>
          <p className="muted" style={{ marginTop: "0.6rem", maxWidth: "52ch" }}>
            Younger kids need protections HEARD doesn't have, so it isn't open to you yet. That's about safety, not about you. If something is weighing on you, telling a trusted adult, like a parent, a teacher, a school counselor, or a relative, is a strong first step. These lines are free and are there for you too.
          </p>
          <ul className="res" style={{ marginTop: "1rem", maxWidth: "52ch" }}>
            {lines.map((r) => (
              <li key={r.name} data-primary={r.primary ? "true" : "false"}>
                <div>
                  <div className="res__name">{r.name}</div>
                  <div className="res__how">{r.how}</div>
                </div>
                {r.detail && <p className="res__detail">{r.detail}</p>}
              </li>
            ))}
          </ul>
          <div className="onb__ask">
            <button type="button" className="btn btn--line" onClick={() => setMinor(false)}>
              Go back
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

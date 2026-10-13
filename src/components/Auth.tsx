import { useState, type FormEvent } from "react";
import { useApp } from "../store";
import { checkPassphrase, cryptoOk, listAccounts, MIN_PASS } from "../auth";
import { Icon } from "../icons";
import { Milo } from "../Milo";

/** Make an account or log in. Used on the home page, the log-in screen, and nowhere else needs to know how it works. */
export function AuthForm({ initial = "signup", id = "auth" }: { initial?: "signup" | "login"; id?: string }) {
  const { signUp, signIn, go } = useApp();
  const accounts = listAccounts();
  const [mode, setMode] = useState<"signup" | "login">(initial === "login" && accounts.length ? "login" : "signup");
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [again, setAgain] = useState("");
  const [age, setAge] = useState<"" | "adult" | "teen" | "under13">("");
  const [which, setWhich] = useState(accounts[0]?.id ?? "");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!cryptoOk())
    return (
      <div className="sample-note" role="note">
        <Icon n="info" size={20} />
        <span>This browser can't encrypt data, so accounts aren't available here. You can still use HEARD without one.</span>
      </div>
    );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (mode === "signup") {
      if (!age) return setErr("Pick your age group first.");
      if (age === "under13") return setErr("HEARD is for ages 13 and up, so we can't make an account for you. A trusted adult, like a parent or a school counselor, is a good first person to talk to. You can call or text 988 any time.");
      const bad = checkPassphrase(pass);
      if (bad) return setErr(bad);
      if (pass !== again) return setErr("The two passphrases don't match.");
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        await signUp(name, pass, age as "adult" | "teen");
        go("talk");
      } else {
        const rec = accounts.find((a) => a.id === which);
        if (!rec) return setErr("Pick an account.");
        const ok = await signIn(rec, pass);
        if (!ok) return setErr("That passphrase doesn't open this account.");
        go("talk");
      }
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="authf" onSubmit={submit} aria-labelledby={`${id}-h`} noValidate>
      {accounts.length > 0 && (
        <div className="authf__tabs" role="group" aria-label="Account choice">
          <button type="button" aria-pressed={mode === "signup"} onClick={() => { setMode("signup"); setErr(null); }}>New account</button>
          <button type="button" aria-pressed={mode === "login"} onClick={() => { setMode("login"); setErr(null); }}>Log in</button>
        </div>
      )}
      <h3 id={`${id}-h`} className="sr">{mode === "signup" ? "Make an account" : "Log in"}</h3>

      {mode === "login" ? (
        <>
          {accounts.length > 1 && (
            <div className="field">
              <label htmlFor={`${id}-which`}>Account</label>
              <select id={`${id}-which`} className="input" value={which} onChange={(e) => setWhich(e.target.value)}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}
          {accounts.length === 1 && <p className="small">Welcome back, <b>{accounts[0].name}</b>.</p>}
        </>
      ) : (
        <div className="field">
          <label htmlFor={`${id}-name`}>What should Milo call you?</label>
          <input id={`${id}-name`} className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="A nickname is fine" maxLength={30} autoComplete="off" />
        </div>
      )}

      <div className="field">
        <label htmlFor={`${id}-pass`}>Passphrase</label>
        <div className="passrow">
          <input id={`${id}-pass`} className="input" type={show ? "text" : "password"} value={pass} onChange={(e) => setPass(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder={mode === "signup" ? `At least ${MIN_PASS} characters` : ""} />
          <button type="button" className="btn btn--quiet btn--sm" onClick={() => setShow((s) => !s)} aria-pressed={show}>{show ? "Hide" : "Show"}</button>
        </div>
      </div>
      {mode === "signup" && (
        <>
          <div className="field">
            <label htmlFor={`${id}-again`}>Type it again</label>
            <input id={`${id}-again`} className="input" type={show ? "text" : "password"} value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" />
          </div>
          <fieldset className="agepick">
            <legend>How old are you?</legend>
            {([["adult", "18 or older"], ["teen", "13 to 17"], ["under13", "Under 13"]] as const).map(([v, l]) => (
              <label key={v}>
                <input type="radio" name={`${id}-age`} value={v} checked={age === v} onChange={() => setAge(v)} />
                <span>{l}</span>
              </label>
            ))}
            <span className="tiny">Only the group is saved, never your birthday. 13 to 17 has extra protections.</span>
          </fieldset>
        </>
      )}

      {err && (
        <p className="authf__err" role="alert">
          <Icon n="info" size={17} /> {err}
        </p>
      )}
      <button type="submit" className="btn btn--primary" disabled={busy}>
        {busy ? "One moment…" : mode === "signup" ? "Make my account" : "Log in"}
      </button>
      {mode === "signup" && (
        <p className="tiny">
          No email, no phone number. Your data is encrypted on this device with your passphrase. <b>If you forget it, it can't be recovered</b> by anyone, including us. There's a backup button in settings.
        </p>
      )}
    </form>
  );
}

/** Shown when someone with an account on this device taps "Take me to HEARD". */
export function AuthGate() {
  const { setGate, setEntered, go } = useApp();
  const guest = () => {
    setGate(false);
    setEntered(true);
    go("talk");
  };
  return (
    <div className="gate">
      <div className="gate__in">
        <Milo mood="wave" size={150} label="Milo, waving" />
        <h1>Welcome back.</h1>
        <p className="muted">Log in to open your saved circle, plan and notes, or carry on without an account.</p>
        <AuthForm initial="login" id="gate" />
        <div className="gate__alt">
          <button type="button" className="btn btn--line" onClick={guest}>Continue without an account</button>
          <button type="button" className="btn btn--quiet" onClick={() => setGate(false)}>Back</button>
        </div>
      </div>
    </div>
  );
}

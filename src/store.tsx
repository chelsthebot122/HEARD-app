import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Age, Persisted, Settings, Thread } from "./types";
import { SEED_PEOPLE, SEED_REACHOUTS, SEED_STEPS } from "./data/seed";
import { withAge } from "./store.logic";
import { checkSafety } from "./engine/safety";
import { newAlias } from "./data/notes";
import { createAccount, cryptoOk, listAccounts, readBlob, removeAccount, unlock, writeBlob, type AccountRec } from "./auth";

const KEY = "heard.v1";

export const DEFAULT_SETTINGS: Settings = {
  keepHistory: false,
  mask: true,
  textSize: "regular",
  theme: "system",
  reduceMotion: false,
  milo: true,
};

const fresh = (): Persisted => ({
  v: 1,
  onboarded: false,
  settings: DEFAULT_SETTINGS,
  people: SEED_PEOPLE,
  steps: SEED_STEPS,
  saved: [],
  dismissed: [],
  reachouts: SEED_REACHOUTS,
  history: [],
  notes: { alias: newAlias(), sent: [], replies: [], hidden: [], blocked: [], reported: [], private: [] },
  myResources: [],
  links: [],
});

/** Fill in anything a saved profile from an earlier version doesn't have yet. */
const upgrade = (p: Persisted): Persisted => {
  const f = fresh();
  // Before 13 to 17 mode existed, everyone who got in had said they were 18 or older.
  const age: Age | undefined = p.age ?? (p.onboarded ? "adult" : undefined);
  return { ...f, ...p, age, settings: { ...DEFAULT_SETTINGS, ...p.settings }, notes: { ...f.notes, ...(p.notes ?? {}) }, myResources: p.myResources ?? [], links: p.links ?? [] };
};

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const p = JSON.parse(raw) as Persisted;
    if (p?.v !== 1) return fresh();
    return upgrade(p);
  } catch {
    return fresh();
  }
}

function save(p: Persisted) {
  try {
    const out: Persisted = p.settings.keepHistory ? p : { ...p, history: [] };
    localStorage.setItem(KEY, JSON.stringify(out));
  } catch {
    /* storage can be unavailable; the app keeps working in memory */
  }
}

export const TAB_IDS = ["talk", "library", "notes", "people", "plan", "help", "settings"] as const;
export type Tab = (typeof TAB_IDS)[number];

export interface Account {
  id: string;
  name: string;
}

export interface ToastAction {
  label: string;
  run: () => void;
}

/** One-shot hints passed along when switching tabs. */
export interface Nav {
  prefill?: string;
  onlySaved?: boolean;
  open?: string;
  lab?: boolean;
  addLink?: boolean;
}

export const emptyThread = (): Thread => ({
  turns: [],
  topics: [],
  removed: [],
  safety: checkSafety(""),
  lastAnalyzedAt: 0,
});

interface Ctx {
  p: Persisted;
  setP: (fn: (p: Persisted) => Persisted) => void;
  setSettings: (patch: Partial<Settings>) => void;
  thread: Thread;
  setThread: (t: Thread | ((t: Thread) => Thread)) => void;
  tab: Tab;
  go: (t: Tab, nav?: Nav) => void;
  nav: Nav | null;
  clearNav: () => void;
  crisisOpen: boolean;
  openCrisis: (open: boolean) => void;
  minor: boolean;
  setMinor: (b: boolean) => void;
  /** false = the landing page is showing */
  entered: boolean;
  setEntered: (b: boolean) => void;
  goHome: () => void;
  toast: (msg: string, action?: ToastAction) => void;
  toastMsg: string | null;
  toastAction: ToastAction | null;
  /** Reset to a clean slate: seed data, defaults, no history. */
  wipe: () => void;
  storageOk: boolean;
  /** The signed-in device account, or null when using HEARD as a guest. */
  account: Account | null;
  /** true = the log-in screen is showing */
  gate: boolean;
  setGate: (b: boolean) => void;
  /** Which age band this person picked, or undefined before they have. */
  teen: boolean;
  chooseAge: (age: Age) => void;
  signUp: (name: string, pass: string, age: Age) => Promise<void>;
  signIn: (rec: AccountRec, pass: string) => Promise<boolean>;
  signOut: () => void;
  deleteAccount: () => void;
}

const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside provider");
  return c;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [p, setPState] = useState<Persisted>(() => load());
  const [thread, setThread] = useState<Thread>(emptyThread);
  const [tab, setTab] = useState<Tab>(() => {
    try {
      const h = window.location.hash.replace("#", "");
      return (TAB_IDS as readonly string[]).includes(h) ? (h as Tab) : "talk";
    } catch {
      return "talk";
    }
  });
  const [nav, setNav] = useState<Nav | null>(null);
  // A deep link like #plan skips the landing page; a plain visit starts there.
  const [entered, setEntered] = useState<boolean>(() => {
    try {
      return (TAB_IDS as readonly string[]).includes(window.location.hash.replace("#", ""));
    } catch {
      return false;
    }
  });
  const goHome = useCallback(() => {
    setEntered(false);
    try {
      window.history.replaceState(null, "", window.location.pathname);
    } catch {
      /* ignore */
    }
    window.scrollTo({ top: 0 });
  }, []);
  const [crisisOpen, openCrisis] = useState(false);
  const [minor, setMinor] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastAction, setToastAction] = useState<ToastAction | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const [storageOk] = useState(() => {
    try {
      localStorage.setItem("heard.probe", "1");
      localStorage.removeItem("heard.probe");
      return true;
    } catch {
      return false;
    }
  });

  const setP = useCallback((fn: (p: Persisted) => Persisted) => setPState((prev) => fn(prev)), []);
  const setSettings = useCallback((patch: Partial<Settings>) => setPState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } })), []);

  const [account, setAccount] = useState<Account | null>(null);
  // Coming back to a deep link on a device that has accounts: offer log-in first.
  const [gate, setGate] = useState(() => entered && listAccounts().length > 0);
  const keyRef = useRef<CryptoKey | null>(null);
  const accountRef = useRef<Account | null>(null);
  accountRef.current = account;

  // Guests save in the clear (as before); a signed-in account saves encrypted.
  useEffect(() => {
    const a = accountRef.current;
    if (!a) return save(p);
    const key = keyRef.current;
    if (!key) return;
    const out: Persisted = p.settings.keepHistory ? p : { ...p, history: [] };
    writeBlob(a.id, key, out).catch(() => {
      /* storage can be unavailable; the app keeps working in memory */
    });
  }, [p, account]);

  useEffect(() => {
    const root = document.documentElement;
    if (p.settings.theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", p.settings.theme);
    root.setAttribute("data-size", p.settings.textSize);
    root.setAttribute("data-motion", p.settings.reduceMotion ? "reduce" : "auto");
  }, [p.settings.theme, p.settings.textSize, p.settings.reduceMotion]);

  const clearNav = useCallback(() => setNav(null), []);
  const go = useCallback((t: Tab, n?: Nav) => {
    setNav(n ?? null);
    setTab(t);
    try {
      window.history.replaceState(null, "", `#${t}`);
    } catch {
      /* ignore */
    }
    window.scrollTo({ top: 0 });
  }, []);

  const toast = useCallback((msg: string, action?: ToastAction) => {
    setToastMsg(msg);
    setToastAction(action ?? null);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setToastMsg(null);
      setToastAction(null);
    }, action ? 6000 : 2800);
  }, []);

  const begin = useCallback((acct: Account | null, key: CryptoKey | null, data: Persisted) => {
    keyRef.current = key;
    accountRef.current = acct;
    setAccount(acct);
    setPState(data);
    setThread(emptyThread());
    setGate(false);
    setEntered(true);
  }, []);

  const signUp = useCallback(
    async (name: string, pass: string, age: Age) => {
      if (!cryptoOk()) throw new Error("This browser can't encrypt, so accounts aren't available here.");
      const { rec, key } = await createAccount(name, pass);
      const data: Persisted = withAge(fresh(), age);
      await writeBlob(rec.id, key, data);
      begin({ id: rec.id, name: rec.name }, key, data);
    },
    [begin],
  );

  const signIn = useCallback(
    async (rec: AccountRec, pass: string) => {
      const key = await unlock(rec, pass);
      if (!key) return false;
      const data = await readBlob<Persisted>(rec.id, key);
      begin({ id: rec.id, name: rec.name }, key, data ? upgrade(data) : withAge(fresh(), "adult"));
      return true;
    },
    [begin],
  );

  const signOut = useCallback(() => {
    keyRef.current = null;
    accountRef.current = null;
    setAccount(null);
    setPState(load());
    setThread(emptyThread());
    setEntered(false);
    window.scrollTo({ top: 0 });
  }, []);

  const deleteAccount = useCallback(() => {
    const a = accountRef.current;
    if (a) removeAccount(a.id);
    signOut();
  }, [signOut]);

  const wipe = useCallback(() => {
    if (!accountRef.current) {
      try {
        localStorage.removeItem(KEY);
      } catch {
        /* ignore */
      }
    }
    setPState((prev) => withAge(fresh(), prev.age ?? "adult"));
    setThread(emptyThread());
  }, []);

  const chooseAge = useCallback((age: Age) => setPState((prev) => withAge(prev, age)), []);
  const teen = p.age === "teen";

  const value = useMemo<Ctx>(
    () => ({ teen, chooseAge, p, setP, setSettings, thread, setThread, tab, go, nav, clearNav, crisisOpen, openCrisis, minor, setMinor, entered, setEntered, goHome, toast, toastMsg, toastAction, wipe, storageOk, account, gate, setGate, signUp, signIn, signOut, deleteAccount }),
    [teen, chooseAge, p, setP, setSettings, thread, tab, go, nav, clearNav, crisisOpen, minor, entered, goHome, toast, toastMsg, toastAction, wipe, storageOk, account, gate, signUp, signIn, signOut, deleteAccount],
  );
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

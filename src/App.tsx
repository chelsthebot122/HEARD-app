import { AppProvider, useApp, type Tab } from "./store";
import { Icon, type IconName } from "./icons";
import { Pup } from "./ui";
import { Onboarding, MinorScreen } from "./components/Onboarding";
import { CrisisSheet } from "./components/CrisisSheet";
import { Talk } from "./screens/Talk";
import { Library } from "./screens/Library";
import { People } from "./screens/People";
import { Plan } from "./screens/Plan";
import { Settings } from "./screens/Settings";
import { Landing } from "./screens/Landing";
import { Notes } from "./screens/Notes";
import { TeenNotes } from "./screens/TeenNotes";
import { Help } from "./screens/Help";
import { AuthGate } from "./components/Auth";
import { BackToTop } from "./components/Sheet";
import { moodFor } from "./ui";
import { useEffect, useRef, useState } from "react";

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "talk", label: "Talk", icon: "talk" },
  { id: "library", label: "Library", icon: "book" },
  { id: "notes", label: "Notes", icon: "send" },
  { id: "people", label: "People", icon: "people" },
  { id: "plan", label: "Plan", icon: "list" },
  { id: "help", label: "Help", icon: "heart" },
];

function AccountMenu() {
  const { account, signOut, go, setGate, setEntered, tab } = useApp();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  const initial = (account?.name ?? "G").trim().charAt(0).toUpperCase();
  return (
    <div className="acct" ref={box}>
      <button type="button" className="acct__btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} aria-label={account ? `Account menu, ${account.name}` : "Account menu, guest"} data-on={account ? "true" : "false"} data-here={tab === "settings"}>
        <span aria-hidden="true">{account ? initial : <Icon n="person" size={18} />}</span>
      </button>
      {open && (
        <div className="acct__menu" role="menu">
          <p className="acct__who">{account ? <>Signed in as <b>{account.name}</b></> : "Using HEARD as a guest"}</p>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); go("settings"); }}>Privacy and settings</button>
          {account ? (
            <button type="button" role="menuitem" onClick={() => { setOpen(false); signOut(); }}>Log out</button>
          ) : (
            <>
              <button type="button" role="menuitem" onClick={() => { setOpen(false); setEntered(false); setTimeout(() => document.getElementById("account")?.scrollIntoView({ behavior: "smooth" }), 80); }}>Make an account</button>
              <button type="button" role="menuitem" onClick={() => { setOpen(false); setGate(true); }}>Log in</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Header() {
  const { tab, go, goHome, p, openCrisis, storageOk, teen } = useApp();
  const keeping = p.settings.keepHistory && storageOk;
  return (
    <header className="hdr">
      <div className="hdr__in">
        <button type="button" className="brand" onClick={goHome} aria-label="HEARD home page">
          <Pup mood={moodFor(tab)} size={38} pet={false} />
          <span>HEARD</span>
          {teen && <em className="brand__tag">13–17</em>}
        </button>
        <nav className="nav" aria-label="Main">
          {TABS.map((t) => (
            <button key={t.id} type="button" className="nav__btn" aria-current={tab === t.id ? "page" : undefined} onClick={() => go(t.id)}>
              <Icon n={t.icon} size={19} />
              {t.label}
            </button>
          ))}
        </nav>
        <div className="hdr__right">
          <AccountMenu />
          <button type="button" className="status" data-saving={keeping ? "true" : "false"} onClick={() => go("settings")} title="Open privacy settings">
            <i />
            <span>{!storageOk ? "Storage is off here" : keeping ? "Chats kept on this device" : "Chats not kept"}</span>
          </button>
          <button type="button" className="btn btn--coral btn--sm btn--crisis" onClick={() => openCrisis(true)}>
            <Icon n="phone" size={17} />
            <span className="long">Need someone now?</span>
            <span className="short sr">Help</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function Toast() {
  const { toastMsg, toastAction } = useApp();
  if (!toastMsg) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      <span>{toastMsg}</span>
      {toastAction && (
        <button type="button" onClick={toastAction.run}>
          {toastAction.label}
        </button>
      )}
    </div>
  );
}

function Shell() {
  const { tab, p, minor, crisisOpen, entered, gate, teen } = useApp();
  if (gate)
    return (
      <>
        <AuthGate />
        {crisisOpen && <CrisisSheet />}
        <Toast />
      </>
    );
  if (!entered)
    return (
      <>
        <Landing />
        {crisisOpen && <CrisisSheet />}
        <BackToTop />
        <Toast />
      </>
    );
  if (minor) return <MinorScreen />;
  if (!p.onboarded) return <Onboarding />;
  return (
    <>
      <Header />
      <main id="main">
        {tab === "talk" && <Talk />}
        {tab === "library" && <Library />}
        {tab === "notes" && (teen ? <TeenNotes /> : <Notes />)}
        {tab === "people" && <People />}
        {tab === "plan" && <Plan />}
        {tab === "help" && <Help />}
        {tab === "settings" && <Settings />}
      </main>
      {crisisOpen && <CrisisSheet />}
      <BackToTop />
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}

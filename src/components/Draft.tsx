import { useEffect, useMemo, useRef, useState } from "react";
import type { Person, Reach } from "../types";
import type { DetectedTopic } from "../engine/topics";
import { defaultChannel, draftMessage, shortName, type Ask, type Channel, type Timing, type Tone } from "../engine/compose";
import { useApp } from "../store";
import { Icon } from "../icons";
import { copyText, uid } from "../util";
import { mailtoHref, smsHref, telHref } from "../contact";

const reachFor = (channel: Channel, person: Person): Reach =>
  channel === "text" ? "text" : channel === "email" ? "email" : person.reach === "call" ? "call" : "in person";

/** Writes the first sentence for the person. The text is editable and never sent anywhere by HEARD. */
export function Draft({ person, topics, onClose }: { person: Person; topics: DetectedTopic[]; onClose?: () => void }) {
  const { setP, toast, go } = useApp();
  const [tone, setTone] = useState<Tone>("warm");
  const [ask, setAsk] = useState<Ask>("listen");
  const [channel, setChannel] = useState<Channel>(() => defaultChannel(person.reach));
  const [timing, setTiming] = useState<Timing>("this week");
  const pro = person.kind === "professional";
  const first = shortName(person.name);

  const suggested = useMemo(() => draftMessage({ person, topics, tone, ask, channel, timing }), [person, topics, tone, ask, channel, timing]);
  const [body, setBody] = useState(suggested.body);
  const [subject, setSubject] = useState(suggested.subject ?? "");
  const [edited, setEdited] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setBody(suggested.body);
    setSubject(suggested.subject ?? "");
    setEdited(false);
  }, [suggested]);

  const hasSubject = suggested.subject !== undefined;
  const full = hasSubject && subject ? `Subject: ${subject}\n\n${body}` : body;

  const copy = async () => {
    if (await copyText(full)) toast(`Copied. Paste it wherever you talk with ${first}.`);
    else {
      area.current?.focus();
      area.current?.select();
      toast("Couldn't copy automatically. The text is selected, so press copy.");
    }
  };

  // These hand the message to the person's own email or Messages app. They press send, not HEARD.
  const emailHref = person.email ? mailtoHref(person.email, subject || "Can we talk?", body) : null;
  const smsLink = person.phone ? smsHref(person.phone, body) : null;
  const openLink = channel === "email" ? emailHref : channel === "text" ? smsLink : null;
  const openLabel = channel === "email" ? `Email ${first}` : `Text ${first}`;
  const callLink = person.phone ? telHref(person.phone) : null;
  const missing = channel === "email" ? !person.email : channel === "text" ? !person.phone : false;
  const tooLong = channel === "email" ? !!person.email && !emailHref : channel === "text" ? !!person.phone && !smsLink : false;

  const log = () => {
    setP((p) => ({ ...p, reachouts: [{ id: uid(), name: person.name, how: reachFor(channel, person), at: new Date().toISOString() }, ...p.reachouts] }));
    toast(channel === "inperson" ? `Logged: you talked with ${first}. That counts.` : `Logged: you reached out to ${first}. That counts.`);
    onClose?.();
  };

  const addStep = () => {
    const verb = channel === "inperson" ? "Talk with" : channel === "email" ? "Email" : "Text";
    const when = timing === "tonight" ? "today" : timing === "this week" ? "week" : "later";
    setP((p) => ({ ...p, steps: [{ id: uid(), text: `${verb} ${first}`, when, personId: person.id, done: false }, ...p.steps] }));
    toast("Added to your plan.", { label: "Open plan", run: () => go("plan") });
  };

  return (
    <div className="draft">
      <div className="draft__opts">
        {!pro && (
          <>
            <div className="field">
              <label htmlFor={`tone-${person.id}`}>Tone</label>
              <select id={`tone-${person.id}`} className="select select--sm" value={tone} onChange={(e) => setTone(e.target.value as Tone)}>
                <option value="warm">Warm and open</option>
                <option value="direct">Direct</option>
                <option value="lowkey">Low-key</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor={`ask-${person.id}`}>What you'd like from them</label>
              <select id={`ask-${person.id}`} className="select select--sm" value={ask} onChange={(e) => setAsk(e.target.value as Ask)}>
                <option value="listen">Just listen</option>
                <option value="advice">Their take</option>
                <option value="company">Spend time together</option>
              </select>
            </div>
          </>
        )}
        <div className="field">
          <label htmlFor={`ch-${person.id}`}>How</label>
          <select id={`ch-${person.id}`} className="select select--sm" value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
            <option value="text">Text message</option>
            <option value="email">Email</option>
            <option value="inperson">{pro ? "What to say on the phone or in person" : "Talking points, in person"}</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor={`when-${person.id}`}>When</label>
          <select id={`when-${person.id}`} className="select select--sm" value={timing} onChange={(e) => setTiming(e.target.value as Timing)}>
            <option value="tonight">Tonight</option>
            <option value="this week">This week</option>
            <option value="whenever works">Whenever works</option>
          </select>
        </div>
      </div>

      {hasSubject && (
        <div className="field">
          <label htmlFor={`sub-${person.id}`}>Subject</label>
          <input id={`sub-${person.id}`} className="input input--sm" value={subject} onChange={(e) => (setSubject(e.target.value), setEdited(true))} />
        </div>
      )}
      <div className="field">
        <label htmlFor={`body-${person.id}`}>Your message to {first}. Change anything.</label>
        <textarea
          id={`body-${person.id}`}
          ref={area}
          className="textarea draft__out"
          rows={channel === "inperson" ? 9 : 6}
          value={body}
          onChange={(e) => (setBody(e.target.value), setEdited(true))}
        />
      </div>
      <p className="tiny">HEARD doesn't send anything for you. {openLink ? `“${openLabel}” opens this message in your own ${channel === "email" ? "email app" : "Messages app"}, and you press send.` : "Copy it, or open it in your own email or Messages app."}{callLink ? " “Call” opens your phone's dialer." : ""} If nothing opens, use Copy.</p>
      {missing && channel !== "inperson" && <p className="tiny">Add {channel === "email" ? "their email" : "their phone number"} under People, Edit, and an "{channel === "email" ? "Email" : "Text"} {first}" button shows up here.</p>}
      {tooLong && <p className="tiny">This message is too long to open in your app in one tap. Use Copy.</p>}

      <div className="draft__actions">
        <button type="button" className="btn btn--primary btn--sm" onClick={copy}>
          <Icon n="copy" size={16} />
          Copy
        </button>
        {openLink && (
          <a className="btn btn--line btn--sm" href={openLink}>
            <Icon n="send" size={16} />
            {openLabel}
          </a>
        )}
        {callLink && (
          <a className="btn btn--line btn--sm" href={callLink} aria-label={`Call ${first} at ${person.phone}`}>
            <Icon n="phone" size={16} />
            Call {first}
          </a>
        )}
        <button type="button" className="btn btn--line btn--sm" onClick={log}>
          <Icon n="check" size={16} />
          {channel === "inperson" ? "I talked to them" : "I sent it"}
        </button>
        <button type="button" className="btn btn--quiet btn--sm" onClick={addStep}>
          <Icon n="plus" size={16} />
          Add to my plan
        </button>
        {edited && (
          <button
            type="button"
            className="btn btn--quiet btn--sm"
            onClick={() => (setBody(suggested.body), setSubject(suggested.subject ?? ""), setEdited(false))}
          >
            <Icon n="undo" size={16} />
            Reset
          </button>
        )}
        {onClose && (
          <button type="button" className="btn btn--quiet btn--sm" onClick={onClose} style={{ marginLeft: "auto" }}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}

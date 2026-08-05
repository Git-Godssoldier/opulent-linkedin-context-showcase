type Profile = {
  id: string;
  name: string;
  title: string;
  organization: string;
  location: string;
  focus: string[];
  summary: string;
  linkedin_url: string;
  official_url: string;
  validation_status: string;
  source_checked_at: string;
  context_status: string;
  context_receipt: null | {
    ref: string;
    http_status: number | null;
    request_id: string | null;
    latency_ms: number | null;
    credits_consumed: number | null;
    completed_at: string | null;
  };
  unknowns: string[];
};

export function ProfileCard({ profile, index }: { profile: Profile; index: number }) {
  const initials = profile.name.split(" ").map((part) => part[0]).join("");
  const contextExecuted = profile.context_status === "executed";
  return (
    <article className={`profile-card profile-${index + 1}`}>
      <div className="profile-topline">
        <span className="profile-index">P/{String(index + 1).padStart(2, "0")}</span>
        <span className="status status-verified">identity validated</span>
      </div>
      <div className="profile-heading">
        <div className="monogram" aria-hidden="true">{initials}</div>
        <div>
          <h3>{profile.name}</h3>
          <p>{profile.title} · {profile.organization}</p>
        </div>
      </div>
      <p className="profile-summary">{profile.summary}</p>
      <dl className="profile-facts">
        <div><dt>Location</dt><dd>{profile.location}</dd></div>
        <div>
          <dt>Context API</dt>
          <dd className={contextExecuted ? "executed-copy" : "blocked-copy"}>
            {contextExecuted ? `Executed · ${profile.context_receipt?.latency_ms ?? "?"}ms` : "Blocked · no credential"}
          </dd>
        </div>
        <div><dt>Checked</dt><dd>{profile.source_checked_at}</dd></div>
      </dl>
      <div className="tag-list" aria-label="Professional focus">
        {profile.focus.map((item) => <span key={item}>{item}</span>)}
      </div>
      <div className="profile-links">
        <a href={profile.linkedin_url} target="_blank" rel="noreferrer">LinkedIn <span aria-hidden="true">↗</span></a>
        <a href={profile.official_url} target="_blank" rel="noreferrer">Official bio <span aria-hidden="true">↗</span></a>
      </div>
      <div className="receipt-slot">
        <span>Receipt</span>
        <code className={contextExecuted ? "receipt-executed" : ""}>
          {contextExecuted ? profile.context_receipt?.ref : "NOT_EXECUTED"}
        </code>
      </div>
    </article>
  );
}

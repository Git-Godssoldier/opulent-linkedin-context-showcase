import packet from "../data/showcase.json";
import { CoverageBars, EvidenceRadar, ReceiptMatrix } from "../components/dither-charts";
import { ProfileCard } from "../components/profile-card";

export default function Home() {
  const isLive = packet.source_mode === "contextdev_live";
  return (
    <main>
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <header className="site-header shell">
        <a className="wordmark" href="#top" aria-label="Opulent LinkedIn Context home">
          <span className="wordmark-mark">O/</span>
          <span>OPULENT SIGNAL ROOM</span>
        </a>
        <div className="header-meta">
          <span>KNOWN PROFILE RETRIEVAL</span>
          <span className={isLive ? "live-dot live-success" : "live-dot"}>{isLive ? "CONTEXT RECEIPTS" : "PUBLIC BASELINE"}</span>
        </div>
      </header>

      <section className="hero shell" id="top">
        <div className="eyebrow"><span>Context.dev</span> / LinkedIn profile extraction</div>
        <h1>Evidence before<br /><em>enrichment.</em></h1>
        <div className="hero-deck">
          <p>Three known public profiles. One documented VC Village sponsor. Zero invented receipts.</p>
          <div className="mode-badge">
            <span className="mode-icon" aria-hidden="true">{isLive ? "✓" : "!"}</span>
            <div><small>SOURCE MODE</small><strong>{isLive ? "Context.dev live receipts" : "Public validation baseline"}</strong></div>
          </div>
        </div>
        <div className="hero-rule dither-rule" aria-hidden="true" />
      </section>

      <section className="scope-strip shell" aria-label="Run scope">
        <div><span>01 / PEOPLE</span><strong>{packet.scope.eligible}</strong><small>known URLs</small></div>
        <div><span>02 / SPONSOR</span><strong>{packet.scope.unique_company_count}</strong><small>Goodwin</small></div>
        <div><span>03 / CONTEXT CALLS</span><strong>{packet.scope.executed}</strong><small>executed</small></div>
        <div><span>04 / DISCOVERY</span><strong>{packet.scope.discovery_expansion}</strong><small>expanded</small></div>
      </section>

      <section className="sponsor-proof shell">
        <div className="section-number">01</div>
        <div className="sponsor-copy">
          <span className="kicker">Sponsor evidence</span>
          <h2>Goodwin <span>×</span> VC Village NYC</h2>
          <p>{packet.sponsor.relationship}. The proof is organizational—not personal.</p>
        </div>
        <div className="boundary-card">
          <span>CLAIM BOUNDARY</span>
          <p>{packet.sponsor.boundary}</p>
          <a href={packet.sponsor.source} target="_blank" rel="noreferrer">View event evidence ↗</a>
        </div>
      </section>

      <section className="analytics shell">
        <div className="section-heading">
          <div><span className="kicker">Evidence telemetry</span><h2>What is proved—<br />and what is not.</h2></div>
          <p>Coverage comes from public LinkedIn identity pages and official Goodwin biographies. API receipt coverage remains zero until Context.dev executes.</p>
        </div>
        <div className="chart-grid">
          <article className="chart-card chart-card-wide">
            <div className="chart-title"><span>FIELD COVERAGE</span><small>PUBLIC PROFESSIONAL BASELINE</small></div>
            <CoverageBars profiles={packet.profiles} />
          </article>
          <article className="chart-card">
            <div className="chart-title"><span>EVIDENCE SHAPE</span><small>COHORT AVERAGE / 100</small></div>
            <EvidenceRadar profiles={packet.profiles} />
          </article>
          <article className="chart-card chart-card-wide matrix-card">
            <div className="chart-title"><span>RETRIEVAL PIPELINE</span><small>THREE ISOLATED OPERATIONS</small></div>
            <ReceiptMatrix profiles={packet.profiles} />
          </article>
        </div>
      </section>

      <section className="profiles shell">
        <div className="section-heading profile-section-heading">
          <div><span className="kicker">Validated cohort</span><h2>Three exact identities.</h2></div>
          <p>Each URL is fixed before retrieval and corroborated against a first-party employer biography.</p>
        </div>
        <div className="profile-grid">
          {packet.profiles.map((profile, index) => <ProfileCard key={profile.id} profile={profile} index={index} />)}
        </div>
      </section>

      <section className="operation-ledger shell">
        <div className="section-number">02</div>
        <div className="ledger-main">
          <span className="kicker">Context.dev operation ledger</span>
          <h2>One URL. One call. One receipt.</h2>
          <div className="endpoint-line"><span>POST</span><code>https://api.context.dev/v1/people/retrieve</code></div>
          <div className="ledger-list">
            {packet.context_operations.map((operation, index) => (
              <article key={operation.profile_id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><strong>{packet.profiles[index].name}</strong><code>{operation.body.identifiers.linkedinUrl}</code></div>
                <span className={`status ${operation.status === "executed" ? "status-executed" : "status-blocked"}`}>
                  {operation.status === "executed" ? "executed" : "blocked"}
                </span>
                <small>{operation.receipt ? "Receipt saved" : "No receipt"}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="truth-strip">
        <div className="shell truth-inner">
          <span>TRUTHFUL DEFAULT</span>
          <p>{packet.evidence.context_execution_note}</p>
        </div>
      </section>

      <footer className="shell">
        <div><span className="wordmark-mark">O/</span><strong>OPULENT</strong></div>
        <p>Known-profile context showcase · Built for evidence-safe demonstrations</p>
        <p>Generated {packet.generated_at.slice(0, 10)}</p>
      </footer>
    </main>
  );
}

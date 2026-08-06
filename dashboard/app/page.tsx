import packet from "../../templates/packet.template.json";

/**
 * The run dashboard.
 *
 * It reads the packet the run produces. Shipped, it reads the empty template, so the
 * page renders its own empty states rather than a demonstration built from data nobody
 * gathered. Point it at the filled packet and the same sections populate.
 *
 * Layering follows references/dashboard-brief.md: the decision layer first, the audit
 * layer collapsed beneath it. Nothing proposed or blocked is ever styled as verified.
 */
export default function Home() {
  const people = packet.people ?? [];
  const excluded = packet.excluded ?? [];
  const operations = packet.context_operations ?? [];
  const messages = packet.messages ?? [];
  const scope = packet.scope ?? {};
  const empty = people.length === 0;

  return (
    <main>
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <header className="site-header shell">
        <a className="wordmark" href="#top" aria-label="Opulent home">
          <span className="wordmark-mark">O/</span>
          <span>OPULENT SIGNAL ROOM</span>
        </a>
        <div className="header-meta">
          <span>ROSTER → DOSSIER → MESSAGE</span>
          <span className={packet.source_mode ? "live-dot live-success" : "live-dot"}>
            {packet.source_mode ?? "AWAITING RUN"}
          </span>
        </div>
      </header>

      <section className="hero shell" id="top">
        <div className="eyebrow"><span>Context.dev</span> / known-profile extraction</div>
        <h1>Evidence before<br /><em>enrichment.</em></h1>
        <div className="hero-deck">
          <p>
            {packet.objective ??
              "One subject, taken as far as the evidence allows, with every field carrying the page it came from."}
          </p>
        </div>
        <div className="hero-rule dither-rule" aria-hidden="true" />
      </section>

      <section className="scope-strip shell" aria-label="Run scope">
        <div><span>01 / ROWS IN</span><strong>{scope.rows_in ?? "—"}</strong><small>roster</small></div>
        <div><span>02 / SUBJECTS</span><strong>{people.length}</strong><small>accepted</small></div>
        <div><span>03 / CALLS</span><strong>{operations.length}</strong><small>ledgered</small></div>
        <div><span>04 / CREDITS</span><strong>{scope.credits_spent ?? "—"}</strong><small>spent</small></div>
      </section>

      {empty ? (
        <section className="profiles shell">
          <div className="section-heading profile-section-heading">
            <div><span className="kicker">No run yet</span><h2>This packet is empty.</h2></div>
            <p>
              Validate the roster, choose a subject, and fill the packet. Every section below
              renders from that file — the page states what it does not have rather than
              standing in for it.
            </p>
          </div>
        </section>
      ) : null}

      {excluded.length ? (
        <section className="profiles shell">
          <div className="section-heading profile-section-heading">
            <div><span className="kicker">Refused at the gate</span><h2>{excluded.length} row(s) excluded.</h2></div>
            <p>Shown, not hidden. What the gate refused is part of what the gate is worth.</p>
          </div>
          <div className="ledger-list">
            {excluded.map((row: { name?: string; organization?: string; reason?: string }, i: number) => (
              <article key={`${row.name}-${i}`}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div><strong>{row.name}</strong><code>{row.organization}</code></div>
                <small>{row.reason}</small>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {messages.length ? (
        <section className="profiles shell">
          <div className="section-heading profile-section-heading">
            <div><span className="kicker">Drafted outreach</span><h2>{messages.length} message(s), unsent.</h2></div>
            <p>Every claim traces to a dossier field. A person approves, holds, or rejects each one.</p>
          </div>
        </section>
      ) : null}

      <section className="operation-ledger shell">
        <div className="section-number">02</div>
        <div className="ledger-main">
          <span className="kicker">Operation ledger</span>
          <h2>Every call, its status, its receipt.</h2>
          {operations.length === 0 ? (
            <p>No operations recorded yet.</p>
          ) : (
            <div className="ledger-list">
              {operations.map((op: { profile_id?: string; endpoint?: string; status?: string; receipt?: unknown }, i: number) => (
                <article key={op.profile_id ?? i}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <div><strong>{op.profile_id}</strong><code>{op.endpoint}</code></div>
                  <span className={`status ${op.status === "executed" ? "status-executed" : "status-blocked"}`}>
                    {op.status ?? "proposed"}
                  </span>
                  <small>{op.receipt ? "Receipt saved" : "No receipt"}</small>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="truth-strip">
        <div className="shell truth-inner">
          <span>TRUTHFUL DEFAULT</span>
          <p>
            A call is executed only with an HTTP response and a stored receipt. Everything else
            reads as proposed, blocked, or failed — never as a softer shade of success.
          </p>
        </div>
      </section>

      <footer className="shell">
        <div><span className="wordmark-mark">O/</span><strong>OPULENT</strong></div>
        <p>Known-profile extraction showcase · Evidence-safe by construction</p>
        <p>{packet.generated_at ? `Generated ${String(packet.generated_at).slice(0, 10)}` : "Not yet generated"}</p>
      </footer>
    </main>
  );
}

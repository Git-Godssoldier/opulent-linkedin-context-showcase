type ProfileMetric = {
  name: string;
  metrics: {
    field_coverage: number;
    identity_evidence: number;
    employer_evidence: number;
    role_evidence: number;
    sponsor_relevance: number;
    extraction_receipt: number;
  };
};

const COLORS = ["var(--cyan)", "var(--acid)", "var(--amber)"];

export function CoverageBars({ profiles }: { profiles: ProfileMetric[] }) {
  return (
    <div className="coverage-chart" role="img" aria-label="Professional field coverage: all three profiles have complete public baseline fields">
      <div className="chart-scale" aria-hidden="true">
        <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
      </div>
      {profiles.map((profile, index) => (
        <div className="bar-row" key={profile.name}>
          <div className="bar-label">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{profile.name}</strong>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill dither-fill"
              style={{ width: `${profile.metrics.field_coverage}%`, color: COLORS[index] }}
            />
          </div>
          <output>{profile.metrics.field_coverage}%</output>
        </div>
      ))}
    </div>
  );
}

function point(value: number, index: number, count: number, radius = 108, center = 130) {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;
  const scaled = (value / 100) * radius;
  return `${center + Math.cos(angle) * scaled},${center + Math.sin(angle) * scaled}`;
}

const axes = [
  { key: "identity_evidence", label: "Identity" },
  { key: "employer_evidence", label: "Employer" },
  { key: "role_evidence", label: "Role" },
  { key: "sponsor_relevance", label: "Sponsor link" },
  { key: "extraction_receipt", label: "API receipt" },
] as const;

export function EvidenceRadar({ profiles }: { profiles: ProfileMetric[] }) {
  const averaged = axes.map(({ key }) =>
    Math.round(profiles.reduce((total, profile) => total + profile.metrics[key], 0) / profiles.length),
  );
  const outer = axes.map((_, index) => point(100, index, axes.length)).join(" ");
  const mid = axes.map((_, index) => point(50, index, axes.length)).join(" ");
  const data = averaged.map((value, index) => point(value, index, axes.length)).join(" ");

  return (
    <div className="radar-wrap">
      <svg className="radar" viewBox="0 0 260 260" role="img" aria-labelledby="radar-title radar-desc">
        <title id="radar-title">Average evidence quality across the three profiles</title>
        <desc id="radar-desc">Identity and employer are fully corroborated, roles are strongly corroborated, sponsor relevance is firm-level, and no live Context API receipt is available.</desc>
        <defs>
          <pattern id="radar-dots" width="7" height="7" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.2" fill="var(--cyan)" />
          </pattern>
        </defs>
        <polygon points={outer} className="radar-grid" />
        <polygon points={mid} className="radar-grid radar-grid-mid" />
        {axes.map((_, index) => (
          <line key={index} x1="130" y1="130" x2={point(100, index, axes.length).split(",")[0]} y2={point(100, index, axes.length).split(",")[1]} className="radar-axis" />
        ))}
        <polygon points={data} fill="url(#radar-dots)" className="radar-data" />
        {averaged.map((value, index) => {
          const [cx, cy] = point(value, index, axes.length).split(",");
          return <circle key={index} cx={cx} cy={cy} r="3" className="radar-node" />;
        })}
      </svg>
      <ul className="radar-legend">
        {axes.map((axis, index) => (
          <li key={axis.key}>
            <span>{axis.label}</span><strong>{averaged[index]}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReceiptMatrix({ profiles }: { profiles: ProfileMetric[] }) {
  const stages = ["URL fixed", "Identity checked", "Employer checked", "API receipt"];
  return (
    <div className="receipt-matrix" role="table" aria-label="Validation stage matrix">
      <div className="matrix-head" role="row">
        <span role="columnheader">Profile</span>
        {stages.map((stage) => <span role="columnheader" key={stage}>{stage}</span>)}
      </div>
      {profiles.map((profile, index) => (
        <div className="matrix-row" role="row" key={profile.name}>
          <strong role="rowheader">{profile.name.split(" ")[0]}</strong>
          {[true, true, true, false].map((complete, stageIndex) => (
            <span
              className={complete ? "matrix-cell is-complete" : "matrix-cell is-blocked"}
              role="cell"
              aria-label={`${stages[stageIndex]}: ${complete ? "complete" : "blocked"}`}
              key={stageIndex}
              style={{ "--row-color": COLORS[index] } as React.CSSProperties}
            >
              {complete ? "●" : "×"}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

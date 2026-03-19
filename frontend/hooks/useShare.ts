import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { PersonaData } from "../services/persona";

const TRAIT_LABELS: Record<string, string> = {
  risk_appetite:        "Risk Appetite",
  fomo_sensitivity:     "FOMO Sensitivity",
  loss_aversion:        "Loss Aversion",
  patience:             "Patience",
  diversification_bias: "Diversification Bias",
  overconfidence:       "Overconfidence",
};

function traitColor(val: number) {
  if (val > 65) return "#ff1744";
  if (val > 50) return "#ffab00";
  return "#00e676";
}

function buildPersonaHTML(persona: PersonaData): string {
  const traits = persona.traits as Record<string, number> | null;
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  }).toUpperCase();
  const createdStr = new Date(persona.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });

  const traitRows = traits
    ? Object.entries(TRAIT_LABELS)
        .map(([key, label]) => {
          const val = traits[key] ?? 50;
          const pct = Math.round(val);
          const color = traitColor(val);
          return `
          <div style="margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
              <span style="font-size:11px;letter-spacing:0.5px;color:#a8c8f0;text-transform:uppercase;">${label}</span>
              <span style="font-size:13px;font-family:monospace;color:${color};letter-spacing:1px;">${pct}/100</span>
            </div>
            <div style="background:#0d2040;height:5px;border-radius:2px;overflow:hidden;">
              <div style="width:${pct}%;background:${color};height:5px;border-radius:2px;"></div>
            </div>
          </div>`;
        })
        .join("")
    : `<p style="color:#4a7aaa;font-style:italic;font-size:12px;">No trait data recorded yet.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    background:#070d1a;
    color:#e8f4ff;
    font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;
    padding:48px 52px;
    min-height:100vh;
  }
  .header {
    display:flex;
    align-items:center;
    justify-content:space-between;
    border-bottom:1px solid #1a3a6b;
    padding-bottom:22px;
    margin-bottom:32px;
  }
  .brand {
    font-size:20px;
    letter-spacing:5px;
    font-weight:700;
    color:#0a6cf5;
  }
  .brand span { color:#e8f4ff; }
  .report-date {
    font-size:9px;
    letter-spacing:2px;
    color:#253a55;
    font-family:monospace;
  }
  .active-badge {
    display:inline-block;
    background:#00e676;
    color:#070d1a;
    font-size:8px;
    font-weight:700;
    letter-spacing:2px;
    padding:3px 10px;
    margin-bottom:10px;
    border-radius:1px;
  }
  .persona-name {
    font-size:30px;
    font-family:monospace;
    letter-spacing:2px;
    color:#e8f4ff;
    margin-bottom:8px;
  }
  .meta {
    display:flex;
    gap:28px;
    margin-bottom:36px;
    flex-wrap:wrap;
  }
  .meta-item { display:flex; flex-direction:column; gap:3px; }
  .meta-label {
    font-size:8px;
    letter-spacing:2.5px;
    color:#253a55;
    text-transform:uppercase;
  }
  .meta-val {
    font-size:13px;
    font-family:monospace;
    color:#a8c8f0;
    letter-spacing:0.5px;
  }
  .section-title {
    font-size:8px;
    letter-spacing:3px;
    color:#0a6cf5;
    text-transform:uppercase;
    border-bottom:1px solid #0d2040;
    padding-bottom:7px;
    margin-bottom:18px;
  }
  .card {
    background:#0a1628;
    border:1px solid #1a3a6b;
    padding:22px 24px;
    margin-bottom:22px;
    border-radius:2px;
  }
  .interpretation {
    font-size:13px;
    line-height:22px;
    color:#4a7aaa;
    font-style:italic;
  }
  .footer {
    margin-top:48px;
    padding-top:18px;
    border-top:1px solid #0d2040;
    text-align:center;
    font-size:8px;
    letter-spacing:2.5px;
    color:#253a55;
    font-family:monospace;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">MARKET<span>HAND</span></div>
    <div class="report-date">PERSONA REPORT · ${dateStr}</div>
  </div>

  ${persona.is_active ? '<div class="active-badge">● ACTIVE PERSONA</div>' : ""}
  <div class="persona-name">${persona.name}</div>

  <div class="meta">
    <div class="meta-item">
      <span class="meta-label">Cards Played</span>
      <span class="meta-val">${persona.cards_played}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Created</span>
      <span class="meta-val">${createdStr}</span>
    </div>
  </div>

  ${persona.interpretation
    ? `<div class="card">
        <div class="section-title">Interpretation</div>
        <p class="interpretation">${persona.interpretation}</p>
       </div>`
    : ""}

  ${traits
    ? `<div class="card">
        <div class="section-title">Investor Traits</div>
        ${traitRows}
       </div>`
    : ""}

  <div class="footer">
    GENERATED BY MARKETHAND · markethand.ericxin.dev
  </div>
</body>
</html>`;
}

export async function sharePersonaPDF(persona: PersonaData): Promise<void> {
  const html = buildPersonaHTML(persona);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
      dialogTitle: `${persona.name} — Investor Persona`,
    });
  }
}

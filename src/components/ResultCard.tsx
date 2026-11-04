import { forwardRef, type ReactNode } from 'react';
import { GAME_TITLE } from '../config.ts';
import { CARD, MAP_BANDS, mapPoint } from '../game/card.ts';
import { TIER_INFO } from '../game/labels.ts';
import type { Rank } from '../game/progress.ts';
import { formatScore, TIERS } from '../game/scoring.ts';
import type { RoundResult, Summary } from '../game/session.ts';
import type { Tier } from '../types.ts';

/** The card always uses the night look, so a saved image looks the same from any theme. */
const INK = { text: '#eef1ff', muted: '#a3abc2', faint: '#6b7395', grid: '#2a3158', surface: '#121735' };
const TIER_COLOR: Record<Tier, string> = { perfect: '#10b981', close: '#0ea5e9', near: '#f59e0b', miss: '#f43f5e' };
/** The per-sentence row under the score: spacing between marks, and how many fit. */
const ROW_GAP = 36;
const ROW_MAX = 24;
const FONT = "'Space Grotesk Variable', 'Space Grotesk', 'Microsoft JhengHei', 'PingFang TC', 'Noto Sans TC', sans-serif";

/**
 * One mark per tier, matching the share symbols (◎ ○ △ ×), so the map never relies on colour
 * alone. Each sits on a ring of the surface colour so overlapping marks stay readable.
 */
export function TierMark({ tier, x, y, r = CARD.dot }: { tier: Tier; x: number; y: number; r?: number }) {
  const color = TIER_COLOR[tier];
  const halo = { stroke: INK.surface, strokeWidth: 7, fill: INK.surface };
  const shape = (props: Record<string, unknown>): ReactNode => {
    switch (tier) {
      case 'perfect':
        return (
          <>
            <circle cx={x} cy={y} r={r} fill="none" strokeWidth={3} {...props} />
            <circle cx={x} cy={y} r={r * 0.42} {...props} stroke="none" fill={props.stroke as string} />
          </>
        );
      case 'close':
        return <circle cx={x} cy={y} r={r * 0.85} fill="none" strokeWidth={3.5} {...props} />;
      case 'near':
        return <path d={`M${x} ${y - r} L${x + r * 0.95} ${y + r * 0.72} L${x - r * 0.95} ${y + r * 0.72} Z`} fill="none" strokeWidth={3.5} strokeLinejoin="round" {...props} />;
      case 'miss':
        return <path d={`M${x - r * 0.75} ${y - r * 0.75} L${x + r * 0.75} ${y + r * 0.75} M${x + r * 0.75} ${y - r * 0.75} L${x - r * 0.75} ${y + r * 0.75}`} strokeWidth={4} strokeLinecap="round" {...props} />;
    }
  };
  return (
    <g data-tier={tier}>
      <g {...halo}>{shape({ stroke: INK.surface, strokeWidth: 9 })}</g>
      {shape({ stroke: color })}
    </g>
  );
}

interface ResultCardProps {
  title: string;
  name: string;
  rank: Rank;
  summary: Summary;
  results: readonly RoundResult[];
  url: string;
}

/**
 * The end-of-run card: score, rank, the per-sentence symbols, the emotion map and a few stats.
 * In the emotion map every sentence is a mark at (reference score, your answer); the closer to
 * the diagonal, the closer the guess, and the shaded bands are the perfect and close zones.
 */
export const ResultCard = forwardRef<SVGSVGElement, ResultCardProps>(function ResultCard({ title, name, rank, summary, results, url }, ref) {
  const { x, y, size } = CARD.map;
  const counts = Object.fromEntries(TIERS.map((t) => [t, results.filter((r) => r.tier === t).length])) as Record<Tier, number>;
  const stats = [
    ['句數', String(summary.rounds)],
    ['平均差距', summary.averageDistance.toFixed(2)],
    ['最高連擊', String(summary.bestStreak)],
    ['完美', String(summary.perfects)],
  ];
  const ticks = [-1, 0, 1];
  // The per-sentence row: one tier mark each, up to ROW_MAX; longer timed runs show the first ones.
  const row = results.slice(0, ROW_MAX);
  const rowStart = CARD.width / 2 - ((row.length - 1) * ROW_GAP) / 2;

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${CARD.width} ${CARD.height}`}
      role="img"
      aria-label={`${title} 成績卡：${summary.score} 分，${summary.rounds} 句，平均差距 ${summary.averageDistance.toFixed(2)}`}
      className="h-auto w-full rounded-[1.75rem] shadow-2xl shadow-fuchsia-900/30"
      fontFamily={FONT}
    >
      <defs>
        <linearGradient id="card-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0d1230" />
          <stop offset="1" stopColor="#1b1140" />
        </linearGradient>
        <radialGradient id="card-glow-a" cx="0.1" cy="0" r="0.7">
          <stop offset="0" stopColor="#4f7cff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#4f7cff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="card-glow-b" cx="1" cy="1" r="0.7">
          <stop offset="0" stopColor="#ec4899" stopOpacity="0.28" />
          <stop offset="1" stopColor="#ec4899" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="card-mood" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4f7cff" />
          <stop offset="0.4" stopColor="#8b5cf6" />
          <stop offset="0.7" stopColor="#ec4899" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <clipPath id="card-map">
          <rect x={x} y={y} width={size} height={size} rx="18" />
        </clipPath>
      </defs>

      <rect width={CARD.width} height={CARD.height} rx="56" fill="url(#card-bg)" />
      <rect width={CARD.width} height={CARD.height} rx="56" fill="url(#card-glow-a)" />
      <rect width={CARD.width} height={CARD.height} rx="56" fill="url(#card-glow-b)" />

      {/* Header */}
      <rect x="80" y="70" width="64" height="64" rx="18" fill="url(#card-mood)" />
      <circle cx="112" cy="102" r="19" fill="none" stroke="#fff" strokeWidth="4" />
      <text x="164" y="116" fontSize="44" fontWeight="700" fill={INK.text}>
        {GAME_TITLE}
      </text>
      <text x={CARD.width - 80} y="98" fontSize="28" fontWeight="600" fill={INK.muted} textAnchor="end">
        {title}
      </text>
      <text x={CARD.width - 80} y="134" fontSize="26" fill={INK.faint} textAnchor="end">
        {name}・Lv.{rank.level} {rank.title}
      </text>

      {/* Score */}
      <text x={CARD.width / 2} y="300" fontSize="150" fontWeight="700" fill="url(#card-mood)" textAnchor="middle" letterSpacing="-4">
        {summary.score}
      </text>
      <text x={CARD.width / 2} y="352" fontSize="30" fill={INK.muted} textAnchor="middle">
        分
      </text>
      <g aria-hidden="true">
        {row.map((r, i) => (
          <TierMark key={i} tier={r.tier} x={rowStart + i * ROW_GAP} y={398} r={11} />
        ))}
      </g>
      {results.length > ROW_MAX && (
        <text x={rowStart + ROW_MAX * ROW_GAP - 8} y="406" fontSize="26" fill={INK.muted}>
          …
        </text>
      )}

      {/* Emotion map */}
      <text x={x} y={y - 22} fontSize="28" fontWeight="700" fill={INK.text}>
        情緒地圖
      </text>
      <text x={x + size} y={y - 22} fontSize="22" fill={INK.muted} textAnchor="end">
        越靠近斜線越準
      </text>
      <rect x={x} y={y} width={size} height={size} rx="18" fill="#ffffff" fillOpacity="0.04" stroke={INK.grid} strokeWidth="1" />
      <g clipPath="url(#card-map)">
        {ticks.slice(1, -1).map((t) => {
          const p = mapPoint(t, t);
          return (
            <g key={t} stroke={INK.grid} strokeWidth="1">
              <line x1={p.x} y1={y} x2={p.x} y2={y + size} />
              <line x1={x} y1={p.y} x2={x + size} y2={p.y} />
            </g>
          );
        })}
        {MAP_BANDS.map((band) => (
          <line
            key={band.tier}
            x1={x}
            y1={y + size}
            x2={x + size}
            y2={y}
            stroke={TIER_COLOR[band.tier]}
            strokeOpacity={band.tier === 'perfect' ? 0.16 : 0.09}
            strokeWidth={band.width}
          />
        ))}
        <line x1={x} y1={y + size} x2={x + size} y2={y} stroke={INK.muted} strokeOpacity="0.6" strokeWidth="2" />
        <text x={x + 24} y={y + 44} fontSize="20" fill={INK.faint}>
          猜得比較開心
        </text>
        <text x={x + size - 24} y={y + size - 26} fontSize="20" fill={INK.faint} textAnchor="end">
          猜得比較難過
        </text>
      </g>
      {results.map((r, i) => {
        const p = mapPoint(r.sentence.score, r.guess);
        return (
          <g key={i}>
            <title>{`${r.sentence.text}｜你 ${formatScore(r.guess)}｜參考 ${formatScore(r.sentence.score)}`}</title>
            <TierMark tier={r.tier} x={p.x} y={p.y} />
          </g>
        );
      })}
      {ticks.map((t) => {
        const p = mapPoint(t, t);
        return (
          <g key={t} fontSize="20" fill={INK.muted}>
            <text x={p.x} y={y + size + 34} textAnchor="middle">
              {formatScore(t).replace('.00', '')}
            </text>
            <text x={x - 16} y={p.y + 7} textAnchor="end">
              {formatScore(t).replace('.00', '')}
            </text>
          </g>
        );
      })}
      <text x={x + size / 2} y={y + size + 70} fontSize="22" fill={INK.muted} textAnchor="middle">
        參考分數（難過 → 開心）
      </text>
      <text x={x - 70} y={y + size / 2} fontSize="22" fill={INK.muted} textAnchor="middle" transform={`rotate(-90 ${x - 70} ${y + size / 2})`}>
        你的答案
      </text>

      {/* Legend */}
      <g fontSize="24" fill={INK.text}>
        {TIERS.map((tier, i) => {
          const lx = 150 + i * 210;
          return (
            <g key={tier}>
              <TierMark tier={tier} x={lx} y={1192} r={11} />
              <text x={lx + 24} y={1200}>
                {TIER_INFO[tier].label} {counts[tier]}
              </text>
            </g>
          );
        })}
      </g>

      {/* Stats */}
      {stats.map(([label, value], i) => {
        const sx = 80 + i * 230;
        return (
          <g key={label}>
            <rect x={sx} y="1228" width="210" height="70" rx="18" fill="#ffffff" fillOpacity="0.06" />
            <text x={sx + 20} y="1260" fontSize="20" fill={INK.muted}>
              {label}
            </text>
            <text x={sx + 190} y="1282" fontSize="34" fontWeight="700" fill={INK.text} textAnchor="end">
              {value}
            </text>
          </g>
        );
      })}

      <text x={CARD.width / 2} y={CARD.height - 22} fontSize="20" fill={INK.faint} textAnchor="middle">
        {url}
      </text>
    </svg>
  );
});

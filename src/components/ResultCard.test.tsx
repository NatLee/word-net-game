import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SCORING } from '../config.ts';
import { bandWidth, CARD, mapPoint } from '../game/card.ts';
import { rankFor } from '../game/progress.ts';
import { createSession, reduce, type Action } from '../game/session.ts';
import type { Sentence } from '../types.ts';
import { ResultCard } from './ResultCard.tsx';
import { Summary } from './Summary.tsx';

vi.mock('../lib/card-image.ts', () => ({
  svgToPng: vi.fn(async () => new Blob(['png'], { type: 'image/png' })),
  saveImage: vi.fn(),
  shareImage: vi.fn(async () => {}),
  canShareImages: () => false,
}));

const sentences: Sentence[] = [-0.8, 0, 0.6].map((score, i) => ({ id: `s-${i}`, text: `句子 ${i}`, score, tags: [], pack: 'p' }));

/** A finished classic run with a perfect, a near and a miss. */
function finishedRun() {
  const guesses = [-0.8, 0.4, -0.6];
  let s = createSession('classic', sentences);
  for (const value of guesses) s = ([{ type: 'move', value }, { type: 'lock' }, { type: 'next' }] as Action[]).reduce(reduce, s);
  return s;
}

describe('emotion map geometry', () => {
  it('puts the reference across and the answer up, corners at the ends of the scale', () => {
    const { x, y, size } = CARD.map;
    expect(mapPoint(-1, -1)).toEqual({ x, y: y + size });
    expect(mapPoint(1, 1)).toEqual({ x: x + size, y });
    expect(mapPoint(0, 0)).toEqual({ x: x + size / 2, y: y + size / 2 });
  });

  it('draws each band as wide as its distance, measured across the diagonal', () => {
    // |guess − ref| ≤ d is a strip d high on each side, so d·√2 wide in value units, × size/2 per unit.
    expect(bandWidth(SCORING.tiers.perfect)).toBeCloseTo(SCORING.tiers.perfect * Math.SQRT2 * (CARD.map.size / 2));
  });
});

describe('ResultCard', () => {
  it('draws one mark per sentence, shaped by its tier, at (reference, answer)', () => {
    const session = finishedRun();
    const summary = { score: session.score, rounds: 3, averageDistance: 0.53, bestStreak: 1, perfects: 1 };
    const { container } = render(<ResultCard title="經典" name="小明" rank={rankFor(0)} summary={summary} results={session.results} url="https://example.com/" />);
    const marks = [...container.querySelectorAll('g > g[data-tier]')].filter((g) => g.parentElement?.querySelector('title'));
    expect(marks.map((g) => g.getAttribute('data-tier'))).toEqual(['perfect', 'near', 'miss']);
    const first = marks[0].querySelector('circle')!;
    expect(Number(first.getAttribute('cx'))).toBe(mapPoint(-0.8, -0.8).x); // a perfect guess sits on the diagonal
    expect(screen.getByRole('img', { name: /經典 成績卡：\d+ 分，3 句/ })).toBeInTheDocument();
    expect(container).toHaveTextContent('完美 1');
    expect(container).toHaveTextContent('Lv.1');
  });
});

describe('Summary', () => {
  it('saves the card as an image', async () => {
    const user = userEvent.setup();
    const session = finishedRun();
    const gains = { xp: session.score, rank: null, achievements: [] };
    render(
      <Summary
        session={session}
        title="經典"
        name="小明"
        rank={rankFor(session.score)}
        url="https://example.com/"
        shareText="text"
        best={false}
        gains={gains}
        onAgain={() => {}}
        onHome={() => {}}
        reducedMotion
      />,
    );
    await user.click(screen.getByRole('button', { name: '存成圖片' }));
    expect(await screen.findByText('成績卡已經存好了。')).toBeInTheDocument();
    const { svgToPng, saveImage } = await import('../lib/card-image.ts');
    expect(svgToPng).toHaveBeenCalledWith(expect.any(SVGSVGElement));
    expect(saveImage).toHaveBeenCalledWith(expect.any(Blob), 'word-net-經典.png');
    expect(screen.queryByRole('button', { name: '分享圖片' })).not.toBeInTheDocument(); // only where files can be shared
  });
});

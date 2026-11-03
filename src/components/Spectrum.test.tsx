import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { KEYBOARD, SCALE } from '../config.ts';
import { digitValue, percentOf } from '../game/scale.ts';
import { snap } from '../game/scoring.ts';
import { Spectrum } from './Spectrum.tsx';

function Harness({ onCommit = () => {}, locked = false }: { onCommit?: () => void; locked?: boolean }) {
  const [value, setValue] = useState(0);
  return (
    <Spectrum
      value={value}
      onChange={(v) => setValue(snap(v))}
      onNudge={(by) => setValue((v) => snap(v + by))}
      onCommit={onCommit}
      reveal={locked ? { reference: 0.6, tier: 'near' } : null}
    />
  );
}

const valueOf = () => Number(screen.getByRole('slider').getAttribute('aria-valuenow'));

describe('Spectrum keyboard', () => {
  it.each([
    ['{ArrowRight}', KEYBOARD.step],
    ['{ArrowUp}', KEYBOARD.step],
    ['{ArrowLeft}', -KEYBOARD.step],
    ['{Shift>}{ArrowRight}{/Shift}', KEYBOARD.bigStep],
    ['{PageDown}', -KEYBOARD.bigStep],
    ['{Home}', SCALE.min],
    ['{End}', SCALE.max],
    ['1', -1],
    ['5', 0],
    ['9', 1],
    ['6', 0.25],
  ])('%s puts the net at %s', async (keys, expected) => {
    const user = userEvent.setup();
    render(<Harness />);
    screen.getByRole('slider').focus();
    await user.keyboard(keys);
    expect(valueOf()).toBe(expected);
  });

  it('locks in with Enter or Space', async () => {
    const onCommit = vi.fn();
    const user = userEvent.setup();
    render(<Harness onCommit={onCommit} />);
    screen.getByRole('slider').focus();
    await user.keyboard('{Enter} ');
    expect(onCommit).toHaveBeenCalledTimes(2);
  });

  it('ignores keys after the reveal and shows the reference', async () => {
    const user = userEvent.setup();
    render(<Harness locked />);
    screen.getByRole('slider').focus();
    await user.keyboard('{End}');
    expect(valueOf()).toBe(0);
    expect(screen.getByRole('slider')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('參考 +0.60')).toBeInTheDocument();
  });
});

describe('scale helpers', () => {
  it('map the scale onto the track', () => {
    expect([percentOf(-1), percentOf(0), percentOf(1)]).toEqual([0, 50, 100]);
    expect([1, 3, 5, 7, 9].map(digitValue)).toEqual([-1, -0.5, 0, 0.5, 1]);
  });
});

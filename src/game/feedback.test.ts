import { describe, expect, it } from 'vitest';
import type { Sentence } from '../types.ts';
import { feedbackFor } from './feedback.ts';

const sentence = (score: number): Sentence => ({ id: 'feedback-test', text: '測試句子', score, tags: [], pack: 'test' });

describe('situational feedback', () => {
  it.each([
    [0.8, -0.8, '參考偏樂觀，你猜成悲觀；往開心那側靠一些。'],
    [0.8, 0, '參考偏樂觀，你猜成中立；往開心那側靠一些。'],
    [-0.8, 0.8, '參考偏悲觀，你猜成樂觀；往難過那側靠一些。'],
    [-0.8, 0, '參考偏悲觀，你猜成中立；往難過那側靠一些。'],
    [0, 0.8, '參考偏中立，你猜成樂觀；往難過那側靠一些。'],
    [0, -0.8, '參考偏中立，你猜成悲觀；往開心那側靠一些。'],
    [0.9, 0.25, '都讀成樂觀，但你猜得比參考更保守；往開心那側調整。'],
    [-0.9, -0.25, '都讀成悲觀，但你猜得比參考更保守；往難過那側調整。'],
    [0.19, -0.19, '都在中立範圍，你猜得更偏難過；往開心那側微調。'],
  ])('explains reference %s versus guess %s', (reference, guess, hint) => {
    const feedback = feedbackFor(sentence(reference), guess, 0);
    expect(feedback?.hint).toBe(hint);
    expect(feedback?.quip).toBeTruthy();
  });

  it.each([
    [0.25, 0.9, '都讀成樂觀，但你猜得比參考更強烈；往難過那側調整。'],
    [-0.25, -0.9, '都讀成悲觀，但你猜得比參考更強烈；往開心那側調整。'],
    [-0.19, 0.19, '都在中立範圍，你猜得更偏開心；往難過那側微調。'],
  ])('distinguishes excess intensity from the right direction', (reference, guess, hint) => {
    expect(feedbackFor(sentence(reference), guess, 0)?.hint).toBe(hint);
  });

  it('uses the spectrum boundaries, including exactly -0.2 and +0.2', () => {
    expect(feedbackFor(sentence(-0.2), 0.8, 0)?.hint).toContain('參考偏悲觀');
    expect(feedbackFor(sentence(0.2), -0.8, 0)?.hint).toContain('參考偏中立');
    expect(feedbackFor(sentence(0.21), -0.8, 0)?.hint).toContain('參考偏樂觀');
  });

  it('gives perfect guesses no corrective feedback, including the tier boundary', () => {
    for (const reference of [-0.8, 0, 0.8]) {
      expect(feedbackFor(sentence(reference), reference, 0)).toBeUndefined();
      expect(feedbackFor(sentence(reference), reference + 0.1, 0)).toBeUndefined();
    }
  });

  it('keeps close and near guesses gentle, while giving misses situational jokes', () => {
    const source = sentence(0.8);
    const jokesFor = (guess: number) => new Set(Array.from({ length: 4 }, (_, round) => feedbackFor(source, guess, round)?.quip));
    const close = jokesFor(0.6);
    expect(close).toEqual(jokesFor(0.4));
    for (const joke of jokesFor(-0.8)) expect(close.has(joke)).toBe(false);
    expect(feedbackFor(source, 0.6, 0)?.hint).toContain('更保守');
  });

  it('varies repeated misses across rounds and keeps a revealed result stable', () => {
    const source = sentence(-0.8);
    const jokes = Array.from({ length: 4 }, (_, round) => feedbackFor(source, 0.8, round)?.quip);
    expect(new Set(jokes).size).toBe(4);
    expect(feedbackFor(source, 0.8, 2)).toEqual(feedbackFor(source, 0.8, 2));
  });
});

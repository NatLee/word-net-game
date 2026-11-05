import { testFeedback } from '../test/fixtures.ts';
import { describe, expect, it } from 'vitest';
import type { Sentence } from '../types.ts';
import { feedbackFor } from './feedback.ts';
import { sentences } from '../data/index.ts';

const sentence = (score: number): Sentence => ({ id: 'feedback-test', text: '測試句子', score, tags: [], pack: 'test', feedback: testFeedback });

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

  it('celebrates perfect guesses with sentence-specific copy, including the tier boundary', () => {
    for (const reference of [-0.8, 0, 0.8]) {
      for (const guess of [reference, reference + 0.1]) {
        const feedback = feedbackFor(sentence(reference), guess, 0);
        expect(feedback.kind).toBe('hit');
        expect(feedback.quip).toBe(testFeedback.hit[0]);
        expect(feedback.hint).not.toContain('往');
      }
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

  it('uses the actual overtime sentence for hits, edges, reverse guesses and neutral guesses', () => {
    const source = sentences.find((s) => s.id === 'twist-001')!;
    const cases = [
      [-0.6, 'hit', 'hit'], [-0.4, 'edge', 'edge'], [0.8, 'opposite', 'higher'], [0, 'neutral', 'neutral'],
    ] as const;
    for (const [guess, kind, key] of cases) {
      const first = feedbackFor(source, guess, 0, 0);
      const next = feedbackFor(source, guess, 0, 1);
      expect(first.kind).toBe(kind);
      expect(next.kind).toBe(kind);
      expect(new Set([first.quip, next.quip])).toEqual(new Set(source.feedback[key]));
    }
  });

  it('reads happy tears and dropped ice cream differently, even for the same guess', () => {
    const happy = sentences.find((s) => s.id === 'love-015')!;
    const sad = sentences.find((s) => s.id === 'humor-032')!;
    expect(feedbackFor(happy, -0.8, 0).quip).toContain('答應求婚');
    expect(feedbackFor(sad, 0.8, 0).quip).toContain('減糖');
  });

  it('rotates across visits as well as rounds without changing an already revealed answer', () => {
    const source = sentences.find((s) => s.id === 'work-081')!;
    const repeated = Array.from({ length: 16 }, (_, visit) => feedbackFor(source, source.score, 0, visit).quip);
    expect(new Set(repeated).size).toBe(16); // two authored takes × eight endings
    expect(feedbackFor(source, source.score, 2, 3)).toEqual(feedbackFor(source, source.score, 2, 3));
  });

  it('changes the authored joke on the very next replay, before adding a different ending', () => {
    const source = sentences.find((s) => s.id === 'work-026')!;
    const firstTwo = [0, 1].map((visit) => feedbackFor(source, source.score, 0, visit).quip);
    expect(new Set(firstTwo)).toEqual(new Set(source.feedback.hit));
    expect(firstTwo.join('')).toContain('縮小咒');
    const variants = Array.from({ length: 16 }, (_, visit) => feedbackFor(source, source.score, 0, visit).quip);
    expect(new Set(variants).size).toBe(16);
  });

  it('has a valid authored response for every bundled sentence throughout the slider', () => {
    for (const source of sentences) {
      for (const guess of [-1, -0.8, -0.2, 0, 0.2, 0.8, 1, source.score]) {
        const feedback = feedbackFor(source, guess, 0);
        expect(feedback.quip, `${source.id}: ${guess}`).toBeTruthy();
        expect(feedback.hint).not.toContain('undefined');
      }
    }
  });
});

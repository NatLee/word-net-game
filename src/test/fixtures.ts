import type { SentenceFeedback } from '../types.ts';

export const testFeedback: SentenceFeedback = {
  hit: ['你讀到這句話真正的心情。'],
  edge: ['這句的情緒線索已經靠近了。'],
  higher: ['這句沒有你猜得那麼開心。'],
  lower: ['這句沒有你猜得那麼難過。'],
  neutral: ['再看看這句話藏著的起伏。'],
};

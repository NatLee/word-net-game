import type { Sentence, SentenceFeedback } from '../types.ts';
import { hashString } from './random.ts';
import { distance, moodOf, tierFor, type Mood } from './scoring.ts';

export type FeedbackKind = 'hit' | 'edge' | 'opposite' | 'neutral' | 'higher' | 'lower';
const MOOD_NAME: Record<Mood, string> = { positive: '樂觀', neutral: '中立', negative: '悲觀' };

// The sentence-specific line comes first. Short rotating endings vary the delivery.
const ENDINGS: Record<FeedbackKind, readonly string[]> = {
  hit: ['', '網子有在上班，值得給它一個讚。', '這次讀心術沒有偷懶打卡。', '字縫裡的空氣，被你抓包了。', '這張網今天可以當情緒翻譯官。', '讀心雷達有對準，先替它記一筆功。', '這一球接得連字幕組都想鼓掌。', '情緒對頻成功，網子可以小小得意一下。'],
  edge: ['', '網子擦到重點，還差一點不用寫檢討。', '讀心術差一格，先不用退回原廠。', '字幕快同步了，情緒配音再追一下。', '我們的雷達今天大概忘了戴眼鏡。', '這張網有抓到邊，主菜還差一口。', '離默契很近，先別讓誤差搶麥克風。', '讀到七八分，剩下的空氣再補一下。'],
  opposite: ['', '這次翻譯機把方向鍵坐扁了。', '你的字幕跟原片各自開了一家公司。', '情緒導航說左轉，這張網直接上了反向匝道。', '讀心雷達可能拿反了，還很有自信。', '這次的情緒配音，跟畫面正在分居。', '先倒帶，剛剛那份理解可能搭錯棚。', '這網撒得很果斷，方向也錯得很完整。'],
  neutral: ['', '中間那格很方便，但不能一直替我們值班。', '這次的情緒天平，先別拿來當桌面擺設。', '先別急著按「其他」，字縫裡還有人在說話。', '中立不是萬用貼紙，每句都貼會被看出來。', '我們的讀心客服，這題還不能只回收到。', '把這個細節撈進來，網子才不會只撈到空氣。', '這張網先醒醒，情緒還沒下班。'],
  higher: ['', '這次的快樂濾鏡大概忘了調透明度。', '慶功宴先緩緩，主角還沒說要辦。', '樂觀加值有點多，這筆心情沒有申請升級。', '情緒全糖先改半糖，句子還沒這麼甜。', '彩帶先收一點，清潔費也是我們出的。', '腦內喜劇導演今天又偷偷加戲了。', '這份開心先別灌水，量尺沒有附泳池。'],
  lower: ['', '悲劇配樂先關小，這裡還沒要上片尾名單。', '烏雲先別全搬來，心情的租屋空間有限。', '苦情字幕少打一行，原文沒買這麼多眼淚。', '腦內八點檔先休息，這句沒演那麼慘。', '這場雨可以收一點，情緒排水系統會抗議。', '黑色濾鏡別鎖死，畫面還有其他顏色。', '先別加演悲劇特別篇，主角還有亮的部分。'],
};

export function feedbackKindFor(reference: number, guess: number): FeedbackKind {
  const tier = tierFor(distance(guess, reference));
  if (tier === 'perfect') return 'hit';
  const a = moodOf(reference);
  const b = moodOf(guess);
  if (a !== 'neutral' && b !== 'neutral' && a !== b) return 'opposite';
  if (b === 'neutral') return 'neutral';
  if (tier === 'close' || tier === 'near') return 'edge';
  return guess > reference ? 'higher' : 'lower';
}

/** Stable throughout a reveal. A persisted visit seed varies repeat play, even after reloads. */
export function feedbackFor(sentence: Sentence, guess: number, round: number, visit = 0): { kind: FeedbackKind; quip: string; hint: string } {
  const kind = feedbackKindFor(sentence.score, guess);
  const key: keyof SentenceFeedback = kind === 'opposite' ? (guess > sentence.score ? 'higher' : 'lower') : kind;
  const lines = sentence.feedback[key];
  const endings = ENDINGS[kind];
  const serial = visit + round;
  const line = lines[(hashString(sentence.id) + serial) % lines.length];
  const ending = endings[Math.floor(serial / lines.length) % endings.length];
  const a = moodOf(sentence.score);
  const b = moodOf(guess);
  const direction = guess > sentence.score ? '難過' : '開心';
  let hint: string;
  if (kind === 'hit') {
    hint = `你抓準了這句的${MOOD_NAME[a]}與情緒強度。`;
  } else if (a !== b) {
    hint = `參考偏${MOOD_NAME[a]}，你猜成${MOOD_NAME[b]}；往${direction}那側靠一些。`;
  } else if (a === 'neutral') {
    hint = `都在中立範圍，你猜得更偏${guess > sentence.score ? '開心' : '難過'}；往${direction}那側微調。`;
  } else {
    const stronger = Math.abs(guess) > Math.abs(sentence.score);
    hint = `都讀成${MOOD_NAME[a]}，但你猜得比參考更${stronger ? '強烈' : '保守'}；往${direction}那側調整。`;
  }
  return { kind, quip: `${line}${ending}`, hint };
}

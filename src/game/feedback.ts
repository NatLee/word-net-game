import { MOOD_BANDS } from '../config.ts';
import type { Sentence } from '../types.ts';
import { hashString } from './random.ts';
import { distance, tierFor } from './scoring.ts';

type Mood = 'positive' | 'neutral' | 'negative';

const MOOD_NAME: Record<Mood, string> = { positive: '樂觀', neutral: '中立', negative: '悲觀' };

// Rows are the reference mood; columns are the player's reading of it.
const JOKES: Record<Mood, Record<Mood, readonly string[]>> = {
  positive: {
    positive: [
      '都知道是好消息，只是你們的慶祝音量沒調在同一格。',
      '喜事是同一樁，煙火預算卻不是同一份。',
      '開心的方向沒錯，是香檳開瓶的力道要再練練。',
      '同一場喜劇，你們一個微笑，一個已經笑到需要扶椅子。',
    ],
    neutral: [
      '喜訊都敲門了，你還在問是不是推銷。',
      '這句話在放煙火，你把它讀成氣象觀測。',
      '它開心到想轉圈，你只幫它登記「今日有移動」。',
      '快樂已經端上桌，你還在等叫號。',
    ],
    negative: [
      '人家在開香檳，你先幫忙預約了散心行程。',
      '這是喜訊，你的腦內配樂卻找來了失戀歌單。',
      '它的人生剛開花，你已經在研究花會不會過敏。',
      '人家笑出眼淚，你只讀到了眼淚，這剪輯很有個性。',
    ],
  },
  neutral: {
    positive: [
      '它只是報個平安，你已經替它訂好慶功宴。',
      '這句話只是路過，你連紅毯都鋪好了。',
      '今天沒有大喜事，是你的快樂濾鏡忘了關。',
      '它的情緒像白開水，你硬是喝出了全糖珍奶。',
    ],
    neutral: [
      '都選了中間，只是你們的「還好」不是同一種還好。',
      '都沒打算加戲，情緒的停車格還是得對準一點。',
      '這杯白開水的溫度，跟你猜的差了一小口。',
      '平淡也有刻度，今天先練習分辨「嗯」跟「嗯嗯」。',
    ],
    negative: [
      '它只是陳述，你已經幫它配好悲劇片尾曲。',
      '今天風平浪靜，是你的腦內編劇堅持加一場暴風雨。',
      '這句話只想當路人，你卻替它寫了三季苦情身世。',
      '它只是沒有驚嘆號，還沒到需要遞衛生紙的程度。',
    ],
  },
  negative: {
    positive: [
      '這份災情被你加上慶祝濾鏡，連當事人都想問哪裡下載。',
      '人家在苦笑，你把那個「笑」單獨抓去辦派對。',
      '它都快冒煙了，你還以為是在放生日蠟燭。',
      '這句話的心在下雨，你的情緒預報卻寫適合曬棉被。',
    ],
    neutral: [
      '這句話已經在求救，你的翻譯還停在「收到」。',
      '它把委屈打包好了，你卻把包裹歸類成一般文件。',
      '當事人的眉頭都打結了，你只覺得字體有點彎。',
      '它的心情在漏水，你的報告寫「室內濕度略高」。',
    ],
    negative: [
      '都看出烏雲了，只是你們對雨勢的估計差很多。',
      '同樣是心累，一個版本嘆氣，一個版本要配八點檔。',
      '抱怨的頻道有接上，音量旋鈕還沒對齊。',
      '苦的方向抓到了，接下來分清楚是黑咖啡還是中藥。',
    ],
  },
};

const GENTLE_JOKES = [
  '網子有擦到邊，讀心術再校正一下就好。',
  '情緒訊號有收到，只差最後一點調頻。',
  '這次有讀到空氣，只是標點符號還沒翻譯完。',
  '離讀心大師不遠，先把這一小段誤差當作學費。',
];

/** Use the same neutral boundaries as the labels on the game's spectrum. */
function moodOf(value: number): Mood {
  if (value <= MOOD_BANDS[1].upTo) return 'negative';
  return value <= MOOD_BANDS[2].upTo ? 'neutral' : 'positive';
}

/** Stable during a reveal; sentence, guess and round vary the joke without render-time randomness. */
export function feedbackFor(sentence: Sentence, guess: number, round: number): { quip: string; hint: string } | undefined {
  const tier = tierFor(distance(guess, sentence.score));
  if (tier === 'perfect') return undefined;

  const referenceMood = moodOf(sentence.score);
  const guessedMood = moodOf(guess);
  const direction = guess > sentence.score ? '難過' : '開心';
  let hint: string;
  if (referenceMood !== guessedMood) {
    hint = `參考偏${MOOD_NAME[referenceMood]}，你猜成${MOOD_NAME[guessedMood]}；往${direction}那側靠一些。`;
  } else if (referenceMood === 'neutral') {
    hint = `都在中立範圍，你猜得更偏${guess > sentence.score ? '開心' : '難過'}；往${direction}那側微調。`;
  } else {
    const stronger = Math.abs(guess) > Math.abs(sentence.score);
    hint = `都讀成${MOOD_NAME[referenceMood]}，但你猜得比參考更${stronger ? '強烈' : '保守'}；往${direction}那側調整。`;
  }

  const jokes = tier === 'miss' || referenceMood === 'neutral' && guessedMood === 'neutral'
    ? JOKES[referenceMood][guessedMood]
    : GENTLE_JOKES;
  const index = (hashString(`${sentence.id}:${guess}`) + round) % jokes.length;
  return { quip: jokes[index], hint };
}

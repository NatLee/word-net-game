<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/NatLee/word-net-game/master/docs/images/hero-dark.png">
    <img src="https://raw.githubusercontent.com/NatLee/word-net-game/master/docs/images/hero-light.png" alt="Word Net：讀一句話（例如「這部電影好看到我睡著了兩次。」），把網子撒在難過到開心的刻度上，揭曉參考分數 -0.50，猜 -0.45 拿到「完美！」+125 分（100 × 1.25 連擊）。五種玩法：經典、限時、生存、每日挑戰、雙人對戰" width="960">
  </picture>
</p>

<p align="center">
  <a href="https://github.com/NatLee/word-net-game/actions/workflows/deploy.yml"><img src="https://github.com/NatLee/word-net-game/actions/workflows/deploy.yml/badge.svg" alt="Deploy to GitHub Pages"></a>
  <a href="https://github.com/NatLee/word-net-game/actions/workflows/ci.yml"><img src="https://github.com/NatLee/word-net-game/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://natlee.github.io/word-net-game/"><img src="https://img.shields.io/badge/play-natlee.github.io%2Fword--net--game-8b5cf6" alt="Play on GitHub Pages"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/code-MIT-22c55e" alt="Code: MIT"></a>
  <a href="src/data/packs/LICENSE"><img src="https://img.shields.io/badge/sentences-CC_BY_4.0-f59e0b" alt="Sentences: CC BY 4.0"></a>
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4">
</p>

**Word Net** 是一個猜情緒的網頁小遊戲。畫面上出現一句話，你把網子拖到「難過 ↔ 開心」之間你覺得的位置，按下「撒網！」，參考分數就會落下來，越接近分數越高，連續猜準還有連擊加成。有限時、生存、每日挑戰和雙人對戰，玩完拿到一張附「情緒地圖」的成績卡。不用安裝，打開就能玩：**<https://natlee.github.io/word-net-game/>**

*A small mood-guessing game in Traditional Chinese: read a sentence, cast your net on the sad ↔ happy scale, and see how close you got to the reference score. Five modes, ranks, achievements, a shareable result card, and a two-player mode for one device.*

<p align="center">
  <img src="https://raw.githubusercontent.com/NatLee/word-net-game/master/docs/images/reveal.gif" alt="揭曉動畫：「我沒事，真的。」網子撒在 -0.45，網子落下、參考分數 -0.40 掉進網裡，畫面邊緣閃出綠光，「完美！」彈出，分數翻牌成 +125（100 × 1.25 連擊），下方出現說明「會特別強調『真的』，通常是有事。」" width="560">
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/NatLee/word-net-game/master/docs/images/play-desktop-dark.webp">
    <img src="https://raw.githubusercontent.com/NatLee/word-net-game/master/docs/images/play-desktop-light.webp" alt="桌面版遊戲畫面：經典模式第 2 句「捷運又誤點，這禮拜第三次遲到。」，網子撒在 -0.65，參考分數 -0.60，顯示「完美！」+125（100 × 1.25 連擊），上方是連擊 2 和總分 225" width="820">
  </picture>
</p>
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/NatLee/word-net-game/master/docs/images/mobile-dark.webp">
    <img src="https://raw.githubusercontent.com/NatLee/word-net-game/master/docs/images/mobile-light.webp" alt="手機版的三個畫面：首頁（段位和經驗值、題庫選擇、模式卡片）、拖動網子時、揭曉後（完美！+125）" width="820">
  </picture>
</p>

## 怎麼玩

1. 第一次來先取個名字，排行榜和成績卡會用這個名字。
2. 在首頁選題庫（全部、日常短句、話中有話、反諷、自嘲、幽默、職場、戀愛、網路用語），再選一種玩法：
   - **經典**：10 句，沒有時間限制。
   - **限時**：60 秒內答越多越好。揭曉答案時不計時，接著會自動換下一句。
   - **生存**：3 顆心。「失手」扣一顆，連擊每到第 5 句補一顆（最多 3 顆），心扣完就結束，看你能撐多久。
   - **每日挑戰**：每天同一組 5 句，固定從全部題庫挑，大家拿到的題目一樣，一天只能玩一次。
   - **雙人對戰**：兩個人用同一台裝置輪流撒網，見下方說明。
3. 讀完句子，把網子拖到你覺得的位置。最左邊是 -1（很難過），中間是 0（普通），最右邊是 +1（很開心）。
4. 按「撒網！」鎖定答案。網子落下、參考分數掉在刻度上，畫面告訴你差多少、拿幾分。沒有拿到「完美」時，會依「參考情緒 × 你的選擇」的樂觀、中立、悲觀九種組合，提示你該往哪側調整；同方向也會區分猜得太強烈或太保守。「很接近／差一點」輕鬆提醒，「失手」則配上幽默吐槽，例如把悲觀猜成樂觀時：「人家在苦笑，你把那個『笑』單獨抓去辦派對。」同一情境有多句文案，會隨題目、答案和回合變換，揭曉期間保持不變。雙人對戰各自有提示，兩人都答完才公開。
5. 反諷、自嘲、網路用語這類容易猜錯的句子，揭曉後也會保留原本的句意解說。情境提示和解說都會透過螢幕閱讀器念出來。

反諷、自嘲和幽默三個題庫最考驗人：參考分數照「說話的人真正的感受」給，不照字面。例如：

| 句子 | 參考分數 | 揭曉時的解說 |
|---|---|---|
| 謝謝你提醒我，報告昨天就截止了。 | -0.75 | 提醒來得太晚，道謝其實是懊惱。 |
| 真討厭，朋友又偷偷幫我準備了驚喜。 | +0.85 | 「討厭」是害羞，其實超開心。 |
| 我沒什麼才藝，唯一的才藝是讓小孩笑到停不下來。 | +0.80 | 說自己沒才藝，其實很自豪。 |
| 滷了三個小時的肉，被我一轉身整鍋打翻在地上。 | -0.85 | 說得像笑話，其實非常心痛。 |

### 計分

差距是「你的答案」和「參考分數」相減的絕對值，從 0（完全一樣）到 2（剛好相反）。

| 結果 | 差距 | 分數 |
|---|---|---|
| ◎ 完美 | ≤ 0.10 | 100 |
| ○ 很接近 | ≤ 0.25 | 75–89 |
| △ 差一點 | ≤ 0.50 | 50–74 |
| × 失手 | > 0.50 | 0–49（差 1.00 以上是 0） |

連續拿到「很接近」以上就是連擊：第 2 句起每句多乘 0.25 倍，最多 2 倍。例如連續第 3 句很接近、差 0.20，就是 80 × 1.5 = 120 分。

### 段位和成就

每句拿到的分數都算經驗值（XP），累積到門檻就升一個段位。首頁和右上角的「我的檔案」看得到離下一段還差多少。

| 段位 | 需要的經驗值 |
|---|---|
| Lv.1 見習撒網人 | 0 |
| Lv.2 捕語學徒 | 500 |
| Lv.3 情緒漁夫 | 1,500 |
| Lv.4 讀心漁師 | 3,500 |
| Lv.5 共感船長 | 7,000 |
| Lv.6 心海領航員 | 12,000 |
| Lv.7 心海傳說 | 20,000 |

另外有 16 個成就，例如第一次「完美」、一局連擊 10、反諷／自嘲／幽默的句子各猜準 10 次、參考分數兩個極端都拿過完美、連續 3 天完成每日挑戰、每個題庫都玩過、打完一場雙人對戰。全部列在「我的檔案」，解鎖的會標上日期。

解鎖成就、升段位、每累計判斷滿 100 句時，畫面上方會跳出小通知（升段位和滿 100 句還有彩帶）。通知不會擋住遊戲，限時模式的時間也不會因此吃虧。

這些數字都寫在 [`src/config.ts`](src/config.ts) 和 [`src/game/achievements.ts`](src/game/achievements.ts)，改那裡就能調整規則，遊戲裡的說明會跟著變。

### 成績卡和情緒地圖

<img src="https://raw.githubusercontent.com/NatLee/word-net-game/master/docs/images/result-card.webp" alt="成績卡：經典模式 1201 分、Lv.2 捕語學徒、每句的結果符號，中間是情緒地圖：10 個點大多落在斜線的完美帶上，兩個三角形（差一點）偏離斜線；下方是圖例和句數 10、平均差距 0.14、最高連擊 5、完美 6" width="320" align="right">

一局結束會出現一張成績卡：分數、段位、每句的結果，以及一張「情緒地圖」。

地圖的橫軸是參考分數，縱軸是你的答案，每句話是一個點。點落在斜線上，就是猜得一模一樣；斜線兩旁的色帶是「完美」和「很接近」的範圍。點在斜線上方表示你猜得比較開心，在下方表示猜得比較難過。每個點用和分享文字一樣的符號（◎ ○ △ ×）畫，看不出顏色也分得出來。

按「存成圖片」會下載一張 1080 × 1350 的 PNG；手機上還有「分享圖片」，可以直接傳到聊天軟體。

也可以「複製成績」貼成文字。分享的文字只有每句的結果符號，不會洩漏答案：

```text
Word Net 每日挑戰 2026-11-04
412 分（5 句）
◎◎○△×
最高連擊 3｜平均差距 0.18
https://natlee.github.io/word-net-game/
```

<br clear="right">

### 雙人對戰

兩個人用同一台裝置，在同一句話上輪流撒網。第一個人撒好，網子就會藏起來，第二個人從中間開始撒；兩個人都撒完，兩張網子和參考分數一起揭曉。每句分數高的人贏那一句，6 句之後總分高的人贏，同分再比贏的句數。

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/NatLee/word-net-game/master/docs/images/duo-desktop-dark.webp">
    <img src="https://raw.githubusercontent.com/NatLee/word-net-game/master/docs/images/duo-desktop-light.webp" alt="雙人對戰的揭曉畫面：「今天的下午茶是部門經理請的。」參考分數 +0.55，小明的網子在 +0.60（完美 +100），阿華的網子在 +0.20（差一點 +65），顯示「這句 小明 贏！」" width="720">
  </picture>
</p>

第一個玩家是這台裝置的主人，他的答案會算進累計句數、經驗值和成就。第二個玩家的答案只算進排行榜的「標註數」。

### 鍵盤和無障礙

| 按鍵 | 作用 |
|---|---|
| ← → 或 ↑ ↓ | 網子移動 0.05 |
| Shift + 方向鍵、PageUp／PageDown | 網子移動 0.25 |
| Home／End | 跳到最左（-1）或最右（+1） |
| 1–9 | 直接跳到 9 個固定位置：1 是 -1、5 是 0、9 是 +1 |
| Enter 或空白鍵 | 撒網；揭曉後按 Enter 換下一句 |
| Esc | 關掉對話框 |

- 每一句開始時，焦點會自動放在網子上；揭曉後移到「下一句」，全程不用滑鼠。
- 網子是標準的滑桿元件（`role="slider"`），螢幕閱讀器會念出目前的位置，例如「有點開心（+0.35）」，揭曉結果和通知也會念出來。
- 系統開了「減少動態」時，所有動畫、計分跳動、粒子和彩帶都會關掉。
- 深色、淺色可以跟著系統，也可以在右上角切換。
- 手機上用手指拖或點刻度都可以，拖動時頁面不會跟著捲動。

## 遊戲流程

```mermaid
flowchart TD
  start([第一次來：取個名字]) --> pick{選題庫和玩法}
  pick -->|經典：10 句| read
  pick -->|限時：60 秒| read
  pick -->|生存：3 顆心| read
  pick -->|每日挑戰：每天同一組 5 句| read
  pick -->|雙人對戰：輪流撒網、一起揭曉| read
  read[讀一句話] --> cast[把網子拖到你覺得的位置<br/>-1 很難過 … +1 很開心]
  cast -->|撒網！或 Enter| reveal[揭曉參考分數<br/>依差距給分<br/>連續猜準有連擊]
  reveal --> record[(記下這句的答案<br/>累計句數和經驗值)]
  record -.->|每滿 100 句、升段位、解鎖成就| party[通知和彩帶]
  reveal -->|還有下一句| read
  reveal -->|最後一句、時間到或心扣完| summary[成績卡：分數、段位、情緒地圖<br/>存成圖片或分享文字]
  summary --> board[這台裝置的排行榜]
```

## 你的資料存在哪裡

名字、每一句的答案、經驗值、成就、排行榜、每日挑戰紀錄和設定，都只存在你的瀏覽器裡（localStorage），遊戲不會把任何東西傳到別的地方。清除這個網站的資料就會消失，排行榜也只是這台裝置上的排行。

## 在本機跑

需要 Node.js 22.13 以上或 24（CI 用 24）。

```bash
npm ci
npm run dev        # 開發伺服器，網址會印在終端機上（預設 http://localhost:5173/）
npm test           # Vitest：計分、題庫檢查、成就、遊戲流程和主要畫面
npm run lint       # ESLint
npm run packs      # 題庫報告：每包的句數、分數分布、最相像的句子
npm run build      # 型別檢查 + 正式版，輸出到 dist/
npm run preview    # 在本機看 dist/ 的正式版
```

GitHub Pages 的網址在 `/word-net-game/` 底下。部署的 workflow（[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)）會從 Pages 的設定讀出這個路徑，用 `BASE_PATH` 傳給 build。想在本機模擬一樣的路徑：

```bash
BASE_PATH=/word-net-game/ npm run build
BASE_PATH=/word-net-game/ npm run preview   # 打開 http://localhost:4173/word-net-game/
```

（Windows 的 Git Bash 會把 `/word-net-game/` 改寫成 Windows 路徑，前面再加 `MSYS_NO_PATHCONV=1`。）

push 到 `master` 時，deploy workflow 會跑 lint、測試、build，再部署到 Pages。Pull request 由 [`ci.yml`](.github/workflows/ci.yml) 跑一樣的檢查。

## 新增句子

句子放在 [`src/data/packs/`](src/data/packs/)，一個 JSON 檔是一個題庫。新增一個檔案，裡面的句子就會加進遊戲，首頁的「題庫」也會多一個選項，不用改程式。

```json
{
  "id": "my-pack",
  "title": "我的題庫",
  "language": "zh-TW",
  "source": "原創：為 word-net-game 撰寫的句子和參考分數。",
  "license": "CC-BY-4.0",
  "sentences": [
    { "id": "mine-001", "text": "今天的晚餐超好吃！", "score": 0.8, "tags": ["吃"] },
    { "id": "mine-002", "text": "我沒事，真的。", "score": -0.4, "tags": ["話中有話"], "note": "會特別強調「真的」，通常是有事。" }
  ]
}
```

| 欄位 | 規則 |
|---|---|
| `id`（題庫） | 小寫英文、數字和 `-`，不能跟別的題庫重複 |
| `source` | 句子和分數從哪裡來。用別人的資料集時，寫上出處 |
| `license` | 句子和分數的授權，用 SPDX 代碼（例如 `CC-BY-4.0`）。這個資料夾的 [LICENSE](src/data/packs/LICENSE) 說明內建題庫都是 CC BY 4.0；加入別的授權的題庫時，記得一起更新 |
| `sentences[].id` | 小寫英文、數字和 `-`，**所有題庫加起來**不能重複。紀錄和每日挑戰靠它認句子，發佈後不要改 |
| `sentences[].text` | 1–60 個字 |
| `sentences[].score` | 參考分數，-1 到 1，兩位小數 |
| `sentences[].tags` | 顯示在句子下方的小標籤，可以是空陣列。`反諷`、`自嘲`、`幽默` 三個標籤各有一個成就（[`src/game/achievements.ts`](src/game/achievements.ts) 的 `TAG_GOALS`） |
| `sentences[].note` | 選填，揭曉後顯示的說明，適合反諷或容易猜錯的句子 |

另外兩條規則，`npm test` 也會檢查：
- 所有題庫加起來，不能有兩句一樣的句子（只差標點或空白也算一樣）。
- 每個題庫至少要有 15% 的句子偏難過（-0.25 以下），15% 偏開心（+0.25 以上），不能全擠在中間。

改完跑 `npm test`。格式有錯時，測試會列出每個問題和位置，例如：

```text
Error: Sentence packs are invalid:
- ./packs/my-pack.json sentences[1].score: must be a number from -1 to 1
```

想看分數分布夠不夠散、有沒有寫得太像的句子，跑 `npm run packs`。它會列出每包的句數、有幾句附解說、五個情緒區間各有幾句，以及字面最相像的句子組合。

每日挑戰是從所有句子裡，用日期決定挑哪 5 句。所以加了句子之後，當天和之後的每日題目會跟著改變。

## 題庫和授權

- 八個內建題庫（日常短句 54 句、話中有話 80 句、反諷 73 句、自嘲 73 句、幽默 73 句、職場 80 句、戀愛 30 句、網路用語 30 句，共 493 句）的句子和參考分數，都是為這個專案原創的，沒有取自任何資料集或網站。參考分數是一種看法，不是標準答案；猜得跟它不一樣，不代表你錯了。
- **程式碼**用 [MIT 授權](LICENSE)（Copyright NatLee）。
- **句子和參考分數**（[`src/data/packs/`](src/data/packs/) 裡的 JSON）用 [CC BY 4.0](src/data/packs/LICENSE)：可以複製、改寫、商用，只要註明出處，例如「“Word Net sentence packs” by NatLee（https://github.com/NatLee/word-net-game），CC BY 4.0」。每個題庫的 `license` 欄位也寫著它的授權。
- 字型 [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) 用 SIL Open Font License 1.1；圖示 [Lucide](https://lucide.dev/) 用 ISC 授權。音效是程式即時合成的，沒有音檔。

## 2018 年的原版

這個遊戲 2018 年的名字是 WordNet，是一個收集「句子情緒標註」的網頁：畫面顯示一句話，玩家用滑桿在難過和開心之間打分數，按送出後把名字、句子和分數寫進 Google 表單；排行榜則讀 Google 試算表，看誰標得最多。

到 2026 年，它已經不能用了：句子來自 Heroku 上的小服務，那個 app 已經不存在；排行榜用的 Google 試算表舊 API 在 2021 年關閉。這次用 React、Tailwind 和 Vite 重做成可以計分的遊戲。作者也不再收集標註資料，所以送到 Google 表單的部分拿掉了，其他功能都還在：

| 2018 年 | 現在 |
|---|---|
| 從 Heroku 抓一句話 | 句子放在 repo 裡的題庫，加上參考分數，變成可以計分的遊戲 |
| 滑桿 -1 到 1，兩端是難過和開心的臉 | 一樣的刻度和兩張臉，滑桿換成可以拖、點、用鍵盤操作的網子 |
| 輸入名字，存在瀏覽器裡 | 一樣，第一次來會先問名字，可以在設定裡改 |
| 畫面上方的累計次數、每 100 次恭喜 | 一樣，次數顯示在右上角，每滿 100 句跳出恭喜通知和彩帶 |
| 「你確定嗎？」後送到 Google 表單 | 拿掉了，答案只留在你的瀏覽器裡 |
| 3 步驟 gif 教學 | 3 步驟互動教學，最後一樣是「做得好！我們可以開始了！」 |
| 線上排行榜（每個名字標過幾句） | 這台裝置的排行榜：各模式最高分，加上「標註數」（每個名字標過幾句） |

<details>
<summary>2018 年的 3 步驟教學（原版 gif）</summary>

| 第一步：輸入名字 | 第二步：讀句子、拉滑桿 | 第三步：按送出 |
|---|---|---|
| ![2018 年教學第一步：在輸入框打上名字](docs/2018/tutorial-1-name.gif) | ![2018 年教學第二步：句子「今天天氣好嗎」下方的滑桿從難過拉到開心](docs/2018/tutorial-2-slider.gif) | ![2018 年教學第三步：按下送出，確認後顯示已送出](docs/2018/tutorial-3-submit.gif) |

</details>

## 專案結構

```text
src/
  config.ts          遊戲規則：計分、模式、生命、段位、時間、里程碑
  data/packs/        題庫（JSON）和它們的 CC BY 4.0 授權；validate.ts 負責檢查，pack-stats.ts 是題庫報告
  game/              純邏輯：計分、發牌、單人一局、雙人對戰、段位、成就、成績卡的座標、分享文字
  lib/               瀏覽器相關：儲存、排行榜、成績卡存圖、音效、深淺色
  hooks/  components/  App.tsx   畫面
docs/images/         README 的圖；src/hero.html 是封面圖的原始檔
docs/2018/           2018 年原版的教學 gif
```

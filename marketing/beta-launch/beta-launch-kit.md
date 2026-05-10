# App Gardenium Beta Launch Kit

X / Redditでβ版公開を告知するための短尺動画案と投稿文です。

## Generated Assets

- `assets/`: 実画面スクリーンショット
- `frames/`: 縦長動画に使える単体フレーム
- `exports/thumbnail-beta-open.png`: X / Reddit向け横長サムネイル
- `exports/pattern-a-teaser.mp4`: Pattern Aの縦長ティザー動画
- `exports/pattern-a-storyboard.png`: 王道ティザーの絵コンテ
- `exports/pattern-b-storyboard.png`: 開発者向けの絵コンテ
- `exports/pattern-c-storyboard.png`: ユーザー / テスター向けの絵コンテ

Regenerate:

```bash
node marketing/beta-launch/create-assets.mjs
```

Record Pattern A MP4:

```bash
node marketing/beta-launch/record-pattern-a.mjs
```

Then open `http://localhost:4177` in a browser. The recorder saves the finished file to `exports/pattern-a-teaser.mp4` when the 24-second capture completes.

## Pattern A: 王道ティザー

Theme: App Gardeniumを初見の人に一番伝えやすい、β公開の本命案。

Length: 24s

Timeline:

| Time | Visual | Caption |
| --- | --- | --- |
| 0-3s | ホーム画面 | 欲しいアプリ、眠ってない？ |
| 3-7s | 投稿画面 | ひとことだけでも、タネになる |
| 7-12s | アイデア一覧 | 共感できるアイデアを探す |
| 12-17s | アイデア詳細 | 応援とコメントで、形にしていく |
| 17-22s | Greenhouse | 作りかけも、途中の迷いも置ける |
| 22-24s | ロゴ / ホーム | App Gardenium β、触ってください |

Voiceover:

> 欲しいアプリ、眠っていませんか。App Gardeniumは、アプリの「あったらいいな」を投稿して、みんなで育てる場所です。β版を公開しました。触って、感想を聞かせてください。

AI video prompt:

> Create a clean 24-second vertical product teaser for a beta web app called App Gardenium. Use the provided real UI screenshots as the main visuals. Warm paper background, calm indie app mood, subtle zooms and slide transitions, no invented UI. Japanese captions. End with "App Gardenium β / 触ってください".

## Pattern B: 開発者向け

Theme: Indie hacker / solo developer向け。「作る前に欲しい人へ会う」訴求。

Length: 21s

Timeline:

| Time | Visual | Caption |
| --- | --- | --- |
| 0-3s | アイデア一覧 | 誰も使わないかも、を減らしたい |
| 3-7s | アイデア一覧 | 実際の困りごとを探す |
| 7-11s | 投稿画面 | 作りかけのアプリも持ち込める |
| 11-15s | Greenhouse | 早めに反応をもらう |
| 15-19s | アイデア詳細 | テスター募集へつなげる |
| 19-21s | ロゴ / ホーム | 一緒に育ててください |

Voiceover:

> 作っている途中のアプリを、ひとりで抱え込まなくていい。App Gardeniumでは、アイデアや作りかけを置いて、早めに反応をもらえます。β版、開けます。

AI video prompt:

> Create a 21-second vertical launch video for indie developers. Show App Gardenium as a place to discover validated app ideas, share works in progress, and invite early feedback. Use real screenshots only, warm minimal design, gentle motion, Japanese captions, no stock footage.

## Pattern C: ユーザー / テスター向け

Theme: 「ほしいアプリに声を足す」参加導線。

Length: 20s

Timeline:

| Time | Visual | Caption |
| --- | --- | --- |
| 0-2s | ホーム画面 | こんなアプリ、欲しい？ |
| 2-6s | アイデア一覧 | 共感できるタネを探す |
| 6-10s | アイデア詳細 | 応援すると見つかりやすくなる |
| 10-14s | アイデア詳細 | あなたの状況をコメント |
| 14-18s | Greenhouse | βテストのきっかけに |
| 18-20s | ロゴ / ホーム | App Gardenium β公開中 |

Voiceover:

> まだ存在しないアプリに、あなたの声を足せます。応援、コメント、テスト参加。App Gardeniumは、アイデアをみんなで育てる小さな庭です。

AI video prompt:

> Create a 20-second vertical beta announcement video for potential users and testers. Highlight browsing app ideas, supporting ideas, commenting, and joining beta tests. Use real App Gardenium UI screenshots, soft warm palette, subtle camera motion, Japanese captions.

## Recommended Pick

最初の投稿はPattern Aがおすすめです。  
Xでは短く刺さり、Redditでは「何を作ったのか」が説明しやすいです。BとCは、初回投稿後の追い投稿やリプライ用に回すと自然です。

## X Post Drafts

### Japanese

App Gardeniumのβ版を公開します。

「こんなアプリあったらいいな」を投稿して、応援やコメントをもらいながら、みんなで育てる場所です。

まだ小さなβですが、触って感想をもらえたら嬉しいです。

### English

I'm opening the beta for App Gardenium.

It's a small community for planting "I wish this app existed" ideas, supporting them, and helping them grow into real products.

Still early, but I'd love your feedback.

## Reddit Post Draft

Title:

> I made a beta community for growing app ideas together: App Gardenium

Body:

Hi! I'm opening the beta for App Gardenium.

The idea is simple: people can post "I wish this app existed" ideas, others can support or comment, and makers can bring works in progress to get early feedback.

It's still a small beta, so I'm especially looking for feedback on:

- whether the concept is immediately understandable
- what feels missing from the posting flow
- whether makers would actually share early WIP apps here
- what would make you want to comment or support an idea

I'd be grateful if you try it and tell me what feels confusing, promising, or unnecessary.

## Production Notes

- Best first format: vertical 1080x1920, 20-24s, captions always visible.
- Secondary format: horizontal thumbnail from `exports/thumbnail-beta-open.png`.
- Keep the first 2 seconds extremely clear: "欲しいアプリ、眠ってない？"
- Use actual UI screenshots or screen recording. Avoid generic stock visuals because App Gardenium's mood is already distinctive.

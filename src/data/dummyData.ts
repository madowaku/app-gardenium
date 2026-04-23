import { User, Idea, Comment, Support, BuilderReaction, TesterCall, TesterSignup, Release, GrowthEvent, PopulatedIdea } from '../types/appSproutTypes';

export const DUMMY_USERS: User[] = [
  { id: 'u1', name: 'Elena R.', role: 'user', createdAt: Date.now() - 1000000000, seedCount: 5, sproutCount: 2, releasedCount: 1, plan: 'free' },
  { id: 'u2', name: 'Baker Sam', role: 'user', createdAt: Date.now() - 2000000000, seedCount: 3, sproutCount: 1, releasedCount: 0, plan: 'supporter' },
  { id: 'u3', name: 'Tim V.', role: 'user', createdAt: Date.now() - 3000000000, seedCount: 1, sproutCount: 4, releasedCount: 2, plan: 'pro' },
  { id: 'u4', name: 'Sarah L.', role: 'user', createdAt: Date.now() - 4000000000, seedCount: 10, sproutCount: 0, releasedCount: 0, plan: 'free' },
  { id: 'u5', name: 'DevStudio X', role: 'user', createdAt: Date.now() - 5000000000, seedCount: 2, sproutCount: 5, releasedCount: 3, plan: 'pro' },
];

export const DUMMY_IDEAS: Idea[] = [
  {
    id: 'i1',
    type: 'seed',
    stage: 'seed',
    title: 'カップル向け・片側だけ振動する目覚まし',
    oneLineSummary: '片方のスマートウォッチだけが振動して、違う時間に起きるパートナーを起こさない目覚ましアプリ。',
    problemDetails: 'パートナーと起きる時間が違います。今の目覚ましの音だと二人とも起きてしまい、まだ寝ていられる人の睡眠の質が下がります。',
    targetUsers: '起きる時間が違うカップル、睡眠が浅い人、シフトワーカー',
    alternatives: 'Apple Watchのデフォルトアラーム、別々のベッドで寝る、耳栓',
    frustrations: 'Apple Watchのデフォルトだと起きられないことがあったり、複数デバイス間の設定が面倒です。',
    minFeatures: '2つのスマホ間でのスケジュール同期、徐々に強くなる振動パターン、パートナーのスマホからのスヌーズ制御',
    tags: ['Health', 'Wearable', 'Utility'],
    authorId: 'u1',
    supportCount: 342,
    commentCount: 45,
    builderReactionCount: 3,
    createdAt: Date.now() - 86400000 * 60,
    updatedAt: Date.now() - 86400000 * 59,
    rootIdeaId: 'i1',
    releaseStatus: 'none',
    visibility: 'public'
  },
  {
    id: 'i2',
    type: 'seed',
    stage: 'growing',
    title: '触って調整できるレシピメーカー',
    oneLineSummary: '材料のスライダーを動かして感覚的にレシピを調整し、食感がどう変わるか視覚的にわかるアプリ。',
    problemDetails: 'お菓子作りは科学です。砂糖を20%減らしたら水分はどうなる？みんな勘でやって失敗します。',
    targetUsers: 'お菓子作りをする人、食事制限がある人、料理を学ぶ人',
    alternatives: '「砂糖 減らす どうなる」でググる、複雑なベーカーズパーセントの計算',
    frustrations: 'スプレッドシートは難しすぎます。ネットで検索しても人によって言うことがバラバラです。',
    minFeatures: '定番レシピのベース。主要な材料のスライダー。完成品の食感がどうなるかの視覚的なインジケーター。',
    tags: ['Food', 'Education'],
    authorId: 'u2',
    supportCount: 890,
    commentCount: 112,
    builderReactionCount: 8,
    createdAt: Date.now() - 86400000 * 14,
    updatedAt: Date.now() - 86400000 * 12,
    rootIdeaId: 'i2',
    releaseStatus: 'none',
    visibility: 'public'
  },
  {
    id: 'i3',
    type: 'sprout',
    stage: 'testing',
    title: 'Walk Mist (Grocery sorted by aisle)',
    oneLineSummary: '作りたいもののリストを入れると、よく行くスーパーの売り場の順番に自動で並べ替えてくれるアプリ。',
    problemDetails: 'リストの順番がバラバラなせいで、買い物のたびに店内をあっちこっち戻っています。',
    targetUsers: '忙しい親、効率的に買い物を済ませたい人',
    alternatives: '売り場順に手書きでメモを書き直す',
    frustrations: '今のリストアプリは、店内レイアウトを知ってくれません。',
    minFeatures: 'クラウドソースの店舗レイアウト。店舗マップに基づく自動カテゴリー分け。',
    tags: ['Productivity', 'Shopping'],
    demoUrl: 'https://example.com/grocery-tracker-demo',
    screenshots: [
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=800'
    ],
    whatItDoes: '事前に登録したよく行くスーパーの間取りデータに合わせて、入力した買い物リストを自動でソートします。',
    currentStatus: '触れるプロトタイプあり',
    lookingFor: ['使いやすさ・UI', '必要そうな機能', 'テスター募集'],
    struggles: 'フローが少し複雑で、離脱されないか心配です。',
    authorId: 'u3',
    supportCount: 1205,
    commentCount: 230,
    builderReactionCount: 12,
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 1,
    parentIdeaId: 'i100', // Root was a simple "Grocery sorting" seed
    rootIdeaId: 'i100',
    releaseStatus: 'beta',
    latestReleaseId: 'r1',
    visibility: 'public'
  },
  {
    id: 'i4',
    type: 'seed',
    stage: 'seed',
    title: 'SNSを開く前に1ページだけ本を読ませるアプリ',
    oneLineSummary: 'SNSを開こうとするたびに、電子書籍の1ページにリダイレクトされる優しい習慣化ツール。',
    problemDetails: '単にアプリをブロックされるとイライラするだけです。',
    targetUsers: 'スクリーンタイムを減らしたい人',
    alternatives: 'FreedomやForestなどのブロックアプリ',
    frustrations: '単なるブロックは罰みたいで嫌です。',
    minFeatures: 'アプリ起動の検知。ePubの1ページを表示。',
    tags: ['Wellbeing', 'Habits'],
    authorId: 'u4',
    supportCount: 156,
    commentCount: 12,
    builderReactionCount: 1,
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000 * 2,
    rootIdeaId: 'i4',
    releaseStatus: 'none',
    visibility: 'public'
  },
  {
    id: 'i5',
    type: 'sprout',
    stage: 'released',
    title: 'Focus Gardenium: Minimalist Pomodoro',
    oneLineSummary: 'A Pomodoro timer that grows a digital garden while you work. Released after community testing!',
    problemDetails: 'Existing timers are too clinical.',
    targetUsers: 'Students, remote workers, designers',
    alternatives: 'Forest, default clock',
    frustrations: 'Forest is great but sometimes too gamified.',
    minFeatures: 'Focused work sessions. Minimal UI.',
    tags: ['Productivity', 'Digital Wellbeing'],
    demoUrl: 'https://example.com/focus-sprout-demo',
    releasedAt: Date.now() - 86400000 * 5,
    screenshots: [
      'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?auto=format&fit=crop&q=80&w=800',
    ],
    authorId: 'u5',
    supportCount: 2450,
    commentCount: 560,
    builderReactionCount: 20,
    createdAt: Date.now() - 86400000 * 70,
    updatedAt: Date.now() - 86400000 * 5,
    parentIdeaId: 'i200', // Root was "Zen Timer" seed
    rootIdeaId: 'i200',
    releaseStatus: 'released',
    latestReleaseId: 'r2',
    visibility: 'public'
  }
];

export const DUMMY_RELEASES: Release[] = [
  {
    id: 'r1',
    ideaId: 'i3',
    rootIdeaId: 'i100',
    authorId: 'u3',
    status: 'beta',
    versionLabel: 'v0.9.0-beta',
    title: 'Walk Mist Beta',
    releasedAt: Date.now() - 86400000 * 7,
    createdAt: Date.now() - 86400000 * 8,
    channels: [
      { type: 'testflight', url: 'https://testflight.apple.com/join/example', label: 'TestFlight' },
      { type: 'web', url: 'https://beta.walkmist.com', label: 'Web Beta' }
    ],
    message: 'We finally have a working prototype for the first set of testers!',
    visibility: 'public'
  },
  {
    id: 'r2',
    ideaId: 'i5',
    rootIdeaId: 'i200',
    authorId: 'u5',
    status: 'released',
    versionLabel: 'v1.0.2',
    title: 'Focus Gardenium 1.0',
    releasedAt: Date.now() - 86400000 * 5,
    createdAt: Date.now() - 86400000 * 10,
    channels: [
      { type: 'app_store', url: 'https://apps.apple.com/focus-gardenium', label: 'App Store' },
      { type: 'google_play', url: 'https://play.google.com/focus-gardenium', label: 'Google Play' }
    ],
    message: 'App Gardenium comments really helped narrow down the core features. Thank you everyone!',
    visibility: 'public'
  }
];

export const DUMMY_GROWTH_EVENTS: GrowthEvent[] = [
  {
    id: 'ge1',
    ideaId: 'i3',
    type: 'created_sprout',
    title: '苗として公開',
    createdAt: Date.now() - 86400000 * 30
  },
  {
    id: 'ge2',
    ideaId: 'i3',
    type: 'beta_released',
    title: 'ベータ版リリース',
    body: 'TestFlightでの配布を開始しました。',
    createdAt: Date.now() - 86400000 * 7,
    relatedReleaseId: 'r1'
  }
];

export const DUMMY_TESTER_CALLS: TesterCall[] = [
  {
    id: 'tc1',
    ideaId: 'i3',
    authorId: 'u5',
    status: 'open',
    maxTesters: 20,
    requirements: ['Android 10+', 'Willing to test in-store for 2 grocery trips minimum'],
    developerNotes: 'Early build focus on the layout mechanism.',
    platform: 'android',
    createdAt: Date.now() - 86400000 * 2,
  }
];

// Helper functions
export const getPopulatedIdeas = (): PopulatedIdea[] => {
  return DUMMY_IDEAS.map(idea => ({
    ...idea,
    author: DUMMY_USERS.find(u => u.id === idea.authorId)
  }));
};

export const getPopulatedIdeaById = (id: string): PopulatedIdea | undefined => {
  const idea = DUMMY_IDEAS.find(i => i.id === id);
  if (!idea) return undefined;
  return {
    ...idea,
    author: DUMMY_USERS.find(u => u.id === idea.authorId)
  };
};

export const getReleasesByIdeaId = (ideaId: string): Release[] => {
  return DUMMY_RELEASES.filter(r => r.ideaId === ideaId);
};

export const getGrowthEventsByIdeaId = (ideaId: string): GrowthEvent[] => {
  return DUMMY_GROWTH_EVENTS.filter(ge => ge.ideaId === ideaId);
};

export const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' mins ago';
  return Math.floor(seconds) + ' seconds ago';
};

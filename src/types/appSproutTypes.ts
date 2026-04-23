export type IdeaType = 'seed' | 'sprout';
export type IdeaStage = 'seed' | 'sprout' | 'growing' | 'polishing' | 'testing' | 'launching' | 'released' | 'archived';

export const STAGE_LABELS: Record<IdeaStage, string> = {
  seed: 'Idea Phase',
  sprout: 'Sapling Phase',
  growing: 'Growing',
  polishing: 'Refining',
  testing: 'Seeking Testers',
  launching: 'Preparing Release',
  released: 'Has Borne Fruit',
  archived: 'Archived',
};

export interface BaseEntity {
  id: string;
  createdAt: number;
  updatedAt?: number;
}

export interface SocialLinks {
  twitter?: string;
  github?: string;
  website?: string;
  x?: string;
}

export type UserPlan = 'free' | 'supporter' | 'pro';
export type Plan = UserPlan;
export type PlanStatus = 'active' | 'inactive' | 'past_due' | 'canceled' | 'trialing' | 'unpaid';
export type ProductKey = 'supporter' | 'pro' | 'boost_support' | 'extra_activity_report' | 'extra_tester_recruitment';

export interface UserTopUps {
  currentMonthKey?: string;
  boostSupportCount?: number;
  boostSupportLastPurchasedAt?: number | null;
  extraActivityReportsRemaining?: number;
  extraTesterRecruitmentsRemaining?: number;
}

export interface UserUsage {
  monthKey: string;
  aiSummariesUsed: number;
  reportsUsed: number;
}

export interface User extends BaseEntity {
  name: string;
  avatarUrl?: string;
  bio?: string;
  role: 'user' | 'admin';
  socialLinks?: SocialLinks;
  seedCount?: number;
  sproutCount?: number;
  releasedCount?: number;
  aiTicketBalance?: number;
  plan: UserPlan;
  planStatus?: PlanStatus;
  planStartedAt?: number;
  currentPeriodEnd?: number | null;
  cancelAtPeriodEnd?: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  usage?: UserUsage;
  topUps?: UserTopUps;
}

export type SalonPostType = 'progress' | 'question';
export type BoostState = 'none' | 'applied' | 'candidate' | 'featured';

export interface SalonPost extends BaseEntity {
  id: string;
  authorId: string;
  authorName: string;
  authorPlan: UserPlan;
  type: SalonPostType;
  title: string;
  body: string;
  screenshotUrl?: string;
  boostState: BoostState;
  cheerCount: number;
  commentCount: number;
}

export type PostRecord = SalonPost & { 
  isMine?: boolean; 
  publishState?: 'draft' | 'publishing' | 'published' | 'failed';
  isBoostCandidate?: boolean;
};

export interface SalonComment extends BaseEntity {
  postId: string;
  authorId: string;
  authorName: string;
  authorPlan: UserPlan;
  body: string;
}

export interface SalonReaction extends BaseEntity {
  postId: string;
  userId: string;
  type: 'cheer';
}

export interface Idea extends BaseEntity {
  type: IdeaType;
  stage: IdeaStage;
  title: string;
  oneLineSummary: string;
  
  // Seed specific
  problemDetails: string;
  targetUsers: string;
  alternatives: string;
  frustrations: string;
  minFeatures: string;
  
  // Sprout/Sapling specific
  whatItDoes?: string;
  currentStatus?: string;
  lookingFor?: string[];
  struggles?: string;
  demoUrl?: string;
  repoUrl?: string;
  screenshots?: string[];

  // Genealogy
  parentIdeaId?: string | null;
  rootIdeaId?: string;
  
  // Social/Tags
  tags: string[];
  authorId: string;
  supportCount: number;
  commentCount: number;
  builderReactionCount: number;
  supportedBy?: string[];
  
  // Release Integration
  releaseStatus: 'none' | 'planned' | 'beta' | 'released';
  latestReleaseId?: string | null;
  releasedAt?: number | null;
  
  visibility?: 'public' | 'unlisted' | 'private';
}

export type ReleaseChannel = 'app_store' | 'google_play' | 'web' | 'testflight' | 'apk' | 'other';
export type ReleaseStatus = 'planned' | 'beta' | 'released' | 'paused';

export interface Release extends BaseEntity {
  ideaId: string;
  rootIdeaId?: string;
  authorId: string;
  status: ReleaseStatus;
  versionLabel?: string;
  title?: string;
  subtitle?: string;
  releasedAt?: number;
  channels: Array<{
    type: ReleaseChannel;
    url: string;
    label?: string;
    countryCodes?: string[];
  }>;
  message?: string;
  changelog?: string;
  screenshots?: string[];
  iconUrl?: string;
  contributorSummary?: {
    commentCount?: number;
    testerCount?: number;
    collaboratorCount?: number;
  };
  visibility?: 'public' | 'unlisted' | 'private';
}

export type GrowthEventType =
  | 'created_seed'
  | 'created_sprout'
  | 'commented'
  | 'adopted'
  | 'started_building'
  | 'opened_test'
  | 'beta_released'
  | 'released'
  | 'milestone'
  | 'status_changed';

export interface GrowthEvent extends BaseEntity {
  ideaId: string;
  rootIdeaId?: string;
  type: GrowthEventType;
  actorId?: string;
  actorName?: string;
  title: string;
  body?: string;
  fromStage?: string;
  toStage?: string;
  relatedCommentId?: string;
  relatedReleaseId?: string;
  visibility?: 'public' | 'private';
}

export interface Comment extends BaseEntity {
  ideaId: string;
  authorId: string;
  text: string; // Changed from content to title/body usage or unified text
  authorName?: string;
  kind?: 'comment' | 'suggestion' | 'question' | 'support';
  adoptedInRelease?: boolean;
}

export interface Support extends BaseEntity {
  ideaId: string;
  userId: string;
}

export interface ShippedApp extends BaseEntity {
  developerId: string;
  name: string;
  description: string;
  appUrl: string;
  ideaId?: string;
}

export interface BuilderReaction extends BaseEntity {
  ideaId: string;
  userId: string;
  status: 'interested' | 'building';
}

export interface TesterCall extends BaseEntity {
  ideaId: string;
  authorId: string;
  status: 'open' | 'closed';
  maxTesters: number;
  requirements: string[];
  developerNotes: string;
  platform: 'ios' | 'android' | 'web' | 'cross-platform';
}

export interface TesterSignup extends BaseEntity {
  testerCallId: string;
  userId: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  device: string;
}

export interface AppNotification extends BaseEntity {
  userId: string;
  type: 'like' | 'comment' | 'tester_apply' | 'ai_report' | 'system';
  message: string;
  link?: string;
  read: boolean;
}

export interface PopulatedIdea extends Idea {
  author?: User;
}

export interface PopulatedTesterCall extends TesterCall {
  idea?: Idea;
  author?: User;
}

export type CreateIdeaInput = Omit<Idea, 'id' | 'createdAt' | 'updatedAt' | 'supportCount' | 'commentCount' | 'builderReactionCount'>;
export type CreateReleaseInput = Omit<Release, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateCommentInput = Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateTesterCallInput = Omit<TesterCall, 'id' | 'createdAt' | 'updatedAt' | 'status'>;
export type CreateTesterSignupInput = Omit<TesterSignup, 'id' | 'createdAt' | 'updatedAt' | 'status'>;

# App Gardenium Manual E2E Checklist

## Purpose
This checklist verifies that App Gardenium's core community flows work against real Firebase Auth and Firestore rules.

Target flows:
- idea 投稿
- comment 投稿
- testerCall 作成
- tester 応募
- 作者側の応募確認
- sprout 詳細表示
- membership / billing 未設定時の安全な挙動

## Test Roles
- 投稿者アカウント: `User A`
- 応募者アカウント: `User B`

Recommended setup:
- Use two separate browsers or one browser plus one private window.
- Log in to both users through Firebase Auth.
- Ensure both users have verified email addresses if your Firebase project enforces `email_verified == true` in Firestore rules.

## Preconditions
- `.env.local` is configured for the intended Firebase project.
- App starts locally with `npm run dev`.
- Firestore rules are deployed or the local project is pointed at the rules you want to validate.
- `User A` and `User B` can both sign in successfully.
- Stripe and membership env vars may be intentionally unset for the billing safety checks.

## Logging To Keep Open During Testing
- App server terminal:
  Run `npm run dev` and keep the terminal visible.
- Browser DevTools:
  Open `Console` and `Network` tabs for both users.
- Firebase Console:
  Open Authentication and Firestore data views.

## If A Step Fails Because Of Firestore Rules
Check these in order:
1. Browser `Console` for Firebase errors such as `Missing or insufficient permissions`.
2. Browser `Network` tab for failed Firestore requests and request timing.
3. App server terminal for route errors if the action touches `/api/...`.
4. Firebase Authentication:
   Confirm the active user is signed in and email verified.
5. Firestore document shape:
   Confirm the payload fields match the rules assumptions.

Useful failure patterns:
- `Missing or insufficient permissions`
  Most likely Firestore rules mismatch or signed-in user does not satisfy a rule.
- `Failed to get document because the client is offline`
  Environment or network issue, not rules.
- `400/500` from `/api/billing/...`
  Server env or Stripe configuration issue, not Firestore rules.

## Common Verification Data
Use these sample values so both users can recognize the same test record.

### Idea
- Title: `E2E Seed 2026-04-23`
- Summary: `Manual E2E validation idea`
- Target users: `solo builders, indie hackers`
- Problem details: `Need a shared place to grow app ideas`

### Sprout
- Title: `E2E Sprout 2026-04-23`
- Summary: `Manual E2E validation sprout`
- Target users: `makers validating prototypes`
- What it does: `Simple prototype for testing the sprout path`
- Struggles: `Need external testers before release`

### Comment
- Text: `E2E comment from User B`

### Tester Call
- Prototype stage: `Alpha Build`
- Ideal tester: `people who give structured product feedback`
- Testing goal: `Check whether onboarding and first task are understandable`
- Action link: use a harmless test URL if needed

## Flow 1: Idea 投稿

### Steps
1. Sign in as `User A`.
2. Open `/ideas/new`.
3. Choose `Seed`.
4. Fill required fields and optional details.
5. Submit the idea.

### Expected Result
- Submission succeeds without permission errors.
- Success UI is shown.
- New document appears in Firestore under `ideas`.
- Stored document includes:
  `type: "seed"`
- Stored document includes:
  `stage: "seed"`
- Stored document includes:
  `supportCount: 0`
- Stored document includes:
  `supportedBy: []`
- Stored document includes:
  `commentCount: 0`
- Stored document includes:
  `builderReactionCount: 0`
- Stored document includes:
  `releaseStatus: "none"`
- Stored document includes:
  `visibility: "public"`

### If It Fails
- Browser Console:
  Look for `permission-denied` or `Missing or insufficient permissions`.
- Firestore:
  Confirm the write payload is not trying to set `supportCount: 1`.
- Rules to compare:
  `match /ideas/{ideaId}` create conditions.

## Flow 2: Comment 投稿

### Steps
1. Stay signed in as `User A` or open a second session as `User B`.
2. Open the created idea detail page.
3. Switch to the discussion tab if needed.
4. Enter a comment and submit.

### Expected Result
- Comment posts successfully.
- Comment count increments on the idea.
- New nested document appears under `ideas/{ideaId}/comments`.
- Stored comment includes:
  `ideaId` equal to the parent idea ID.
- Stored comment includes:
  `authorId`, `authorName`, `text`, `createdAt`.
- If commenter is not the author, a notification document is created for the author.

### If It Fails
- Browser Console:
  Check whether the comment create failed before or after `commentCount` update.
- Firestore:
  Confirm the nested comment payload includes `ideaId`.
- Rules to compare:
  `match /ideas/{ideaId}/comments/{commentId}` create conditions.

## Flow 3: TesterCall 作成

### Steps
1. Sign in as `User A`.
2. Open `/tester-calls/new` from profile or navigate directly.
3. Select the idea to recruit for.
4. Choose a prototype stage.
5. Fill ideal tester and testing goal.
6. Submit the recruitment.

### Expected Result
- Update succeeds without permission errors.
- Idea document is updated with:
  `stage: "testing"`
- Idea document is updated with:
  `testerCall.prototypeStage`
- Idea document is updated with:
  `testerCall.idealTester`
- Idea document is updated with:
  `testerCall.testingGoal`
- Redirect to the idea detail page succeeds.
- From the idea detail page, the tester CTA navigates to `/tester-calls/{ideaId}`.

### If It Fails
- Browser Console:
  Check for `permission-denied` on the idea update.
- Firestore:
  Confirm the app is writing lowercase `testing`, not `Testing`.
- Rules to compare:
  `isValidIdeaStage` and `match /ideas/{ideaId}` update conditions.

## Flow 4: Tester 応募

### Steps
1. Sign out `User A` from one session if needed.
2. Sign in as `User B`.
3. Open `/tester-calls/{ideaId}` for the idea created by `User A`.
4. Click `Apply to Test`.

### Expected Result
- Apply action succeeds.
- New nested document appears under `ideas/{ideaId}/testers`.
- Stored tester document includes:
  `userId` equal to `User B`
- Stored tester document includes:
  `userName`
- Stored tester document includes:
  `email`
- Stored tester document includes:
  `appliedAt`
- Stored tester document includes:
  `status: "pending"`
- Idea document increments `testerCount` by 1.
- If `User B` is not the author, a notification is created for `User A`.
- Reloading the tester page as `User B` shows the applied state and does not expose other applicants.

### If It Fails
- Browser Console:
  Check for failure on the nested `testers` create or on the `testerCount` update.
- Firestore:
  Confirm the idea is in `stage: "testing"` and has a `testerCall` object.
- Auth:
  Confirm `User B` is signed in and email verified.
- Rules to compare:
  `match /ideas/{ideaId}/testers/{testerId}` create conditions.

## Flow 5: 作者側の応募確認

### Steps
1. Sign back in as `User A`.
2. Open `/tester-calls/{ideaId}` for the same idea.

### Expected Result
- The page loads.
- Applicant table is visible to the author.
- `User B` appears in the list with:
  `userName`
- `User B` appears in the list with:
  `email`
- `User B` appears in the list with:
  applied date
- `User B` appears in the list with:
  `pending` status
- The page does not throw render errors when showing `appliedAt`.

### If It Fails
- Browser Console:
  Check whether the failure is on `ideas/{ideaId}/testers` read.
- Firestore:
  Confirm the tester doc exists and belongs to the same idea.
- Rules to compare:
  `match /ideas/{ideaId}/testers/{testerId}` read conditions.

## Flow 6: Sprout 詳細表示

### Steps
1. Sign in as `User A`.
2. Open `/ideas/new`.
3. Choose `Sapling` / sprout flow.
4. Fill required sprout fields.
5. Submit the sprout.
6. Open the created sprout detail page.

### Expected Result
- Sprout submission succeeds.
- Detail page renders without crashing.
- Missing seed-only fields do not break rendering.
- AI summary card area renders safely even when `minFeatures` is absent.
- Tags area renders safely even when `tags` is empty or missing.
- Translate button does not crash when optional text fields are empty.

### If It Fails
- Browser Console:
  Look for `Cannot read properties of undefined` involving `split`, `map`, or `replace`.
- Likely hotspots:
  `minFeatures`
- Likely hotspots:
  `tags`
- Likely hotspots:
  `problemDetails`, `alternatives`, `frustrations`

## Flow 7: Membership / Billing 未設定時の安全な挙動

### Steps
1. Keep Stripe-related env vars unset or intentionally invalid in the local environment.
2. Sign in as any user.
3. Open membership-related pages such as `/membership`, `/pricing`, and any UI that triggers checkout or portal actions.
4. Try:
   open membership page
5. Try:
   open pricing page
6. Try:
   start checkout
7. Try:
   open customer portal

### Expected Result
- Page rendering itself does not crash.
- Membership-related fetches fail gracefully.
- Checkout attempt returns a handled error, not a blank screen.
- Portal attempt returns a handled error, not a blank screen.
- Server responds with a clear JSON error for missing Stripe config.
- Browser Console may show handled request errors, but the React app stays usable.

### If It Fails
- App server terminal:
  Check `/api/billing/create-checkout-session` and `/api/billing/create-portal-session` responses.
- Expected server-side failure pattern:
  error mentioning missing `STRIPE_SECRET_KEY`.
- If the whole app crashes:
  inspect server startup logs and `src/lib/server/billingService.ts`.

## Final Sanity Checks
- Idea created by `User A` is visible in explore.
- Comment count shown on cards and detail page matches Firestore.
- Tester count increases after `User B` applies.
- `User B` cannot see the full applicant list.
- `User A` can see the applicant list.
- Sprout detail page loads without runtime exceptions.
- Billing-unconfigured flows degrade safely.

## Suggested Sign-Off
Mark the run complete only if all items below are true:
- idea 投稿 passed
- comment 投稿 passed
- testerCall 作成 passed
- tester 応募 passed
- 作者側の応募確認 passed
- sprout 詳細表示 passed
- membership / billing 未設定時の安全な挙動 passed

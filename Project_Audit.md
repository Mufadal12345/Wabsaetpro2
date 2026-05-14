# MASTER AUDIT REPORT — Project Structure Analyzer & Dead File Detection

## 1. CORE EXECUTION FLOW

**Main Entry Files:**
- `index.tsx`: The actual React mounting point.
- `index.html`: The HTML shell.
- `src/App.tsx`: Manages routing, code-splitting (using `React.lazy`), Capacitor native backing handling, and the top-level application shell (`<AppContent>`).
- `src/app/providers/AppProviders.tsx`: The primary container bridging all context systems.

**App Bootstrap & Routing Flow:**
- `AppProviders.tsx` mounts **both** the new (`src/features/auth/context/AuthContext.tsx`) and legacy (`contexts/AuthContext.tsx`) authentication providers in a stacked manner.
- It also sets up React Query (`QueryClientProvider`), `ToastProvider`, and the legacy `contexts/DataContext.tsx`.
- The router (`HashRouter`) delegates all rendering to components mapped by `lazy()` in `src/App.tsx`.

**State Management & Data Layer Flow:**
The application suffers from an incomplete migration (Phase 2 feature restructuring).
There is a massive bridge connecting the modern React Query system back to the legacy state shape:
- Legacy Data Store: `contexts/DataContext.tsx` accesses its data by proxying to the monolithic hook file `hooks/useAppQueries.ts`, aggregating almost every domain model into a single context (`useData()`).
- Because of this bottleneck, pages explicitly run `const { users, ideas, comments } = useData();` causing full re-renders whenever query caching updates.

**Authentication Flow:**
- Authentication connects the `auth` (Firebase Auth) inside `contexts/AuthContext.tsx`.
- The new `AuthContext` asynchronously writes `syncUserToFirestore` up to Firestore and then hydrates `QUERY_KEYS.users.currentUser()`.
- Both contexts are stacked, running concurrent `onAuthStateChanged` observers.

---

## 2. ACTIVE FILES (CURRENTLY EXECUTING)

### App Core
- `index.tsx`, `index.html`, `vite.config.ts`, `firebase.ts`, `supabase.ts`

### Routing & Layouts
- `src/App.tsx`: Crucial routing dictionary.
- `components/layout/AppLayout.tsx`: The primary dashboard/shell layout.

### Shared Infrastructure
- `src/app/providers/AppProviders.tsx`
- `contexts/DataContext.tsx`: Still actively driving the data layer for legacy components.
- `contexts/AuthContext.tsx`: The active legacy authentication system.
- `contexts/ToastContext.tsx`: Toast notification singleton.
- `hooks/useAppQueries.ts`: Contains practically all the global `useQuery` definitions.

### Active UI Pages
- `pages/Home.tsx`, `pages/Login.tsx`, `pages/Profile.tsx`, `pages/Ideas.tsx`, `pages/Search.tsx`, `pages/Visuals.tsx`, `pages/Notifications.tsx`, `pages/Suggestions.tsx`.
- `pages/admin/`: Admin panels (`Dashboard.tsx`, `Members.tsx`, `Messages.tsx`, `AdminNotifications.tsx`, `AdminSections.tsx`, etc.). Note that `AdminSettings.tsx` is being loaded through `src/App.tsx`.

### Active UI Components
- `components/HomeIdeaListItem.tsx`: The backbone post component (renders standard posts, links, videos).
- `components/MediaRouter.tsx`: Handles branching rendering of Ideas/Media.
- `components/BottomNav.tsx`, `components/UserAvatar.tsx`, `components/Icons.tsx`, `components/LinkPreview.tsx`, `components/Onboarding.tsx`.

### Features (Partially Active)
- `src/features/auth/*`: Very active. Used directly in `Settings` and provider trees.
- `src/features/settings/*`: Active. Setting screens (e.g., `AccountSettings.tsx`, `SettingsHome.tsx`) actively mount via `SettingsRoutes.tsx`.

---

## 3. DEAD / UNUSED FILES

These files are disconnected from the runtime and safe to delete.

**File:** `pages/Settings.tsx`
- **Status:** **DEAD**
- **Reason:** Completely disconnected from `App.tsx`. The routing uses `<Route path="/settings/*" element={<SettingsRoutes />} />` via `features/settings`.
- **Delete Safety:** HIGH

**File:** `contexts/App.tsx`
- **Status:** **DEAD**
- **Reason:** No imports found inside the React execution tree. Also confirmed by the `MIGRATION_CHECKLIST.md`.
- **Delete Safety:** HIGH

**File:** `components/feed/PostCard.tsx`, `components/feed/ThoughtCard.tsx`, `components/feed/ThoughtFeed.tsx`
- **Status:** **DEAD**
- **Reason:** Unused by any layout or page. No traces inside `App.tsx` or `MediaRouter.tsx`.
- **Delete Safety:** HIGH

**File:** `components/home/IdeaCard.tsx`
- **Status:** **DEAD**
- **Reason:** Replaced entirely by `components/HomeIdeaListItem.tsx`. Never rendered in any functional component.
- **Delete Safety:** HIGH

**File:** `components/create/CreateScreen.tsx`
- **Status:** **DEAD**
- **Reason:** Only referenced in the dead `contexts/App.tsx` file. Not used in the actual `src/App.tsx` routing.
- **Delete Safety:** HIGH

**Directory:** `vanilla-html-version/`
- **Status:** **DEAD**
- **Reason:** An obsolete backup folder from pre-React or vanilla prototype phases. Contains raw unbundled JS scripts.
- **Delete Safety:** HIGH

**Helper Scripts (.cjs files):**
- `clean-everything.cjs`, `clean-more.cjs`, `clean-headers.cjs`, `fix-files.cjs`, `sync-home.cjs`, `categories-update.cjs`, `remove-modal.cjs`, `fix-home.cjs`
- **Status:** **DEAD**
- **Reason:** Temporary code manipulation scripts running raw regex replacement on files. Left unattended in the project root.
- **Delete Safety:** HIGH

**Unused NPM Dependencies:**
- `@capacitor/camera`, `@dicebear/collection`, `browser-image-compression`, `express`, `firebase-admin`, `react-image-crop`, `react-infinite-scroll-component`, `react-player`
- **Delete Safety:** HIGH

---

## 4. PARTIALLY CONNECTED FILES

**Directory:** `src/features/ideas`, `src/features/comments`, `src/features/users`, `src/features/admin`
- **Status:** **ZOMBIE / OUTDATED**
- **What is wrong:** The backend features were built but never wired to the UI. The application uses `hooks/useAppQueries.ts` and `hooks/useFeedActions.ts`. E.g., `useMultipleUsers` or `useLikeIdea` logic runs via `useFeedActions.ts`, entirely side-stepping the `src/features` pattern.
- **Exceptions:** `pages/Visuals.tsx` imports `useVisualFeedQuery` from `ideas/queries/idea.queries.ts`.
- **Recommendation:** Pause the creation of new logic inside `src/features/*` until the UI starts directly importing these hooks or immediately migrate `HomeIdeaListItem.tsx` to call feature hooks.

**Directory:** `src/features/settings/components/`
- **Status:** **PARTIALLY ABANDONED**
- **What is wrong:** The component `AccountSettings.tsx` is defined both in `features/settings/pages/` AND `features/settings/components/`. The imported one is `./pages/AccountSettings.tsx`.

---

## 5. DUPLICATE SYSTEMS

| System | Legacy Implementation | Modern Implementation | Action Plan |
|---|---|---|---|
| **Authentication** | `contexts/AuthContext.tsx` | `src/features/auth/context/AuthContext.tsx` | Use modern context, pipe `profile` state to replace legacy implementations. |
| **Data Fetching (Queries)** | `hooks/useAppQueries.ts` | `src/features/*/queries/*.ts` | Remove `useData()` proxy entirely; have UI load via Feature Queries natively. |
| **Action Handlers** | `hooks/useFeedActions.ts` | `src/features/*/hooks/*.ts` | Consolidate feed mutations into `useIdeaMutations`. |
| **Settings UI** | `pages/Settings.tsx` | `src/features/settings/pages/` | Delete `pages/Settings.tsx`. |

---

## 6. ARCHITECTURE HEALTH REPORT

- **Architecture Score:** 4/10
- **Maintainability Score:** 3/10
- **Scalability Score:** 5/10 (High potential, hindered by dual architecture)
- **Technical Debt Level:** SEVERE
- **Dead Code Percentage Estimate:** ~35%

**Dangerous Issues & Anti-Patterns:**
1. **Architectural Schizophrenia:** The codebase contains a half-finished migration (React Context to React Query + Feature Slice), leading to intense logic duplication and cache synchronization bugs (e.g. Profile metadata sync loop).
2. **God Module `DataContext`:** The `DataContext.tsx` component runs ~20 `useQuery` operations simultaneously blocking immediate fast-render pipelines and invalidating aggressively across the application surface.
3. **Bloated UI Component (`HomeIdeaListItem.tsx`):** A 500+ line module handling rendering, Optimistic UI caching manually via `queryClient.setQueryData`, state transitions for menus, video state, and embedded nested comment threads.

---

## 7. CLEANUP PLAN

### Phase 1 — Safe Deletions (Immediate Execution)
1. Delete `pages/Settings.tsx`.
2. Delete `contexts/App.tsx`.
3. Delete `components/feed/` entirely.
4. Delete `components/home/IdeaCard.tsx`.
5. Delete `components/create/CreateScreen.tsx`.
6. Delete `vanilla-html-version/`.
7. Delete all `.cjs` scripting files in root.
8. Uninstall `@capacitor/camera`, `@dicebear/collection`, `react-image-crop`, `browser-image-compression` and other unimported packages.

### Phase 2 — Refactor Targets
1. Rip out `hooks/useFeedActions.ts`. Migrate each action sequentially into its corresponding Feature Domain (Ideas, Comments, etc.).
2. Un-wire `DataContext.tsx` from components that only require local domain knowledge.

### Phase 3 — Architecture Consolidation
1. Delete `contexts/AuthContext.tsx`. Use `src/features/auth/context/AuthContext.tsx` uniformly across the router and UI.
2. Ensure Firebase Firestore Rules (`firestore.rules`) strictly map `UserRole` instead of leaving `AuthService` handling it blindly.

### Phase 4 — Optimization
1. Move the `HomeIdeaListItem` comment section into a lazy-loaded sub-component.
2. Implement React Query key factories (`shared/constants/queryKeys.ts`) strictly for all queries (stop hardcoding cache keys `["ideas"]` vs `QUERY_KEYS.ideas.all()`).

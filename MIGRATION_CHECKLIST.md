# Migration Checklist

Welcome to the new feature-driven architecture! The foundational services, queries, and providers have been set up. To complete the migration, you need to replace the old context hooks inside the UI components with the new React Query hooks.

## 1. Authentication Migration
- [ ] In `Login.tsx`, replace `import { useAuth } from '../contexts/AuthContext'` with `import { useAuth } from '../src/features/auth/hooks/useAuth'`.
- [ ] Update usages of `currentUser` to `profile`.
- [ ] Update usages of `loginWithGoogle` to `signInWithGoogle`.
- [ ] Replace `logout()` with `signOut()`.
- [ ] Repeat this for `AppLayout`, `Sidebar`, and anywhere `useAuth` is called.

## 2. Ideas Domain Migration
- [ ] Remove `const { ideas } = useData()` from components like `Home.tsx` and `Ideas.tsx`.
- [ ] Import and use `const { data, fetchNextPage } = useIdeasQuery()` from `src/features/ideas/queries/idea.queries.ts`.
- [ ] Use `useCreateIdea`, `useUpdateIdea`, `useDeleteIdea`, and `useLikeIdea` from `useIdeaActions.ts` instead of calling `useFeedActions()`.

## 3. Comments Domain Migration
- [ ] In the Comments Section component, replace manual Snapshot listeners with `const { data: comments } = useCommentsQuery(ideaId)`.
- [ ] Use `useAddComment` and `useDeleteComment` from `comment.queries.ts` for actions.

## 4. Social Actions Migration (Follow/Unfollow)
- [ ] Replace custom transaction functions with `useFollowMutation()` and `useUnfollowMutation()` from `src/features/users/hooks/useSocialActions.ts`.
- [ ] The mutations automatically update the React Query cache via Optimistic Updates, making the UI instantly responsive.

## 5. Admin Panel Migration
- [ ] In `AdminDashboard` and `Members.tsx`, use `const { data } = useUsersManagementQuery()` from `admin.queries.ts` instead of `useData().users`.
- [ ] Replace custom role editing logic with `const changeRole = useChangeRoleMutation()`.
- [ ] Utilize `const stats = useSystemStatsQuery()` for dashboard counters instead of loading arrays into memory.

## 6. Removing Legacy Contexts
- [ ] Once all components are migrated, delete `src/contexts/DataContext.tsx`.
- [ ] Delete `src/contexts/AuthContext.tsx`.
- [ ] Delete `src/contexts/App.tsx`.
- [ ] Remove them from `AppProviders.tsx`.

You now have a scalable, production-ready, highly-performant React application!

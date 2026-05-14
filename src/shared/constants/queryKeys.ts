export const QUERY_KEYS = {
  ideas: {
    all: ['ideas'] as const,
    list: (filters?: Record<string, unknown>) => ['ideas', 'list', filters] as const,
    detail: (id: string) => ['ideas', 'detail', id] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
    currentUser: () => ['users', 'currentUser'] as const,
  },
  comments: {
    all: ['comments'] as const,
    byIdeaId: (ideaId: string) => ['comments', 'byIdeaId', ideaId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
  },
  suggestions: {
    all: ['suggestions'] as const,
  },
  adminChats: {
    all: ['adminChats'] as const,
  },
  settings: {
    getUserSettings: (userId: string) => ['settings', userId] as const,
  },
  quotes: {
    all: ['quotes'] as const,
  },
  courses: {
    all: ['courses'] as const,
  },
  bookmarks: {
    all: ['bookmarks'] as const,
  },
  follows: {
    all: ['follows'] as const,
  },
  sectionItems: {
    all: ['sectionItems'] as const,
  },
  aboutSections: {
    all: ['aboutSections'] as const,
  },
  socialRelation: {
    detail: (userId: string) => ['socialRelation', userId] as const,
  },
  auditLogs: {
    all: ['auditLogs'] as const,
  }
} as const;

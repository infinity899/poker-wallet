# Poker Wallet Architect Skill

You are the Chief Architect for Poker Wallet, a production-grade poker tracking SPA. Think clean code, SOLID principles, and scalability for thousands of concurrent users.

## Core Architecture Principles

### 1. Data Flow Pattern
```
Component → Store Action → Adapter → Persistence → Response → Store State → Computed → Component
```

### 2. Store Architecture (Target State)
- **Base Store Factory**: Extract common patterns (init, loading, persistence)
- **Adapter Pattern**: `StorageAdapter` interface with `LocalStorageAdapter` and `SupabaseAdapter`
- **Repository Pattern**: Entity-specific repositories wrapping adapters
- **Service Layer**: Business logic separate from data access

### 3. Type Safety Hierarchy
```
Types (interfaces) → Schemas (Zod) → DTOs → Entities → ViewModels
```

### 4. Component Organization
```
components/
├── domain/          # Feature-specific (sessions, tournaments, horses)
├── shared/          # Reusable UI primitives
├── layout/          # App shell components
└── composition/     # Higher-order wrappers
```

## Key Design Decisions

### Persistence Strategy
- **Demo Mode**: localStorage with JSON seeding
- **Production Mode**: Supabase with RLS
- **Adapter Interface**: Unified CRUD operations regardless of backend
- **Offline-First**: Queue mutations, sync when online

### State Management
- Pinia with Composition API
- Computed getters for derived state
- Actions for mutations only
- No direct state mutation from components

### Error Handling
- Result type pattern: `{ success: boolean, data?: T, error?: Error }`
- Toast notifications for user feedback
- Error boundaries for component isolation
- Structured logging for debugging

### Performance Targets
- Initial load: < 2s on 3G
- Interaction latency: < 100ms
- Data operations: < 500ms
- Support 10,000+ records without degradation

## Refactoring Guidelines

### When Adding Features
1. Define types first in `/app/types/`
2. Add Zod schema for validation
3. Extend repository/adapter if persistence needed
4. Create store actions with proper error handling
5. Build components from shared primitives
6. Add tests for business logic

### When Modifying Stores
1. Keep stores thin - delegate to services
2. Use computed for all derived state
3. Never mutate state directly from actions
4. Ensure demo/production parity

### When Creating Components
1. Prefer composition over inheritance
2. Extract hooks for complex logic
3. Use `useBreakpoint()` for responsive behavior
4. Keep template logic minimal

## Anti-Patterns to Avoid

```typescript
/* eslint-disable ts/no-unused-vars */
// ❌ Direct localStorage in component
localStorage.setItem('key', JSON.stringify(data));

// ✅ Through store/adapter
sessionsStore.save(session);

// ❌ Demo mode check scattered everywhere
if (isDemoMode) { /* ... */ }
else { /* ... */ }

// ✅ Adapter handles this
adapter.save(entity); // Adapter knows the mode

// ❌ Business logic in component
const badProfit = sessions.reduce((sum, s) => sum + s.result, 0);

// ✅ Computed in store
const goodProfit = computed(() => sessionsStore.stats.totalProfit);

// ❌ Untyped API responses
const { data } = await supabase.from('sessions').select();

// ✅ Validated with schema
const sessions = SessionSchema.array().parse(data);
```

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Store | `use{Entity}Store` | `useSessionsStore` |
| Composable | `use{Feature}` | `useBreakpoint` |
| Adapter | `{Type}Adapter` | `SupabaseAdapter` |
| Service | `{Domain}Service` | `SessionService` |
| Type | `{Entity}` | `CashSession` |
| Schema | `{Entity}Schema` | `CashSessionSchema` |
| Test | `{file}.spec.ts` | `sessions.spec.ts` |

## Migration Strategy

When refactoring existing code:
1. Add new abstraction alongside existing code
2. Migrate one feature at a time
3. Keep backwards compatibility during transition
4. Remove deprecated code only after full migration
5. Test both paths until deprecated code removed

## Quality Gates

Before merging any architectural change:
- [ ] TypeScript strict mode passes
- [ ] All existing tests pass
- [ ] New tests cover the change
- [ ] No ESLint warnings
- [ ] Demo mode works correctly
- [ ] Production mode works correctly
- [ ] Mobile responsive behavior verified
- [ ] No console errors in browser

## Decision Log Template

When making significant architectural decisions, document:
```markdown
## Decision: [Title]
**Date**: YYYY-MM-DD
**Status**: Proposed | Accepted | Deprecated

### Context
[Why is this decision needed?]

### Options Considered
1. Option A - [Pros/Cons]
2. Option B - [Pros/Cons]

### Decision
[What was decided and why]

### Consequences
[What changes as a result]
```

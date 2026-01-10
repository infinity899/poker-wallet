Feature idea:

We are building a new feature for my own poker app. My horses page become My Community. A community page.


My community page use case is to help poker stables/poker investors to manage their "horses" stakes. 

I want to allow everyone to be able to create a community. 

Once a community is created, I'm thinking to allow other users to discover the community and request to join the community.

Then the community admin can approve members.

Once the community member is approved when he tracks his poker results, his results are aggregated in the community as well. 

A community has:
- a general overview of aggregated results, with over all stats, total profit, win rate and hourly rate
- a chart with cumulated total profits also lines for each community member with their own results
- a list of community members, teaser cards that have name, total profit and his unique chart

When a community member is clicked we can expand a drawer with the details of the respective community member: details and tables with all the entries of Cash Sessions, Tournaments, 

Goals

1.	Let any user create a community.
2.	Let users discover communities and request to join.
3.	Let admins(initially the community creator has admin role) approve/deny membership requests. Later we can promote other people too.
4.	Aggregate approved members’ poker results into community stats and charts.
4.1. Aggregation is not on all user's results. But it unlocks a new option so that when user creates a new tournament entry, a cash session or tournament session it can also select a community for that result, a community that is part of. So we only aggregate in the communities the results that are linked to a community
5.	Provide a community page with:
•	Overview stats
•	Community cumulative profit chart
•	Per-member lines
•	Member list with teaser cards
•	Member drawer with session/tournament tables

Goals for V1.5:
	•	Staking % / makeup accounting
	•	Comments
	•	Roles beyond admin vs member

---

## Implementation Plan

### Phase 1: Database Schema
- [x] Create SQL migration for community tables
- [ ] Run migration in Supabase

### Phase 2: Types & Adapter
- [ ] Create `app/types/community.ts`
- [ ] Update `app/types/database.types.ts`
- [ ] Create `app/adapters/communityAdapter.ts`

### Phase 3: Store
- [ ] Create `app/stores/communities.ts`
- [ ] Update `app/plugins/stores.client.ts`

### Phase 4: Components
- [ ] `CommunitiesList.vue` - Main grid view
- [ ] `CommunitiesHeader.vue` - Title + buttons
- [ ] `CommunitiesCard.vue` - Community teaser card
- [ ] `CommunitiesFormModal.vue` - Create/edit
- [ ] `CommunitiesDeleteModal.vue` - Confirm delete
- [ ] `CommunitiesDiscoverModal.vue` - Browse public
- [ ] `CommunitiesJoinModal.vue` - Join by invite
- [ ] `CommunitiesDetail.vue` - Full community page
- [ ] `CommunitiesChart.vue` - Cumulative profit chart
- [ ] `CommunitiesMemberCard.vue` - Member teaser
- [ ] `CommunitiesMemberDrawer.vue` - Member detail
- [ ] `CommunitiesPendingRequests.vue` - Admin view
- [ ] `CommunitiesSelector.vue` - Multi-select for forms

### Phase 5: Pages
- [ ] `/communities` - My communities list
- [ ] `/communities/[id]` - Community detail
- [ ] `/communities/discover` - Browse public

### Phase 6: Integration
- [ ] Add CommunitiesSelector to session forms
- [ ] Add CommunitiesSelector to tournament forms
- [ ] Update navigation (sidebar, bottom nav)

### Phase 7: Cleanup
- [ ] Remove horses components
- [ ] Remove horses store/adapter/types
- [ ] Remove horses pages

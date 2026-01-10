-- Communities Feature Migration
-- Adds tables for communities, members, and session/tournament linking

-- Communities table
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  avatar VARCHAR(255),
  visibility VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  invite_code VARCHAR(32) UNIQUE,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP', 'CAD', 'RON')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Community members table
CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  display_name VARCHAR(255),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- Session-Community linking table
CREATE TABLE IF NOT EXISTS session_communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, community_id)
);

-- Tournament-Community linking table
CREATE TABLE IF NOT EXISTS tournament_communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tournament_id, community_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_communities_created_by ON communities(created_by);
CREATE INDEX IF NOT EXISTS idx_communities_visibility ON communities(visibility);
CREATE INDEX IF NOT EXISTS idx_communities_invite_code ON communities(invite_code);
CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_status ON community_members(status);
CREATE INDEX IF NOT EXISTS idx_session_communities_session ON session_communities(session_id);
CREATE INDEX IF NOT EXISTS idx_session_communities_community ON session_communities(community_id);
CREATE INDEX IF NOT EXISTS idx_tournament_communities_tournament ON tournament_communities(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_communities_community ON tournament_communities(community_id);

-- Enable RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_communities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for communities table

-- Anyone can view public communities, or communities they're a member of
CREATE POLICY "communities_select_policy" ON communities
  FOR SELECT USING (
    visibility = 'public'
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = communities.id
      AND user_id = auth.uid()
      AND status = 'approved'
    )
  );

-- Users can create communities
CREATE POLICY "communities_insert_policy" ON communities
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Admins can update their communities
CREATE POLICY "communities_update_policy" ON communities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = communities.id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND status = 'approved'
    )
  );

-- Only creator can delete community
CREATE POLICY "communities_delete_policy" ON communities
  FOR DELETE USING (created_by = auth.uid());

-- RLS Policies for community_members table

-- Members can view their own membership, approved members can see other approved members
CREATE POLICY "community_members_select_policy" ON community_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR (
      status = 'approved'
      AND EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = community_members.community_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'approved'
      )
    )
    OR EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_members.community_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'admin'
      AND cm.status = 'approved'
    )
  );

-- Users can request to join (insert pending membership)
CREATE POLICY "community_members_insert_policy" ON community_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
    AND role = 'member'
  );

-- Admins can manage members, users can update their own display_name
CREATE POLICY "community_members_update_policy" ON community_members
  FOR UPDATE USING (
    (user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_members.community_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'admin'
      AND cm.status = 'approved'
    )
  );

-- Admins can remove members, users can leave
CREATE POLICY "community_members_delete_policy" ON community_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_members.community_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'admin'
      AND cm.status = 'approved'
    )
  );

-- RLS Policies for session_communities table

-- Users can view links for their sessions or communities they're members of
CREATE POLICY "session_communities_select_policy" ON session_communities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = session_communities.session_id
      AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = session_communities.community_id
      AND user_id = auth.uid()
      AND status = 'approved'
    )
  );

-- Users can only link their own sessions
CREATE POLICY "session_communities_insert_policy" ON session_communities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = session_communities.session_id
      AND user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = session_communities.community_id
      AND user_id = auth.uid()
      AND status = 'approved'
    )
  );

-- Users can only unlink their own sessions
CREATE POLICY "session_communities_delete_policy" ON session_communities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = session_communities.session_id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for tournament_communities table

-- Users can view links for their tournaments or communities they're members of
CREATE POLICY "tournament_communities_select_policy" ON tournament_communities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE id = tournament_communities.tournament_id
      AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = tournament_communities.community_id
      AND user_id = auth.uid()
      AND status = 'approved'
    )
  );

-- Users can only link their own tournaments
CREATE POLICY "tournament_communities_insert_policy" ON tournament_communities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE id = tournament_communities.tournament_id
      AND user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = tournament_communities.community_id
      AND user_id = auth.uid()
      AND status = 'approved'
    )
  );

-- Users can only unlink their own tournaments
CREATE POLICY "tournament_communities_delete_policy" ON tournament_communities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE id = tournament_communities.tournament_id
      AND user_id = auth.uid()
    )
  );

-- Function to auto-create admin membership when community is created
CREATE OR REPLACE FUNCTION create_community_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO community_members (community_id, user_id, role, status, joined_at)
  VALUES (NEW.id, NEW.created_by, 'admin', 'approved', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create admin membership
DROP TRIGGER IF EXISTS on_community_created ON communities;
CREATE TRIGGER on_community_created
  AFTER INSERT ON communities
  FOR EACH ROW
  EXECUTE FUNCTION create_community_admin();

-- Function to generate invite code for private communities
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.visibility = 'private' AND NEW.invite_code IS NULL THEN
    NEW.invite_code := encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate invite code
DROP TRIGGER IF EXISTS on_community_visibility ON communities;
CREATE TRIGGER on_community_visibility
  BEFORE INSERT OR UPDATE ON communities
  FOR EACH ROW
  EXECUTE FUNCTION generate_invite_code();

-- Updated_at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS communities_updated_at ON communities;
CREATE TRIGGER communities_updated_at
  BEFORE UPDATE ON communities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS community_members_updated_at ON community_members;
CREATE TRIGGER community_members_updated_at
  BEFORE UPDATE ON community_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migration: Create Row Level Security policies

-- ===================
-- PROFILES POLICIES
-- ===================

-- Users can view all profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- ===================
-- CLIENTS POLICIES
-- ===================

-- Authenticated users can view all clients
CREATE POLICY "Authenticated users can view clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

-- Admins can create clients
CREATE POLICY "Admins can create clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update clients
CREATE POLICY "Admins can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can delete clients
CREATE POLICY "Admins can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ===================
-- CYCLES POLICIES
-- ===================

-- Authenticated users can view all cycles
CREATE POLICY "Authenticated users can view cycles"
  ON cycles FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create cycles
CREATE POLICY "Authenticated users can create cycles"
  ON cycles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update cycles
CREATE POLICY "Authenticated users can update cycles"
  ON cycles FOR UPDATE
  TO authenticated
  USING (true);

-- Authenticated users can delete cycles
CREATE POLICY "Authenticated users can delete cycles"
  ON cycles FOR DELETE
  TO authenticated
  USING (true);

-- ===================
-- SHOOTS POLICIES
-- ===================

-- Authenticated users can view all shoots
CREATE POLICY "Authenticated users can view shoots"
  ON shoots FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create shoots
CREATE POLICY "Authenticated users can create shoots"
  ON shoots FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update shoots
CREATE POLICY "Authenticated users can update shoots"
  ON shoots FOR UPDATE
  TO authenticated
  USING (true);

-- Authenticated users can delete shoots
CREATE POLICY "Authenticated users can delete shoots"
  ON shoots FOR DELETE
  TO authenticated
  USING (true);

-- ===================
-- TASKS POLICIES
-- ===================

-- Authenticated users can view all tasks
CREATE POLICY "Authenticated users can view tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create tasks
CREATE POLICY "Authenticated users can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update tasks
CREATE POLICY "Authenticated users can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (true);

-- Authenticated users can delete tasks
CREATE POLICY "Authenticated users can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (true);

-- ===================
-- CLIENT_CONTEXT POLICIES
-- ===================

-- Authenticated users can view all context entries
CREATE POLICY "Authenticated users can view client context"
  ON client_context FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create context (must be author)
CREATE POLICY "Authenticated users can create context"
  ON client_context FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Authors and admins can update context
CREATE POLICY "Authors and admins can update context"
  ON client_context FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Authors and admins can delete context
CREATE POLICY "Authors and admins can delete context"
  ON client_context FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

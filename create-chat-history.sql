-- ==========================================
-- CREATE chat_history TABLE & POLICIES
-- ==========================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable for guest users
    session_id TEXT NOT NULL, -- To group messages together for a single conversation
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add an index for faster querying by session
CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);

-- 3. Enable Row Level Security
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
-- Users can view their own chat history based on their user_id
CREATE POLICY "Users can view own chat history" 
ON chat_history FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert into chat history (Edge function usually bypasses RLS, but for client-side inserts if needed)
CREATE POLICY "Users can insert own chat history" 
ON chat_history FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Admin can view all chat history (Assuming role='admin' in profiles table)
CREATE POLICY "Admins can view all chat history" 
ON chat_history FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

const { createClient } = require('@supabase/supabase-js');

/**
 * Database service for tracking user activity in Supabase
 */
class DatabaseService {
  constructor() {
    this.supabase = null;
    this.enabled = false;
    this.initialize();
  }

  /**
   * Initialize Supabase client
   */
  initialize() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️  Supabase credentials not found. Database tracking disabled.');
      return;
    }

    try {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.enabled = true;
      console.log('✅ Database service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Supabase client:', error.message);
    }
  }

  /**
   * Upsert requester (create or update user)
   * @param {string} email - User's email address
   * @param {string} sessionId - Session identifier
   * @param {string} userAgent - Browser user agent
   * @param {string} ipAddress - User's IP address
   * @returns {Promise<string|null>} - Requester ID or null if failed
   */
  async upsertRequester(email, sessionId, userAgent, ipAddress) {
    if (!this.enabled) return null;

    try {
      // Check if requester exists by email
      const { data: existingRequester, error: selectError } = await this.supabase
        .from('requesters')
        .select('id, daily_requests_count, last_request_date')
        .eq('email', email)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine
        throw selectError;
      }

      if (existingRequester) {
        // Check if this is a new day (reset counter)
        const today = new Date().toISOString().split('T')[0];
        const isNewDay = existingRequester.last_request_date !== today;

        // Use atomic increment to avoid race conditions
        // If it's a new day, reset to 1; otherwise increment
        const newCount = isNewDay ? 1 : (existingRequester.daily_requests_count || 0) + 1;

        // Update with optimistic locking using the current count as a condition
        const { data: updateData, error: updateError } = await this.supabase
          .from('requesters')
          .update({
            last_seen_at: new Date().toISOString(),
            session_id: sessionId,
            user_agent: userAgent,
            ip_address: ipAddress,
            daily_requests_count: newCount,
            last_request_date: today
          })
          .eq('id', existingRequester.id)
          .eq('daily_requests_count', isNewDay ? existingRequester.daily_requests_count : existingRequester.daily_requests_count)
          .select('id');

        // If no rows updated due to race condition, retry once
        if (!updateData || updateData.length === 0) {
          console.log('⚠️ Race condition detected, retrying update...');
          const { error: retryError } = await this.supabase
            .from('requesters')
            .update({
              last_seen_at: new Date().toISOString(),
              session_id: sessionId,
              user_agent: userAgent,
              ip_address: ipAddress,
              last_request_date: today
            })
            .eq('id', existingRequester.id);

          if (retryError) throw retryError;
        } else if (updateError) {
          throw updateError;
        }

        console.log(`✅ Updated requester: ${email}`);
        return existingRequester.id;
      } else {
        // Create new requester
        const { data: newRequester, error: insertError } = await this.supabase
          .from('requesters')
          .insert({
            email,
            session_id: sessionId,
            user_agent: userAgent,
            ip_address: ipAddress,
            daily_requests_count: 1,
            last_request_date: new Date().toISOString().split('T')[0]
          })
          .select('id')
          .single();

        if (insertError) throw insertError;

        console.log(`✅ Created new requester: ${email}`);
        return newRequester.id;
      }
    } catch (error) {
      console.error('❌ Error upserting requester:', error.message);
      return null;
    }
  }

  /**
   * Track tool usage in user_activity_data
   * @param {string} requesterId - UUID of the requester
   * @param {string} sessionId - Session identifier
   * @param {string} email - User's email address
   * @returns {Promise<boolean>} - Success status
   */
  async trackToolUsage(requesterId, sessionId, email) {
    if (!this.enabled || !requesterId) return false;

    try {
      // Check if activity record exists for this requester
      const { data: existingActivity, error: selectError } = await this.supabase
        .from('user_activity_data')
        .select('id, copy_grader_uses, total_tool_uses')
        .eq('requester_id', requesterId)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError;
      }

      const now = new Date().toISOString();

      if (existingActivity) {
        // Update with optimistic locking to handle race conditions
        const newCopyGraderUses = (existingActivity.copy_grader_uses || 0) + 1;
        const newTotalToolUses = (existingActivity.total_tool_uses || 0) + 1;

        const { data: updateData, error: updateError } = await this.supabase
          .from('user_activity_data')
          .update({
            last_seen_at: now,
            last_tool_use: now,
            session_id: sessionId,
            email: email,
            user_type: 'guest',
            copy_grader_uses: newCopyGraderUses,
            total_tool_uses: newTotalToolUses,
            updated_at: now
          })
          .eq('id', existingActivity.id)
          .eq('copy_grader_uses', existingActivity.copy_grader_uses)
          .select('id');

        // If no rows updated due to race condition, do a simple update without count change
        if ((!updateData || updateData.length === 0) && !updateError) {
          console.log('⚠️ Race condition in activity tracking, retrying...');
          const { error: retryError } = await this.supabase
            .from('user_activity_data')
            .update({
              last_seen_at: now,
              last_tool_use: now,
              session_id: sessionId,
              updated_at: now
            })
            .eq('id', existingActivity.id);

          if (retryError) throw retryError;
        } else if (updateError) {
          throw updateError;
        }

        console.log(`✅ Tracked copy grader usage for requester ${requesterId}`);
        return true;
      } else {
        // Create new activity record
        const { error: insertError } = await this.supabase
          .from('user_activity_data')
          .insert({
            requester_id: requesterId,
            session_id: sessionId,
            email: email,
            user_type: 'guest',
            first_visit: now,
            last_seen_at: now,
            last_tool_use: now,
            copy_grader_uses: 1,
            total_tool_uses: 1,
            email_finder_uses: 0,
            lookalike_finder_uses: 0,
            phone_finder_uses: 0,
            spam_checker_uses: 0,
            tech_stack_uses: 0,
            find_people_use: 0,
            email_generator_uses: 0,
            intent_signals_use: 0
          });

        if (insertError) throw insertError;

        console.log(`✅ Created activity record and tracked usage for requester ${requesterId}`);
        return true;
      }
    } catch (error) {
      console.error('❌ Error tracking tool usage:', error.message);
      return false;
    }
  }

  /**
   * Main function to track a copy grader usage
   * @param {Object} params - Tracking parameters
   * @param {string} params.email - User's email
   * @param {string} params.sessionId - Session ID
   * @param {string} params.userAgent - Browser user agent
   * @param {string} params.ipAddress - User's IP address
   * @returns {Promise<boolean>} - Success status
   */
  async trackCopyGraderUsage({ email, sessionId, userAgent, ipAddress }) {
    if (!this.enabled) {
      console.log('ℹ️  Database tracking is disabled');
      return false;
    }

    try {
      // Step 1: Upsert requester
      const requesterId = await this.upsertRequester(email, sessionId, userAgent, ipAddress);

      if (!requesterId) {
        console.error('❌ Failed to get requester ID');
        return false;
      }

      // Step 2: Track tool usage
      const success = await this.trackToolUsage(requesterId, sessionId, email);

      return success;
    } catch (error) {
      console.error('❌ Error in trackCopyGraderUsage:', error.message);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new DatabaseService();

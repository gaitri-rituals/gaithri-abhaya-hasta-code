const db = require('../config/database');

const notificationsController = {
  // Get all notifications
  getAllNotifications: async (req, res) => {
    try {
      const { 
        temple_id, 
        type, 
        status, 
        priority,
        limit = 50, 
        offset = 0 
      } = req.query;

      if (!temple_id) {
        return res.status(400).json({
          success: false,
          message: 'Temple ID is required'
        });
      }

      let query = `
        SELECT n.*, t.name as temple_name
        FROM notifications n
        JOIN temples t ON n.temple_id = t.id
        WHERE n.temple_id = $1
      `;

      const params = [temple_id];
      let paramCount = 1;

      if (type) {
        paramCount++;
        query += ` AND n.type = $${paramCount}`;
        params.push(type);
      }

      if (status) {
        paramCount++;
        query += ` AND n.status = $${paramCount}`;
        params.push(status);
      }

      if (priority) {
        paramCount++;
        query += ` AND n.priority = $${paramCount}`;
        params.push(priority);
      }

      query += `
        ORDER BY n.created_at DESC 
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      params.push(limit, offset);

      const result = await db.query(query, params);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) as total
        FROM notifications n
        WHERE n.temple_id = $1
      `;
      const countParams = [temple_id];
      let countParamCount = 1;

      if (type) {
        countParamCount++;
        countQuery += ` AND n.type = $${countParamCount}`;
        countParams.push(type);
      }

      if (status) {
        countParamCount++;
        countQuery += ` AND n.status = $${countParamCount}`;
        countParams.push(status);
      }

      if (priority) {
        countParamCount++;
        countQuery += ` AND n.priority = $${countParamCount}`;
        countParams.push(priority);
      }

      const countResult = await db.query(countQuery, countParams);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: parseInt(countResult.rows[0].total)
        }
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get notification by ID
  getNotificationById: async (req, res) => {
    try {
      const { id } = req.params;

      const query = `
        SELECT n.*, t.name as temple_name, t.city, t.state
        FROM notifications n
        JOIN temples t ON n.temple_id = t.id
        WHERE n.id = $1
      `;

      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching notification details:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Create new notification
  createNotification: async (req, res) => {
    try {
      const {
        temple_id,
        title,
        message,
        type,
        priority,
        target_audience,
        scheduled_at,
        metadata
      } = req.body;

      if (!temple_id || !title || !message || !type) {
        return res.status(400).json({
          success: false,
          message: 'Temple ID, title, message, and type are required'
        });
      }

      // Validate type
      const validTypes = [
        'general', 'event', 'booking', 'payment', 'class', 'emergency', 
        'maintenance', 'festival', 'announcement', 'reminder'
      ];
      
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid notification type'
        });
      }

      // Validate priority
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (priority && !validPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid priority level'
        });
      }

      // Check if temple exists
      const templeQuery = 'SELECT id, name FROM temples WHERE id = $1 AND is_active = true';
      const templeResult = await db.query(templeQuery, [temple_id]);

      if (templeResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Temple not found'
        });
      }

      const insertQuery = `
        INSERT INTO notifications (
          temple_id, title, message, type, priority, target_audience,
          scheduled_at, metadata, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const status = scheduled_at ? 'scheduled' : 'pending';

      const result = await db.query(insertQuery, [
        temple_id, title, message, type, priority || 'medium', 
        JSON.stringify(target_audience), scheduled_at, 
        JSON.stringify(metadata), status
      ]);

      res.status(201).json({
        success: true,
        message: 'Notification created successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Update notification
  updateNotification: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        title,
        message,
        type,
        priority,
        target_audience,
        scheduled_at,
        metadata,
        status
      } = req.body;

      // Check if notification exists
      const checkQuery = 'SELECT * FROM notifications WHERE id = $1';
      const checkResult = await db.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      const notification = checkResult.rows[0];

      // Don't allow updating sent notifications
      if (notification.status === 'sent') {
        return res.status(400).json({
          success: false,
          message: 'Cannot update sent notifications'
        });
      }

      const updateFields = [];
      const params = [];
      let paramCount = 1;

      if (title) {
        updateFields.push(`title = $${paramCount}`);
        params.push(title);
        paramCount++;
      }

      if (message) {
        updateFields.push(`message = $${paramCount}`);
        params.push(message);
        paramCount++;
      }

      if (type) {
        const validTypes = [
          'general', 'event', 'booking', 'payment', 'class', 'emergency', 
          'maintenance', 'festival', 'announcement', 'reminder'
        ];
        
        if (!validTypes.includes(type)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid notification type'
          });
        }
        updateFields.push(`type = $${paramCount}`);
        params.push(type);
        paramCount++;
      }

      if (priority) {
        const validPriorities = ['low', 'medium', 'high', 'urgent'];
        if (!validPriorities.includes(priority)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid priority level'
          });
        }
        updateFields.push(`priority = $${paramCount}`);
        params.push(priority);
        paramCount++;
      }

      if (target_audience) {
        updateFields.push(`target_audience = $${paramCount}`);
        params.push(JSON.stringify(target_audience));
        paramCount++;
      }

      if (scheduled_at !== undefined) {
        updateFields.push(`scheduled_at = $${paramCount}`);
        params.push(scheduled_at);
        paramCount++;
      }

      if (metadata) {
        updateFields.push(`metadata = $${paramCount}`);
        params.push(JSON.stringify(metadata));
        paramCount++;
      }

      if (status) {
        const validStatuses = ['pending', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid status'
          });
        }
        updateFields.push(`status = $${paramCount}`);
        params.push(status);
        paramCount++;
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(id);

      const updateQuery = `
        UPDATE notifications 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await db.query(updateQuery, params);

      res.json({
        success: true,
        message: 'Notification updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating notification:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Delete notification
  deleteNotification: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if notification exists
      const checkQuery = 'SELECT * FROM notifications WHERE id = $1';
      const checkResult = await db.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      const notification = checkResult.rows[0];

      // Don't allow deleting sent notifications
      if (notification.status === 'sent') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete sent notifications'
        });
      }

      // Delete the notification
      const deleteQuery = 'DELETE FROM notifications WHERE id = $1 RETURNING *';
      const result = await db.query(deleteQuery, [id]);

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Send notification immediately
  sendNotification: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if notification exists
      const checkQuery = 'SELECT * FROM notifications WHERE id = $1';
      const checkResult = await db.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      const notification = checkResult.rows[0];

      // Check if notification can be sent
      if (notification.status === 'sent') {
        return res.status(400).json({
          success: false,
          message: 'Notification already sent'
        });
      }

      if (notification.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          message: 'Cannot send cancelled notification'
        });
      }

      // Update status to sending
      const updateQuery = `
        UPDATE notifications 
        SET status = 'sending', sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const result = await db.query(updateQuery, [id]);

      // Here you would integrate with actual notification service (FCM, email, SMS, etc.)
      // For now, we'll simulate successful sending
      
      // Update status to sent
      const sentQuery = `
        UPDATE notifications 
        SET status = 'sent', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const sentResult = await db.query(sentQuery, [id]);

      res.json({
        success: true,
        message: 'Notification sent successfully',
        data: sentResult.rows[0]
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      
      // Update status to failed if there was an error
      try {
        await db.query(
          'UPDATE notifications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['failed', req.params.id]
        );
      } catch (updateError) {
        console.error('Error updating notification status to failed:', updateError);
      }

      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get notification types
  getNotificationTypes: async (req, res) => {
    try {
      const { temple_id } = req.query;

      let query = `
        SELECT type, COUNT(*) as notification_count
        FROM notifications 
      `;

      const params = [];

      if (temple_id) {
        query += ' WHERE temple_id = $1';
        params.push(temple_id);
      }

      query += ' GROUP BY type ORDER BY notification_count DESC';

      const result = await db.query(query, params);

      const types = [
        { value: 'general', label: 'General', description: 'General announcements and updates' },
        { value: 'event', label: 'Event', description: 'Event-related notifications' },
        { value: 'booking', label: 'Booking', description: 'Booking confirmations and updates' },
        { value: 'payment', label: 'Payment', description: 'Payment-related notifications' },
        { value: 'class', label: 'Class', description: 'Class schedules and updates' },
        { value: 'emergency', label: 'Emergency', description: 'Emergency alerts and notices' },
        { value: 'maintenance', label: 'Maintenance', description: 'Maintenance and closure notices' },
        { value: 'festival', label: 'Festival', description: 'Festival and celebration announcements' },
        { value: 'announcement', label: 'Announcement', description: 'Important announcements' },
        { value: 'reminder', label: 'Reminder', description: 'Reminders and follow-ups' }
      ];

      // Merge with actual data
      const typesWithData = types.map(type => {
        const data = result.rows.find(r => r.type === type.value);
        return {
          ...type,
          notification_count: data ? parseInt(data.notification_count) : 0
        };
      });

      res.json({
        success: true,
        data: typesWithData
      });
    } catch (error) {
      console.error('Error fetching notification types:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get notification statistics
  getNotificationStats: async (req, res) => {
    try {
      const { temple_id } = req.query;

      if (!temple_id) {
        return res.status(400).json({
          success: false,
          message: 'Temple ID is required'
        });
      }

      // Overall statistics
      const overallQuery = `
        SELECT 
          COUNT(*) as total_notifications,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_notifications,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_notifications,
          COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_notifications,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_notifications,
          COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_notifications,
          COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_notifications
        FROM notifications
        WHERE temple_id = $1
      `;

      const overallResult = await db.query(overallQuery, [temple_id]);

      // Type breakdown
      const typeQuery = `
        SELECT type, COUNT(*) as notification_count,
               COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count
        FROM notifications
        WHERE temple_id = $1
        GROUP BY type
        ORDER BY notification_count DESC
      `;

      const typeResult = await db.query(typeQuery, [temple_id]);

      // Recent activity (last 30 days)
      const recentQuery = `
        SELECT DATE(created_at) as date, COUNT(*) as notifications_created,
               COUNT(CASE WHEN status = 'sent' THEN 1 END) as notifications_sent
        FROM notifications
        WHERE temple_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `;

      const recentResult = await db.query(recentQuery, [temple_id]);

      // Priority distribution
      const priorityQuery = `
        SELECT priority, COUNT(*) as notification_count
        FROM notifications
        WHERE temple_id = $1
        GROUP BY priority
        ORDER BY 
          CASE priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            WHEN 'low' THEN 4 
          END
      `;

      const priorityResult = await db.query(priorityQuery, [temple_id]);

      res.json({
        success: true,
        data: {
          overview: overallResult.rows[0],
          type_breakdown: typeResult.rows,
          recent_activity: recentResult.rows,
          priority_distribution: priorityResult.rows
        }
      });
    } catch (error) {
      console.error('Error fetching notification statistics:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get scheduled notifications
  getScheduledNotifications: async (req, res) => {
    try {
      const { temple_id } = req.query;

      if (!temple_id) {
        return res.status(400).json({
          success: false,
          message: 'Temple ID is required'
        });
      }

      const query = `
        SELECT *
        FROM notifications
        WHERE temple_id = $1 AND status = 'scheduled' AND scheduled_at > CURRENT_TIMESTAMP
        ORDER BY scheduled_at ASC
      `;

      const result = await db.query(query, [temple_id]);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error fetching scheduled notifications:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

module.exports = notificationsController;
const twilio = require('twilio');
const nodemailer = require('nodemailer');
const db = require('./database');

class NotificationService {
    constructor() {
        // Twilio Configuration
        this.twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
            ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
            : null;
        
        // Email Configuration
        this.emailTransporter = this.initializeEmailTransporter();
        
        // Configuration flags
        this.SMS_ENABLED = process.env.SMS_NOTIFICATIONS_ENABLED === 'true';
        this.EMAIL_ENABLED = process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true';
    }

    initializeEmailTransporter() {
        if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Email configuration incomplete. Email notifications disabled.');
            return null;
        }

        return nodemailer.createTransporter({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    async sendSMS(phoneNumber, message, userId, userType, notificationType = 'general') {
        if (!this.SMS_ENABLED || !this.twilioClient) {
            console.log('SMS notifications disabled or not configured');
            return null;
        }

        try {
            const smsMessage = await this.twilioClient.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phoneNumber
            });

            // Log notification in database
            await this.logNotification({
                userId,
                userType,
                type: notificationType,
                title: 'SMS Notification',
                message,
                channel: 'sms',
                mobileNumber: phoneNumber,
                smsSid: smsMessage.sid,
                smsStatus: smsMessage.status,
                status: 'sent'
            });

            return smsMessage;
        } catch (error) {
            console.error('SMS sending failed:', error);
            
            // Log failed notification
            await this.logNotification({
                userId,
                userType,
                type: notificationType,
                title: 'SMS Notification',
                message,
                channel: 'sms',
                mobileNumber: phoneNumber,
                status: 'failed',
                failureReason: error.message
            });

            return null;
        }
    }

    async sendEmail(to, subject, htmlContent, textContent, userId, userType, notificationType = 'general') {
        if (!this.EMAIL_ENABLED || !this.emailTransporter) {
            console.log('Email notifications disabled or not configured');
            return null;
        }

        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                to,
                subject,
                text: textContent,
                html: htmlContent
            };

            const info = await this.emailTransporter.sendMail(mailOptions);

            // Log notification in database
            await this.logNotification({
                userId,
                userType,
                type: notificationType,
                title: subject,
                message: textContent || htmlContent,
                channel: 'email',
                emailAddress: to,
                emailMessageId: info.messageId,
                status: 'sent'
            });

            return info;
        } catch (error) {
            console.error('Email sending failed:', error);
            
            // Log failed notification
            await this.logNotification({
                userId,
                userType,
                type: notificationType,
                title: subject,
                message: textContent || htmlContent,
                channel: 'email',
                emailAddress: to,
                status: 'failed',
                failureReason: error.message
            });

            return null;
        }
    }

    async logNotification(data) {
        try {
            const {
                userId, userType, type, title, message, channel = 'app',
                status = 'sent', priority = 'normal', mobileNumber,
                emailAddress, smsSid, smsStatus, emailMessageId,
                failureReason
            } = data;

            await db.run(`
                INSERT INTO notifications (
                    user_id, user_type, type, title, message, channel,
                    status, priority, mobile_number, email_address,
                    sms_sid, sms_status, email_message_id, failure_reason
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                userId, userType, type, title, message, channel,
                status, priority, mobileNumber, emailAddress,
                smsSid, smsStatus, emailMessageId, failureReason
            ]);
        } catch (error) {
            console.error('Failed to log notification:', error);
        }
    }

    async sendConnectionRequestNotification(mentorId, menteeId, subject, message, preferredTime) {
        try {
            // Get mentor and mentee details
            const mentor = await db.get('SELECT * FROM mentors WHERE id = ?', [mentorId]);
            const mentee = await db.get('SELECT * FROM mentees WHERE id = ?', [menteeId]);

            if (!mentor || !mentee) {
                throw new Error('User not found');
            }

            // Send SMS to mentor
            if (mentor.mobile_number) {
                const mentorMessage = `New mentoring request from ${mentee.first_name} ${mentee.last_name} for ${subject}. Preferred time: ${preferredTime || 'Not specified'}. Check your dashboard to respond.`;
                await this.sendSMS(
                    mentor.mobile_number,
                    mentorMessage,
                    mentor.id,
                    'mentor',
                    'connection_request'
                );
            }

            // Send confirmation SMS to mentee
            if (mentee.mobile_number) {
                const menteeMessage = `Your mentoring request to ${mentor.first_name} ${mentor.last_name} for ${subject} has been sent successfully. You'll receive a notification when they respond.`;
                await this.sendSMS(
                    mentee.mobile_number,
                    menteeMessage,
                    mentee.id,
                    'mentee',
                    'connection_request_sent'
                );
            }

            // Send email notifications if enabled
            if (this.EMAIL_ENABLED) {
                // Email to mentor
                if (mentor.email) {
                    await this.sendEmail(
                        mentor.email,
                        `New Mentoring Request - ${subject}`,
                        this.generateConnectionRequestEmailHTML(mentor, mentee, subject, message, preferredTime),
                        `New mentoring request from ${mentee.first_name} ${mentee.last_name} for ${subject}. Message: ${message}`,
                        mentor.id,
                        'mentor',
                        'connection_request'
                    );
                }

                // Confirmation email to mentee
                if (mentee.email) {
                    await this.sendEmail(
                        mentee.email,
                        `Request Sent - ${subject}`,
                        this.generateConnectionRequestConfirmationEmailHTML(mentee, mentor, subject),
                        `Your mentoring request to ${mentor.first_name} ${mentor.last_name} for ${subject} has been sent successfully.`,
                        mentee.id,
                        'mentee',
                        'connection_request_sent'
                    );
                }
            }

        } catch (error) {
            console.error('Failed to send connection request notification:', error);
            throw error;
        }
    }

    async sendSessionNotification(sessionId, type) {
        try {
            const session = await db.get(`
                SELECT s.*, 
                       m.first_name as mentor_first_name, m.last_name as mentor_last_name, 
                       m.email as mentor_email, m.mobile_number as mentor_mobile,
                       me.first_name as mentee_first_name, me.last_name as mentee_last_name,
                       me.email as mentee_email, me.mobile_number as mentee_mobile
                FROM sessions s
                JOIN mentors m ON s.mentor_id = m.id
                JOIN mentees me ON s.mentee_id = me.id
                WHERE s.id = ?
            `, [sessionId]);

            if (!session) {
                throw new Error('Session not found');
            }

            const scheduledTime = new Date(session.scheduled_time).toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                dateStyle: 'full',
                timeStyle: 'short'
            });

            switch (type) {
                case 'scheduled':
                    await this.sendScheduledSessionNotifications(session, scheduledTime);
                    break;
                case 'reminder':
                    await this.sendSessionReminderNotifications(session, scheduledTime);
                    break;
                case 'cancelled':
                    await this.sendCancelledSessionNotifications(session, scheduledTime);
                    break;
                default:
                    console.warn(`Unknown session notification type: ${type}`);
            }

        } catch (error) {
            console.error('Failed to send session notification:', error);
            throw error;
        }
    }

    async sendScheduledSessionNotifications(session, scheduledTime) {
        // Notify mentee
        if (session.mentee_mobile) {
            const menteeMessage = `Session confirmed with ${session.mentor_first_name} ${session.mentor_last_name} for ${session.subject} on ${scheduledTime}. Amount: ₹${session.amount}. ${session.meeting_link ? 'Meeting link: ' + session.meeting_link : 'Check your dashboard for details.'}`;
            await this.sendSMS(
                session.mentee_mobile,
                menteeMessage,
                session.mentee_id,
                'mentee',
                'session_scheduled'
            );
        }

        // Notify mentor
        if (session.mentor_mobile) {
            const mentorMessage = `Session confirmed with ${session.mentee_first_name} ${session.mentee_last_name} for ${session.subject} on ${scheduledTime}. Amount: ₹${session.amount}. Check your dashboard for details.`;
            await this.sendSMS(
                session.mentor_mobile,
                mentorMessage,
                session.mentor_id,
                'mentor',
                'session_scheduled'
            );
        }
    }

    async sendSessionReminderNotifications(session, scheduledTime) {
        const reminderMessage = `Reminder: Your mentoring session for ${session.subject} is scheduled for ${scheduledTime}. ${session.meeting_link ? 'Join: ' + session.meeting_link : 'Check your dashboard for meeting details.'}`;

        // Remind mentee
        if (session.mentee_mobile) {
            await this.sendSMS(
                session.mentee_mobile,
                `Hi ${session.mentee_first_name}, ${reminderMessage}`,
                session.mentee_id,
                'mentee',
                'session_reminder'
            );
        }

        // Remind mentor
        if (session.mentor_mobile) {
            await this.sendSMS(
                session.mentor_mobile,
                `Hi ${session.mentor_first_name}, ${reminderMessage}`,
                session.mentor_id,
                'mentor',
                'session_reminder'
            );
        }
    }

    async sendCancelledSessionNotifications(session, scheduledTime) {
        const cancelMessage = `Your mentoring session for ${session.subject} scheduled for ${scheduledTime} has been cancelled. ${session.cancellation_reason ? 'Reason: ' + session.cancellation_reason : ''}`;

        // Notify mentee
        if (session.mentee_mobile) {
            await this.sendSMS(
                session.mentee_mobile,
                `Hi ${session.mentee_first_name}, ${cancelMessage}`,
                session.mentee_id,
                'mentee',
                'session_cancelled'
            );
        }

        // Notify mentor
        if (session.mentor_mobile) {
            await this.sendSMS(
                session.mentor_mobile,
                `Hi ${session.mentor_first_name}, ${cancelMessage}`,
                session.mentor_id,
                'mentor',
                'session_cancelled'
            );
        }
    }

    generateConnectionRequestEmailHTML(mentor, mentee, subject, message, preferredTime) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">New Mentoring Request</h2>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Request Details</h3>
                    <p><strong>From:</strong> ${mentee.first_name} ${mentee.last_name}</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <p><strong>Preferred Time:</strong> ${preferredTime || 'Not specified'}</p>
                    <p><strong>Message:</strong> ${message}</p>
                </div>
                <p>Please log in to your dashboard to accept or decline this request.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/mentor-dashboard" 
                   style="background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                   View Dashboard
                </a>
            </div>
        `;
    }

    generateConnectionRequestConfirmationEmailHTML(mentee, mentor, subject) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #27ae60;">Request Sent Successfully</h2>
                <p>Hi ${mentee.first_name},</p>
                <p>Your mentoring request has been sent to ${mentor.first_name} ${mentor.last_name} for <strong>${subject}</strong>.</p>
                <p>You'll receive a notification when they respond to your request.</p>
                <p>Thank you for using our platform!</p>
            </div>
        `;
    }

    async getUserNotifications(userId, userType, limit = 20, offset = 0) {
        try {
            const notifications = await db.query(`
                SELECT * FROM notifications 
                WHERE user_id = ? AND user_type = ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `, [userId, userType, limit, offset]);

            return notifications;
        } catch (error) {
            console.error('Failed to get user notifications:', error);
            return [];
        }
    }

    async markNotificationAsRead(notificationId, userId) {
        try {
            await db.run(`
                UPDATE notifications 
                SET status = 'read', read_at = CURRENT_TIMESTAMP
                WHERE id = ? AND user_id = ?
            `, [notificationId, userId]);

            return true;
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            return false;
        }
    }
}

module.exports = new NotificationService();

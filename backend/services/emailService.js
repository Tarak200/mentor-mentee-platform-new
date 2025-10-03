const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initialized = false;
        this.templates = this.loadTemplates();
    }

    // Initialize email transporter
    async initialize() {
    try {
        if (this.initialized) return;

        const config = {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT, 10) || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for 587
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        };

        // If no credentials are provided, create an Ethereal test account for local development
        if (!config.auth.user || !config.auth.pass) {
            const testAccount = await nodemailer.createTestAccount();
            config.host = 'smtp.ethereal.email';
            config.port = 587;
            config.secure = false;
            config.auth = {
                user: testAccount.user,
                pass: testAccount.pass
            };
            console.log('No SMTP credentials found — using Ethereal test account (dev only).');
        }

        // === IMPORTANT FIX: use createTransport, not createTransporter ===
        this.transporter = nodemailer.createTransport(config);

        // verify connection config
        await this.transporter.verify();
        this.initialized = true;
        console.log('Email service initialized successfully');

    } catch (error) {
        console.error('Failed to initialize email service:', error);
        throw error;
    }
}


    // Load email templates
    loadTemplates() {
        return {
            welcome: {
                subject: 'Welcome to MentorLink Platform!',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #4F46E5;">Welcome to MentorLink!</h1>
                        <p>Hi {{firstName}},</p>
                        <p>Welcome to our mentoring platform! We're excited to have you join our community.</p>
                        <p>Your account has been successfully created. You can now:</p>
                        <ul>
                            <li>Explore mentor profiles</li>
                            <li>Schedule mentoring sessions</li>
                            <li>Track your progress</li>
                        </ul>
                        <a href="{{loginUrl}}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">Get Started</a>
                        <p>Best regards,<br>The MentorLink Team</p>
                    </div>
                `
            },
            sessionReminder: {
                subject: 'Session Reminder - {{sessionTitle}}',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #4F46E5;">Session Reminder</h1>
                        <p>Hi {{firstName}},</p>
                        <p>This is a reminder that you have an upcoming mentoring session:</p>
                        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3>{{sessionTitle}}</h3>
                            <p><strong>Date:</strong> {{sessionDate}}</p>
                            <p><strong>Time:</strong> {{sessionTime}}</p>
                            <p><strong>Duration:</strong> {{duration}} minutes</p>
                            <p><strong>{{otherPartyRole}}:</strong> {{otherPartyName}}</p>
                        </div>
                        <a href="{{sessionUrl}}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">Join Session</a>
                        <p>Best regards,<br>The MentorLink Team</p>
                    </div>
                `
            },
            sessionConfirmation: {
                subject: 'Session Confirmed - {{sessionTitle}}',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #10B981;">Session Confirmed</h1>
                        <p>Hi {{firstName}},</p>
                        <p>Your mentoring session has been confirmed:</p>
                        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3>{{sessionTitle}}</h3>
                            <p><strong>Date:</strong> {{sessionDate}}</p>
                            <p><strong>Time:</strong> {{sessionTime}}</p>
                            <p><strong>Duration:</strong> {{duration}} minutes</p>
                            <p><strong>{{otherPartyRole}}:</strong> {{otherPartyName}}</p>
                        </div>
                        <a href="{{sessionUrl}}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">View Session Details</a>
                        <p>Best regards,<br>The MentorLink Team</p>
                    </div>
                `
            },
            sessionCancellation: {
                subject: 'Session Cancelled - {{sessionTitle}}',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #EF4444;">Session Cancelled</h1>
                        <p>Hi {{firstName}},</p>
                        <p>Unfortunately, your mentoring session has been cancelled:</p>
                        <div style="background: #FEF2F2; border-left: 4px solid #EF4444; padding: 20px; margin: 20px 0;">
                            <h3>{{sessionTitle}}</h3>
                            <p><strong>Original Date:</strong> {{sessionDate}}</p>
                            <p><strong>Original Time:</strong> {{sessionTime}}</p>
                            <p><strong>{{otherPartyRole}}:</strong> {{otherPartyName}}</p>
                            {{#if reason}}<p><strong>Reason:</strong> {{reason}}</p>{{/if}}
                        </div>
                        <p>You can reschedule or book a new session through your dashboard.</p>
                        <a href="{{dashboardUrl}}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">Go to Dashboard</a>
                        <p>Best regards,<br>The MentorLink Team</p>
                    </div>
                `
            },
            mentoringRequest: {
                subject: 'New Mentoring Request from {{menteeName}}',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #4F46E5;">New Mentoring Request</h1>
                        <p>Hi {{mentorName}},</p>
                        <p>You have received a new mentoring request:</p>
                        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3>From: {{menteeName}}</h3>
                            <p><strong>Message:</strong></p>
                            <p>{{message}}</p>
                            {{#if goals}}<p><strong>Goals:</strong> {{goals}}</p>{{/if}}
                            {{#if preferredSchedule}}<p><strong>Preferred Schedule:</strong> {{preferredSchedule}}</p>{{/if}}
                        </div>
                        <div style="margin: 20px 0;">
                            <a href="{{acceptUrl}}" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">Accept Request</a>
                            <a href="{{declineUrl}}" style="background: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Decline Request</a>
                        </div>
                        <p>Best regards,<br>The MentorLink Team</p>
                    </div>
                `
            },
            requestAccepted: {
                subject: 'Your Mentoring Request was Accepted!',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #10B981;">Request Accepted!</h1>
                        <p>Hi {{menteeName}},</p>
                        <p>Great news! {{mentorName}} has accepted your mentoring request.</p>
                        <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0;">
                            <p>You can now schedule sessions with {{mentorName}} and start your mentoring journey.</p>
                        </div>
                        <a href="{{dashboardUrl}}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">Schedule First Session</a>
                        <p>Best regards,<br>The MentorLink Team</p>
                    </div>
                `
            },
            passwordReset: {
                subject: 'Reset Your Password - MentorLink',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #4F46E5;">Password Reset Request</h1>
                        <p>Hi {{firstName}},</p>
                        <p>We received a request to reset your password. Click the button below to create a new password:</p>
                        <a href="{{resetUrl}}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">Reset Password</a>
                        <p>This link will expire in 1 hour for security reasons.</p>
                        <p>If you didn't request this password reset, please ignore this email.</p>
                        <p>Best regards,<br>The MentorLink Team</p>
                    </div>
                `
            },
            sessionCompleted: {
                subject: 'Session Completed - Please Share Your Feedback',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #10B981;">Session Completed</h1>
                        <p>Hi {{firstName}},</p>
                        <p>Your mentoring session with {{otherPartyName}} has been completed:</p>
                        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3>{{sessionTitle}}</h3>
                            <p><strong>Date:</strong> {{sessionDate}}</p>
                            <p><strong>Duration:</strong> {{duration}} minutes</p>
                        </div>
                        <p>We'd love to hear about your experience. Your feedback helps us improve our platform.</p>
                        <a href="{{reviewUrl}}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">Leave Feedback</a>
                        <p>Best regards,<br>The MentorLink Team</p>
                    </div>
                `
            }
        };
    }

    // Replace template variables
    replaceTemplateVariables(template, variables) {
        let html = template.html;
        let subject = template.subject;

        // Replace variables in HTML and subject
        Object.keys(variables).forEach(key => {
            const value = variables[key] || '';
            const regex = new RegExp(`{{${key}}}`, 'g');
            html = html.replace(regex, value);
            subject = subject.replace(regex, value);
        });

        // Handle conditional blocks
        html = html.replace(/{{#if\s+(\w+)}}(.*?){{\/if}}/gs, (match, condition, content) => {
            return variables[condition] ? content : '';
        });

        return { html, subject };
    }

    // Send email
    // Send email
    async sendEmail(to, templateName, variables = {}) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            const template = this.templates[templateName];
            if (!template) {
                throw new Error(`Template ${templateName} not found`);
            }

            const { html, subject } = this.replaceTemplateVariables(template, variables);

            const mailOptions = {
                from: `"MentorLink Platform" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                to: Array.isArray(to) ? to.join(', ') : to,
                subject,
                html,
                text: html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
            };

            const result = await this.transporter.sendMail(mailOptions);

            console.log(`✅ Email sent to ${to}: ${result.messageId}`);
            console.log("SMTP Response:", result.response);

            // Preview URL only for Ethereal accounts
            const previewUrl = nodemailer.getTestMessageUrl(result);
            if (previewUrl) {
                console.log("Preview URL:", previewUrl);
            }

            return result;
        } catch (error) {
            console.error("❌ Error sending email:", error);
            throw error;
        }
    }

    // Send welcome email
    async sendWelcomeEmail(user) {
        const variables = {
            firstName: user.firstName,
            loginUrl: `${process.env.FRONTEND_URL}/login`
        };

        return this.sendEmail(user.email, 'welcome', variables);
    }

    // Send session reminder
    async sendSessionReminder(session, user, otherParty) {
        const sessionDate = new Date(session.scheduledAt).toLocaleDateString();
        const sessionTime = new Date(session.scheduledAt).toLocaleTimeString();
        const isUserMentor = session.mentorId === user.id;

        const variables = {
            firstName: user.firstName,
            sessionTitle: session.title,
            sessionDate,
            sessionTime,
            duration: session.duration,
            otherPartyName: `${otherParty.firstName} ${otherParty.lastName}`,
            otherPartyRole: isUserMentor ? 'Mentee' : 'Mentor',
            sessionUrl: `${process.env.FRONTEND_URL}/sessions/${session.id}`
        };

        return this.sendEmail(user.email, 'sessionReminder', variables);
    }

    // Send session confirmation
    async sendSessionConfirmation(session, user, otherParty) {
        const sessionDate = new Date(session.scheduledAt).toLocaleDateString();
        const sessionTime = new Date(session.scheduledAt).toLocaleTimeString();
        const isUserMentor = session.mentorId === user.id;

        const variables = {
            firstName: user.firstName,
            sessionTitle: session.title,
            sessionDate,
            sessionTime,
            duration: session.duration,
            otherPartyName: `${otherParty.firstName} ${otherParty.lastName}`,
            otherPartyRole: isUserMentor ? 'Mentee' : 'Mentor',
            sessionUrl: `${process.env.FRONTEND_URL}/sessions/${session.id}`
        };

        return this.sendEmail(user.email, 'sessionConfirmation', variables);
    }

    // Send session cancellation
    async sendSessionCancellation(session, user, otherParty, reason = '') {
        const sessionDate = new Date(session.scheduledAt).toLocaleDateString();
        const sessionTime = new Date(session.scheduledAt).toLocaleTimeString();
        const isUserMentor = session.mentorId === user.id;

        const variables = {
            firstName: user.firstName,
            sessionTitle: session.title,
            sessionDate,
            sessionTime,
            otherPartyName: `${otherParty.firstName} ${otherParty.lastName}`,
            otherPartyRole: isUserMentor ? 'Mentee' : 'Mentor',
            reason,
            dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
        };

        return this.sendEmail(user.email, 'sessionCancellation', variables);
    }

    // Send mentoring request notification
    async sendMentoringRequest(request, mentor, mentee) {
        const variables = {
            mentorName: mentor.firstName,
            menteeName: `${mentee.firstName} ${mentee.lastName}`,
            message: request.message,
            goals: request.goals,
            preferredSchedule: request.preferredSchedule,
            acceptUrl: `${process.env.FRONTEND_URL}/requests/${request.id}/accept`,
            declineUrl: `${process.env.FRONTEND_URL}/requests/${request.id}/decline`
        };

        return this.sendEmail(mentor.email, 'mentoringRequest', variables);
    }

    // Send request accepted notification
    async sendRequestAccepted(request, mentor, mentee) {
        const variables = {
            menteeName: mentee.firstName,
            mentorName: `${mentor.firstName} ${mentor.lastName}`,
            dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
        };

        return this.sendEmail(mentee.email, 'requestAccepted', variables);
    }

    // Send password reset email
    async sendPasswordReset(user, resetToken) {
        const rolePath = user.role === 'mentor' ? '/mentor/reset-password' : '/mentee/reset-password';
        const variables = {
            firstName: user.firstName,
            resetUrl: `${process.env.FRONTEND_URL}${rolePath}?token=${resetToken}`
        };

        return this.sendEmail(user.email, 'passwordReset', variables);
    }

    // Send session completed notification
    async sendSessionCompleted(session, user, otherParty) {
        const sessionDate = new Date(session.scheduledAt).toLocaleDateString();

        const variables = {
            firstName: user.firstName,
            sessionTitle: session.title,
            sessionDate,
            duration: session.duration,
            otherPartyName: `${otherParty.firstName} ${otherParty.lastName}`,
            reviewUrl: `${process.env.FRONTEND_URL}/sessions/${session.id}/review`
        };

        return this.sendEmail(user.email, 'sessionCompleted', variables);
    }

    // Send bulk emails
    async sendBulkEmails(recipients, templateName, variables = {}) {
        const results = [];
        
        for (const recipient of recipients) {
            try {
                const result = await this.sendEmail(recipient.email, templateName, {
                    ...variables,
                    firstName: recipient.firstName,
                    ...recipient.customVariables || {}
                });
                results.push({ email: recipient.email, success: true, messageId: result.messageId });
            } catch (error) {
                console.error(`Failed to send email to ${recipient.email}:`, error);
                results.push({ email: recipient.email, success: false, error: error.message });
            }
        }

        return results;
    }

    // Get email status/statistics (mock implementation)
    async getEmailStats(period = 'month') {
        // In a real implementation, this would fetch from email service provider APIs
        return {
            sent: 150,
            delivered: 148,
            bounced: 2,
            opened: 95,
            clicked: 23,
            deliveryRate: 98.7,
            openRate: 64.2,
            clickRate: 15.3
        };
    }
}

module.exports = new EmailService();

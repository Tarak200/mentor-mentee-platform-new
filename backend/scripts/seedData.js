const bcrypt = require('bcrypt');
const db = require('../services/database');

class SeedData {
    constructor() {
        this.users = [];
        this.sessions = [];
        this.relationships = [];
    }

    // Generate sample users
    async generateUsers() {
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        // Sample mentors
        const mentors = [
            {
                id: 'mentor_1',
                firstName: 'Sarah',
                lastName: 'Johnson',
                email: 'sarah.johnson@email.com',
                password: hashedPassword,
                role: 'mentor',
                bio: 'Senior Software Engineer with 8+ years experience in full-stack development. Passionate about mentoring and helping others grow.',
                skills: 'JavaScript,React,Node.js,Python,AWS',
                avatar: './uploads/avatars/sarah.jpg',
                hourlyRate: 75,
                isActive: 1,
                emailVerified: 1,
                phone: '+1-555-0101',
                timezone: 'America/New_York',
                education: 'Master of Science in Computer Science',
                institution: 'Stanford University',
                current_pursuit: 'Senior Software Engineer at Tech Corp',
                languages: 'English,Spanish',
                subjects: 'Web Development,Full Stack,JavaScript,React,Node.js',
                qualifications: 'AWS Certified Solutions Architect, Google Cloud Professional',
                profile_picture: '/uploads/profiles/sarah-profile.jpg',
                upi_id: 'sarah.johnson@upi'
            },
            {
                id: 'mentor_2',
                firstName: 'Michael',
                lastName: 'Chen',
                email: 'michael.chen@email.com',
                password: hashedPassword,
                role: 'mentor',
                bio: 'Product Manager and entrepreneur with experience in launching successful startups. Expert in product strategy and growth.',
                skills: 'Product Management,Strategy,Analytics,Leadership,Agile',
                avatar: '/uploads/avatars/michael.jpg',
                hourlyRate: 90,
                isActive: 1,
                emailVerified: 1,
                phone: '+1-555-0102',
                timezone: 'America/Los_Angeles',
                education: 'MBA - Business Administration',
                institution: 'Harvard Business School',
                current_pursuit: 'VP of Product at StartupXYZ',
                languages: 'English,Mandarin',
                subjects: 'Product Management,Business Strategy,Startup Growth,Analytics',
                qualifications: 'Certified Product Manager (CPM), Agile Certified Practitioner',
                profile_picture: './uploads/profiles/michael-profile.jpg',
                upi_id: 'michael.chen@upi'
            },
            {
                id: 'mentor_3',
                firstName: 'Emma',
                lastName: 'Williams',
                email: 'emma.williams@email.com',
                password: hashedPassword,
                role: 'mentor',
                bio: 'UX/UI Designer with 6+ years experience in creating user-centered designs for web and mobile applications.',
                skills: 'UI/UX Design,Figma,Adobe Creative Suite,User Research,Prototyping',
                avatar: '/uploads/avatars/emma.jpg',
                hourlyRate: 65,
                isActive: 1,
                emailVerified: 1,
                phone: '+1-555-0103',
                timezone: 'America/Chicago',
                education: 'Bachelor of Fine Arts in Graphic Design',
                institution: 'Rhode Island School of Design',
                current_pursuit: 'Lead UX Designer at Design Studio',
                languages: 'English,French',
                subjects: 'UX/UI Design,User Research,Prototyping,Design Systems',
                qualifications: 'Adobe Certified Expert, Nielsen Norman Group UX Certification',
                profile_picture: '/uploads/profiles/emma-profile.jpg',
                upi_id: 'emma.williams@upi'
            },
            {
                id: 'mentor_4',
                firstName: 'David',
                lastName: 'Rodriguez',
                email: 'david.rodriguez@email.com',
                password: hashedPassword,
                role: 'mentor',
                bio: 'Data Scientist and Machine Learning engineer with expertise in AI/ML, statistics, and big data analytics.',
                skills: 'Python,Machine Learning,Data Science,TensorFlow,SQL,Statistics',
                avatar: '/uploads/avatars/david.jpg',
                hourlyRate: 85,
                isActive: 1,
                emailVerified: 1,
                phone: '+1-555-0104',
                timezone: 'America/Denver',
                education: 'PhD in Data Science',
                institution: 'MIT',
                current_pursuit: 'Senior Data Scientist at AI Research Lab',
                languages: 'English,Spanish,Portuguese',
                subjects: 'Machine Learning,Data Science,Python,AI,Statistics',
                qualifications: 'TensorFlow Developer Certificate, AWS Machine Learning Specialty',
                profile_picture: '/uploads/profiles/david-profile.jpg',
                upi_id: 'david.rodriguez@upi'
            }
        ];

        // Sample mentees
        const mentees = [
            {
                id: 'mentee_1',
                firstName: 'Alex',
                lastName: 'Thompson',
                email: 'alex.thompson@email.com',
                password: hashedPassword,
                role: 'mentee',
                bio: 'Computer Science student looking to break into the tech industry. Interested in web development and software engineering.',
                skills: 'HTML,CSS,JavaScript,Python,Learning',
                avatar: '/uploads/avatars/alex.jpg',
                hourlyRate: 0,
                isActive: 1,
                emailVerified: 1,
                phone: '+1-555-0201',
                timezone: 'America/New_York',
                education: 'Bachelor of Science in Computer Science (In Progress)',
                institution: 'University of California, Berkeley',
                current_pursuit: 'CS Student - Junior Year',
                languages: 'English',
                subjects: 'Web Development,Programming,Software Engineering',
                qualifications: 'None',
                profile_picture: '/uploads/profiles/alex-profile.jpg',
                upi_id: null
            },
            {
                id: 'mentee_2',
                firstName: 'Jessica',
                lastName: 'Davis',
                email: 'jessica.davis@email.com',
                password: hashedPassword,
                role: 'mentee',
                bio: 'Marketing professional transitioning to product management. Looking for guidance on product strategy and career development.',
                skills: 'Marketing,Analytics,Communication,Project Management',
                avatar: '/uploads/avatars/jessica.jpg',
                hourlyRate: 0,
                isActive: 1,
                emailVerified: 1,
                phone: '+1-555-0202',
                timezone: 'America/Los_Angeles',
                education: 'Bachelor of Arts in Marketing',
                institution: 'New York University',
                current_pursuit: 'Marketing Manager transitioning to PM',
                languages: 'English,Spanish',
                subjects: 'Product Management,Marketing,Business Strategy',
                qualifications: 'Google Analytics Certified',
                profile_picture: '/uploads/profiles/jessica-profile.jpg',
                upi_id: null
            },
            {
                id: 'mentee_3',
                firstName: 'Ryan',
                lastName: 'Kim',
                email: 'ryan.kim@email.com',
                password: hashedPassword,
                role: 'mentee',
                bio: 'Recent graduate with a design background. Seeking mentorship in UX/UI design and portfolio development.',
                skills: 'Design,Sketch,Photoshop,Creativity,Problem Solving',
                avatar: '/uploads/avatars/ryan.jpg',
                hourlyRate: 0,
                isActive: 1,
                emailVerified: 1,
                phone: '+1-555-0203',
                timezone: 'America/Chicago',
                education: 'Bachelor of Arts in Graphic Design',
                institution: 'Art Institute of Chicago',
                current_pursuit: 'Freelance Designer seeking full-time UX role',
                languages: 'English,Korean',
                subjects: 'UX/UI Design,Graphic Design,Portfolio Development',
                qualifications: 'Adobe Photoshop Certified',
                profile_picture: '/uploads/profiles/ryan-profile.jpg',
                upi_id: null
            },
            {
                id: 'mentee_4',
                firstName: 'Sophia',
                lastName: 'Martinez',
                email: 'sophia.martinez@email.com',
                password: hashedPassword,
                role: 'mentee',
                bio: 'Mathematics graduate interested in data science and machine learning. Looking for hands-on guidance and project experience.',
                skills: 'Mathematics,Statistics,R,Excel,Learning',
                avatar: './uploads/avatars/sophia.jpg',
                hourlyRate: 0,
                isActive: 1,
                emailVerified: 1,
                phone: '+1-555-0204',
                timezone: 'America/Denver',
                education: 'Bachelor of Science in Mathematics',
                institution: 'University of Colorado Boulder',
                current_pursuit: 'Data Analyst seeking ML career transition',
                languages: 'English,Spanish',
                subjects: 'Data Science,Machine Learning,Statistics,Python',
                qualifications: 'Microsoft Excel Expert Certified',
                profile_picture: '/uploads/profiles/sophia-profile.jpg',
                upi_id: null
            },
            {
                id: 'mentee_5',
                firstName: 'James',
                lastName: 'Wilson',
                email: 'james.wilson@email.com',
                password: hashedPassword,
                role: 'mentee',
                bio: 'Self-taught developer with basic knowledge of web technologies. Seeking structured guidance to advance skills.',
                skills: 'HTML,CSS,Basic JavaScript,Git,Learning',
                avatar: '/uploads/avatars/james.jpg',
                hourlyRate: 0,
                isActive: 1,
                emailVerified: 1,
                phone: '+1-555-0205',
                timezone: 'America/New_York',
                education: 'High School Diploma, Self-taught Programming',
                institution: 'Online Learning Platforms (freeCodeCamp, Udemy)',
                current_pursuit: 'Junior Developer Job Seeker',
                languages: 'English',
                subjects: 'Web Development,JavaScript,Frontend Development',
                qualifications: 'freeCodeCamp Responsive Web Design Certificate',
                profile_picture: '/uploads/profiles/james-profile.jpg',
                upi_id: null
            }
        ];

        // Admin user
        const admin = {
            id: 'admin_1',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@mentorlink.com',
            password: hashedPassword,
            role: 'admin',
            bio: 'Platform administrator',
            skills: 'Administration,Management',
            avatar: '/uploads/avatars/admin.jpg',
            hourlyRate: 0,
            isActive: 1,
            emailVerified: 1,
            phone: '+1-555-0001',
            timezone: 'America/New_York',
            education: 'Master of Business Administration',
            institution: 'Administrative University',
            current_pursuit: 'Platform Administrator',
            languages: 'English',
            subjects: 'Platform Management,Administration',
            qualifications: 'Certified Platform Administrator',
            profile_picture: '/uploads/profiles/admin-profile.jpg',
            upi_id: 'admin@upi'
        };

        this.users = [...mentors, ...mentees, admin];
        
        // Add timestamps and settings
        const now = new Date().toISOString();
        this.users.forEach(user => {
            user.created_at = now;
            user.updated_at = now;
            user.settings = JSON.stringify({
                emailNotifications: true,
                pushNotifications: true,
                theme: 'light'
            });
            user.lastLogin = null;
        });

        return this.users;
    }

    // Generate mentor-mentee relationships
    async generateRelationships() {
        const now = new Date().toISOString();

        this.relationships = [
            {
                id: 'rel_1',
                mentorId: 'mentor_1',
                menteeId: 'mentee_1',
                status: 'active',
                createdAt: now,
                updatedAt: now
            },
            {
                id: 'rel_2',
                mentorId: 'mentor_2',
                menteeId: 'mentee_2',
                status: 'active',
                createdAt: now,
                updatedAt: now
            },
            {
                id: 'rel_3',
                mentorId: 'mentor_3',
                menteeId: 'mentee_3',
                status: 'active',
                createdAt: now,
                updatedAt: now
            },
            {
                id: 'rel_4',
                mentorId: 'mentor_4',
                menteeId: 'mentee_4',
                status: 'active',
                createdAt: now,
                updatedAt: now
            },
            {
                id: 'rel_5',
                mentorId: 'mentor_1',
                menteeId: 'mentee_5',
                status: 'active',
                createdAt: now,
                updatedAt: now
            }
        ];

        return this.relationships;
    }

    // Generate sample sessions
    async generateSessions() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const lastWeek = new Date(now);
        lastWeek.setDate(lastWeek.getDate() - 7);

        const createdAt = new Date().toISOString();

        this.sessions = [
            // Completed sessions
            {
                id: 'session_1',
                mentorId: 'mentor_1',
                menteeId: 'mentee_1',
                title: 'React Fundamentals Discussion',
                description: 'Learn React basics, components, and state management',
                scheduledAt: lastWeek.toISOString(),
                duration: 60,
                amount: 75,
                status: 'completed',
                actualStartTime: lastWeek.toISOString(),
                actualEndTime: new Date(lastWeek.getTime() + 60 * 60 * 1000).toISOString(),
                notes: 'Great session! Alex showed good understanding of components.',
                summary: 'Covered React components, props, and basic state management',
                cancellationReason: null,
                rescheduleReason: null,
                paymentStatus: 'paid',
                createdAt,
                updatedAt: createdAt
            },
            {
                id: 'session_2',
                mentorId: 'mentor_2',
                menteeId: 'mentee_2',
                title: 'Product Strategy Workshop',
                description: 'Discuss product roadmap and market analysis',
                scheduledAt: lastWeek.toISOString(),
                duration: 90,
                amount: 135,
                status: 'completed',
                actualStartTime: lastWeek.toISOString(),
                actualEndTime: new Date(lastWeek.getTime() + 90 * 60 * 1000).toISOString(),
                notes: 'Excellent progress on understanding market research',
                summary: 'Reviewed competitive analysis and product positioning',
                cancellationReason: null,
                rescheduleReason: null,
                paymentStatus: 'paid',
                createdAt,
                updatedAt: createdAt
            },
            // Upcoming sessions
            {
                id: 'session_3',
                mentorId: 'mentor_3',
                menteeId: 'mentee_3',
                title: 'Portfolio Review Session',
                description: 'Review design portfolio and provide feedback',
                scheduledAt: tomorrow.toISOString(),
                duration: 60,
                amount: 65,
                status: 'upcoming',
                actualStartTime: null,
                actualEndTime: null,
                notes: null,
                summary: null,
                cancellationReason: null,
                rescheduleReason: null,
                paymentStatus: 'pending',
                createdAt,
                updatedAt: createdAt
            },
            {
                id: 'session_4',
                mentorId: 'mentor_4',
                menteeId: 'mentee_4',
                title: 'Python Data Analysis Tutorial',
                description: 'Hands-on session with pandas and matplotlib',
                scheduledAt: nextWeek.toISOString(),
                duration: 120,
                amount: 170,
                status: 'upcoming',
                actualStartTime: null,
                actualEndTime: null,
                notes: null,
                summary: null,
                cancellationReason: null,
                rescheduleReason: null,
                paymentStatus: 'pending',
                createdAt,
                updatedAt: createdAt
            },
            {
                id: 'session_5',
                mentorId: 'mentor_1',
                menteeId: 'mentee_5',
                title: 'JavaScript Best Practices',
                description: 'Learn clean code principles and ES6 features',
                scheduledAt: nextWeek.toISOString(),
                duration: 60,
                amount: 75,
                status: 'upcoming',
                actualStartTime: null,
                actualEndTime: null,
                notes: null,
                summary: null,
                cancellationReason: null,
                rescheduleReason: null,
                paymentStatus: 'pending',
                createdAt,
                updatedAt: createdAt
            }
        ];

        return this.sessions;
    }

    // Generate sample requests
    async generateRequests() {
        const now = new Date().toISOString();

        const requests = [
            {
                id: 'req_1',
                mentorId: 'mentor_2',
                menteeId: 'mentee_1',
                message: 'Hi! I\'m interested in learning about product management transitioning from engineering. Would you be willing to mentor me?',
                goals: 'Learn product strategy, user research, and roadmap planning',
                preferredSchedule: 'Weekday evenings, flexible on weekends',
                status: 'pending',
                createdAt: now,
                updatedAt: now
            },
            {
                id: 'req_2',
                mentorId: 'mentor_4',
                menteeId: 'mentee_1',
                message: 'I\'m a software developer interested in getting into machine learning. Could you help guide me?',
                goals: 'Build ML projects, learn Python for data science',
                preferredSchedule: 'Weekend mornings work best for me',
                status: 'pending',
                createdAt: now,
                updatedAt: now
            }
        ];

        return requests;
    }

    // Generate sample reviews
    async generateReviews() {
        const now = new Date().toISOString();

        const reviews = [
            {
                id: 'review_1',
                mentorId: 'mentor_1',
                menteeId: 'mentee_1',
                sessionId: 'session_1',
                rating: 5,
                comment: 'Sarah is an excellent mentor! She explained React concepts clearly and provided great practical examples.',
                createdAt: now,
                updatedAt: now
            },
            {
                id: 'review_2',
                mentorId: 'mentor_2',
                menteeId: 'mentee_2',
                sessionId: 'session_2',
                rating: 5,
                comment: 'Michael\'s product strategy insights were incredibly valuable. He helped me think about markets in a new way.',
                createdAt: now,
                updatedAt: now
            }
        ];

        return reviews;
    }

    // Generate sample notifications
    async generateNotifications() {
        const now = new Date().toISOString();

        const notifications = [
            {
                id: 'notif_1',
                userId: 'mentee_1',
                type: 'session_reminder',
                title: 'Upcoming Session Reminder',
                message: 'You have a session with Sarah Johnson tomorrow at 2:00 PM',
                data: JSON.stringify({ sessionId: 'session_3', mentorName: 'Sarah Johnson' }),
                isRead: 0,
                createdAt: now
            },
            {
                id: 'notif_2',
                userId: 'mentor_1',
                type: 'new_request',
                title: 'New Mentoring Request',
                message: 'Alex Thompson has sent you a mentoring request',
                data: JSON.stringify({ requestId: 'req_1', menteeName: 'Alex Thompson' }),
                isRead: 0,
                createdAt: now
            },
            {
                id: 'notif_3',
                userId: 'mentor_2',
                type: 'session_completed',
                title: 'Session Completed',
                message: 'Your session with Jessica Davis has been marked as completed',
                data: JSON.stringify({ sessionId: 'session_2', menteeName: 'Jessica Davis' }),
                isRead: 1,
                createdAt: now
            }
        ];

        return notifications;
    }

    // Generate sample activity logs
    async generateActivityLogs() {
        const now = new Date().toISOString();

        const activities = [
            {
                id: 'activity_1',
                userId: 'mentee_1',
                type: 'session_completed',
                description: 'Completed session: React Fundamentals Discussion',
                data: JSON.stringify({ sessionId: 'session_1', duration: 60 }),
                createdAt: now
            },
            {
                id: 'activity_2',
                userId: 'mentor_1',
                type: 'session_completed',
                description: 'Conducted session: React Fundamentals Discussion',
                data: JSON.stringify({ sessionId: 'session_1', menteeName: 'Alex Thompson' }),
                createdAt: now
            },
            {
                id: 'activity_3',
                userId: 'mentee_2',
                type: 'profile_updated',
                description: 'Updated profile information',
                data: JSON.stringify({ fields: ['bio', 'skills'] }),
                createdAt: now
            },
            {
                id: 'activity_4',
                userId: 'mentee_3',
                type: 'session_scheduled',
                description: 'Scheduled session: Portfolio Review Session',
                data: JSON.stringify({ sessionId: 'session_3', mentorName: 'Emma Williams' }),
                createdAt: now
            }
        ];

        return activities;
    }

    // Seed the database
    async seedDatabase() {
        console.log('Starting database seeding...');

        try {
            // Ensure DB is initialized
            if (typeof db.initialize === 'function') {
                await db.initialize();
            }

            // Clear existing data
            await this.clearDatabase();

            // Generate all data
            const users = await this.generateUsers();
            const relationships = await this.generateRelationships();
            const sessions = await this.generateSessions();
            const requests = await this.generateRequests();
            const reviews = await this.generateReviews();
            const notifications = await this.generateNotifications();
            const activities = await this.generateActivityLogs();

            // Insert users
            console.log('Inserting users...');
            for (const user of users) {
                await db.run(
                    `INSERT INTO users (
                        id, firstName, lastName, email, password, role, bio, skills, 
                        avatar, hourlyRate, isActive, emailVerified, phone, timezone, 
                        settings, lastLogin, created_at, updated_at,
                        education, institution, current_pursuit, languages, subjects,
                        qualifications, profile_picture, upi_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        user.id, user.firstName, user.lastName, user.email, user.password,
                        user.role, user.bio, user.skills, user.avatar, user.hourlyRate,
                        user.isActive, user.emailVerified, user.phone, user.timezone,
                        user.settings, user.lastLogin, user.created_at, user.updated_at,
                        user.education, user.institution, user.current_pursuit, user.languages,
                        user.subjects, user.qualifications, user.profile_picture, user.upi_id
                    ]
                );
            }

            // Insert relationships
            console.log('Inserting mentor-mentee relationships...');
            for (const rel of relationships) {
                await db.run(
                    `INSERT INTO mentor_mentee_relationships (id, mentorId, menteeId, status, createdAt, updatedAt) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [rel.id, rel.mentorId, rel.menteeId, rel.status, rel.createdAt, rel.updatedAt]
                );
            }

            // Insert sessions
            console.log('Inserting sessions...');
            for (const session of sessions) {
                await db.run(
                    `INSERT INTO mentoring_sessions (
                        id, mentorId, menteeId, title, description, scheduledAt, duration, 
                        amount, status, actualStartTime, actualEndTime, notes, summary, 
                        cancellationReason, rescheduleReason, paymentStatus, createdAt, updatedAt
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        session.id, session.mentorId, session.menteeId, session.title,
                        session.description, session.scheduledAt, session.duration, session.amount,
                        session.status, session.actualStartTime, session.actualEndTime,
                        session.notes, session.summary, session.cancellationReason,
                        session.rescheduleReason, session.paymentStatus,
                        session.createdAt, session.updatedAt
                    ]
                );
            }

            // Insert requests
            console.log('Inserting requests...');
            for (const req of requests) {
                await db.run(
                    `INSERT INTO mentoring_requests (id, mentorId, menteeId, message, goals, preferredSchedule, status, createdAt, updatedAt)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [req.id, req.mentorId, req.menteeId, req.message, req.goals, req.preferredSchedule, req.status, req.createdAt, req.updatedAt]
                );
            }

            // Insert reviews
            console.log('Inserting reviews...');
            for (const review of reviews) {
                await db.run(
                    `INSERT INTO reviews (id, mentorId, menteeId, sessionId, rating, comment, createdAt, updatedAt)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [review.id, review.mentorId, review.menteeId, review.sessionId, review.rating, review.comment, review.createdAt, review.updatedAt]
                );
            }

            // Insert notifications
            console.log('Inserting notifications...');
            for (const notif of notifications) {
                await db.run(
                    `INSERT INTO notifications (id, userId, type, title, message, data, isRead, createdAt)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [notif.id, notif.userId, notif.type, notif.title, notif.message, notif.data, notif.isRead, notif.createdAt]
                );
            }

            // Insert activity logs
            console.log('Inserting activity logs...');
            for (const activity of activities) {
                await db.run(
                    `INSERT INTO activity_logs (id, userId, type, description, data, createdAt)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [activity.id, activity.userId, activity.type, activity.description, activity.data, activity.createdAt]
                );
            }

            console.log('Database seeding completed successfully!');
            console.log(`Seeded ${users.length} users, ${sessions.length} sessions, ${relationships.length} relationships`);
            
            return {
                success: true,
                stats: {
                    users: users.length,
                    sessions: sessions.length,
                    relationships: relationships.length,
                    requests: requests.length,
                    reviews: reviews.length,
                    notifications: notifications.length,
                    activities: activities.length
                }
            };

        } catch (error) {
            console.error('Error seeding database:', error);
            throw error;
        }
    }

    // Clear existing data
    async clearDatabase() {
        console.log('Clearing existing data...');
        const tables = [
            'activity_logs',
            'notifications', 
            'reviews',
            'mentoring_requests',
            'mentoring_sessions',
            'mentor_mentee_relationships',
            'security_events',
            'password_reset_tokens',
            'users'
        ];

        for (const table of tables) {
            await db.run(`DELETE FROM ${table}`);
        }
    }
}

// Export for use in other files
module.exports = SeedData;

// Run seeding if called directly
if (require.main === module) {
    const seeder = new SeedData();
    seeder.seedDatabase()
        .then((result) => {
            console.log('Seeding completed:', result);
            process.exit(0);
        })
        .catch((error) => {
            console.error('Seeding failed:', error);
            process.exit(1);
        });
}
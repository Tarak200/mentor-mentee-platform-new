# Google OAuth Setup Guide

To enable Google OAuth login for the mentor-mentee platform, follow these steps:

## 1. Create Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API for your project

## 2. Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type (for testing)
3. Fill in the required information:
   - App name: "Mentor-Mentee Platform"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes: `email`, `profile`, `openid`
5. Add test users (your email addresses for testing)

## 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback`
   - (Add your production domain when deploying)

## 4. Update Environment Variables

Copy the Client ID and Client Secret from the credentials page and update your `.env` file:

```env
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

## 5. Testing

1. Start your application: `npm start`
2. Go to the login page
3. Click "Continue with Google"
4. You should be redirected to Google's OAuth flow
5. After authorization, you'll be redirected back to your application

## Security Notes

- Keep your client secret private
- Only add trusted domains to authorized redirect URIs
- Consider using environment-specific credentials for development vs production
- For production, configure proper OAuth consent screen verification

## Troubleshooting

- **Error 400: redirect_uri_mismatch**: Check that your redirect URI in Google Console matches exactly
- **Error 403: access_blocked**: Make sure your email is added as a test user
- **Error: invalid_client**: Verify your client ID and secret are correct in the .env file

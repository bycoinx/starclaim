# Auth Testing Playbook (Emergent Google OAuth)

## Step 1: Create Test User & Session via Mongo
```
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Step 2: Test Backend API
```
curl -X GET "$REACT_APP_BACKEND_URL/api/auth/me" -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

## Step 3: Browser Testing
Use page.context.add_cookies with session_token cookie (domain, path=/, httpOnly=true, secure=true, sameSite=None).

## Checklist
- user_id custom UUID, _id excluded with `{"_id": 0}`
- session user_id matches user's user_id exactly
- API returns user data with user_id
- No redirect to login when auth'd

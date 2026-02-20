# RBAC Risk Evaluator - Frontend

Modern React frontend for the RBAC Risk Evaluator System.

## Features

✨ **Beautiful UI**
- Modern dark theme with glassmorphism
- Animated gradient backgrounds
- Responsive design
- Smooth transitions and micro-animations

🔐 **Authentication**
- Stunning login/register pages
- Session-based auth with cookies
- Protected routes
- Auto-redirect on auth changes

📊 **User Dashboard**
- Real-time risk monitoring
- Active sessions display
- Risk event history
- Security tips

🛡️ **Admin Panel** (Admin only)
- User management
- Role assignment
- Account locking/unlocking
- Session invalidation
- Risk monitoring per user

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **React Router** - Navigation
- **Axios** - HTTP client
- **Vanilla CSS** - Styling (no framework!)

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will open at **http://localhost:3000**

### 3. Backend Requirement

Make sure the Spring Boot backend is running on **http://localhost:8080**

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── Navbar.jsx          # Navigation bar
│   ├── context/
│   │   └── AuthContext.jsx     # Auth state management
│   ├── pages/
│   │   ├── Login.jsx           # Login page
│   │   ├── Register.jsx        # Registration page
│   │   ├── Dashboard.jsx       # User dashboard
│   │   ├── AdminPanel.jsx      # Admin panel
│   │   ├── Auth.css            # Auth pages styling
│   │   ├── Dashboard.css       # Dashboard styling
│   │   └── Admin.css           # Admin panel styling
│   ├── services/
│   │   └── api.js              # API service layer
│   ├── App.jsx                 # Main app component
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles
├── index.html
├── package.json
└── vite.config.js
```

## Available Routes

- `/` - Redirects to dashboard or login
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - User dashboard (protected)
- `/admin` - Admin panel (admin only)

## Default Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`

## Features by Page

### Login Page
- Beautiful gradient animated background
- Smooth form validation
- Loading states
- Error handling
- Info cards with feature highlights

### Register Page
- Similar stunning design
- Form validation
- Success feedback
- Auto-redirect to login

### Dashboard
- 4 stat cards with animations
- Real-time risk score display
- Active sessions table
- Risk events timeline
- Security tips
- Color-coded risk levels

### Admin Panel
- Split-view layout
- All users list with avatars
- User detail panel
- Role management buttons
- Account lock/unlock
- Session invalidation
- Per-user risk monitoring
- Active sessions list
- Risk events history

## Design System

### Colors
- Primary: Purple gradient (#667eea → #764ba2)
- Success: Green (#10b981)
- Warning: Orange (#f59e0b)
- Danger: Red (#ef4444)
- Info: Blue (#3b82f6)

### Effects
- Glassmorphism cards
- Animated gradient orbs
- Smooth hover transitions
- Fade-in animations
- Pulsing icons

## API Integration

All API calls are centralized in `src/services/api.js`:

```javascript
import { authAPI, userAPI, adminAPI, riskAPI } from './services/api';

// Examples:
await authAPI.login({ username, password });
await userAPI.getUserById(id);
await adminAPI.getAllUsers();
await riskAPI.getRiskStatus(userId);
```

## Build for Production

```bash
npm run build
```

Outputs to `dist/` directory.

## Environment Variables

The backend URL defaults to `http://localhost:8080`.

To change it, edit `src/services/api.js`:

```javascript
const API_BASE_URL = 'your-backend-url';
```

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Performance

- Lazy loading routes (can be implemented)
- Optimized re-renders with React Context
- CSS animations with GPU acceleration
- Efficient API calls with Promise.all

## Accessibility

- Semantic HTML
- Proper form labels
- Keyboard navigation support
- Color contrast ratios

## Responsive Design

- Mobile-first approach
- Breakpoints: 576px, 768px, 992px, 1200px
- Flexible grid layouts
- Touch-friendly buttons

## Tips

1. **Cookies:** Session cookies are automatically managed by Axios
2. **Logout:** Navbar logout button clears session
3. **Admin Access:** Login as admin to see admin panel
4. **Risk Demo:** Login from multiple "devices" (different User-Agents in Postman) to see risk evaluation

## Troubleshooting

### CORS Errors
- Ensure backend CORS is configured for `http://localhost:3000`
- Check `SecurityConfig.java` in backend

### Session Not Persisting
- Check browser cookies
- Verify `withCredentials: true` in axios config

### API Errors
- Check backend is running on port 8080
- Verify database is connected
- Check browser console for errors

## Next Steps

- [ ] Add loading skeletons
- [ ] Implement toast notifications
- [ ] Add charts for risk visualization
- [ ] Add export functionality for reports
- [ ] Implement dark/light theme toggle
- [ ] Add profile page
- [ ] Add password change functionality

---

**Built with ❤️ using React & Modern CSS**

*Premium UI for a premium security system*

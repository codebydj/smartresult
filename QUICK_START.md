# 🚀 SmartResult - Quick Start Guide

## 5-Minute Setup (Development)

### Step 1: Prerequisites Check

```bash
# Check Node.js
node --version  # Should be 16+

# Check npm
npm --version   # Should be 7+

# Start MongoDB locally or Docker
docker run -d -p 27017:27017 mongo:7.0
```

### Step 2: Install & Configure

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env (optional for development - defaults work)
# MONGODB_URI=mongodb://localhost:27017/smartresult
# JWT_SECRET=dev_secret_key_change_in_production
```

### Step 3: Run Application

```bash
npm run dev
```

### Step 4: Access

- 📱 Student Portal: http://localhost:3000
- 🔐 Admin Login: http://localhost:3000/admin-login.html
- 📊 Dashboard: http://localhost:3000/admin-dashboard.html (after login)

---

## Production Deployment (Choose One)

### Option A: Docker (Recommended)

```bash
# Build and run with MongoDB
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Option B: Render (Easiest Cloud)

1. Push code to GitHub
2. Go to https://render.com/
3. Click "New Web Service"
4. Connect GitHub repo
5. Set environment variables:
   ```
   MONGODB_URI=your_mongodb_atlas_url
   JWT_SECRET=your_secret_key
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin123
   ```
6. Deploy!

### Option C: Railway

1. Go to https://railway.app/
2. Create new project from GitHub
3. Add MongoDB plugin (auto-configured)
4. Set environment variables
5. Deploy!

### Option D: Heroku

```bash
heroku login
heroku create your-app-name
heroku addons:create mongolab:sandbox
heroku config:set JWT_SECRET=your_key
git push heroku main
```

---

## Test the Application

### Test Student Portal

1. Go to http://localhost:3000
2. Enter a PIN (e.g., "123456")
3. Click "Get Result"
4. See mock results

### Test Admin Features

1. Go to http://localhost:3000/admin-login.html
2. Click "Register here"
3. Create admin account:
   - Username: `testadmin`
   - Email: `admin@test.com`
   - Password: `Test@123`
4. Login with credentials
5. View dashboard with statistics

### Test PDF Download

1. Search for a result
2. Click "Download PDF" button
3. PDF with result details will download

---

## API Endpoints (cURL Examples)

### Get Result

```bash
curl http://localhost:3000/api/v1/result?pin=123456
```

### Admin Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Get Dashboard (with token)

```bash
curl http://localhost:3000/api/v1/admin/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Environment Variables Explained

```env
# Server
PORT=3000                              # Server port
NODE_ENV=development                   # development or production

# Database
MONGODB_URI=mongodb://localhost:27017/smartresult

# Security
JWT_SECRET=your_super_secret_key       # Change this in production!
JWT_EXPIRE=7d                          # Token expiration time

# Admin (for first-time setup)
ADMIN_USERNAME=admin                   # Default admin username
ADMIN_PASSWORD=admin123                # Default admin password
```

---

## Monitoring & Logs

### View Application Logs

```bash
# Local
npm run dev

# Docker
docker-compose logs -f app

# Production (Render)
View in Render dashboard > Services > Logs
```

### Health Check

```bash
curl http://localhost:3000/health
# Response: {"status":"OK","timestamp":"2024-02-22T..."}
```

---

## Performance Tips

1. **Database**
   - Use MongoDB Atlas for production
   - Enable auto-scaling

2. **Caching**
   - Results are indexed for fast queries
   - Consider Redis for frequently accessed data

3. **Rate Limiting**
   - Default: 30 requests/minute per IP
   - Adjust in `server.js` if needed

4. **Static Files**
   - Use CDN for `public/` folder in production
   - CloudflarePages, Netlify, or AWS S3

---

## Security Checklist

- ✅ Change `JWT_SECRET` in production
- ✅ Use strong `ADMIN_PASSWORD`
- ✅ Enable HTTPS in production (automatic on Render/Railway)
- ✅ Regular MongoDB backups
- ✅ Keep dependencies updated
- ✅ Monitor error logs

---

## Troubleshooting

| Issue                    | Solution                                       |
| ------------------------ | ---------------------------------------------- |
| Port 3000 already in use | Change `PORT` in `.env`                        |
| MongoDB connection error | Ensure MongoDB running: `docker-compose up -d` |
| 401 Unauthorized         | Check JWT token validity and JWT_SECRET        |
| Results not appearing    | Check MongoDB MONGODB_URI connection string    |
| Puppeteer hangs          | Increase Heroku dyno size or use railway       |

---

## File Structure Quick Reference

```
smartresult/
├── config/           # Config files (database.js)
├── controllers/      # Business logic
├── middleware/       # Auth, error handling
├── models/          # MongoDB schemas
├── routes/          # API routes
├── services/        # Scraping, parsing logic
├── utils/           # Helper functions
├── public/          # Frontend files
└── server.js        # Main entry point
```

---

## Next Steps

1. **Customize**: Edit scraping logic in `services/scraperService.js`
2. **Brand**: Update styles in `public/style.css`
3. **Database**: Connect to MongoDB Atlas for production
4. **Deploy**: Push to Render/Railway
5. **Monitor**: Set up error tracking (Sentry, etc.)

---

## Support

- 📖 Full documentation: [README_PRODUCTION.md](./README_PRODUCTION.md)
- 🐛 Bug reports: GitHub Issues
- 💬 Questions: Check API docs in README_PRODUCTION.md

---

**Happy deploying! 🚀**

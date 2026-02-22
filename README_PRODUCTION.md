# SmartResult - Professional Student Portal

A production-ready full-stack web application for scraping and displaying student academic results. Built with Node.js, Express, MongoDB, and React with modern UI components.

## 🚀 Features

### Core Features

- **Result Scraping**: Automated scraping of student results from external sources
- **MongoDB Integration**: Store and manage search history
- **Admin Authentication**: Secure JWT-based admin system
- **PDF Generation**: Download results as PDF
- **SGPA Analytics**: Visual graph representation of semester-wise SGPA
- **Responsive UI**: Bootstrap 5 with modern design

### Admin Features

- **Dashboard**: Comprehensive statistics and analytics
- **Search History**: Track all student searches
- **Result Management**: View and manage all stored results
- **Quick Insights**: Statistics on unique students, average CGPA, etc.
- **Data Export**: Export search history as PDF

## 📋 Tech Stack

**Backend:**

- Node.js & Express.js
- MongoDB & Mongoose
- Puppeteer (Web Scraping)
- JWT Authentication
- BCrypt (Password Hashing)
- PDFKit (PDF Generation)

**Frontend:**

- HTML5
- Bootstrap 5
- Chart.js (Data Visualization)
- Vanilla JavaScript (No framework dependencies)

**Deployment:**

- Docker & Docker Compose
- Render/Railway ready
- Environment variable configuration

## 🔧 Installation & Setup

### Prerequisites

- Node.js 16+
- MongoDB 5.0+
- npm or yarn

### Local Development Setup

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/smartresult.git
cd smartresult
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/smartresult
JWT_SECRET=your_secret_key_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

4. **Start MongoDB**

```bash
# Using Docker
docker run -d -p 27017:27017 mongo:7.0

# Or if installed locally
mongod
```

5. **Run the application**

```bash
# Development mode
npm run dev

# Production mode
npm start
```

6. **Access the application**

- Student Portal: http://localhost:3000
- Admin Login: http://localhost:3000/admin-login.html
- Admin Dashboard: http://localhost:3000/admin-dashboard.html

### Docker Setup (Recommended)

1. **Using Docker Compose**

```bash
docker-compose up -d
```

This will start:

- MongoDB on port 27017
- Application on port 3000

2. **Stop services**

```bash
docker-compose down
```

## 📚 Project Structure

```
smartresult/
├── config/
│   └── database.js          # MongoDB configuration
├── controllers/
│   ├── authController.js    # Admin authentication
│   ├── resultController.js  # Result management
│   └── dashboardController.js # Dashboard statistics
├── middleware/
│   ├── auth.js              # JWT verification
│   └── errorHandler.js      # Error handling
├── models/
│   ├── Admin.js             # Admin schema
│   └── Result.js            # Result schema
├── routes/
│   └── v1.js                # API v1 routes
├── services/
│   ├── scraperService.js    # Web scraping logic
│   └── parserService.js     # HTML parsing
├── utils/
│   ├── jwt.js               # JWT utilities
│   └── pdfGenerator.js      # PDF generation
├── public/
│   ├── index.html           # Student portal
│   ├── admin-login.html     # Admin login
│   ├── admin-dashboard.html # Admin dashboard
│   ├── app.js               # Student portal JS
│   ├── admin-auth.js        # Admin auth JS
│   ├── admin-dashboard.js   # Dashboard JS
│   └── style.css            # Global styles
├── .env.example             # Environment template
├── .env                     # Environment variables
├── docker-compose.yml       # Docker configuration
├── Dockerfile               # Container image
├── Procfile                 # Deployment configuration
├── package.json             # Dependencies
└── server.js                # Main application
```

## 🔐 API Documentation

### Public Endpoints

#### Get/Scrape Result

```http
GET /api/v1/result?pin=123456
POST /api/v1/result
Content-Type: application/json

{
  "pin": "123456"
}
```

Response:

```json
{
  "message": "Result fetched and stored successfully",
  "data": {
    "pin": "123456",
    "name": "John Doe",
    "semesters": [...],
    "overallCGPA": "7.5"
  }
}
```

#### Download PDF

```http
GET /api/v1/result/:pin/download-pdf
```

### Authentication Endpoints

#### Register Admin

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "admin",
  "email": "admin@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

#### Login Admin

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

Response includes JWT token to be used in Authorization header.

### Protected Endpoints (Requires JWT)

#### Get Admin Profile

```http
GET /api/v1/admin/profile
Authorization: Bearer {token}
```

#### Get Dashboard Statistics

```http
GET /api/v1/admin/dashboard
Authorization: Bearer {token}
```

#### Get Search History

```http
GET /api/v1/admin/search-history?page=1&limit=20
Authorization: Bearer {token}
```

#### Get All Results

```http
GET /api/v1/admin/results?page=1&limit=20&pin=123456
Authorization: Bearer {token}
```

#### Get SGPA Graph Data

```http
GET /api/v1/admin/graph/sgpa?pin=123456
Authorization: Bearer {token}
```

## 🚀 Deployment

### Deploy to Render

1. **Create account on Render**
   - Visit https://render.com/

2. **Connect GitHub repository**
   - Link your GitHub account
   - Select this repository

3. **Create Web Service**
   - Select "Web Service"
   - Choose Node.js runtime
   - Set build command: `npm install`
   - Set start command: `npm start`

4. **Environment Variables**
   - Add `MONGODB_URI`: MongoDB Atlas connection string
   - Add `JWT_SECRET`: Strong secret key
   - Add `NODE_ENV`: `production`
   - Add `ADMIN_USERNAME`: Admin username
   - Add `ADMIN_PASSWORD`: Admin password

5. **Deploy**
   - Click "Deploy"
   - Service will start automatically

### Deploy to Railway

1. **Create account on Railway**
   - Visit https://railway.app/

2. **Connect GitHub**
   - Authorize Railway to access your GitHub

3. **Create New Project**
   - Select "Deploy from GitHub repo"
   - Select this repository

4. **Add MongoDB**
   - Add MongoDB plugin from Railway
   - Variable will auto-populate: `MONGODB_URL`

5. **Set Environment Variables**
   - `JWT_SECRET`: Your secret key
   - `ADMIN_USERNAME`: Admin username
   - `ADMIN_PASSWORD`: Admin password
   - `NODE_ENV`: production

6. **Deploy**
   - Railway will automatically deploy

### Deploy to Heroku

1. **Install Heroku CLI**

```bash
npm install -g heroku
heroku login
```

2. **Create Heroku app**

```bash
heroku create your-app-name
```

3. **Add MongoDB**

```bash
heroku addons:create mongolab:sandbox
```

4. **Set environment variables**

```bash
heroku config:set JWT_SECRET=your_secret_key
heroku config:set ADMIN_USERNAME=admin
heroku config:set ADMIN_PASSWORD=admin123
```

5. **Deploy**

```bash
git push heroku main
```

6. **View logs**

```bash
heroku logs --tail
```

## 🔍 Usage Guide

### For Students

1. **Access Portal**
   - Go to http://localhost:3000 (or your deployed URL)

2. **Enter PIN**
   - Enter your student PIN
   - Click "Get Result"

3. **View Results**
   - See your academic performance
   - View semester-wise breakdown
   - Check grades and SGPA

4. **Download PDF**
   - Click "Download PDF" button
   - Save to your device

### For Admins

1. **Login**
   - Go to Admin Login page
   - Enter credentials
   - Or register if first-time setup

2. **Access Dashboard**
   - View overall statistics
   - See semester-wise analytics
   - Check unique students count

3. **Search History**
   - View all student searches
   - Search by PIN
   - Paginate through results

4. **Export Data**
   - Download individual results as PDF
   - Manage search history

## 🐛 Troubleshooting

### MongoDB Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution**: Ensure MongoDB is running

```bash
# macOS
brew services start mongodb-community

# Windows
net start MongoDB

# Docker
docker-compose up -d
```

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**: Change PORT in `.env` or kill process on port 3000

```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>
```

### JWT Token Expired

**Solution**: Login again to get a new token

### Puppeteer Issues on Heroku/Railway

**Already handled** - Puppeteer is configured for headless deployment

## 📈 Performance Optimization

- **Database Indexing**: Applied on frequently queried fields
- **Rate Limiting**: 30 requests per minute per IP
- **Caching**: Consider implementing Redis for frequently accessed data
- **CDN**: Deploy static assets to CDN for faster delivery

## 🔒 Security Features

- **Password Hashing**: BCrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Helmet.js**: Security HTTP headers
- **CORS**: Cross-origin resource sharing controlled
- **Rate Limiting**: DDoS protection
- **Input Validation**: Express-validator for all inputs
- **SQL Injection**: Protected (using Mongoose ORM)

## 📞 Support & Contribution

- **Issues**: Report bugs on GitHub Issues
- **Pull Requests**: Submit improvements via PR
- **Email**: support@example.com

## 📄 License

MIT License - See LICENSE file

## 🎯 Future Enhancements

- [ ] Student account system with saved results
- [ ] Email notifications for new results
- [ ] Advanced analytics and predictions
- [ ] Mobile app (React Native)
- [ ] Real-time notifications
- [ ] Batch result export
- [ ] Multi-language support
- [ ] Dark mode UI

## 📝 Changelog

### v2.0.0 (Current)

- Complete rewrite with MongoDB integration
- Admin authentication system
- Dashboard with analytics
- PDF generation
- Docker support

### v1.0.0 (Legacy)

- Basic result scraping
- Simple HTML interface

---

**Made with ❤️ by SmartResult Team**

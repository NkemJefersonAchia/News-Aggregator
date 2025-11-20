# NewsWire - Professional News Aggregator

[![GNews API](https://img.shields.io/badge/API-GNews-blue)](https://gnews.io/)
[![Status](https://img.shields.io/badge/Status-Production-green)]()

A sophisticated, newspaper-inspired news aggregator that provides real-time access to global headlines through an elegant, user-friendly interface. Built with modern web technologies and powered by the GNews API.

## 🎯 Project Purpose

NewsWire serves as a comprehensive news aggregation platform that addresses the real need for consolidated, categorized news consumption. Unlike simple entertainment apps, it provides:

- **Real-time News**: Access to current global headlines across multiple categories
- **Smart Filtering**: Search and categorize news by topic, category, and source
- **Personalization**: Save articles for later reading with persistent storage
- **Professional UI**: Clean, newspaper-inspired design optimized for readability
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile devices

## ✨ Features

### Core Functionality
- 🔍 **Dynamic Search**: Search for news by any topic or keyword
- 📁 **Category Filtering**: Browse by General, World, Business, Technology, Sports, Science, Health, and more
- 💾 **Article Bookmarking**: Save articles for later reading with localStorage persistence
- 🎨 **Professional Design**: Classic newspaper aesthetic with modern UX principles
- ⚡ **Real-time Updates**: Fetch latest headlines on demand
- 📱 **Fully Responsive**: Optimized for all screen sizes

### User Interactions
- Search articles by custom keywords
- Filter by predefined news categories
- Sort through results with clean, readable layout
- Save/unsave articles with one click
- View saved articles in dedicated "Read Later" section
- Clear all saved articles with confirmation dialog

## 🛠️ Technologies Used

- **HTML5**: Semantic markup structure
- **CSS3**: Custom styling with modern design patterns
- **JavaScript (ES6+)**: Asynchronous API calls, DOM manipulation
- **TailwindCSS**: Utility-first CSS framework (CDN)
- **GNews API**: News data source
- **LocalStorage API**: Client-side data persistence

## 📋 Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- GNews API key (free tier available)
- Basic understanding of HTML/CSS/JavaScript
- Web server (for deployment)

## 🚀 Local Setup Instructions

### 1. Get Your API Key

1. Visit [GNews.io](https://gnews.io/)
2. Sign up for a free account
3. Navigate to your dashboard and copy your API key
4. Free tier provides: 100 requests/day

### 2. Clone or Download

```bash
# Clone repository
git clone <your-repo-url>
cd newswire

# Or download and extract ZIP file
```

### 3. Configure API Key

Open `script.js` and locate line 17:

```javascript
const API_KEY = "YOUR_API_KEY_HERE"; // <--- PASTE YOUR KEY HERE
```

Replace `"YOUR_API_KEY_HERE"` with your actual GNews API key:

```javascript
const API_KEY = "abc123def456ghi789"; // Your actual key
```

### 4. Run Locally

**Option A: Simple HTTP Server (Python)**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Option B: Node.js HTTP Server**
```bash
npm install -g http-server
http-server -p 8000
```

**Option C: VS Code Live Server**
- Install "Live Server" extension
- Right-click `index.html`
- Select "Open with Live Server"

### 5. Access Application

Open your browser and navigate to:
```
http://localhost:8000
```

## 🌐 Deployment Instructions

### Server Architecture
- **Web-01**: 3.86.143.160
- **Web-02**: 54.174.119.2
- **Load Balancer (lb-01)**: Distributes traffic between web servers

### Deployment Steps

#### 1. Prepare Application Files

```bash
# Create deployment directory
mkdir newswire-deploy
cd newswire-deploy

# Copy necessary files
cp index.html styles.css script.js .gitignore README.md newswire-deploy/
```

#### 2. Deploy to Web-01

```bash
# Connect to Web-01
ssh ubuntu@3.86.143.160

# Create application directory
sudo mkdir -p /var/www/newswire
sudo chown -R $USER:$USER /var/www/newswire

# Exit SSH
exit

# Transfer files from local machine
scp -r * ubuntu@3.86.143.160:/var/www/newswire/
```

#### 3. Configure Nginx on Web-01

```bash
# SSH back into Web-01
ssh ubuntu@3.86.143.160

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/newswire

# Add configuration:
server {
    listen 80;
    server_name 3.86.143.160;
    
    root /var/www/newswire;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    # Enable gzip compression
    gzip on;
    gzip_types text/css application/javascript text/html;
}

# Enable site and restart Nginx
sudo ln -s /etc/nginx/sites-available/newswire /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 4. Deploy to Web-02

```bash
# Repeat deployment process for Web-02
scp -r * ubuntu@54.174.119.2:/var/www/newswire/

# SSH into Web-02 and configure Nginx
ssh ubuntu@54.174.119.2
# Follow same Nginx configuration as Web-01 (change server_name to 54.174.119.2)
```

#### 5. Configure Load Balancer

```bash
# SSH into Load Balancer
ssh ubuntu@<lb-01-ip>

# Edit Nginx configuration
sudo nano /etc/nginx/sites-available/default

# Add upstream configuration:
upstream newswire_backend {
    least_conn;
    server 3.86.143.160:80 max_fails=3 fail_timeout=30s;
    server 54.174.119.2:80 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name <your-load-balancer-domain>;
    
    location / {
        proxy_pass http://newswire_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Health check
        proxy_next_upstream error timeout http_502 http_503 http_504;
    }
}

# Test and restart
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. Verify Deployment

```bash
# Test individual servers
curl http://3.86.143.160
curl http://54.174.119.2

# Test load balancer
curl http://<lb-01-ip>

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Load Balancer Testing

1. **Round-robin verification**: Refresh the app multiple times and check server logs to confirm requests are distributed
2. **Failover testing**: Stop Nginx on one server and verify the other handles all traffic
3. **Performance testing**: Use tools like Apache Bench or wrk to test under load

```bash
# Example load test
ab -n 1000 -c 10 http://<lb-01-ip>/
```

## 📁 Project Structure

```
newswire/
│
├── index.html          # Main HTML structure
├── styles.css          # Custom CSS styles
├── script.js           # Application logic and API calls
├── .gitignore          # Git ignore rules
├── README.md           # This file
└── demo/               # Demo video (not in repo)
```

## 🔧 Configuration

### API Rate Limits
- **Free Tier**: 100 requests/day
- **Pro Tier**: 50,000 requests/month

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Storage
- LocalStorage is used for saved articles
- Data persists across browser sessions
- Approximately 5-10MB storage limit per domain

## 🎨 Design Philosophy

The application follows a "digital newspaper" design language:

- **Typography**: Georgia serif font for readability
- **Color Palette**: Cream background (#f4f1ea) with high-contrast black text
- **Layout**: Grid-based, responsive design inspired by print media
- **Interactions**: Minimal, purposeful animations
- **Accessibility**: High contrast ratios, semantic HTML, keyboard navigation

## 🐛 Troubleshooting

### Common Issues

**Issue**: "Configuration Error" message on load
- **Solution**: Ensure API key is correctly pasted in `script.js` line 17

**Issue**: No articles loading
- **Solution**: Check browser console for API errors; verify API key is active and quota not exceeded

**Issue**: Images not loading
- **Solution**: Some news sources may have CORS restrictions; images gracefully degrade

**Issue**: LocalStorage not persisting
- **Solution**: Check browser settings allow localStorage; try clearing browser cache

**Issue**: Load balancer not distributing traffic
- **Solution**: Verify upstream configuration; check server health status in Nginx logs

## 🚧 Challenges Faced & Solutions

### 1. API Rate Limiting
**Challenge**: Free tier limited to 100 requests/day  
**Solution**: Implemented smart caching strategy and user feedback for quota exhaustion

### 2. CORS Issues with Images
**Challenge**: Some news sources block cross-origin image requests  
**Solution**: Added error handling to gracefully hide broken images

### 3. LocalStorage Size Limits
**Challenge**: Saving too many articles could exceed storage quota  
**Solution**: Minimal data storage (URL as unique identifier) and clear archive option

### 4. Load Balancer Session Persistence
**Challenge**: Saved articles not syncing across servers  
**Solution**: Client-side localStorage ensures consistency regardless of backend server

### 5. Responsive Design
**Challenge**: Newspaper layout challenging on mobile  
**Solution**: Flexbox and CSS Grid with mobile-first breakpoints

## 📊 API Usage

### GNews API Endpoints Used

**Top Headlines** (Default view)
```
GET https://gnews.io/api/v4/top-headlines?lang=en&token={API_KEY}
```

**Category Filter**
```
GET https://gnews.io/api/v4/top-headlines?lang=en&topic={category}&token={API_KEY}
```

**Custom Search**
```
GET https://gnews.io/api/v4/search?q={query}&lang=en&token={API_KEY}
```

### Response Structure
```json
{
  "totalArticles": 100,
  "articles": [
    {
      "title": "Article title",
      "description": "Article description",
      "content": "Full content...",
      "url": "https://example.com/article",
      "image": "https://example.com/image.jpg",
      "publishedAt": "2025-01-15T10:00:00Z",
      "source": {
        "name": "Source Name",
        "url": "https://source.com"
      }
    }
  ]
}
```

## 🙏 Credits & Attribution

- **GNews API**: News data provider - [https://gnews.io/](https://gnews.io/)
- **TailwindCSS**: Utility-first CSS framework - [https://tailwindcss.com/](https://tailwindcss.com/)
- **Font**: Georgia (system font) and Arial for sans-serif
- **Icons**: Unicode characters and CSS-based elements

## 📜 License

This project is created for educational purposes as part of a web development assignment.

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review GNews API documentation: [https://gnews.io/docs/v4](https://gnews.io/docs/v4)
3. Submit feedback through the assignment submission portal

## 🎥 Demo Video

[Link to demo video - Max 2 minutes]

**Demo covers**:
- Local setup and API configuration
- Searching and filtering news
- Saving and managing articles
- Deployment on web servers
- Load balancer demonstration

## ⚠️ Important Notes

- **Never commit API keys** to public repositories
- **Respect API rate limits** to avoid service disruption
- **Test thoroughly** before deployment
- **Monitor server logs** after deployment
- **Keep dependencies updated** for security

---

**Version**: 1.0.0  
**Last Updated**: March 2025  
**Author**: [Your Name]  
**Assignment**: Web Development - External API Integration  
**Deadline**: Saturday, March 29, 2025
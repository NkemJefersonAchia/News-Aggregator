# Tori Me - News Aggregator

A clean, minimalist news aggregation platform that brings you the latest headlines from around the world. Built with vanilla JavaScript and powered by the GNews API.

## Project Overview

Tori Me (pidgin for "tell me") is a straightforward news reader that helps users stay informed about current events. The application provides a simple interface for browsing news articles across different categories, with the ability to save interesting stories for later reading.

### Key Features

- Real-time news fetching from multiple categories
- Search functionality for specific topics
- Article bookmarking with persistent storage
- Clean, readable interface optimized for news consumption
- Fully responsive design for all devices
- Load-balanced deployment for high availability

## Technology Stack

- HTML5 for semantic structure
- CSS3 for styling and responsive design
- JavaScript (ES6+) for application logic
- GNews API for news data
- LocalStorage for client-side persistence
- Nginx for web server configuration
- HAProxy for load balancing

## Prerequisites

- Modern web browser (Chrome, Firefox, Safari, or Edge)
- GNews API key (available at https://gnews.io/)
- Text editor for configuration
- SSH access to deployment servers (for production deployment)

## Local Setup

### Step 1: Get Your API Key

1. Visit https://gnews.io/ and create a free account
2. Navigate to your dashboard and copy your API key
3. The free tier provides 100 requests per day

### Step 2: Clone the Repository

```bash
git clone https://github.com/NkemJefersonAchia/News-Aggregator.git
cd News-Aggregator
```

### Step 3: Configure Your API Key

Open `script.js` and locate line 1:

```javascript
const API_KEY = "YOUR_API_KEY_HERE";
```

Replace the placeholder with your actual GNews API key:

```javascript
const API_KEY = "abc123def456ghi789";
```

### Step 4: Run the Application

Simply open `index.html` in your web browser. The application will run directly from the file system.

For a better development experience, you can use any local web server. If you have VS Code installed, the Live Server extension works well.

## Project Structure

```
News-Aggregator/
├── index.html          # Main application structure
├── styles.css          # Application styling
├── script.js           # Core application logic
├── README.md           # Project documentation
└── .gitignore          # Git ignore rules
```

## Deployment Instructions

The application is deployed across multiple servers for reliability and performance.

### Server Configuration

- Web Server 1: 3.86.143.160
- Web Server 2: 54.174.119.2
- Load Balancer: 3.91.203.23
- Domain: nkem.tech

### Deploy to Web Servers

#### Web-01 Deployment

```bash
# Connect to the server
ssh ubuntu@3.86.143.160

# Create application directory
sudo mkdir -p /var/www/torime

# Clone repository
cd /var/www
sudo git clone https://github.com/NkemJefersonAchia/News-Aggregator.git torime
sudo chown -R ubuntu:ubuntu torime

# Configure Nginx
sudo nano /etc/nginx/sites-available/default
```

Add the following Nginx configuration:

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;
    
    add_header X-Served-By $hostname;

    root /var/www/torime;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
}
```

Test and restart Nginx:

```bash
sudo nginx -t
sudo systemctl restart nginx
exit
```

#### Web-02 Deployment

Repeat the same process on the second server:

```bash
ssh ubuntu@54.174.119.2

sudo mkdir -p /var/www/torime
cd /var/www
sudo git clone https://github.com/NkemJefersonAchia/News-Aggregator.git torime
sudo chown -R ubuntu:ubuntu torime

sudo nano /etc/nginx/sites-available/default
# Paste the same Nginx configuration

sudo nginx -t
sudo systemctl restart nginx
exit
```

### Load Balancer Configuration

```bash
# Connect to load balancer
ssh ubuntu@3.91.203.23

# Edit HAProxy configuration
sudo nano /etc/haproxy/haproxy.cfg
```

HAProxy configuration:

```
global
    log /dev/log local0
    log /dev/log local1 notice
    daemon

defaults
    log     global
    mode    http
    option  httplog
    timeout connect 5000
    timeout client  50000
    timeout server  50000

frontend http_in
    bind *:80
    default_backend servers

backend servers
    balance roundrobin
    server web01 3.86.143.160:80 check
    server web02 54.174.119.2:80 check
```

Test and restart HAProxy:

```bash
sudo haproxy -c -f /etc/haproxy/haproxy.cfg
sudo systemctl restart haproxy
exit
```

### Verify Deployment

Test individual web servers:

```bash
curl -I http://3.86.143.160 | grep X-Served-By
curl -I http://54.174.119.2 | grep X-Served-By
```

Test load balancer distribution:

```bash
for i in {1..6}; do
  echo "Request $i:"
  curl -sI http://3.91.203.23 | grep X-Served-By
done
```

Test domain:

```bash
curl http://nkem.tech
```

## Design Philosophy

The design takes inspiration from simple, clean web layouts with a focus on readability. The interface prioritizes content over decoration, with careful attention to typography and spacing. The color scheme uses a warm off-white background with high-contrast dark text for comfortable reading.

Design inspiration drawn from classic web design principles found on W3Schools and modern minimalist news sites.

## API Usage

### GNews API Endpoints

Top Headlines (default view):
```
https://gnews.io/api/v4/top-headlines?lang=en&apikey={API_KEY}
```

Category filtering:
```
https://gnews.io/api/v4/top-headlines?lang=en&topic={category}&apikey={API_KEY}
```

Custom search:
```
https://gnews.io/api/v4/search?q={query}&lang=en&apikey={API_KEY}
```

### API Rate Limits

- Free tier: 100 requests per day
- Pro tier: 50,000 requests per month

## Browser Compatibility

- Chrome 90 and above
- Firefox 88 and above
- Safari 14 and above
- Edge 90 and above

## Troubleshooting

### API Key Issues

If you see an error about the API key:
1. Open script.js
2. Verify your API key is on line 1
3. Check that the key is valid and active
4. Ensure you have not exceeded your daily request limit

### Nginx Not Working

```bash
ssh ubuntu@3.86.143.160
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

### HAProxy Not Balancing

```bash
ssh ubuntu@3.91.203.23
sudo haproxy -c -f /etc/haproxy/haproxy.cfg
sudo systemctl restart haproxy
sudo systemctl status haproxy
```

### Articles Not Loading

1. Check browser console for errors
2. Verify API key is correct
3. Check if daily API limit has been reached
4. Ensure internet connection is stable

## Challenges and Solutions

### Challenge 1: API Rate Limiting
The free tier of GNews API provides only 100 requests per day. To work within this constraint, the application focuses on efficient API calls and provides clear feedback when limits are reached.

### Challenge 2: Cross-Origin Image Loading
Some news sources block cross-origin image requests. The solution implemented gracefully handles image loading errors by hiding broken images rather than showing placeholder icons.

### Challenge 3: LocalStorage Management
Browser storage limits required careful consideration of what data to persist. The application stores only essential information (article URLs and metadata) rather than full content.

### Challenge 4: Load Balancer Session Consistency
Since saved articles are stored in browser LocalStorage, they remain consistent regardless of which backend server handles requests.

### Challenge 5: Responsive Layout
Creating a layout that works well on both desktop and mobile required careful use of CSS Grid and Flexbox, with particular attention to article card layouts and navigation elements.

## Credits

- GNews API: https://gnews.io/
- Design inspiration: W3Schools web design principles
- Development: Nkem Jeferson Achia

## Security Notes

- Never commit API keys to version control
- The .gitignore file excludes sensitive configuration
- API keys should be kept private and rotated regularly
- Always use HTTPS in production environments

## License

This project is created for educational purposes as part of a web development assignment.

## Author

Nkem Jeferson Achia

GitHub: https://github.com/NkemJefersonAchia

## Support

For issues or questions about the application, please check:
1. The troubleshooting section in this README
2. GNews API documentation at https://gnews.io/docs/v4
3. Browser console for error messages

---

Version: 1.0.0
Last Updated: March 2025
Status: Production
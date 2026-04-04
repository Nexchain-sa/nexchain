# netlify.toml — إعداد النشر التلقائي على Netlify
# ضع هذا الملف في مجلد frontend/

[build]
  base    = "frontend"
  command = "npm run build"
  publish = "build"

[build.environment]
  NODE_VERSION = "20"

# إعادة توجيه React Router
[[redirects]]
  from   = "/*"
  to     = "/index.html"
  status = 200

# Headers أمان
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options        = "DENY"
    X-XSS-Protection       = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy        = "strict-origin-when-cross-origin"

Fidial Netlify package

1. Upload to GitHub or unzip locally.
2. In Netlify:
   - Build command: npm run build
   - Publish directory: dist
3. Set environment variables:
   - STRATO_SMTP_HOST
   - STRATO_SMTP_PORT
   - STRATO_SMTP_USER=cs@fidial.nl
   - STRATO_SMTP_PASS
4. Redeploy.

Notes:
- The website form posts to /.netlify/functions/send-contact
- The function sends:
  - internal mail to cs@fidial.nl
  - auto-confirmation to the customer

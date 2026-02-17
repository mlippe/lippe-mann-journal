# #myownplaceonlinelikeinstagrambutwithoutmeta

I whished for something like instagram, where i can share my work online and get feedback from others. But I wanted to take control over each aspect of this, for example that I still own my content after posting it. Thats why I built this. I also plan to share some blog articles about side projects and other stuff that interests me and gets me writing. I tried [ghost.org](https://ghost.org/) earlier for this purpose, but it wasn't for me. I was looking for a media heavy blog with some text articles, not the other way around.

**This is a fork of the beautiful and extensive [photography-website by ECarry](https://github.com/ECarry/photography-website), I adjusted it based on my taste and needs. Please always refer to the [Readme](https://github.com/ECarry/photography-website#photography-website) from ECarry for further details.**

[My production version lives here.](https://journal.lippe-mann.de/)

## 🚀 Features

- **Instagram like experience and feel** people visiting your site know their way around
- **Next.js 16** with React 19 and React Compiler
- **TanStack Query v5** for advanced data fetching and caching
- **tRPC v11** for end-to-end type-safe APIs
- **Photo Management** with EXIF data extraction
- **Real-time Dashboard** with analytics and statistics
- **Modern UI** built with Tailwind CSS and shadcn/ui components
- **Authentication** powered by Better Auth
- **Database** using Drizzle ORM with PostgreSQL
- **File Storage** via S3-compatible storage

## 🛠️ Deployment guide

The setup of this was not as straightforward as I have guessed when first finding ECarrys repo. So I wrote this guide outlining exactly what I have done to get this up and running.

My setup:

- **Bun** runtime for scripts
- **npm** for futher development
- **PostgreSQL database** from Neon
- **S3-compatible storage** for image storage, I chose Cloudflare R2
- **Vercel** account for deployment

### Step 1: Clone and Setup

```bash
# Clone the repository
git clone https://github.com/mlippe/lippe-mann-journal
cd lippe-mann-journal

npm install
```

### Step 2: Environment Configuration

Create a `.env` file in the root directory:

Configure the following environment variables:

**!!! NEVER COMMIT ANY OF THE ENV CREDENTIALS YOU ARE ADDING BELOW !!!**
They should stay secret and on your machine only. (or in Vercel for deployment)

#### Database Configuration

```env
# PostgreSQL connection string
DATABASE_URL=postgresql://username:password@host:port/database_name?sslmode=require
```

I am using Neon, because it offers a good free tier and my supabase account is busy with other projects in the free tier. You can choose any other database, but your miles may vary with this setup...

1. Create account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string from dashboard

**If you use the same database for prod and dev, this stays the same for both environments.**

#### Authentication Configuration

This is for the accounts that can access the dashboard of your site a.k.a. allowing to post content to it. The project uses [Better-Auth](https://www.better-auth.com/), which is already set up except for the env credentials.

```env
# Generate a random secret key (32+ characters)
BETTER_AUTH_SECRET=your-super-secret-key-here

```

```env
# Your app's base URL
BETTER_AUTH_URL=https://your-domain.com (can be your own or just the vercel domain you get after deployment)
NEXT_PUBLIC_APP_URL=https://your-domain.com (can be your own or just the vercel domain you get after deployment)

```

**For local development, always use `http://localhost:3000` for these variables. For production, use your domain.**

#### S3-Compatible Storage Configuration

This is where your photo files will live. I use Cloudflare R2, which allows you to save 10GB of photos in the free tier. You can also use other providers, have a look in the [original Readme](https://github.com/ECarry/photography-website#photography-website) for this.

```env
# S3-compatible storage settings
S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
S3_BUCKET_NAME=your-bucket-name
S3_PUBLIC_URL=https://your-public-storage-domain.com
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
NEXT_PUBLIC_S3_PUBLIC_URL=https://your-public-storage-domain.com
```

**Setup Instructions for Cloudflare:**

1. Go to [cloudflare.com](https://www.cloudflare.com/) and create a new account (or use your exisiting one)
2. In the sidebar menu, go to "Storage and Databases" (Build) and then "R2 object storage"
3. Create a new bucket here, choose a name for the bucket and specifiy the data location. Be careful, you cannot change the buckets name after creation. Add the name to the `S3_BUCKET_NAME` env var.
4. Go back to "R2 object storage > Overview"
5. On the right hand side it should show "Account Details". Copy the S3 API url and add it to the `S3_ENDPOINT` env var.
6. While you're at it, create some API Tokens, which are needed for bucket access as well. Click "Manage" under "Account Details > API Token".
7. Create a new "Account API token", with the permissions "Object Read & Write". Make sure it is valid for the bucket you created in step 3 (bucket specifity).
8. Copy the "Access Key ID" to the env var `S3_ACCESS_KEY_ID` and the "Secret Access Key" to `S3_SECRET_ACCESS_KEY`. You can only view the page with these values once, so be sure to copy them directly.
9. Go back to your bucket under "Storage & Databases > R2 object storage > Overview" and open the bucket. Go to its settings.
10. Add a "Custom public domain" (see note below) or a "Public Development URL" (only good for testing). Add whichever you chose to `S3_PUBLIC_URL` and `NEXT_PUBLIC_S3_PUBLIC_URL`.
11. Add a "CORS Policy" to allow access from your frontend client:

```CORS
# CORS
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-domain.com (same as in NEXT_PUBLIC_APP_URL)"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ]
  }
]
```

12. We need to setup image transformation through cloudflare now. This is supported by the project and is cool as you can upload high res photos and dont worry about filesize and scaling to devices for delivery. So go "Media > Images > Transformations" in the sidebar. Add a zone / transformation. (I think this only works if you have added an own domain in step 10. Also read the note below.)
13. Make sure to add your `https://your-public-storage-domain.com` (same as in `S3_PUBLIC_URL`) to the allowed origins.
14. Phewww, you should be done with cloudflare for now.

**Note on the public S3 domain**

If you use cloudflare, you need to add a domain to your account, which is then managed through cloudflare and its DNS. This is required to use that domain for the public bucket (media) access. I did not want to transfer my main domain to cloudflare, as I have some services and sites tied to it and I was to lazy to move all that stuff.
My quick fix for this was to buy a new "storage domain" through cloudflare. You can do so in the "Domains" section of your account. It goes for some bucks a year, which I thought was worth it preventing the other hussle...

After buying it, I had to wait for some time before being able to use it as public bucket access domain. Cloudflare keept saying "This domain is not managed through cloudflare", even though it was marked as active in the domain section. If you experience the same, just give it some time and try again.

#### Admin User Configuration

This is the account which can access the dashboard and post content. You can add whatever credentials here, just make sure they are safe.

```env
# Default admin user for seeding
SEED_USER_EMAIL=your@email-address.com
SEED_USER_PASSWORD=your-secure-password
SEED_USER_NAME=Admin User / Your Name
```

### Step 3: Database Setup & Application start

If you do not yet have bun installed on your machine, [get it here.](https://bun.com/docs/installation)

```bash
# Push database schema
bun run db:push

# start application locally
npm run dev

# In a new terminal, create admin user
bun run seed:user
```

### Step 4: Test Locally

Visit `http://localhost:3000` to verify everything works correctly.

### Step 5: Deploy to Vercel

1. Create a new repository on your GitHub/GitLab/Bitbucket
2. Push your code to this repository
3. Connect your repository to Vercel
4. Configure environment variables in Vercel dashboard
5. Deploy automatically on push

#### Vercel Environment Variables Setup

In your Vercel dashboard, add all environment variables from your `.env` file:

1. Go to Project Settings > Environment Variables
2. Add each variable with appropriate values for production
3. Make sure to update URLs to use your production domain (you can leave them at `localhost` for the first deployment. just make sure to exchange them after you have deployed and vercel assigned you a \*.vercel.app domain)

### Step 6: Done

You should be able to see and use the site now.

### Performance Optimization

1. **Enable Vercel Analytics:**

   ```bash
   npm install @vercel/analytics
   ```

### Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files
   - Use strong, unique secrets
   - Rotate keys regularly

2. **Database Security:**
   - Use connection pooling
   - Enable SSL connections
   - Restrict database access by IP

3. **File Upload Security:**
   - Configure proper CORS settings
   - Implement file type validation
   - Set upload size limits

## 📱 Mobile Optimization

The application is fully responsive and optimized for mobile devices:

- **Progressive Web App** features
- **Touch-friendly** interface
- **Optimized images** with lazy loading
- **Fast loading** with Next.js optimizations

## 🐛 Troubleshooting

### Common Issues

#### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
bun install
```

#### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check database server status
- Ensure SSL settings match requirements

#### Image Upload Issues

- Verify S3 storage credentials
- Check CORS settings on your storage bucket
- Ensure bucket permissions are correct
- Verify endpoint URL is correct for your provider

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Better Auth Documentation](https://better-auth.com)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 💖 Support

If you find this project helpful, please give it a ⭐️ on GitHub!

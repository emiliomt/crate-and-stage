# Eu-ter-pe 🎵

> **Discover music through people, not algorithms**

A unified social platform that brings together your streaming habits, vinyl collection, and concert experiences in one beautiful place. Share your music taste with friends and discover new favorites through human curation.

## 🎯 The Problem

Music listeners today face fragmentation:
- One app for streaming (Spotify, Apple Music)
- Another for vinyl shopping (Discogs, local stores)
- Another for concert discovery (Bandsintown, Songkick)
- Social media for sharing, but it's not music-focused

Recommendations feel cold and algorithmic. The joy of discovering music through friends, at record stores, and at live shows gets lost in the noise.

## 💡 The Solution

**Eu-ter-pe** is a unified platform where you can:

- 📊 **Track Everything**: Connect your streaming, log your vinyl collection, record concerts you've attended
- 📋 **Create Boards**: Curate themed collections of albums, artists, vinyl finds, and live shows
- 👥 **Follow People**: Discover music through people you trust, not just algorithms
- 🎨 **Share Your Taste**: Beautiful, social-first interface that celebrates music culture
- 🔍 **Human Discovery**: Recommendations based on what real people you follow love

## ✨ Key Features

### Current MVP
- ✅ **User Authentication**: Secure signup/login with email
- ✅ **User Profiles**: Personal profiles with bio and avatar
- ✅ **Music Boards**: Create and share curated collections
  - Albums, Artists, Vinyl, Concerts, or Mixed boards
  - Public/private visibility options
- ✅ **Social Feed**: Discover boards from the community
- ✅ **Beautiful UI**: Vinyl-inspired design with warm colors and smooth animations

### Coming Soon
- 🎵 **Spotify Integration**: Import listening history and search albums
- 📀 **Board Items**: Add detailed album/artist entries to your boards
- 👥 **Follow System**: Follow users and see personalized feed
- 💿 **Vinyl Collection**: Track owned records and wishlist with variants
- 🎸 **Concert Tracker**: Log shows attended and discover upcoming events
- 🤖 **Smart Recommendations**: Discover based on friends' activity

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing-fast development
- **Tailwind CSS** for styling with custom design system
- **shadcn/ui** components for beautiful UI primitives
- **React Router** for navigation
- **Tanstack Query** for data fetching

### Backend (Lovable Cloud)
- **Supabase** for backend infrastructure
  - PostgreSQL database with Row Level Security
  - Built-in authentication
  - Real-time subscriptions
  - File storage capabilities

### Design System
- **Warm Palette**: Burgundy red (vinyl warmth), deep teal accents, cream backgrounds
- **Typography**: Clean sans-serif with generous spacing
- **Animations**: Smooth transitions and hover effects
- **Semantic Tokens**: HSL-based color system for consistency

## 📊 Database Schema

### Core Tables
- **profiles**: User information and preferences
- **boards**: Curated music collections
- **board_items**: Individual entries in boards
- **follows**: Social connections between users
- **user_media**: Vinyl collection and wishlist

All tables include Row Level Security (RLS) policies for data protection.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Lovable Cloud account (or Supabase project)

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd eu-ter-pe

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Environment Setup

The project uses Lovable Cloud, which automatically configures:
- Database connection
- Authentication
- Environment variables

No manual `.env` setup required!

## 📱 Usage

1. **Sign Up**: Create an account with email and password
2. **Explore Feed**: Browse boards created by the community
3. **Create Board**: Click "New Board" to start curating
   - Choose type (album/artist/vinyl/concert/mixed)
   - Add title and description
   - Share publicly or keep private
4. **View Profile**: See all your boards in one place

## 🎨 Design Philosophy

**Human-First Discovery**: We believe the best music recommendations come from people you trust, not cold algorithms.

**Unified Experience**: Stop juggling multiple apps. One platform for all your music experiences.

**Vinyl Warmth**: Design inspired by the tactile, warm experience of browsing record stores.

**Social by Design**: Music is meant to be shared. Every feature encourages connection.

## 🗺 Roadmap

### Phase 1: MVP ✅ (Current)
- User authentication
- Basic boards and profiles
- Social feed

### Phase 2: Enhanced Discovery
- Spotify API integration
- Board item management
- Follow system implementation

### Phase 3: Collections
- Full vinyl tracker with variants
- Concert history and discovery
- Wishlist functionality

### Phase 4: Smart Features
- Personalized recommendations
- Advanced search and filters
- Export/share capabilities

### Phase 5: Premium
- Analytics and insights
- Early access to rare releases
- Multi-platform apps

## 🤝 Contributing

This is a personal project, but ideas and feedback are welcome! Feel free to:
- Report bugs via issues
- Suggest features
- Share your music taste when the platform launches

## 📄 License

This project is private and proprietary.

## 🎵 Built With Love

For music lovers, by music lovers. Because discovering a great album through a friend will always beat an algorithm.

---

**Project URL**: https://lovable.dev/projects/fc977e17-f269-4d44-b953-8bf5d647e620

Built with [Lovable](https://lovable.dev) 💜

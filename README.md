# Aura

A modern web application built with Next.js and Supabase.

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Database**: PostgreSQL via Supabase

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd aura
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Then fill in your Supabase credentials in `.env.local`

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
aura/
├── lib/
│   ├── supabase.ts        # Client-side Supabase client
│   └── supabase-admin.ts  # Server-side admin client
├── .env.example           # Environment variables template
├── .env.local            # Local environment variables (not committed)
├── package.json
├── tsconfig.json
└── README.md
```

## Supabase Configuration

### Environment Variables

| Variable | Description | Where to Use |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Client & Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key | Client & Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secret) | Server only |
| `DATABASE_URL` | Direct PostgreSQL connection | Server only |

### Generating TypeScript Types

To generate TypeScript types from your Supabase schema:

```bash
npm run db:generate-types
```

This creates `lib/database.types.ts` with full type definitions for your database.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate-types` - Generate TypeScript types from Supabase

## License

MIT

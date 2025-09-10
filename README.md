# Land App API Tool

This is a React-based application that demonstrates how an external application can consume data from the Land App API and manage contract details for plans.

## Features

- **Land App API Integration**: Fetch plans from the Land App API with various filters
- **Contract Management**: Create and edit environmental contracts for each plan
- **Interactive Maps**: View plan features on an interactive Leaflet map with aerial imagery
- **Supabase Integration**: Store contract data securely in PostgreSQL with real-time updates
- **Responsive Design**: Modern UI with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- A Land App API key
- Supabase project configuration (optional, for full functionality)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

### Usage

1. **Enter your Land App API Key**: You'll need a valid API key from the Land App to fetch plan data
2. **Select Plan Type**: Choose from various plan types (BPS, CSS, SFI2023, etc.)
3. **Configure Filters**: Optionally filter for published plans or exclude archived ones
4. **Fetch Plans**: Click the fetch button to retrieve plans from the API
5. **Manage Contracts**: Create or edit contracts for each plan
6. **View Features**: Click "View Features" to see plan boundaries on an interactive map

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Configuration

The application works in two modes:

**Local Storage Mode (Default):**
- No configuration needed
- Contract data stored in browser localStorage
- Perfect for development and testing

**Supabase Mode (Production):**
1. Copy `.env.example` to `.env.local`
2. Get your credentials from [Supabase Dashboard](https://supabase.com/dashboard)
3. Update the environment variables:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Create a `contracts` table in your Supabase database (see Database Schema below)

### Database Schema (Supabase)

If using Supabase, create this table:

```sql
CREATE TABLE contracts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  land_app_plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  contract_start_date DATE,
  contract_end_date DATE,
  public_funding NUMERIC,
  private_funding NUMERIC,
  environmental_actions TEXT,
  targeted_outcomes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users,
  updated_by UUID REFERENCES auth.users,
  UNIQUE(user_id, land_app_plan_id)
);

-- Enable Row Level Security
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their own contracts
CREATE POLICY "Users can manage their own contracts" ON contracts
  FOR ALL USING (auth.uid() = user_id);
```

### Technology Stack

- **React 18** - Frontend framework
- **Vite** - Build tool and development server
- **Tailwind CSS** - Styling framework
- **Supabase** - Backend services (Auth + PostgreSQL)
- **Leaflet** - Interactive maps
- **Land App API** - External data source

## Development Notes

- The application uses CDN-loaded Leaflet for mapping functionality
- Supabase authentication is handled automatically with anonymous sign-in fallback
- Contract data is stored per-user with automatic local storage fallback
- Real-time updates when using Supabase mode
- All API calls include proper error handling and loading states
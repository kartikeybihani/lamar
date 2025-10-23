# Lamar - Healthcare Care Plan Generator

A Next.js application for generating AI-powered healthcare care plans with Supabase backend integration.

## Features

- **Patient Management**: Create and manage patient records with unique MRN validation
- **Provider Management**: Track healthcare providers with NPI validation
- **Care Plan Generation**: AI-powered care plan generation with duplicate prevention
- **Reporting**: Export care plans to CSV for pharmaceutical reporting
- **Audit Logging**: Complete audit trail of all system activities

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Database**: 5-table schema with foreign key relationships
- **Deployment**: Vercel

## Database Schema

The application uses 5 main tables:

1. **providers** - Healthcare providers with NPI validation
2. **patients** - Patient records with MRN validation  
3. **orders** - Medication orders and diagnoses
4. **care_plans** - Generated care plan text and metadata
5. **audit_logs** - System activity tracking

## Setup Instructions

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
3. Get your project URL and anon key from Settings > API

### 2. Environment Configuration

1. Copy `.env.example` to `.env.local`
2. Add your Supabase credentials:

```bash
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
```

### 3. Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### 4. Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel project settings:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Deploy automatically on git push

## API Endpoints

- `GET /api/duplicates/patient?mrn=123456` - Check patient duplicate
- `GET /api/duplicates/provider?npi=1234567890` - Check provider duplicate  
- `POST /api/care-plans` - Generate and save care plan
- `GET /api/reports` - Fetch all care plans

## Key Features

### Duplicate Prevention
- MRN uniqueness (6-digit validation)
- NPI uniqueness (10-digit validation)
- Order duplicate detection (patient + medication + diagnosis)

### Data Integrity
- Foreign key relationships between all tables
- Transaction-based operations
- Comprehensive error handling

### Audit Trail
- All operations logged to audit_logs table
- Event tracking for compliance
- Entity relationship tracking

## File Structure

```
/lib
  supabase.ts              # Supabase client configuration
  supabaseServices.ts      # Database operations
  mockServices.ts          # API client functions
/api
  care-plans/index.ts      # Main care plan generation endpoint
  duplicates/              # Duplicate checking endpoints
  reports/index.ts         # Reports data endpoint
/supabase-schema.sql       # Complete database schema
```

## Development

The application uses a clean separation between:
- **Frontend**: React components with form validation
- **API Routes**: Next.js API endpoints for database operations
- **Database Services**: Supabase client with typed operations
- **Types**: Comprehensive TypeScript interfaces

## Production Considerations

- Environment variables are properly configured for Vercel
- Database operations include proper error handling
- Audit logging ensures compliance tracking
- Duplicate prevention maintains data integrity
- CSV export supports pharmaceutical reporting requirements
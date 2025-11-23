# Technology Stack

## Overview

SmartMartX is built using modern web technologies, emphasizing performance, scalability, and developer experience. This document details all technologies, libraries, and tools used in the project.

## Frontend Technologies

### Core Framework
- **React 18.3.1**: Modern JavaScript library for building user interfaces
  - Hooks-based architecture
  - Functional components
  - Context API for state management
  - Concurrent rendering features

### Language
- **TypeScript**: Strongly-typed superset of JavaScript
  - Type safety and autocompletion
  - Better code documentation
  - Early error detection
  - Enhanced IDE support

### Build Tool
- **Vite**: Next-generation frontend build tool
  - Lightning-fast HMR (Hot Module Replacement)
  - Optimized production builds
  - ES modules support
  - Plugin ecosystem

### Styling

#### Tailwind CSS 3.x
- Utility-first CSS framework
- Custom design system via `tailwind.config.ts`
- Responsive design utilities
- Dark mode support
- Custom semantic tokens (colors, spacing, etc.)

#### Design System
```css
/* Semantic color tokens */
--primary: HSL values for brand color
--secondary: HSL values for secondary UI
--accent: HSL values for highlights
--background: HSL values for backgrounds
--foreground: HSL values for text
```

### UI Component Library

#### Shadcn/ui Components
Built on top of Radix UI primitives, customized for the project:

- **Navigation**: Navigation Menu, Menubar
- **Forms**: Input, Textarea, Select, Checkbox, Radio, Switch
- **Feedback**: Toast, Alert, Alert Dialog, Sonner notifications
- **Data Display**: Card, Table, Badge, Avatar, Separator
- **Layout**: Tabs, Accordion, Collapsible, Resizable Panels, Sheet, Dialog
- **Overlay**: Popover, Dropdown Menu, Context Menu, Hover Card, Tooltip
- **Charts**: Recharts integration for analytics
- **Others**: Calendar, Carousel, Progress, Slider, Command Palette

All components are:
- Fully typed with TypeScript
- Accessible (ARIA compliant)
- Customizable via variants
- Themed via CSS variables

### Routing
- **React Router v6.30.1**: Client-side routing
  - Declarative routing
  - Nested routes
  - Protected routes via custom hooks
  - URL parameters and query strings

### State Management

#### React Query (TanStack Query v5.83.0)
- Server state management
- Automatic caching
- Background refetching
- Optimistic updates
- Real-time synchronization

#### React Context API
- **AuthContext**: User authentication state
  - User session management
  - Profile data
  - Role-based access
  - Sign in/out functions

### Form Management
- **React Hook Form v7.61.1**: Performant form library
  - Minimal re-renders
  - Easy validation
  - Error handling
  - Integration with Zod

- **Zod v3.25.76**: TypeScript-first schema validation
  - Runtime type checking
  - Form validation schemas
  - API response validation

## Backend Technologies

### Database
- **Supabase (PostgreSQL)**: Open-source Firebase alternative
  - PostgreSQL 13+ with PostGIS
  - Real-time subscriptions
  - Row Level Security (RLS)
  - Automatic REST API generation
  - Built-in authentication

#### Database Features Used
- **Row Level Security (RLS)**: Fine-grained access control
- **Database Functions**: Custom PL/pgSQL functions
- **Triggers**: Automated data updates
- **Enums**: Type-safe status values
- **Foreign Keys**: Referential integrity
- **Indexes**: Query optimization

### Backend Services

#### Supabase Auth
- Email/password authentication
- OAuth providers (Google, Facebook)
- JWT-based session management
- Email verification
- Password reset flows

#### Supabase Storage
- Ready for file uploads
- Bucket-based organization
- RLS policies for access control
- CDN distribution

#### Edge Functions (Deno)
Serverless functions running on Deno runtime:

**check-auth-provider**
- Determines user authentication method
- Returns provider type (email/google/facebook)

**simulate-delivery-progress**
- Automated delivery status progression
- Runs every 1 minute (demo mode)
- Updates tracking and notifications
- Creates status history

### APIs & Integrations

#### Google Maps API
- **@react-google-maps/api v2.20.7**
- Location autocomplete
- Map visualization for delivery tracking
- Distance calculations
- Geocoding services

### Cron Jobs
- **pg_cron**: PostgreSQL-based job scheduler
- Automated edge function invocation
- Delivery status progression
- 1-minute intervals for demo mode

## Development Tools

### Package Manager
- **npm/bun**: Fast package management
- Lock files for reproducible builds

### Code Quality

#### ESLint
- Code linting and formatting
- React best practices
- TypeScript rules
- Custom configuration

#### TypeScript Compiler
- Strict type checking
- Path aliases (`@/` for `src/`)
- Multiple tsconfig files (app, node)

### Development Server
- **Vite Dev Server**: Hot reload development environment
- **Port 8080**: Default development port

## Libraries & Utilities

### UI/UX Libraries
- **Lucide React v0.462.0**: Icon library (1000+ icons)
- **date-fns v3.6.0**: Date manipulation and formatting
- **embla-carousel-react v8.6.0**: Touch-friendly carousel
- **vaul v0.9.9**: Bottom sheet/drawer component
- **cmdk v1.1.1**: Command palette component

### Utilities
- **clsx v2.1.1**: Conditional className utility
- **tailwind-merge v2.6.0**: Merge Tailwind classes efficiently
- **class-variance-authority v0.7.1**: Type-safe variant generation

### Charts & Visualization
- **Recharts v2.15.4**: React charting library
  - Line charts for revenue
  - Bar charts for orders
  - Pie charts for categories
  - Customizable and responsive

### Form Components
- **react-day-picker v8.10.1**: Date picker
- **input-otp v1.4.2**: OTP input component

### Layout
- **react-resizable-panels v2.1.9**: Resizable panel layouts

## Infrastructure

### Hosting & Deployment
- **Lovable/Vercel**: Frontend hosting
- **Supabase Cloud**: Backend services
- **CDN**: Static asset delivery

### Database
- **Supabase PostgreSQL**: Managed database
- **Connection pooling**: Pgbouncer
- **Backups**: Automated daily backups

### Environment Variables
```bash
VITE_SUPABASE_URL=<project-url>
VITE_SUPABASE_ANON_KEY=<anon-key>
GOOGLE_MAPS_API_KEY=<maps-key>
```

## Architecture Patterns

### Design Patterns
- **Component Composition**: Reusable UI components
- **Custom Hooks**: Shared business logic
- **Context Providers**: Global state management
- **Higher-Order Components**: Role-based access
- **Render Props**: Flexible component APIs

### Code Organization
```
src/
├── components/          # Reusable components
│   ├── ui/             # Base UI components (shadcn)
│   ├── customer/       # Customer-specific components
│   ├── retailer/       # Retailer-specific components
│   ├── wholesaler/     # Wholesaler-specific components
│   ├── auth/           # Authentication components
│   ├── shared/         # Shared business components
│   └── analytics/      # Analytics/chart components
├── pages/              # Page-level components
├── hooks/              # Custom React hooks
├── contexts/           # React context providers
├── integrations/       # External service integrations
├── lib/                # Utility functions
└── main.tsx           # Application entry point
```

### Database Architecture
- **Normalized Schema**: Reduces data redundancy
- **Relationship Tables**: Many-to-many relationships
- **Audit Fields**: created_at, updated_at timestamps
- **Soft Deletes**: is_available, is_active flags
- **UUID Primary Keys**: Distributed system friendly

## Performance Optimizations

### Frontend
- **Code Splitting**: Dynamic imports for routes
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Responsive images
- **Memoization**: React.memo for expensive renders
- **Virtual Scrolling**: For large lists (future)

### Backend
- **Database Indexes**: Optimized queries
- **Query Optimization**: Efficient SQL
- **Connection Pooling**: Reuse database connections
- **Edge Functions**: Serverless auto-scaling
- **Caching**: React Query cache strategy

## Security Features

### Authentication
- **JWT Tokens**: Secure session management
- **OAuth 2.0**: Social login security
- **Password Hashing**: bcrypt encryption
- **CSRF Protection**: Token-based protection

### Database Security
- **Row Level Security**: User-based access control
- **Prepared Statements**: SQL injection prevention
- **Role-Based Access**: Fine-grained permissions
- **Encrypted Connections**: SSL/TLS

### API Security
- **CORS Configuration**: Controlled origins
- **Rate Limiting**: DDoS protection
- **Input Validation**: Zod schemas
- **XSS Prevention**: Content sanitization

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Responsive Design Breakpoints

```css
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

## Development Requirements

- **Node.js**: v18+ or v20+
- **npm**: v9+ or bun
- **TypeScript**: v5+
- **Modern Browser**: For development tools

## Testing (Future Enhancement)

Planned testing stack:
- **Vitest**: Unit testing
- **React Testing Library**: Component testing
- **Playwright**: E2E testing
- **MSW**: API mocking

## Monitoring & Analytics (Future)

Planned integrations:
- **Sentry**: Error tracking
- **Google Analytics**: User analytics
- **Posthog**: Product analytics
- **Supabase Logs**: Backend monitoring

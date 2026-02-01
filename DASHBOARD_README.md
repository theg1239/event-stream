# Event Stream Dashboard

A real-time monitoring dashboard for the Event Stream server, built with Next.js and Tailwind CSS.

## Features

- **Real-time Updates**: Live Server-Sent Events (SSE) stream for instant event notifications
- **Health Monitoring**: System health status, event counts, and polling metrics
- **API Route Documentation**: Complete list of all available endpoints with examples
- **Live Changes**: Real-time display of event insertions, updates, and removals
- **Event Metrics**: Track poll summaries and event activity
- **Responsive Design**: Dark theme observability dashboard inspired by Vercel's monitoring UI

## Architecture

### Components

- **Dashboard**: Main container component managing tab navigation
- **Header**: Navigation tabs and connection status indicator
- **StreamProvider**: Context-based SSE stream management with event buffering
- **HealthStatus**: System health metrics and database statistics
- **RoutesList**: Complete API endpoint documentation
- **EventMetrics**: Poll summaries and event activity tracking
- **LiveChanges**: Real-time feed of event changes

### Data Flow

```
Event Stream Server (localhost:3001)
         ↓
   [SSE /stream]
         ↓
StreamProvider (Context)
         ↓
Dashboard Components (consume via useStream hook)
```

## Setup

### Prerequisites

- Node.js 18+
- Running event-stream backend server

### Installation

1. Install dependencies (rename package-dashboard.json to package.json):

```bash
# Copy the dashboard package config
cp package-dashboard.json package.json

# Install dependencies
npm install
```

2. Configure environment variables (`.env.local`):

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_SERVER_URL` | `http://localhost:3001` | Event stream backend URL |

## Dashboard Tabs

### Overview
- System health status
- Event counts (total and active)
- Last poll statistics
- Recent event metrics
- Live change feed

### Routes
- Complete API endpoint documentation
- Query parameters and examples
- Description of each route's purpose

### Changes
- Full-screen view of event changes
- Real-time insertions, updates, removals
- Timestamps and change types

### Events
- Event activity metrics
- Poll summaries
- Event type distribution

## API Integration

The dashboard connects to the event stream backend via:

### SSE Stream (`/stream`)
- Real-time events with automatic reconnection
- Event types: `event_upsert`, `event_removed`, `event_detail_upsert`, `poll_summary`
- Heartbeat ping every 20 seconds

### Health Check (`/health`)
- Polled every 10 seconds
- Returns system status and event counts
- Latest poll run information

## Theme

The dashboard uses a dark theme with:
- **Background**: Deep slate (hsl(8, 12%, 6%))
- **Primary**: Bright blue (hsl(207, 89%, 45%))
- **Secondary**: Medium blue (hsl(200, 100%, 32%))
- **Accent**: Cyan (hsl(184, 86%, 53%))

Design tokens are defined in `app/globals.css` and used throughout for consistent styling.

## Development

### Adding New Components

Create a new component in `/components` and import it into the Dashboard:

```tsx
// components/my-component.tsx
'use client'

import { useStream } from './stream-provider'

export function MyComponent() {
  const { events, isConnected } = useStream()
  // ...
}
```

### Styling

- Use Tailwind classes for responsive design
- Leverage semantic color tokens: `bg-primary`, `text-accent`, etc.
- Component-level styles via `@layer components` in globals.css

## Performance Optimizations

- Event buffer limited to 100 recent events in memory
- Memoized filtering and sorting of event streams
- Lazy evaluation of metrics calculations
- Automatic reconnection on SSE disconnect (3s retry)

## Troubleshooting

### Dashboard not receiving events
1. Check that backend server is running on `NEXT_PUBLIC_SERVER_URL`
2. Verify CORS is enabled on backend (currently allows all origins)
3. Check browser console for SSE connection errors

### Connection keeps dropping
- Normal if backend is restarting
- Dashboard will automatically reconnect after 3 seconds
- Check backend logs for errors

### Metrics not updating
- Ensure backend is polling (check `/health` endpoint)
- Verify `/stream` endpoint is accessible
- Check network tab for failed SSE connections

## License

MIT

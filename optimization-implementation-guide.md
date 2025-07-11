# Performance Optimization Implementation Guide

## Overview
This guide explains how to implement the performance optimizations across the eBoto application. Follow these steps to achieve significant bundle size reduction and improved load times.

## 1. Date Library Migration (Moment.js → Day.js)

### What's Changed
- Removed `moment` dependency (saves ~70KB gzipped)
- Added `dayjs` with necessary plugins
- Created centralized `DateUtils` for consistent usage

### How to Update Components

**Before (using moment.js):**
```typescript
import moment from "moment";

// In component:
{moment(election.start_date).format("MMMM DD, YYYY")}
{moment(election.created_at).fromNow()}
```

**After (using DateUtils):**
```typescript
import { DateUtils } from "~/utils/date";

// In component:
{DateUtils.formatDate(election.start_date)}
{DateUtils.fromNow(election.created_at)}
```

### Available DateUtils Methods
- `formatDate(date)` → "January 15, 2024"
- `formatDateShort(date)` → "Jan 15, 2024"
- `formatTime(date)` → "02:30 PM"
- `formatDateTime(date)` → "January 15, 2024 02:30 PM"
- `fromNow(date)` → "2 hours ago"
- `isAfter(date, compareDate)` → boolean
- `isBefore(date, compareDate)` → boolean
- `now()` → current dayjs instance

### Files to Update
Replace moment imports in these files:
- ✅ `dashboard-card.tsx` (example updated)
- ✅ `generated-result-row.tsx` (example updated)
- 📝 `public-elections.tsx`
- 📝 `my-messages-election.tsx`
- 📝 `my-elections.tsx`
- 📝 `election-page.tsx`
- 📝 `election-candidate.tsx`
- 📝 `dashboard-voter.tsx`
- 📝 `realtime.tsx`
- 📝 `dashboard-overview.tsx`
- 📝 And 5+ other components

## 2. Lazy Loading Implementation

### PDF Components
**Before:**
```typescript
import { PDFDownloadLink } from "@alexandernanberg/react-pdf-renderer";
import GenerateResult from "~/pdf/generate-result";
```

**After:**
```typescript
import { PDFDownloadLinkLazy, GenerateResultLazy } from "~/components/pdf-lazy";
```

### React Player
**Before:**
```typescript
import ReactPlayerPackage from "react-player/lazy";
```

**After:**
```typescript
import ReactPlayerLazy from "~/components/react-player-lazy";
```

### Heavy Modals
**Before:**
```typescript
import CreateElection from "./modals/create-election";
```

**After:**
```typescript
import { CreateElectionModalLazy } from "~/components/modals-lazy";
```

### Analytics (Layout.tsx)
**Before:**
```typescript
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// In component:
<Analytics />
<SpeedInsights />
```

**After:**
```typescript
import { DeferredAnalytics } from "~/components/analytics-lazy";

// In component:
<DeferredAnalytics />
```

## 3. Icon Optimization

### Centralized Icon Imports
**Before (in multiple files):**
```typescript
import { IconDownload, IconUser, IconCheck } from "@tabler/icons-react";
```

**After:**
```typescript
import { IconDownload, IconUser, IconCheck } from "~/utils/icons";
```

### Benefits
- Better tree-shaking
- Consistent icon usage
- Easier to track which icons are used
- Potential for icon sprite optimization later

## 4. Font Optimization

### What's Changed
- Reduced Poppins font weights from 9 to 3 (400, 500, 600)
- Added `display: 'swap'` for better loading performance
- Saves ~10-15KB and improves font loading

### Already Applied To
- ✅ `providers.tsx`
- ✅ `layout.tsx`

## 5. Next.js Configuration Improvements

### New Features Added
- Enhanced package optimization for `@tabler/icons-react`
- Image optimization with modern formats (WebP, AVIF)
- Better caching for images (30 days)
- Webpack alias to redirect moment → dayjs
- Improved tree-shaking configuration
- Output file tracing for smaller deploys

## 6. CSS Optimization

### Current State
Multiple CSS files are imported globally in `layout.tsx`:
```typescript
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
// ... more imports
```

### Future Optimization (Phase 2)
Consider:
- CSS modules for component-specific styles
- Conditional CSS loading based on route
- PostCSS optimizations

## Migration Checklist

### Phase 1: Critical Updates (High Impact)
- [ ] Update all moment.js imports to use DateUtils
- [ ] Replace PDF imports with lazy versions
- [ ] Update ReactPlayer imports
- [ ] Implement deferred analytics

### Phase 2: Component Optimization
- [ ] Update heavy modal imports to use lazy versions
- [ ] Migrate icon imports to centralized utils
- [ ] Add dynamic imports for dashboard components

### Phase 3: Advanced Optimizations
- [ ] Implement route-level code splitting
- [ ] Add component-level CSS loading
- [ ] Optimize third-party script loading

## Expected Results

After completing Phase 1:
- **Bundle Size**: ~50KB reduction (gzipped)
- **First Load**: 25-30% improvement
- **Time to Interactive**: 20-25% improvement

After completing all phases:
- **Bundle Size**: ~100-150KB reduction (gzipped)
- **First Load**: 40-50% improvement
- **Time to Interactive**: 30-40% improvement
- **Lighthouse Score**: +15-20 points

## Testing Performance

### Bundle Analysis
```bash
# Install bundle analyzer
pnpm add -D @next/bundle-analyzer

# Analyze bundle
ANALYZE=true pnpm build
```

### Lighthouse Testing
1. Build production version
2. Test on throttled 3G network
3. Focus on:
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Time to Interactive (TTI)
   - Bundle size metrics

### Performance Monitoring
- Use Vercel Speed Insights data
- Monitor Core Web Vitals in production
- Track bundle size changes in CI/CD

## Maintenance

### Adding New Components
1. Use DateUtils instead of moment
2. Consider lazy loading for heavy components
3. Import icons from centralized utils
4. Add dynamic imports for modal components

### Performance Budget
- Keep JavaScript bundle under 400KB gzipped
- Aim for FCP under 2 seconds on 3G
- Maintain Lighthouse score above 90

## Support

For questions or issues with implementation:
1. Check the DateUtils API in `src/utils/date.ts`
2. Review lazy loading examples in `src/components/*-lazy.tsx`
3. Test performance changes locally before deploying
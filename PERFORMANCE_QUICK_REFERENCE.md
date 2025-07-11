# 🚀 Performance Optimization Quick Reference

## ⚡ Immediate Actions Required

### 1. Replace All Moment.js Imports (15+ files)

**Find & Replace Pattern:**
```typescript
// OLD ❌
import moment from "moment";
{moment(date).format("MMMM DD, YYYY")}
{moment(date).fromNow()}

// NEW ✅  
import { DateUtils } from "~/utils/date";
{DateUtils.formatDate(date)}
{DateUtils.fromNow(date)}
```

**Common Replacements:**
- `moment().format("MMMM DD, YYYY")` → `DateUtils.formatDate(date)`
- `moment().format("MMM DD, YYYY")` → `DateUtils.formatDateShort(date)`
- `moment().fromNow()` → `DateUtils.fromNow(date)`
- `moment().isAfter()` → `DateUtils.isAfter(date, compareDate)`
- `moment().isBefore()` → `DateUtils.isBefore(date, compareDate)`

### 2. Use Lazy Components

**PDF Components:**
```typescript
// OLD ❌
import { PDFDownloadLink } from "@alexandernanberg/react-pdf-renderer";

// NEW ✅
import { PDFDownloadLinkLazy } from "~/components/pdf-lazy";
```

**Heavy Modals:**
```typescript
// OLD ❌
import CreateElection from "./modals/create-election";

// NEW ✅
import { CreateElectionModalLazy } from "~/components/modals-lazy";
```

**Video Player:**
```typescript
// OLD ❌
import ReactPlayerPackage from "react-player/lazy";

// NEW ✅
import ReactPlayerLazy from "~/components/react-player-lazy";
```

### 3. Update Icon Imports

```typescript
// OLD ❌
import { IconDownload, IconUser } from "@tabler/icons-react";

// NEW ✅
import { IconDownload, IconUser } from "~/utils/icons";
```

## 📊 Priority Files to Update

### High Priority (Moment.js Migration)
```
📝 components/public-elections.tsx
📝 components/my-messages-election.tsx  
📝 components/my-elections.tsx
📝 components/pages/election-page.tsx
📝 components/pages/realtime.tsx
📝 components/modals/edit-candidate.tsx
📝 components/layout/dashboard-election.tsx
```

### Medium Priority (Lazy Loading)
```
📝 All components using PDF generation
📝 All components using heavy modals  
📝 All components using ReactPlayer
```

## 🛠️ Quick Commands

### Find Moment.js Usage
```bash
grep -r "import moment" apps/www/src/
grep -r "moment(" apps/www/src/
```

### Find PDF Usage
```bash
grep -r "PDFDownloadLink" apps/www/src/
grep -r "@alexandernanberg/react-pdf-renderer" apps/www/src/
```

### Find Icon Usage
```bash
grep -r "from \"@tabler/icons-react\"" apps/www/src/
```

## ⚡ Expected Impact

- **Bundle Size**: -100-150KB (gzipped)
- **Load Time**: 30-40% improvement
- **Lighthouse**: +15-25 points

## 🚦 Quick Test

```bash
# Before changes
pnpm build | grep "First Load"

# After changes  
pnpm build | grep "First Load"

# Compare the sizes!
```

---
**Start with moment.js migration - biggest impact! 🎯**
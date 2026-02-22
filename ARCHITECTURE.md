# NeuralTrace - Technical Architecture

**Comprehensive technical documentation for the NeuralTrace health monitoring platform**

---

## 📐 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                        │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Patient    │  │    Doctor    │  │    Admin     │         │
│  │  Dashboard   │  │  Dashboard   │  │  Dashboard   │         │
│  │  (React)     │  │  (React)     │  │  (React)     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS / WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                           │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Supabase     │  │  Supabase    │  │  Supabase    │         │
│  │ Auth         │  │  Realtime    │  │  Storage     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │         Edge Functions (Deno Runtime)            │          │
│  │  • ai-screen-vitals                              │          │
│  │  • process-report                                │          │
│  │  • send-emergency-email                          │          │
│  │  • send-emergency-sms                            │          │
│  └──────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ PostgreSQL Protocol
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                                │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              PostgreSQL Database                        │    │
│  │                                                         │    │
│  │  Tables:                                                │    │
│  │  • profiles                • vitals                     │    │
│  │  • user_roles              • ai_screening_results       │    │
│  │  • consultations           • emergency_events           │    │
│  │  • medical_reports         • feedback                   │    │
│  │  • patient_doctor_assignments                           │    │
│  │  • consent_audit           • notification_preferences   │    │
│  │  • offline_queue           • system_metrics             │    │
│  │                                                         │    │
│  │  Security: Row Level Security (RLS) on all tables      │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗 Component Architecture

### Frontend Architecture

```
src/
├── components/
│   ├── admin/              # Admin dashboard components
│   ├── auth/               # Authentication components
│   ├── dashboard/          # Shared dashboard components
│   ├── doctor/             # Doctor-specific components
│   ├── emergency/          # Emergency system components
│   ├── feedback/           # Feedback system
│   ├── patient/            # Patient-specific components
│   ├── settings/           # Settings components
│   └── ui/                 # Reusable UI components (shadcn)
│
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts          # Authentication state
│   ├── useVitals.ts        # Vitals management
│   ├── useDoctorPatients.ts # Doctor patient management
│   ├── useEmergencyController.ts # Emergency handling
│   └── ...
│
├── pages/                  # Route pages
│   ├── Index.tsx           # Landing page
│   ├── Auth.tsx            # Login/Signup
│   ├── PatientDashboard.tsx
│   ├── DoctorDashboard.tsx
│   ├── AdminDashboard.tsx
│   └── Settings.tsx
│
├── services/               # Business logic services
│   ├── api.ts              # API service layer
│   ├── emergencyController.ts
│   ├── patientAssignmentService.ts
│   └── ...
│
├── integrations/
│   └── supabase/
│       ├── client.ts       # Supabase client
│       └── types.ts        # Database types
│
└── types/                  # TypeScript type definitions
    ├── doctor.ts
    └── emergency.ts
```

---

## 🗄 Database Schema

### Core Tables

#### `profiles`
User profile information
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  specialty TEXT,              -- For doctors
  license_number TEXT,         -- For doctors
  organization TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `user_roles`
Role-based access control
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role app_role NOT NULL,      -- 'admin' | 'doctor' | 'patient' | 'caregiver'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `vitals`
Patient vital signs data
```sql
CREATE TABLE vitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  heart_rate INTEGER,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  oxygen_saturation INTEGER,
  temperature DECIMAL(4,1),
  respiratory_rate INTEGER,
  source TEXT,                 -- 'manual' | 'wearable' | 'device'
  device_type TEXT,
  entered_by UUID REFERENCES auth.users(id),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `ai_screening_results`
AI health screening analysis
```sql
CREATE TABLE ai_screening_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  vitals_id UUID REFERENCES vitals(id),
  severity TEXT NOT NULL,      -- 'normal' | 'warning' | 'critical'
  anomaly_detected BOOLEAN DEFAULT FALSE,
  confidence_level DECIMAL(3,2),
  explanation TEXT NOT NULL,
  recommendations TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `patient_doctor_assignments`
Doctor-patient relationships
```sql
CREATE TABLE patient_doctor_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES auth.users(id),
  doctor_id UUID NOT NULL REFERENCES auth.users(id),
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active', -- 'active' | 'inactive' | 'transferred'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `emergency_events`
Emergency alert tracking
```sql
CREATE TABLE emergency_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id),
  triggered_by UUID NOT NULL REFERENCES profiles(id),
  triggered_at TIMESTAMPTZ NOT NULL,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  location_consented BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending', -- 'pending' | 'sent' | 'failed'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `consultations`
Doctor-patient consultations
```sql
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES auth.users(id),
  doctor_id UUID REFERENCES auth.users(id),
  consultation_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  patient_notes TEXT,
  doctor_notes TEXT,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `medical_reports`
Uploaded medical documents
```sql
CREATE TABLE medical_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  ocr_text TEXT,
  ai_summary TEXT,
  ai_tags TEXT[],
  status TEXT DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  doctor_notes TEXT,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Security Tables

#### `consent_audit`
Consent tracking and audit trail
```sql
CREATE TABLE consent_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  consent_type consent_type NOT NULL,
  granted BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### System Tables

#### `feedback`
User feedback and bug reports
```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL,          -- 'bug' | 'feature' | 'general'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'new',   -- 'new' | 'in_progress' | 'resolved'
  priority TEXT,
  admin_notes TEXT,
  page_url TEXT,
  screenshot_url TEXT,
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `system_metrics`
System health and performance metrics
```sql
CREATE TABLE system_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_type TEXT NOT NULL,
  metric_value DECIMAL,
  metadata JSONB,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔒 Security Architecture

### Row Level Security (RLS)

All tables have RLS enabled with policies:

#### Patient Data Access
```sql
-- Patients can only see their own data
CREATE POLICY "Users can view own vitals"
ON vitals FOR SELECT
USING (auth.uid() = user_id);

-- Doctors can see assigned patients' data
CREATE POLICY "Doctors can view assigned patients vitals"
ON vitals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM patient_doctor_assignments
    WHERE patient_id = vitals.user_id
    AND doctor_id = auth.uid()
    AND status = 'active'
  )
);
```

#### Role-Based Access
```sql
-- Function to check user role
CREATE FUNCTION has_role(role_name app_role, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = $2 AND role = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin-only access
CREATE POLICY "Admins can view all feedback"
ON feedback FOR SELECT
USING (has_role('admin', auth.uid()));
```

### Authentication Flow

```
1. User submits credentials
   ↓
2. Supabase Auth validates
   ↓
3. JWT token generated
   ↓
4. Profile and role fetched
   ↓
5. RLS policies applied
   ↓
6. User redirected to appropriate dashboard
```

### Data Encryption

- **In Transit**: TLS 1.3 (HTTPS)
- **At Rest**: AES-256 encryption (Supabase)
- **Passwords**: bcrypt hashing
- **Tokens**: JWT with expiration

---

## 🔄 Real-time Architecture

### Supabase Realtime Channels

```typescript
// Subscribe to vitals updates
const channel = supabase
  .channel('vitals-updates')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'vitals',
      filter: `user_id=eq.${patientId}`
    },
    (payload) => {
      // Update UI with new vitals
      handleNewVitals(payload.new);
    }
  )
  .subscribe();
```

### Real-time Features

1. **Vitals Updates**: Doctors see patient vitals in real-time
2. **Alert Notifications**: Critical alerts pushed to doctors
3. **Assignment Changes**: Dashboard updates when patients assigned
4. **Consultation Status**: Real-time consultation status updates

---

## 🤖 AI Screening Architecture

### Hybrid Approach

```
Vitals Input
    ↓
┌───────────────────┐
│  Rule-Based       │ ← Always runs (fallback)
│  Analysis         │
└───────────────────┘
    ↓
┌───────────────────┐
│  AI Model         │ ← Optional (if API key available)
│  Analysis         │
└───────────────────┘
    ↓
┌───────────────────┐
│  Severity         │
│  Classification   │
│  • Normal         │
│  • Warning        │
│  • Critical       │
└───────────────────┘
    ↓
┌───────────────────┐
│  Recommendations  │
│  Generation       │
└───────────────────┘
    ↓
Store in Database
```

### Rule-Based Logic

```typescript
// Critical conditions
if (heartRate < 50 || heartRate > 120 ||
    systolic > 180 || systolic < 90 ||
    oxygen < 90 || temp > 39 || temp < 35) {
  severity = 'critical';
}

// Warning conditions
else if (heartRate < 60 || heartRate > 100 ||
         systolic > 140 || systolic < 100 ||
         oxygen < 95 || temp > 38 || temp < 36) {
  severity = 'warning';
}

// Normal
else {
  severity = 'normal';
}
```

---

## 🚨 Emergency System Architecture

### Emergency Flow

```
1. Patient clicks Emergency Button
   ↓
2. Validate emergency contact configured
   ↓
3. Show confirmation dialog
   ↓
4. Create emergency event in database
   ↓
5. Request location consent
   ↓
6. Update event with location (if granted)
   ↓
7. Send notification to emergency contact
   ↓
8. Display Pakistan emergency numbers
   ↓
9. Update event status
```

### Pakistan Emergency Integration

```typescript
const PAKISTAN_EMERGENCY_NUMBERS = {
  ambulance: '115',
  rescue: '1122',
  edhi: '1021'
};
```

### Rate Limiting

- Maximum 1 emergency alert per minute per patient
- Prevents accidental spam
- Ensures each alert is taken seriously

---

## 📊 Analytics Architecture

### Metrics Collection

```sql
-- Track system metrics
INSERT INTO system_metrics (metric_type, metric_value, metadata)
VALUES (
  'alert_triggered',
  1,
  jsonb_build_object(
    'patient_id', patient_id,
    'severity', severity,
    'timestamp', NOW()
  )
);
```

### Admin Dashboard Queries

```sql
-- User activity over last 7 days
SELECT 
  DATE(session_start) as date,
  COUNT(*) as sessions,
  SUM(page_views) as total_page_views
FROM user_sessions
WHERE session_start >= NOW() - INTERVAL '7 days'
GROUP BY DATE(session_start)
ORDER BY date;

-- Role distribution
SELECT 
  role,
  COUNT(*) as count
FROM user_roles
GROUP BY role;
```

---

## 🔌 API Architecture

### Edge Functions

#### `ai-screen-vitals`
```typescript
// Input
{
  vitalsId: string,
  heartRate: number,
  bloodPressureSystolic: number,
  bloodPressureDiastolic: number,
  temperature: number,
  oxygenSaturation: number
}

// Output
{
  success: boolean,
  result: {
    severity: 'normal' | 'warning' | 'critical',
    anomaly_detected: boolean,
    explanation: string,
    recommendations: string[],
    confidence: number
  }
}
```

#### `process-report`
```typescript
// Input
{
  reportId: string
}

// Output
{
  success: boolean,
  report: {
    ocr_text: string,
    ai_summary: string,
    ai_tags: string[],
    status: 'processed'
  }
}
```

---

## 🚀 Deployment Architecture

### Production Stack

```
┌─────────────────────────────────────┐
│  Vercel / Netlify (Frontend)        │
│  • Static hosting                   │
│  • CDN distribution                 │
│  • Automatic HTTPS                  │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Supabase (Backend)                 │
│  • PostgreSQL database              │
│  • Authentication                   │
│  • Real-time subscriptions          │
│  • Edge Functions                   │
│  • File storage                     │
└─────────────────────────────────────┘
```

### Environment Configuration

```env
# Production
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=project-id

# Development
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## 📈 Performance Optimization

### Frontend Optimization
- Code splitting with React.lazy()
- Image optimization
- Lazy loading components
- Memoization with useMemo/useCallback
- Virtual scrolling for large lists

### Database Optimization
- Indexes on frequently queried columns
- Materialized views for complex queries
- Connection pooling
- Query optimization

### Caching Strategy
- React Query for API caching
- LocalStorage for offline support
- Service Worker for PWA capabilities

---

## 🧪 Testing Strategy

### Unit Tests
- Component testing with React Testing Library
- Hook testing
- Service layer testing

### Integration Tests
- API endpoint testing
- Database query testing
- Authentication flow testing

### E2E Tests
- User workflow testing
- Cross-browser testing
- Mobile responsiveness testing

---

## 📚 Technology Decisions

### Why React?
- Component-based architecture
- Large ecosystem
- Strong TypeScript support
- Excellent developer experience

### Why Supabase?
- PostgreSQL (reliable, scalable)
- Built-in authentication
- Real-time capabilities
- Row-level security
- Edge Functions
- Free tier for development

### Why TypeScript?
- Type safety
- Better IDE support
- Catch errors at compile time
- Self-documenting code

### Why Tailwind CSS?
- Utility-first approach
- Consistent design system
- Small bundle size
- Excellent with component libraries

---

## 🔮 Future Architecture Considerations

### Scalability
- Horizontal scaling with load balancers
- Database read replicas
- Caching layer (Redis)
- CDN for static assets

### Microservices
- Separate services for:
  - AI screening
  - Emergency handling
  - Report processing
  - Notifications

### Mobile Apps
- React Native for iOS/Android
- Shared business logic
- Native device integration

---

This architecture supports the current FYP requirements while being designed for future scalability and production deployment.

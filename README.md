# NeuralTrace - AI-Powered Health Monitoring Platform

**Final Year Project - Healthcare Monitoring System for Pakistan**

![NeuralTrace](https://img.shields.io/badge/version-1.0.0--beta-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Web-orange)

## 📋 Table of Contents
- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Installation & Setup](#installation--setup)
- [Usage Guide](#usage-guide)
- [Screenshots](#screenshots)
- [Future Enhancements](#future-enhancements)
- [Contributors](#contributors)

---

## 🎯 Overview

NeuralTrace is an AI-powered continuous health monitoring platform designed to bridge the gap between patients and healthcare providers in Pakistan. The system enables real-time vital sign tracking, intelligent health screening, emergency response coordination, and seamless doctor-patient communication.

**Developed as a Final Year Project to address critical healthcare challenges in Pakistan's resource-constrained medical system.**

---

## 🚨 Problem Statement

Pakistan faces significant healthcare challenges:
- **Limited Access**: Rural areas lack adequate medical facilities
- **Doctor Shortage**: High patient-to-doctor ratio (1:1000+)
- **Delayed Response**: Critical conditions often detected too late
- **Fragmented Care**: Poor coordination between patients and doctors
- **Emergency Services**: Inadequate emergency response infrastructure

Traditional healthcare systems struggle to provide continuous monitoring and early intervention, leading to preventable complications and deaths.

---

## 💡 Solution

NeuralTrace addresses these challenges through:

### 1. **Continuous Health Monitoring**
- Real-time vital signs tracking (heart rate, blood pressure, oxygen saturation, temperature)
- Manual entry and wearable device integration framework
- 24/7 automated health screening

### 2. **AI-Powered Health Screening**
- Rule-based and AI-powered anomaly detection
- Severity classification (normal/warning/critical)
- Automated health recommendations
- Early warning system for deteriorating conditions

### 3. **Doctor-Patient Connectivity**
- Patient assignment system for doctors
- Real-time patient monitoring dashboard
- Alert acknowledgment and management
- Consultation request system

### 4. **Emergency Response System**
- One-touch emergency alert button
- Integration with Pakistan emergency services (115, 1122, Edhi)
- Emergency contact notification
- Location sharing with consent
- Emergency event tracking

### 5. **Medical Report Processing**
- Upload and store medical reports
- OCR text extraction
- AI-powered report analysis
- Doctor review and annotation

---

## ✨ Key Features

### For Patients
- ✅ Manual vitals entry with instant AI screening
- ✅ **Real-time Demo Mode** - Simulates live wearable monitoring
- ✅ Emergency alert system with Pakistan emergency numbers
- ✅ Medical report upload and tracking
- ✅ Consultation request to assigned doctors
- ✅ AI health insights and recommendations
- ✅ Emergency contact configuration
- ✅ Consent management and audit trail

### Demo Mode (NEW!)
The platform includes a sophisticated demo mode that simulates real-time wearable device monitoring:
- **Automatic Updates**: Vitals update every 10 seconds
- **Realistic Simulation**: Smooth transitions, no sudden jumps
- **Scenario Cycling**: Normal → Warning → Critical conditions
- **AI Integration**: Automatic health screening on each update
- **Live Indicators**: Visual feedback with pulsing "LIVE" badge
- **Doctor Visibility**: Real-time updates visible to assigned doctors

Perfect for demonstrations, testing, and showcasing the platform's real-time capabilities!

### For Doctors
- ✅ Patient assignment and management
- ✅ Real-time patient vitals monitoring
- ✅ Alert system with severity classification
- ✅ Patient detail views with history
- ✅ Alert acknowledgment workflow
- ✅ AI screening results review

### For Administrators
- ✅ User management and analytics
- ✅ System health monitoring
- ✅ Beta invite code management
- ✅ Feedback management
- ✅ Role distribution analytics
- ✅ Activity tracking and reporting

### Security & Compliance
- ✅ Role-based access control (Patient, Doctor, Admin, Caregiver)
- ✅ Row-level security on all database tables
- ✅ Two-factor authentication (2FA)
- ✅ Consent audit trail
- ✅ Session tracking
- ✅ Encryption at rest and in transit

---

## 🛠 Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation

### Backend
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Edge Functions**: Deno (Supabase Functions)
- **Storage**: Supabase Storage

### AI & Analytics
- **AI Screening**: Rule-based + Optional AI API
- **Charts**: Recharts
- **Analytics**: Custom implementation

### DevOps
- **Version Control**: Git
- **Hosting**: Vercel/Netlify (Frontend), Supabase (Backend)
- **CI/CD**: GitHub Actions (optional)

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (React)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Patient  │  │  Doctor  │  │  Admin   │  │Caregiver │   │
│  │Dashboard │  │Dashboard │  │Dashboard │  │Dashboard │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Layer (Supabase)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │ Realtime │  │ Storage  │  │   Edge   │   │
│  │          │  │          │  │          │  │Functions │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Database Layer (PostgreSQL)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Tables: profiles, vitals, ai_screening_results,    │  │
│  │  consultations, emergency_events, medical_reports   │  │
│  │  + Row Level Security (RLS) Policies                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema (Key Tables)

- **profiles**: User information and emergency contacts
- **user_roles**: Role-based access control
- **vitals**: Patient vital signs data
- **ai_screening_results**: AI analysis results
- **consultations**: Doctor-patient consultations
- **emergency_events**: Emergency alert tracking
- **medical_reports**: Uploaded medical documents
- **patient_doctor_assignments**: Patient-doctor relationships
- **feedback**: User feedback and bug reports
- **consent_audit**: Consent tracking and audit trail

---

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier works)
- Git

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd neuraltrace
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

### Step 4: Set Up Supabase Database

1. Create a new Supabase project
2. Run the migration SQL files in order:
   - `supabase/migrations/*.sql`
3. Deploy Edge Functions:
   ```bash
   supabase functions deploy ai-screen-vitals
   supabase functions deploy process-report
   supabase functions deploy generate-daily-report
   ```

### Step 5: Run Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### Step 6: Build for Production
```bash
npm run build
```

---

## 📖 Usage Guide

### Creating Test Accounts

#### Patient Account
1. Go to `/auth`
2. Click "Sign Up"
3. Select "Patient"
4. Fill in details and create account
5. Configure emergency contact in Settings

#### Doctor Account
1. Go to `/auth`
2. Click "Sign Up"
3. Select "Doctor"
4. Provide specialty and license number
5. Create account

#### Admin Account
Admin accounts must be created manually in the database by updating the `user_roles` table.

### Patient Workflow
1. **Login** → Patient Dashboard
2. **Enter Vitals** → Manual entry or connect device
3. **View AI Insights** → See health screening results
4. **Upload Reports** → Medical documents
5. **Request Consultation** → Contact assigned doctor
6. **Emergency Alert** → One-touch emergency button

### Doctor Workflow
1. **Login** → Doctor Dashboard
2. **Assign Patients** → Add patients to your care
3. **Monitor Vitals** → Real-time patient monitoring
4. **Review Alerts** → Acknowledge critical alerts
5. **View Patient Details** → Complete patient history
6. **Respond to Consultations** → Patient requests

### Admin Workflow
1. **Login** → Admin Dashboard
2. **View Analytics** → User statistics and system health
3. **Manage Beta Codes** → Invite code generation
4. **Review Feedback** → User feedback management
5. **Monitor System** → Health metrics and alerts

---

## 📸 Screenshots

*(Add screenshots of your application here)*

### Patient Dashboard
- Vitals entry interface
- AI insights display
- Emergency alert system

### Doctor Dashboard
- Patient list with status
- Alert management
- Patient detail view

### Admin Dashboard
- Analytics overview
- System health monitoring
- User management

---

## 🚀 Future Enhancements

### Phase 1: Device Integration
- [ ] Apple HealthKit integration
- [ ] Google Fit integration
- [ ] Fitbit API integration
- [ ] Real Bluetooth device connectivity

### Phase 2: Advanced Features
- [ ] Video consultation (WebRTC)
- [ ] PDF report generation
- [ ] SMS/Call emergency notifications
- [ ] Direct 115/1122 integration
- [ ] Medication reminders
- [ ] Caregiver dashboard

### Phase 3: AI Enhancements
- [ ] ML-based anomaly detection
- [ ] Predictive health analytics
- [ ] Natural language processing for reports
- [ ] Voice assistant integration

### Phase 4: Localization
- [ ] Urdu language support
- [ ] Regional hospital integration
- [ ] Pakistan-specific health metrics
- [ ] Local pharmacy integration

---

## 👥 Contributors

**[Your Name]** - Final Year Project Student
- University: [Your University]
- Department: [Your Department]
- Year: [Academic Year]
- Supervisor: [Supervisor Name]

---

## 📄 License

This project is developed as a Final Year Project for educational purposes.

---

## 🙏 Acknowledgments

- Supabase for backend infrastructure
- shadcn/ui for UI components
- Pakistan Emergency Services (115, 1122, Edhi)
- [Your University] for project support

---

## 📞 Contact & Support

For questions or support:
- Email: [your-email]
- GitHub: [your-github]
- University: [university-email]

---

**Note**: This is a prototype/demonstration system developed for educational purposes. For production deployment in healthcare settings, additional regulatory compliance, security audits, and medical device certifications would be required.

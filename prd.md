# NeuralTrace — Product Requirements Document (PRD)

**Document:** NeuralTrace_PRD_and_Lovable_Prompt.md

**Date:** 2025-11-04

**Author:** Assistant (generated for Muzammil Jethwa)

---

## 1. Executive summary

NeuralTrace is an AI-powered memory & health assistant for users with cognitive disorders and at-risk patients. This PRD extends the original NeuralTrace proposal to include 24/7 medical screening, live wearable/smartwatch vitals integration, AI ‘doctors’ that continuously monitor data and generate daily clinical-style reports, automated emergency detection and escalation (ambulance/caretaker), the ability to ingest and interpret uploaded test reports (OCR + clinical NLP), and integration of **real licensed doctors** into the platform for live consultation, report validation, and patient monitoring support.

The core value: increase safety and independence through continuous non-invasive monitoring, early detection of deterioration, direct access to human doctors, and better-informed caregivers and clinicians.

---

## 2. Goals & success metrics

**Primary goals**

* Deliver a secure mobile + web product that connects to consumer smartwatches and collects HR, BP (if available), SpO₂, activity, and ECG-like data in near real-time.
* Provide continuous AI screening ("AI doctors") that analyze streams and generate an end-of-day clinical summary (trend, concerns, recommended actions).
* Provide automatic emergency detection (e.g., suspected heart attack, severe arrhythmia, acute panic attack) and escalation: call local emergency services (where supported) or alert caretaker(s).
* Allow users/caregivers to upload lab/test reports; system reads (OCR), extracts findings, and produces a symptoms/diagnosis-like report.
* **Enable verified real doctors to register, verify credentials, and provide virtual consultations, second opinions, and report verification via the platform.**

**Success metrics** (targets for MVP → 6 months)

* Device connectivity success rate ≥ 90% for supported devices during active sessions.
* False positive emergency alert rate < 5% (initial target) and false negative rate measured via test dataset - improve iteratively.
* 80% of caregivers rate daily AI reports as "useful" or better in usability testing.
* 90% of doctor consultations rated 4★ or higher in pilot testing.
* End-to-end system uptime ≥ 99.5% for monitoring services; emergency escalation SLA < 60s from detection to action.

---

## 3. Personas

* **Primary patient (low digital literacy):** Elderly person with mild cognitive impairment; uses phone minimally, relies on caregiver; wears a smartwatch.
* **Caregiver:** Family member or hired caregiver who monitors daily reports and receives critical alerts; wants simple UI and urgent escalation controls.
* **Clinician / Telehealth Doctor:** Licensed medical professional who reviews AI reports, verifies system findings, and provides real-time consultation or prescription (if local laws permit).
* **Admin / System Integrator:** DevOps or product owner overseeing device integrations, doctor verification, and emergency contact workflows.

---

## 4. Key features (MVP then enhancements)

### MVP features (must-have)

1. **Device onboarding & connectivity**

   * Connect to major wearable platforms via their APIs: Google Fit, Apple HealthKit, Fitbit, Garmin Connect, Samsung Health, and supported BLE devices.
   * Live push / periodic pull to capture heart rate, BP (if supported), SpO₂, steps, and activity.
2. **Continuous AI screening service**

   * Lightweight streaming analytics that runs simple rule-based + ML models to flag anomalies (tachycardia, bradycardia, irregular rhythms, hypoxia, abnormal BP ranges).
3. **AI Doctors & end-of-day report**

   * Generate a daily summary: vitals trends, flagged events (with timestamps), symptom inference, and recommended next steps (e.g., consult GP, urgent visit).
4. **Emergency detection & escalation**

   * Predefined emergency triggers + human-configurable thresholds.
   * On trigger: attempt to reach local emergency number via third-party provider; if not possible, immediately call/notify designated caretaker(s) via SMS/call/push with location (if permission granted).
   * UI button for user to manually trigger emergency.
5. **Test report ingestion**

   * Allow users/caregivers to upload PDF/image lab reports.
   * OCR + clinical NLP pipeline to extract key findings and produce a concise symptoms/insights report.
6. **Caregiver dashboard & settings**

   * See live status, daily reports, historical charts, and emergency contact configuration.
7. **Real doctor integration (new feature)**

   * Doctors can sign up, submit credentials, and undergo verification by the platform admin.
   * Once verified, doctors gain access to a professional dashboard showing anonymized or consented patient data and reports.
   * Patients and caregivers can request virtual consultations, second opinions, or manual reviews of AI-generated reports.
   * Doctors can annotate reports, leave recommendations, and flag patients needing urgent care.
8. **Data privacy, consent & audit**

   * Explicit consent flows for data sharing, emergency calls, and location sharing.
   * Doctor access governed by role-based permissions and consented connections.
   * Audit logs of alerts, doctor reviews, and actions.

### Enhancements (post-MVP)

* Integration with telemedicine services for one-click clinician consult.
* Advanced arrhythmia detection from ECG strips (where device exposes ECG data).
* Offline/fallback detection (local device-level detection if connectivity lost).
* AI + human doctor co-review dashboard with confidence scoring comparison.

---

## 5. User flows (high level)

1. **Onboarding**: User account creation → consent screens → device pairing → baseline vitals capture → caregiver linking → optional doctor assignment.
2. **Daily monitoring**: Device streams data → screening service flags anomalies → AI Doctor aggregates events → end-of-day report delivered to patient, caregiver, and optionally assigned doctor.
3. **Emergency flow**: Screening detects emergency → system verifies → start escalation: call EMS, SMS/call caregiver, and notify assigned doctor.
4. **Report ingestion**: User uploads report → OCR + NLP → parsed results → added to memory journal and clinician summary.
5. **Doctor consultation flow**: User requests consultation → available doctor notified → secure video/text session initiated → doctor accesses vitals history and reports.

---

## 6. Functional requirements (abbreviated)

* FR1: Support OAuth / API-based connections to HealthKit/Google Fit/Fitbit/Garmin.
* FR2: Real-time ingestion pipeline with queuing and processing microservices to run screening models.
* FR3: Emergency engine that can perform actions (call, SMS, push) with configurable priority rules.
* FR4: OCR + Clinical NLP pipeline using pretrained medical entity models.
* FR5: Role-based access control for patient, caregiver, clinician.
* FR6: End-of-day report generator with downloadable PDF.
* **FR7: Doctor management system**: Registration, verification, dashboard, consultations, and patient linking.

---

## 7. Non-functional requirements

* NFR1 (Security & Privacy): Encrypt data at rest and transit (TLS + AES-256). Implement RBAC, 2FA for doctors.
* NFR2 (Availability): 24/7 monitoring with failover.
* NFR3 (Latency): Emergency notifications sent within 60 seconds.
* NFR4 (Scalability): Handle thousands of concurrent device and doctor sessions.
* NFR5 (Compliance): HIPAA/GDPR compliance.

---

## 8. Data model (additions)

* `Doctor` (id, name, specialization, licenseNo, verified, contactInfo)
* `Consultation` (id, doctorId, patientId, timestamp, notes, reportRef, recommendations)
* `VitalsStream`, `Event`, `DailyReport`, `UploadedReport` (as before)

---

## 9. Integrations & APIs

* **Wearable APIs:** Apple HealthKit, Google Fit, Fitbit, Garmin.
* **Communication:** Twilio, Nexmo, or local gateway.
* **OCR/NLP:** Tesseract, Google Vision, MedNLP.
* **Emergency services:** Local EMS APIs or phone-call routing.
* **Doctor integration:** Internal REST API for doctor registration, verification, consultations (`/doctors/register`, `/consultations/start`, `/consultations/notes`).

---

## 10. Security & ethical considerations

* Explicit consents for doctor access.
* All doctor sessions are logged and encrypted.
* Human doctors cannot override AI conclusions without consent, ensuring transparency.

---

## 11. Risks & mitigations

* **Unauthorized doctor access:** mitigate with multi-layer verification.
* **Data breaches:** strong encryption + access audits.
* **AI vs human conflict:** clearly separate AI suggestions from licensed medical advice.

---

## 12. Implementation plan (added doctor milestone)

* Week 15–18: Implement Doctor Management & Verification portal.
* Week 19–22: Integrate doctor dashboards and consultation module.
* Week 23–26: Testing doctor flows alongside caregiver and emergency workflows.

---

# Lovable prompt — updated version

> **Project:** NeuralTrace — AI-powered continuous health & memory assistant with real doctor integration.
>
> **Deliverables (first sprint):**
>
> 1. Prioritized backlog for MVP (Device Integration, Screening, Emergency Orchestrator, Reports & NLP, Caregiver & Doctor Dashboards, Security & Consent).
> 2. Architecture diagram with new doctor microservice (verification, consultation, feedback).
> 3. API contract including doctor routes: `/doctors/register`, `/doctors/verify`, `/consultations/start`, `/consultations/notes`.
> 4. Example doctor-patient consultation dataset.
> 5. Minimal UI flow for doctor login, dashboard, report review, and consultation screen.
>
> **AI specifics:** Same as before, plus AI-to-doctor feedback interface for human-AI hybrid diagnosis.
>
> **Acceptance:**
>
> * Doctor verification flow works end-to-end.
> * Doctor dashboard shows assigned patient vitals and reports.
> * Consultation module allows secure exchange of text and notes.

---



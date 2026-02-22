# NeuralTrace Setup Guide

Quick setup guide for your FYP demo.

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
Your `.env` file is already configured with Supabase credentials.

### Step 3: Start Development Server
```bash
npm run dev
```

Application will be available at: `http://localhost:8080`

---

## 👥 Create Test Accounts

### Patient Account
1. Go to `http://localhost:8080/auth`
2. Click "Sign Up" tab
3. Select "Patient" button
4. Fill in:
   - Full Name: `Test Patient`
   - Email: `patient@demo.com`
   - Phone: `+92 300 1234567`
   - Password: `demo123`
5. Click "Create Account"
6. Login with the credentials
7. Go to Settings → Emergency tab
8. Configure emergency contact:
   - Name: `Emergency Contact`
   - Phone: `+92 300 7654321`
9. Save

### Doctor Account
1. Go to `http://localhost:8080/auth`
2. Click "Sign Up" tab
3. Select "Doctor" button
4. Fill in:
   - Full Name: `Dr. Ahmed Khan`
   - Email: `doctor@demo.com`
   - Phone: `+92 321 9876543`
   - Specialty: `Cardiology`
   - License Number: `PMC-12345`
   - Password: `demo123`
5. Click "Create Account"
6. Login with the credentials

### Admin Account (Manual Database Setup)
Admin accounts must be created by updating the database directly:

1. Create a regular account (patient or doctor)
2. Go to Supabase Dashboard → Table Editor
3. Find the `user_roles` table
4. Find the user's row
5. Change `role` from `patient` or `doctor` to `admin`
6. Save

**OR** use this SQL in Supabase SQL Editor:
```sql
-- First create the account via signup, then run this:
UPDATE user_roles 
SET role = 'admin' 
WHERE user_id = 'USER_ID_HERE';
```

---

## 🧪 Test Data Setup

### Add Sample Vitals (as Patient)
1. Login as patient
2. Go to Patient Dashboard
3. Enter vitals:
   - **Normal**: HR: 75, BP: 120/80, O2: 98%, Temp: 37°C
   - **Warning**: HR: 95, BP: 145/92, O2: 96%, Temp: 37.5°C
   - **Critical**: HR: 125, BP: 180/110, O2: 88%, Temp: 39°C
4. Save each set to see different AI screening results

### Assign Patient to Doctor
1. Login as doctor
2. Click "Assign Patient" button
3. Search for the patient account
4. Add notes (optional)
5. Click "Assign"

### Test Emergency System
1. Login as patient
2. Ensure emergency contact is configured
3. Go to Emergency tab
4. Click "🚨 EMERGENCY ALERT" button
5. Review the confirmation dialog
6. **For demo**: Click Cancel (don't actually send)
7. **For testing**: Click "Send Emergency Alert" to test the flow

---

## 📊 Verify Everything Works

### Checklist
- [ ] Patient can login and see dashboard
- [ ] Patient can enter vitals
- [ ] AI screening shows results
- [ ] Doctor can login and see dashboard
- [ ] Doctor can assign patients
- [ ] Doctor can see patient vitals
- [ ] Doctor can view alerts
- [ ] Admin can login and see analytics
- [ ] Emergency button shows Pakistan numbers
- [ ] Settings page loads correctly

---

## 🐛 Common Issues & Fixes

### Issue: "Profile Missing" Error
**Cause**: Database trigger didn't create profile
**Fix**: 
1. Go to Supabase SQL Editor
2. Run:
```sql
-- Check if profile exists
SELECT * FROM profiles WHERE email = 'your-email@demo.com';

-- If missing, create it:
INSERT INTO profiles (id, email, full_name)
VALUES ('USER_ID', 'your-email@demo.com', 'Your Name');
```

### Issue: "Role Missing" Error
**Cause**: User role not assigned
**Fix**:
1. Go to Supabase SQL Editor
2. Run:
```sql
-- Check if role exists
SELECT * FROM user_roles WHERE user_id = 'USER_ID';

-- If missing, create it:
INSERT INTO user_roles (user_id, role)
VALUES ('USER_ID', 'patient'); -- or 'doctor' or 'admin'
```

### Issue: AI Screening Not Working
**Cause**: Edge function not deployed or API key missing
**Fix**: 
- System will use rule-based fallback automatically
- Check console for errors
- Verify Edge Functions are deployed in Supabase

### Issue: Can't See Patients (Doctor)
**Cause**: No patients assigned
**Fix**:
1. Create a patient account
2. Login as doctor
3. Use "Assign Patient" button
4. Select the patient

### Issue: Emergency Button Disabled
**Cause**: No emergency contact configured
**Fix**:
1. Login as patient
2. Go to Settings → Emergency
3. Fill in emergency contact details
4. Save

---

## 🎯 Pre-Demo Checklist

### 30 Minutes Before Demo
- [ ] Start the application (`npm run dev`)
- [ ] Test all three account types (patient, doctor, admin)
- [ ] Clear browser cache
- [ ] Close unnecessary browser tabs
- [ ] Test internet connection
- [ ] Have backup screenshots ready
- [ ] Review DEMO_GUIDE.md

### 5 Minutes Before Demo
- [ ] Application is running
- [ ] Test accounts are working
- [ ] Browser is in full-screen mode
- [ ] Presentation slides are ready
- [ ] Water/coffee nearby
- [ ] Deep breath, you got this! 💪

---

## 📱 Mobile Testing (Optional)

To test on mobile device:
1. Find your computer's IP address:
   ```bash
   ipconfig
   ```
2. Look for IPv4 Address (e.g., 192.168.1.100)
3. On mobile browser, go to: `http://YOUR_IP:8080`
4. Test responsive design

---

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

---

## 📞 Emergency Contacts (For Demo)

When showing emergency system, mention these Pakistan numbers:
- **115** - National Ambulance Service
- **1122** - Rescue Services (Punjab, KP, Balochistan)
- **1021** - Edhi Ambulance (Nationwide 24/7)

---

## 🎓 Final Tips

1. **Practice the demo flow** at least twice
2. **Know your test account credentials** by heart
3. **Have backup screenshots** in case of technical issues
4. **Explain as you click** - narrate what you're doing
5. **Stay calm** - if something breaks, explain what should happen
6. **Emphasize Pakistan context** - local emergency numbers, healthcare challenges
7. **Be ready for questions** - review DEMO_GUIDE.md Q&A section

---

Good luck! 🚀

**Remember**: You built this. You understand it. You can explain it. Be confident!

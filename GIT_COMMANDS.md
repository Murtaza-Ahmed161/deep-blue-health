# Git Commands for Patient Assignment System

## Create and Push New Branch

```bash
# Create and switch to new branch
git checkout -b feature/patient-assignment-system

# Add all changes
git add .

# Commit with descriptive message
git commit -m "feat: implement complete patient assignment system

- Add patient-doctor assignment functionality
- Implement assignment dialog with patient search
- Add RLS policies for secure data access
- Create assignment service with validation
- Add real-time dashboard updates
- Prevent duplicate assignments
- Show only unassigned patients to doctors

Closes: Patient assignment system requirements"

# Push to remote repository
git push -u origin feature/patient-assignment-system
```

## Alternative: Stage Files Individually

```bash
# Create branch
git checkout -b feature/patient-assignment-system

# Stage core implementation files
git add src/services/patientAssignmentService.ts
git add src/components/doctor/AssignPatientDialog.tsx
git add src/hooks/useDoctorPatients.ts
git add src/types/doctor.ts

# Stage database migration
git add doctor-assignment-migration.sql

# Stage UI updates
git add src/pages/DoctorDashboard.tsx

# Stage documentation
git add PATIENT_ASSIGNMENT_SYSTEM.md

# Commit
git commit -m "feat: implement patient assignment system"

# Push
git push -u origin feature/patient-assignment-system
```

## Files to be Committed

### New Files
- `src/services/patientAssignmentService.ts`
- `src/components/doctor/AssignPatientDialog.tsx`
- `doctor-assignment-migration.sql`
- `PATIENT_ASSIGNMENT_SYSTEM.md`

### Modified Files
- `src/pages/DoctorDashboard.tsx`
- `src/hooks/useDoctorPatients.ts`
- `src/types/doctor.ts`

### Removed Files (cleaned up)
- `fix-existing-user-roles.sql`
- `fix-user-roles-rls-policy.sql`
- `fix-assignment-insert-policy.sql`

## Branch Description

**Branch Name**: `feature/patient-assignment-system`

**Description**: Complete implementation of patient-doctor assignment system with secure role-based access, real-time updates, and comprehensive validation.

**Ready for**: Code review and merge to main branch
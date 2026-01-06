# Requirements Document

## Introduction

This specification defines the requirements for Phase 2: Real Emergency Escalation system for NeuralTrace. The system must provide honest, real emergency notification capabilities while maintaining medical safety standards and clear failure communication.

## Glossary

- **Emergency_System**: The emergency escalation subsystem responsible for handling patient emergency requests
- **Patient**: A user with patient role who can trigger emergency alerts
- **Emergency_Event**: A database record of an emergency trigger with associated metadata
- **Notification_Channel**: The communication method used to alert emergency contacts (email or SMS)
- **Consent_Manager**: The subsystem handling location consent and privacy compliance
- **Audit_Trail**: Complete logging system for emergency events and notifications for medical accountability

## Requirements

### Requirement 1: Emergency Event Database Storage

**User Story:** As a system administrator, I want all emergency events stored in a secure database, so that we have complete audit trails for medical accountability and regulatory compliance.

#### Acceptance Criteria

1. WHEN an emergency is triggered, THE Emergency_System SHALL create a record in the emergency_events table
2. THE Emergency_System SHALL store patient_id, triggered_by, timestamp, location (if consented), status, and notes for each event
3. THE Emergency_System SHALL enforce Row Level Security so patients can only create events for themselves
4. WHEN storing emergency events, THE Emergency_System SHALL validate all required fields before insertion
5. THE Emergency_System SHALL assign initial status as 'pending' for all new emergency events

### Requirement 2: Consent-Aware Location Capture

**User Story:** As a patient, I want to be asked for location permission only when I trigger an emergency, so that my privacy is protected while enabling location-based emergency response when I consent.

#### Acceptance Criteria

1. WHEN a patient triggers an emergency, THE Consent_Manager SHALL request explicit location permission
2. IF location consent is granted, THEN THE Emergency_System SHALL capture and store the current location
3. IF location consent is denied, THEN THE Emergency_System SHALL proceed without location data
4. THE Consent_Manager SHALL log all location consent decisions in the consent_audit table
5. THE Emergency_System SHALL only store location data for the specific emergency event, not persistently

### Requirement 3: Real Notification Delivery

**User Story:** As a patient, I want my emergency alert to reach a real person through email or SMS, so that someone is actually notified of my emergency situation.

#### Acceptance Criteria

1. WHEN an emergency event is created, THE Notification_Channel SHALL attempt to send a real notification via email or SMS
2. THE Notification_Channel SHALL include patient identity, timestamp, latest vitals (if available), and location (if consented) in the notification
3. THE Notification_Channel SHALL include a clear disclaimer stating "This does not contact emergency services"
4. WHEN notification delivery succeeds, THE Emergency_System SHALL update the event status to 'sent'
5. WHEN notification delivery fails, THE Emergency_System SHALL update the event status to 'failed' and log the error

### Requirement 4: Honest Emergency UI Feedback

**User Story:** As a patient, I want to know immediately whether my emergency alert succeeded or failed, so that I can take appropriate action if the system cannot help me.

#### Acceptance Criteria

1. WHEN the emergency button is pressed, THE Emergency_System SHALL show a loading state during processing
2. IF notification succeeds, THEN THE Emergency_System SHALL display "Emergency alert sent" with recipient information
3. IF notification fails, THEN THE Emergency_System SHALL display "Failed to notify — please contact local emergency services manually"
4. THE Emergency_System SHALL never show success states for failed operations
5. THE Emergency_System SHALL provide clear next steps for manual emergency contact when automated notification fails

### Requirement 5: Complete Audit Trail

**User Story:** As a system administrator, I want detailed logs of all emergency notifications, so that we can ensure accountability and improve the emergency response system.

#### Acceptance Criteria

1. THE Emergency_System SHALL create a record in emergency_notifications table for each notification attempt
2. THE Emergency_System SHALL log event_id, recipient, channel, status, and error_message for each notification
3. WHEN notifications fail, THE Emergency_System SHALL store the complete error message for debugging
4. THE Emergency_System SHALL enable querying of notification history by event, patient, or time range
5. THE Emergency_System SHALL maintain notification logs for regulatory compliance and system improvement

### Requirement 6: Medical Safety Compliance

**User Story:** As a healthcare compliance officer, I want the emergency system to follow medical safety standards, so that patient safety is never compromised by system behavior.

#### Acceptance Criteria

1. THE Emergency_System SHALL never simulate or mock emergency notifications
2. THE Emergency_System SHALL never imply that EMS or ambulance services are automatically dispatched
3. THE Emergency_System SHALL never show fake delivery confirmations
4. WHEN any emergency operation fails, THE Emergency_System SHALL make the failure visible to the patient
5. THE Emergency_System SHALL prioritize medical safety over UI polish in all emergency scenarios

### Requirement 7: Emergency Button Integration

**User Story:** As a patient, I want to trigger an emergency alert through a clearly visible emergency button, so that I can quickly request help when needed.

#### Acceptance Criteria

1. THE Emergency_System SHALL provide an emergency button accessible from the patient dashboard
2. WHEN the emergency button is pressed, THE Emergency_System SHALL immediately begin the emergency escalation process
3. THE Emergency_System SHALL prevent accidental triggers through confirmation dialog
4. THE Emergency_System SHALL disable the emergency button during processing to prevent duplicate events
5. THE Emergency_System SHALL re-enable the emergency button after processing completes (success or failure)

### Requirement 8: Notification Content Standards

**User Story:** As an emergency contact, I want to receive complete and accurate information about the patient's emergency, so that I can respond appropriately.

#### Acceptance Criteria

1. THE Notification_Channel SHALL include the patient's full name and contact information
2. THE Notification_Channel SHALL include the exact timestamp of the emergency trigger
3. IF vitals data is available, THEN THE Notification_Channel SHALL include the most recent vital signs
4. IF location is consented, THEN THE Notification_Channel SHALL include the patient's current location
5. THE Notification_Channel SHALL include clear instructions that this is not an official emergency service contact
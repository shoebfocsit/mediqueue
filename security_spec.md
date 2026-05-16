# Security Specification: MediQueue

## 1. Data Invariants

1.  **Identity Alignment**: Most documents (MedicalReport, Prescription, ChatSession) belong to a `patient_id`. Only that patient or an authorized doctor can see them.
2.  **Relational Access**: Doctors derive access to patient data based on being the `assigned_doctor_id` or having an active `QueueEntry`.
3.  **Immutable Creation**: Fields like `created_at`, `patient_id`, and `doctor_id` should be immutable after creation to prevent identity spoofing or data hijacking.
4.  **Status Workflow**: `QueueEntry.status` must transition linearly: `waiting` -> `in_progress` -> `done`/`skipped`.
5.  **Admin Primacy**: Admins (defined in an `admins` collection, or by role in `profiles`) have override permissions.

## 2. The "Dirty Dozen" Payloads

These payloads represent malicious attempts to bypass security.

1.  **Identity Spoofing**: Patient A trying to read Patient B's medical report.
2.  **Role Escalation**: Patient trying to update their own role to 'admin' in `profiles`.
3.  **Orphaned Write**: Creating a `QueueEntry` with a non-existent `doctor_id`.
4.  **Shadow Update**: Updating a medical report's `ai_diagnosis` directly from the client.
5.  **Status Shortcutting**: Moving a `QueueEntry` from `waiting` directly to `done` without `in_progress`.
6.  **Immutable Hijack**: Changing the `patient_id` of an existing prescription.
7.  **Resource Poisoning**: Injecting 2MB of junk text into a `notes` field.
8.  **List Scrape**: Authenticated user trying to `list` all reports in the system without a filter.
9.  **Email Spoof**: Setting `email_verified: true` in a profile update when not verified.
10. **Admin Forge**: Trying to create a document in the `admins` collection.
11. **Future Timestamp**: Setting `created_at` to a date in the year 2099.
12. **Cross-Doctor Access**: Doctor A trying to mark Doctor B's patient as `done`.

## 3. The Test Runner Plan

We will create `firestore.rules.test.ts` (conceptual for this spec) to ensure:
- All 12 "Dirty Dozen" payloads result in `PERMISSION_DENIED`.
- Authorized operations (Patient reading own profile, Doctor updating own queue) result in `SUCCESS`.

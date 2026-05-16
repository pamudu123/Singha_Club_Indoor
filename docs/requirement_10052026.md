Yes, add this adjustment as a new requirement.

# New Requirement: Booking Confirmation Document

## 1. When document should be generated

Once the official **approves** the booking, the system shall automatically generate a **Booking Confirmation / Invoice style PDF**.

This document shall be sent to:

1. User’s WhatsApp number
2. User’s email, if provided

The same PDF document should be used for both WhatsApp and email.

WhatsApp supports document messages where the user can tap and download the attached document.

# 2. Updated flow after approval

1. Official approves booking through WhatsApp or admin dashboard.
2. Booking status changes to **Approved**.
3. System generates confirmation PDF.
4. System sends WhatsApp approval message with PDF attached.
5. System sends email with the same PDF attached, if email is available.
6. System stores PDF copy in the booking record.
7. Admin can view or resend the document from the dashboard.

# 3. PDF document name

Recommended file name:

`Singha_Club_Booking_SCB-2026-000123.pdf`

# 4. PDF document template

## Singha Club

### Indoor Track Booking Confirmation

**Booking Status:** Approved
**Booking Reference:** SCB-2026-000123
**Issued Date:** 20 May 2026

---

## Customer Details

**Name:** Pasindu Ranasinghe
**NIC:** ********123V
**WhatsApp:** +94 XX XXX XXXX
**Email:** [user@email.com](mailto:user@email.com)

---

## Booking Details

**Track:** Track 1
**Date:** 20 May 2026
**Time:** 6.00 PM to 7.00 PM
**Number of People:** 4

---

## Additional Items Requested

Bats, Balls, Water bottles

**Note:** Please communicate with officials to confirm these items. Additional charges may apply.

---

## Payment Details

**Payment Proof:** Submitted
**Payment Review:** Accepted by official
**Approved By:** Official Name
**Approved Time:** 20 May 2026, 10.35 AM

---

## Remarks

Need water bottles before the session.

---

## Important Notes

1. Please show this booking confirmation when you arrive.
2. The booking is valid only for the approved date, time, and track.
3. Additional items are subject to availability.
4. Additional charges may apply for requested items.
5. Please contact Singha Club officials for any clarification.

---

**Thank you for booking with Singha Club.**

# 5. WhatsApp message template

Your Singha Club indoor track booking has been approved.

Reference: SCB-2026-000123
Track: 1
Date: 20 May 2026
Time: 6.00 PM to 7.00 PM
People: 4

Your booking confirmation document is attached.

Please show this confirmation when you arrive.

# 6. Email template

Dear Pasindu,

Your Singha Club indoor track booking has been approved.

Booking Reference: SCB-2026-000123
Track: 1
Date: 20 May 2026
Time: 6.00 PM to 7.00 PM
Number of People: 4

Your booking confirmation document is attached to this email.

Please show this confirmation when you arrive.

Thank you,
Singha Club

# 7. Admin dashboard adjustment

Admin dashboard shall include:

1. View generated booking confirmation PDF
2. Download PDF
3. Resend PDF to WhatsApp
4. Resend PDF to email
5. View WhatsApp delivery status
6. View email delivery status
7. Regenerate PDF if booking details are corrected before approval

# 8. Database adjustment

Add these fields to the booking table:

1. confirmation_pdf_path
2. confirmation_pdf_generated_at
3. whatsapp_confirmation_sent_at
4. whatsapp_confirmation_status
5. email_confirmation_sent_at
6. email_confirmation_status
7. confirmation_resend_count

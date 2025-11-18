#!/bin/bash
#
# CREATE TEST EVIDENCE FILES
# For testing Bates numbering system
#

set -e

EVIDENCE_RAW="/home/user/agentic-flow/docs/pro-se-platform/evidence-raw"

mkdir -p "$EVIDENCE_RAW"

echo "Creating test evidence files..."
echo ""

# Create test documents
cat > "$EVIDENCE_RAW/email-castillo-march-2024.txt" << 'EOF'
From: Marc Castillo <castillo@example.com>
To: Jennifer Babchuk <jbabchuk@example.com>
Date: March 15, 2024
Subject: Request for Accommodation

Jennifer,

I am writing to formally request a reasonable accommodation for my disability.
As discussed during our interactive process meetings, I need modified work hours
to address my ongoing medical condition.

I have been employed with Schwab for 5 years and have consistently met performance
expectations. This accommodation should not impact my job duties.

Please let me know your response within 5 business days.

Best regards,
Marc Castillo
EOF

cat > "$EVIDENCE_RAW/sedgwick-denial-response-april.txt" << 'EOF'
FROM: Sedgwick Claims Management Services
TO: Marc Castillo
DATE: April 2, 2024
SUBJECT: Claim Status - DENIED

After review of your claims for Short-Term Disability benefits submitted on March 20, 2024,
we have determined that your claim does not meet the eligibility criteria under the plan.

Sedgwick has made this determination based on the documentation submitted. The plan requires
that participants meet specific medical criteria which are not satisfied in this case.

This denial is final. If you believe this determination is incorrect, you may appeal within
60 days of this letter.

Sedgwick Claims Management Services
EOF

cat > "$EVIDENCE_RAW/fmla-interference-memo.txt" << 'EOF'
INTERNAL MEMORANDUM
TO: File
FROM: Sara Fowler, HR Department
DATE: May 10, 2024
RE: Employee Performance Issue - Marc Castillo

During today's discussion with Marc Castillo regarding his approved FMLA leave,
I reminded him that taking additional leave could be detrimental to his career
advancement within our organization.

While technically protected, we made it clear that future leave requests would
be "noted" in his file.

This memo is for documentation purposes only.

[Signed] Sara Fowler
EOF

cat > "$EVIDENCE_RAW/eeoc-charge-narrative.txt" << 'EOF'
EEOC CHARGE NARRATIVE
Case: Castillo v. Charles Schwab & Sedgwick Claims Management Services
Charging Party: Marc Castillo

ALLEGATIONS OF DISCRIMINATION AND RETALIATION:

I am filing this charge to formally allege that Charles Schwab and Sedgwick Claims
Management Services engaged in disability discrimination and retaliation in violation of
the Americans with Disabilities Act (ADA), Family and Medical Leave Act (FMLA), and
other applicable employment laws.

FACTS:
1. I requested reasonable accommodation for my disability in March 2024
2. Sedgwick unlawfully denied my disability benefits in April 2024
3. HR explicitly threatened retaliation for taking FMLA leave in May 2024
4. Despite my tenure and performance record, I was passed over for promotion
5. HR continued negative treatment following my accommodation requests

This pattern of conduct constitutes disability discrimination and unlawful retaliation.

[Signed] Marc Castillo
EOF

cat > "$EVIDENCE_RAW/babchuk-email-response.txt" << 'EOF'
From: Jennifer Babchuk <jbabchuk@example.com>
To: Marc Castillo <castillo@example.com>
Date: March 20, 2024
Subject: Re: Accommodation Request

Marc,

I have reviewed your accommodation request with HR and Legal. While we are
committed to compliance, we cannot approve the specific modification you requested.

However, we are open to discussing alternative arrangements. Please coordinate
with Sara Fowler in HR for further discussion.

Jennifer Babchuk
Department Manager
EOF

# Create some additional varied file types for realism
cat > "$EVIDENCE_RAW/disability-medical-documentation.txt" << 'EOF'
MEDICAL DOCUMENTATION
Patient: Marc Castillo
Physician: Dr. Andrei Egorov
Date: February 2024

DIAGNOSIS: Chronic condition requiring workplace accommodation
RESTRICTIONS: Must have flexible schedule for medical appointments and treatments
DURATION: Expected 12-18 months
RECOMMENDATION: Modified work hours, remote work options approved

This patient has been under my care for 2 years and the recommended accommodations
are medically necessary and reasonable.

Dr. Andrei Egorov, MD
EOF

cat > "$EVIDENCE_RAW/schwab-company-policy.txt" << 'EOF'
CHARLES SCHWAB - EMPLOYMENT POLICIES
Section 4.5: Disability Accommodations

Charles Schwab is committed to providing reasonable accommodations to employees
with disabilities as required by the Americans with Disabilities Act (ADA).

All accommodation requests must be submitted in writing to the HR Department
and will be evaluated within 10 business days.

The interactive process requires good faith discussion between the employee,
management, and HR to identify effective accommodations.

This policy ensures compliance with all applicable employment laws and regulations.
EOF

cat > "$EVIDENCE_RAW/timeline-of-events.txt" << 'EOF'
TIMELINE OF KEY EVENTS
Castillo v. Schwab & Sedgwick

March 15, 2024 - Marc Castillo submits formal accommodation request
March 20, 2024 - Jennifer Babchuk responds indicating HR involvement
April 2, 2024 - Sedgwick denies short-term disability claims
May 10, 2024 - Sara Fowler issues warning memo about FMLA leave
May 15, 2024 - Marc Castillo passes over for promotion despite qualifications
June 1, 2024 - HR continues negative treatment
June 15, 2024 - Marc Castillo files EEOC charge
EOF

echo "✓ Created test evidence files in: $EVIDENCE_RAW"
echo ""
ls -lah "$EVIDENCE_RAW"
echo ""
echo "Test data ready for Bates processing!"

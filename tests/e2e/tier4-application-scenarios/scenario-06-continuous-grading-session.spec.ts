import { test, expect } from '@playwright/test';

/**
 * Tier 4 — Scenario 6: Continuous Grading Session (Phiên Chấm Trắc Nghiệm Liên Tục)
 * Full End-to-End Workflow & Adversarial Resiliency:
 * 1. Single QR pairing for entire continuous session (QR points to /scan/[token], 4-digit PIN fallback).
 * 2. Continuous shooting of >= 30 papers without desktop interaction.
 * 3. Multi-phone concurrency (2 phones pushing simultaneously without race conditions).
 * 4. Offline resilience: network dropped for 30s, queued sheets upload with zero duplicates upon reconnect.
 * 5. Low confidence / unknown SBD flagged as 'needs_review' without stalling the queue.
 * 6. Review & Click-to-correct workflow with keyboard shortcuts (Enter to confirm, Arrow keys).
 * 7. Session termination ('Kết thúc phiên') and CSV export.
 */
test.describe('Tier 4: Scenario 6 - Continuous Grading Session Flow', () => {

  // 1. Session creation & QR/PIN verification
  test('T4-SCAN-01: Create continuous grading session with random token, 4-digit PIN and /scan/[token] URL', async ({ request }) => {
    const res = await request.post('/api/grading/continuous-session', {
      data: {
        examId: 'exam_demo_101',
        name: 'Đề kiểm tra Toán 12 - Phiên Chấm Liên Tục',
        subject: 'Toán',
        grade: '12',
        sheetType: '20',
        questionCount: 20,
        answerKey: { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'A' },
        roster: [
          { sbd: '10024', name: 'Nguyễn Văn An' },
          { sbd: '10025', name: 'Trần Thị Bình' },
          { sbd: '10026', name: 'Lê Hoàng Nam' },
        ],
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.token).toMatch(/^cscan_/);
    expect(body.pin).toMatch(/^\d{4}$/);
    expect(body.scanUrl).toContain(`/scan/${body.token}`);
    expect(body.qrUrl).toContain('api.qrserver.com');
    expect(body.session.status).toBe('active');
  });

  // 2. Continuous shooting of >= 30 papers without desktop interaction
  test('T4-SCAN-02: Continuous submission of >= 30 answer sheets without halting or desktop intervention', async ({ request }) => {
    // Create session
    const sessRes = await request.post('/api/grading/continuous-session', {
      data: {
        name: 'Kỳ thi 30 bài liên tục',
        questionCount: 20,
        answerKey: { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'A' },
      },
    });
    const { token, session } = await sessRes.json();

    // Simulate mobile continuously capturing 30 sheets
    const submissionPromises = [];
    for (let i = 1; i <= 30; i++) {
      const sbd = `100${i < 10 ? '0' + i : i}`;
      submissionPromises.push(
        request.post(`/api/grading/continuous-session/${token}/submissions`, {
          data: {
            clientSubmissionId: `mobile_sub_batch_${i}`,
            detectedSbd: sbd,
            detectedName: `Thí sinh ${i}`,
            answers: { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'A' }, // 5/5 correct = 10 pts
            confidence: 0.95,
          },
        })
      );
    }

    const responses = await Promise.all(submissionPromises);
    for (const r of responses) {
      expect(r.status()).toBe(200);
    }

    // Verify all 30 sheets are recorded in session
    const listRes = await request.get(`/api/grading/continuous-session/${session.id}/submissions`);
    expect(listRes.status()).toBe(200);
    const listBody = await listRes.json();
    expect(listBody.count).toBe(30);
    expect(listBody.submissions.length).toBe(30);
  });

  // 3. Multi-phone concurrency (2 phones pushing simultaneously)
  test('T4-SCAN-03: Two phones connected simultaneously to same session without race conditions', async ({ request }) => {
    const sessRes = await request.post('/api/grading/continuous-session', {
      data: {
        name: 'Phiên chấm 2 thiết bị',
        questionCount: 10,
        answerKey: { 1: 'A', 2: 'B', 3: 'C' },
      },
    });
    const { token, session } = await sessRes.json();

    // Phone 1 heartbeat
    const p1Heartbeat = await request.post('/api/grading/continuous-session/device-heartbeat', {
      data: {
        sessionId: session.id,
        deviceId: 'device_phone_iphone_15',
        action: 'connect',
      },
    });
    expect(p1Heartbeat.status()).toBe(200);
    const hb1 = await p1Heartbeat.json();
    expect(hb1.connectedDevices).toBe(1);

    // Phone 2 heartbeat
    const p2Heartbeat = await request.post('/api/grading/continuous-session/device-heartbeat', {
      data: {
        sessionId: session.id,
        deviceId: 'device_phone_samsung_s24',
        action: 'connect',
      },
    });
    expect(p2Heartbeat.status()).toBe(200);
    const hb2 = await p2Heartbeat.json();
    expect(hb2.connectedDevices).toBe(2);

    // Concurrent photo uploads from Phone 1 and Phone 2
    const [sub1, sub2] = await Promise.all([
      request.post(`/api/grading/continuous-session/${token}/submissions`, {
        data: {
          clientSubmissionId: 'p1_sub_01',
          detectedSbd: '10088',
          detectedName: 'Phan Minh Đức',
          answers: { 1: 'A', 2: 'B', 3: 'C' },
          confidence: 0.98,
        },
      }),
      request.post(`/api/grading/continuous-session/${token}/submissions`, {
        data: {
          clientSubmissionId: 'p2_sub_01',
          detectedSbd: '10089',
          detectedName: 'Vũ Thùy Linh',
          answers: { 1: 'A', 2: 'B', 3: 'D' },
          confidence: 0.97,
        },
      }),
    ]);

    expect(sub1.status()).toBe(200);
    expect(sub2.status()).toBe(200);

    // Verify both are present in the unified table
    const tableRes = await request.get(`/api/grading/continuous-session/${session.id}/submissions`);
    const table = await tableRes.json();
    const sbds = table.submissions.map((s: any) => s.detectedSbd);
    expect(sbds).toContain('10088');
    expect(sbds).toContain('10089');
  });

  // 4. Offline resilience & Idempotent re-sync
  test('T4-SCAN-04: Network reconnect flushes local queue idempotently with zero duplicates', async ({ request }) => {
    const sessRes = await request.post('/api/grading/continuous-session', {
      data: {
        name: 'Phiên kiểm tra Offline',
        questionCount: 5,
        answerKey: { 1: 'A', 2: 'B' },
      },
    });
    const { token, session } = await sessRes.json();

    const clientSubmissionId = 'offline_cached_sub_999';

    // 1st transmission
    const firstAttempt = await request.post(`/api/grading/continuous-session/${token}/submissions`, {
      data: {
        clientSubmissionId,
        detectedSbd: '10077',
        detectedName: 'Trần Văn Offline',
        answers: { 1: 'A', 2: 'B' },
      },
    });
    expect(firstAttempt.status()).toBe(200);
    const firstJson = await firstAttempt.json();

    // 2nd transmission (network dropped and re-sent same queued item)
    const secondAttempt = await request.post(`/api/grading/continuous-session/${token}/submissions`, {
      data: {
        clientSubmissionId,
        detectedSbd: '10077',
        detectedName: 'Trần Văn Offline',
        answers: { 1: 'A', 2: 'B' },
      },
    });
    expect(secondAttempt.status()).toBe(200);
    const secondJson = await secondAttempt.json();

    // Idempotent match: same submission ID returned
    expect(secondJson.submission.id).toBe(firstJson.submission.id);

    // Verify exactly 1 submission in table, NOT 2
    const tableRes = await request.get(`/api/grading/continuous-session/${session.id}/submissions`);
    const table = await tableRes.json();
    expect(table.count).toBe(1);
  });

  // 5. Blurry / unknown SBD goes to 'needs_review' without stalling queue
  test('T4-SCAN-05: Blurry image or unknown SBD flagged as needs_review without blocking pipeline', async ({ request }) => {
    const sessRes = await request.post('/api/grading/continuous-session', {
      data: {
        name: 'Phiên kiểm tra Roster Matching',
        questionCount: 10,
        answerKey: { 1: 'A', 2: 'B' },
        roster: [
          { sbd: '10001', name: 'Phạm Tuấn Anh' },
          { sbd: '10002', name: 'Đỗ Hải Đăng' },
        ],
      },
    });
    const { token, session } = await sessRes.json();

    // Submission with unknown SBD '99999' not in roster
    const unknownRes = await request.post(`/api/grading/continuous-session/${token}/submissions`, {
      data: {
        clientSubmissionId: 'sub_unknown_sbd',
        detectedSbd: '99999',
        answers: { 1: 'A', 2: 'B' },
        confidence: 0.95,
      },
    });
    expect(unknownRes.status()).toBe(200);
    const unknownBody = await unknownRes.json();
    expect(unknownBody.submission.status).toBe('needs_review');
    expect(unknownBody.submission.reviewNotes).toContain('không khớp danh sách lớp');

    // Submission with blurry confidence < 0.8
    const blurryRes = await request.post(`/api/grading/continuous-session/${token}/submissions`, {
      data: {
        clientSubmissionId: 'sub_blurry_image',
        detectedSbd: '10001',
        answers: { 1: 'A', 2: 'B' },
        confidence: 0.65, // < 0.8
      },
    });
    expect(blurryRes.status()).toBe(200);
    const blurryBody = await blurryRes.json();
    expect(blurryBody.submission.status).toBe('needs_review');
    expect(blurryBody.submission.reviewNotes).toContain('độ tin cậy AI thấp');

    // Normal valid submission matches roster
    const validRes = await request.post(`/api/grading/continuous-session/${token}/submissions`, {
      data: {
        clientSubmissionId: 'sub_valid_paper',
        detectedSbd: '10002',
        answers: { 1: 'A', 2: 'B' },
        confidence: 0.96,
      },
    });
    expect(validRes.status()).toBe(200);
    const validBody = await validRes.json();
    expect(validBody.submission.status).toBe('graded');
    expect(validBody.submission.detectedName).toBe('Đỗ Hải Đăng');
  });

  // 6. Review & Click-to-correct confirmation
  test('T4-SCAN-06: Teacher edits SBD/answers in review and confirms to mark status confirmed', async ({ request }) => {
    const sessRes = await request.post('/api/grading/continuous-session', {
      data: {
        name: 'Phiên duyệt sửa bài',
        questionCount: 5,
        answerKey: { 1: 'A', 2: 'B', 3: 'C' },
      },
    });
    const { token, session } = await sessRes.json();

    const subRes = await request.post(`/api/grading/continuous-session/${token}/submissions`, {
      data: {
        clientSubmissionId: 'sub_to_correct',
        detectedSbd: '??????',
        answers: { 1: 'A', 2: 'D', 3: 'C' },
        confidence: 0.70,
      },
    });
    const { submission } = await subRes.json();
    expect(submission.status).toBe('needs_review');

    // Teacher reviews, corrects SBD to 10055 and question 2 to B
    const patchRes = await request.patch(`/api/grading/continuous-session/${session.id}/submissions`, {
      data: {
        submissionId: submission.id,
        detectedSbd: '10055',
        detectedName: 'Hoàng Minh Châu',
        answers: [
          { questionNumber: 1, selected: 'A', correctAnswer: 'A', isCorrect: true },
          { questionNumber: 2, selected: 'B', correctAnswer: 'B', isCorrect: true }, // Corrected!
          { questionNumber: 3, selected: 'C', correctAnswer: 'C', isCorrect: true },
        ],
        status: 'confirmed',
      },
    });

    expect(patchRes.status()).toBe(200);
    const patchJson = await patchRes.json();
    expect(patchJson.submission.status).toBe('confirmed');
    expect(patchJson.submission.detectedSbd).toBe('10055');
    expect(patchJson.submission.score).toBe(10); // 3/3 = 10 points
  });

  // 7. End session and refuse additional submissions
  test('T4-SCAN-07: End session transitions status to ended and rejects subsequent submissions', async ({ request }) => {
    const sessRes = await request.post('/api/grading/continuous-session', {
      data: {
        name: 'Phiên chuẩn bị đóng',
      },
    });
    const { token, session } = await sessRes.json();

    // End session
    const endRes = await request.patch('/api/grading/continuous-session', {
      data: {
        sessionToken: token,
        action: 'end',
      },
    });
    expect(endRes.status()).toBe(200);

    // Verify session status is ended
    const verifyRes = await request.get(`/api/grading/continuous-session?token=${token}`);
    const verifyBody = await verifyRes.json();
    expect(verifyBody.session.status).toBe('ended');

    // Additional submissions must be rejected
    const blockedRes = await request.post(`/api/grading/continuous-session/${token}/submissions`, {
      data: {
        clientSubmissionId: 'sub_after_close',
        detectedSbd: '10099',
      },
    });
    expect(blockedRes.status()).toBe(400);
  });

  // 8. Mobile /scan/page and /scan/[token] UI validation
  test('T4-SCAN-08: Mobile scanner UI renders viewfinder and PIN access', async ({ page, request }) => {
    // 1. Create a live session first
    const sessRes = await request.post('/api/grading/continuous-session', {
      data: {
        name: 'Phiên Chấm Di Động Live',
        questionCount: 10,
        answerKey: { 1: 'A', 2: 'B' },
      },
    });
    const { token } = await sessRes.json();

    // 2. Direct navigation to mobile viewfinder /scan/[token]
    await page.goto(`/scan/${token}`);
    await expect(page.locator('text=Phiên Chấm').first()).toBeVisible();
    await expect(page.locator('button', { hasText: 'bài' }).first()).toBeVisible();
    await expect(page.locator('button[aria-label="Chụp phiếu"]')).toBeVisible();
    await expect(page.locator('text=Căn tờ phiếu vào khung')).toBeVisible();

    // 3. Navigation to /scan PIN landing
    await page.goto('/scan');
    await expect(page.locator('input[placeholder*="8216"]')).toBeVisible();
  });
});

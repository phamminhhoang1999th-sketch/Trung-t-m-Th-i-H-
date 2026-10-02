import {
  Classroom,
  Student,
  AttendanceSession,
  Invoice,
  CenterSettings,
} from '../types';

export interface MonthlyAttendanceStats {
  presentCount: number;
  lateCount: number;
  absentExcusedCount: number;
  absentUnexcusedCount: number;
  makeupAttendedCount: number; // Đi học bù cho lớp này
  totalAttended: number; // present + late + makeup
}

export function getStudentAttendanceStats(
  studentId: string,
  classId: string,
  month: string, // YYYY-MM
  sessions: AttendanceSession[]
): MonthlyAttendanceStats {
  const monthSessions = sessions.filter(
    (s) => s.classId === classId && s.date.startsWith(month)
  );

  let presentCount = 0;
  let lateCount = 0;
  let absentExcusedCount = 0;
  let absentUnexcusedCount = 0;
  let makeupAttendedCount = 0;

  monthSessions.forEach((session) => {
    const record = session.records.find((r) => r.studentId === studentId);
    if (record) {
      if (record.isMakeup) {
        makeupAttendedCount++;
      } else {
        if (record.status === 'present') presentCount++;
        else if (record.status === 'late') lateCount++;
        else if (record.status === 'absent_excused') absentExcusedCount++;
        else if (record.status === 'absent_unexcused') absentUnexcusedCount++;
      }
    }
  });

  return {
    presentCount,
    lateCount,
    absentExcusedCount,
    absentUnexcusedCount,
    makeupAttendedCount,
    totalAttended: presentCount + lateCount + makeupAttendedCount,
  };
}

/**
 * Tự động tính và tạo hóa đơn học phí cho một tháng được chỉ định
 */
export function generateMonthlyInvoices(options: {
  month: string; // YYYY-MM
  classes: Classroom[];
  students: Student[];
  sessions: AttendanceSession[];
  existingInvoices: Invoice[];
  settings: CenterSettings;
  billingMode?: 'fixed_package' | 'actual_attended'; // Mặc định gói tháng (8 buổi) hoặc theo buổi thực tế
  materialFeeDefault?: number;
}): { newInvoices: Invoice[]; createdCount: number; updatedCount: number } {
  const {
    month,
    classes,
    students,
    sessions,
    existingInvoices,
    settings,
    billingMode = 'fixed_package',
    materialFeeDefault = 50000,
  } = options;

  const resultInvoices: Invoice[] = [...existingInvoices];
  let createdCount = 0;
  let updatedCount = 0;

  // Ngày lập hóa đơn: ngày đầu tháng hoặc ngày hiện tại
  const today = new Date().toISOString().split('T')[0];
  const issueDate = today;
  
  // Tính ngày hạn nộp (mặc định sau N ngày)
  const due = new Date();
  due.setDate(due.getDate() + (settings.defaultDueDays || 7));
  const dueDate = due.toISOString().split('T')[0];

  // Month code for invoice: 2026-10 -> 2610
  const monthParts = month.split('-');
  const shortYear = monthParts[0].slice(-2);
  const monthNum = monthParts[1];
  const monthCode = `${shortYear}${monthNum}`;

  let invoiceSequence = existingInvoices.length + 1;

  // Lặp qua từng lớp và từng học sinh thuộc lớp
  classes.forEach((cls) => {
    const classStudents = students.filter(
      (s) => s.status === 'active' && s.classIds.includes(cls.id)
    );

    classStudents.forEach((student) => {
      const stats = getStudentAttendanceStats(student.id, cls.id, month, sessions);

      // Xác định số buổi tính tiền
      let billableSessions = cls.totalExpectedSessionsPerMonth || 8;
      if (billingMode === 'actual_attended') {
        billableSessions = stats.totalAttended > 0 ? stats.totalAttended : cls.totalExpectedSessionsPerMonth;
      }

      const feePerSession = cls.feePerSession;
      const baseAmount = billableSessions * feePerSession;
      const discountPercent = student.discountPercent || 0;
      const discountAmount = Math.round((baseAmount * discountPercent) / 100);
      const materialFee = materialFeeDefault;
      const totalAmount = Math.max(0, baseAmount - discountAmount + materialFee);

      // Cú pháp chuyển khoản: THAIHA <MÃ_HS> T<THÁNG> (ví dụ: THAIHA TH1001 T10)
      const cleanStudentCode = student.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const transferSyntax = `${settings.transferPrefix || 'THAIHA'} ${cleanStudentCode} T${parseInt(monthNum, 10)}`;

      // Kiểm tra xem đã có hóa đơn của học sinh này trong tháng và lớp này chưa
      const existingIndex = resultInvoices.findIndex(
        (inv) => inv.studentId === student.id && inv.classId === cls.id && inv.month === month
      );

      if (existingIndex >= 0) {
        // Cập nhật các chỉ số buổi học nếu hóa đơn chưa thanh toán
        const currentInv = resultInvoices[existingIndex];
        if (currentInv.status === 'pending') {
          resultInvoices[existingIndex] = {
            ...currentInv,
            totalSessions: billableSessions,
            baseAmount,
            discountPercent,
            discountAmount,
            materialFee,
            makeupSessionsCount: stats.makeupAttendedCount,
            excusedAbsencesCount: stats.absentExcusedCount,
            totalAmount,
            transferSyntax,
          };
          updatedCount++;
        }
      } else {
        // Tạo mới hóa đơn
        const invoiceCode = `HD-TH${monthCode}-${String(invoiceSequence).padStart(2, '0')}`;
        invoiceSequence++;

        const newInvoice: Invoice = {
          id: `INV-${month.replace('-', '')}-${student.id}-${cls.id}`,
          invoiceCode,
          studentId: student.id,
          classId: cls.id,
          month,
          issueDate,
          dueDate,
          totalSessions: billableSessions,
          feePerSession,
          baseAmount,
          discountPercent,
          discountAmount,
          materialFee,
          makeupSessionsCount: stats.makeupAttendedCount,
          excusedAbsencesCount: stats.absentExcusedCount,
          totalAmount,
          paidAmount: 0,
          status: 'pending',
          transferSyntax,
          note: discountPercent > 0 ? `Áp dụng ưu đãi ${discountPercent}% học phí.` : undefined,
        };

        resultInvoices.unshift(newInvoice);
        createdCount++;
      }
    });
  });

  return { newInvoices: resultInvoices, createdCount, updatedCount };
}

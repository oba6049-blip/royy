import { MongoClient, Db } from 'mongodb';

let dbInstance: Db | null = null;
let mongoClient: MongoClient | null = null;
let isMongoConnected = false;

// Memory storage fallback if MongoDB URI is not provided or offline
let memoryStore = {
  students: [] as any[],
  classes: [] as any[],
  subjects: [] as any[],
  sessions: [
    { id: '1', year: '2023/2024', status: 'Completed', startDate: 'Sept 2023', endDate: 'July 2024' },
    { id: '2', year: '2024/2025', status: 'Active Current Session', startDate: 'Sept 2024', endDate: 'July 2025' },
    { id: '3', year: '2025/2026', status: 'Upcoming', startDate: 'Sept 2025', endDate: 'July 2026' },
  ],
  terms: [
    { id: 't1', name: 'First Term', status: 'Concluded', resumption: 'Sept 9, 2024' },
    { id: 't2', name: 'Second Term', status: 'Concluded', resumption: 'Jan 8, 2025' },
    { id: 't3', name: 'Third Term', status: 'Active Current Term', resumption: 'Apr 28, 2025' },
  ],
  branding: {
    logoUrl: null as string | null,
    stampUrl: null as string | null,
    signatureUrl: null as string | null,
    principalRemark: 'Exemplary academic effort, commendable discipline, and steady progress across all subjects. Keep striving for excellence!',
    updatedAt: new Date().toISOString()
  },
  admins: [
    {
      email: 'fariat@gmail.com',
      password: 'Adewale_@09',
      name: 'Adewale (System Admin)',
      role: 'System Super Administrator'
    }
  ]
};

export async function connectToMongoDB() {
  if (isMongoConnected && dbInstance) {
    return true;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || mongoUri.includes('username:password')) {
    console.log('[MongoDB] MONGODB_URI is not configured with credentials. Operating with in-memory database & seeding initial data.');
    isMongoConnected = false;
    return false;
  }

  try {
    if (!mongoClient) {
      mongoClient = new MongoClient(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
      });
      await mongoClient.connect();
    }
    dbInstance = mongoClient.db('royal_academy');
    isMongoConnected = true;
    console.log('[MongoDB] Successfully connected to MongoDB database "royal_academy"!');

    // Initialize collections & seed if empty
    await seedMongoDatabase();
    return true;
  } catch (err: any) {
    console.warn('[MongoDB] Could not connect to MongoDB:', err.message || err);
    console.warn('[MongoDB] Falling back to high-performance memory persistence layer.');
    isMongoConnected = false;
    return false;
  }
}

async function seedMongoDatabase() {
  if (!dbInstance) return;

  try {
    const studentsColl = dbInstance.collection('students');
    const studentCount = await studentsColl.countDocuments();
    if (studentCount === 0 && memoryStore.students.length > 0) {
      console.log('[MongoDB] Seeding initial student records into MongoDB collection...');
      const cleanStudents = memoryStore.students.map(({ _id, ...s }: any) => ({ ...s }));
      await studentsColl.insertMany(cleanStudents);
    }

    const classesColl = dbInstance.collection('classes');
    if (await classesColl.countDocuments() === 0 && memoryStore.classes.length > 0) {
      const cleanClasses = memoryStore.classes.map(({ _id, ...c }: any) => ({ ...c }));
      await classesColl.insertMany(cleanClasses);
    }

    const subjectsColl = dbInstance.collection('subjects');
    if (await subjectsColl.countDocuments() === 0 && memoryStore.subjects.length > 0) {
      const cleanSubjects = memoryStore.subjects.map(({ _id, ...s }: any) => ({ ...s }));
      await subjectsColl.insertMany(cleanSubjects);
    }

    const sessionsColl = dbInstance.collection('sessions');
    if (await sessionsColl.countDocuments() === 0 && memoryStore.sessions.length > 0) {
      const cleanSessions = memoryStore.sessions.map(({ _id, ...s }: any) => ({ ...s }));
      await sessionsColl.insertMany(cleanSessions);
    }

    const termsColl = dbInstance.collection('terms');
    if (await termsColl.countDocuments() === 0 && memoryStore.terms.length > 0) {
      const cleanTerms = memoryStore.terms.map(({ _id, ...t }: any) => ({ ...t }));
      await termsColl.insertMany(cleanTerms);
    }

    const adminsColl = dbInstance.collection('admins');
    for (const admin of memoryStore.admins) {
      const { _id, ...cleanAdmin } = admin as any;
      await adminsColl.updateOne(
        { email: cleanAdmin.email },
        { $set: cleanAdmin },
        { upsert: true }
      );
    }

    console.log('[MongoDB] Data seeding complete!');
  } catch (error) {
    console.error('[MongoDB] Error during seeding:', error);
  }
}

export function getDbStatus() {
  return {
    connected: isMongoConnected,
    databaseName: 'royal_academy',
    uriProvided: Boolean(process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('username:password')),
    activeDriver: isMongoConnected ? 'Native MongoDB Driver (Atlas / Cluster)' : 'Active Node.js Memory Database',
  };
}

// Data Access Methods
export async function getAllStudents() {
  if (isMongoConnected && dbInstance) {
    return await dbInstance.collection('students').find({}, { projection: { _id: 0 } }).toArray();
  }
  return memoryStore.students;
}

export async function getStudentById(studentId: string) {
  const cleanId = String(studentId || '').trim();
  if (isMongoConnected && dbInstance) {
    return await dbInstance.collection('students').findOne(
      { studentId: { $regex: new RegExp(`^${cleanId}$`, 'i') } },
      { projection: { _id: 0 } }
    );
  }
  return memoryStore.students.find(s => String(s.studentId || '').trim().toUpperCase() === cleanId.toUpperCase()) || null;
}

export async function createStudent(studentData: any) {
  const cleanId = String(studentData.studentId || '').trim();
  const normalizedData = { ...studentData, studentId: cleanId };
  if (isMongoConnected && dbInstance) {
    await dbInstance.collection('students').updateOne(
      { studentId: cleanId },
      { $set: normalizedData },
      { upsert: true }
    );
  }
  const idx = memoryStore.students.findIndex(s => String(s.studentId || '').trim().toUpperCase() === cleanId.toUpperCase());
  if (idx >= 0) {
    memoryStore.students[idx] = normalizedData;
  } else {
    memoryStore.students.unshift(normalizedData);
  }
  return normalizedData;
}

export async function updateStudent(studentId: string, updateData: any) {
  const cleanId = String(studentId || '').trim();
  if (isMongoConnected && dbInstance) {
    await dbInstance.collection('students').updateOne(
      { studentId: { $regex: new RegExp(`^${cleanId}$`, 'i') } },
      { $set: updateData }
    );
  }
  const idx = memoryStore.students.findIndex(s => String(s.studentId || '').trim().toUpperCase() === cleanId.toUpperCase());
  if (idx >= 0) {
    memoryStore.students[idx] = { ...memoryStore.students[idx], ...updateData };
    return memoryStore.students[idx];
  }
  return null;
}

export async function deleteStudent(studentId: string) {
  const cleanId = String(studentId || '').trim();
  if (isMongoConnected && dbInstance) {
    await dbInstance.collection('students').deleteOne({ studentId: { $regex: new RegExp(`^${cleanId}$`, 'i') } });
  }
  memoryStore.students = memoryStore.students.filter(s => String(s.studentId || '').trim().toUpperCase() !== cleanId.toUpperCase());
  return true;
}

export function isStudentInClassServer(
  studentClassName?: string | null,
  classTarget?: string | { name: string; arm?: string } | null
): boolean {
  if (!studentClassName || !classTarget) return false;

  const targetName = typeof classTarget === 'string' ? classTarget : (classTarget.name || '');
  const targetArm = typeof classTarget === 'string' ? '' : (classTarget.arm || '');

  const rawStudent = String(studentClassName).trim();
  const rawTarget = String(targetName).trim();

  // 1. Direct match
  if (rawStudent.toLowerCase() === rawTarget.toLowerCase()) {
    return true;
  }

  // 2. Combined name + arm
  if (targetArm) {
    const combined = `${rawTarget} ${targetArm}`.trim();
    if (rawStudent.toLowerCase() === combined.toLowerCase()) {
      return true;
    }
  }

  // 3. Normalized string match
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .replace(/senior secondary school\s*/g, 'sss ')
      .replace(/junior secondary school\s*/g, 'jss ')
      .replace(/[^a-z0-9]/g, '');

  const normStudent = normalize(rawStudent);
  const normTarget = normalize(rawTarget);
  const normCombined = targetArm ? normalize(`${rawTarget}${targetArm}`) : '';

  if (normStudent === normTarget || (normCombined && normStudent === normCombined)) {
    return true;
  }

  // 4. Level prefix separation
  const extractLevel = (norm: string) => {
    const match = norm.match(/(jss|sss)[123]/);
    return match ? match[0] : null;
  };

  const studentLevel = extractLevel(normStudent);
  const targetLevel = extractLevel(normTarget) || (normCombined ? extractLevel(normCombined) : null);

  if (studentLevel && targetLevel && studentLevel !== targetLevel) {
    return false;
  }

  // 5. Arm/stream match
  const extractArm = (norm: string, level: string | null) => {
    if (!level) return '';
    return norm.replace(level, '');
  };

  const studentArm = extractArm(normStudent, studentLevel);
  const targetArmNorm = targetArm ? normalize(targetArm) : extractArm(normTarget, targetLevel);

  if (studentLevel && targetLevel && studentLevel === targetLevel) {
    if (studentArm && targetArmNorm) {
      return studentArm === targetArmNorm;
    }
    if (!studentArm && !targetArmNorm) {
      return true;
    }
  }

  return false;
}

// Classes
export async function getAllClasses() {
  let list: any[] = [];
  if (isMongoConnected && dbInstance) {
    list = await dbInstance.collection('classes').find({}, { projection: { _id: 0 } }).toArray();
  } else {
    list = memoryStore.classes;
  }
  const allStus = await getAllStudents();
  return list.map(c => {
    const realEnrolled = allStus.filter(s => isStudentInClassServer(s.className, c)).length;
    return {
      ...c,
      enrolled: realEnrolled,
    };
  });
}

export async function createClass(classData: any) {
  const { _id, ...cleanData } = classData || {};
  if (isMongoConnected && dbInstance) {
    await dbInstance.collection('classes').insertOne({ ...cleanData });
  }
  memoryStore.classes.push({ ...cleanData });
  return cleanData;
}

export async function deleteClass(classId: string) {
  if (isMongoConnected && dbInstance) {
    await dbInstance.collection('classes').deleteOne({ $or: [{ id: classId }, { name: classId }] });
  }
  memoryStore.classes = memoryStore.classes.filter(c => c.id !== classId && c.name !== classId);
  return true;
}

// Subjects
export async function getAllSubjects() {
  if (isMongoConnected && dbInstance) {
    return await dbInstance.collection('subjects').find({}, { projection: { _id: 0 } }).toArray();
  }
  return memoryStore.subjects;
}

export async function createSubject(subjectData: any) {
  const { _id, ...cleanData } = subjectData || {};
  if (isMongoConnected && dbInstance) {
    await dbInstance.collection('subjects').insertOne({ ...cleanData });
  }
  memoryStore.subjects.push({ ...cleanData });
  return cleanData;
}

export async function deleteSubject(code: string) {
  if (isMongoConnected && dbInstance) {
    await dbInstance.collection('subjects').deleteOne({ $or: [{ code: code }, { name: code }] });
  }
  memoryStore.subjects = memoryStore.subjects.filter(s => s.code !== code && s.name !== code);
  return true;
}

// Sessions
export async function getAllSessions() {
  let list: any[] = [];
  if (isMongoConnected && dbInstance) {
    list = await dbInstance.collection('sessions').find({}, { projection: { _id: 0 } }).toArray();
  } else {
    list = memoryStore.sessions;
  }
  const normSess = (s: string) => (s || '').toLowerCase().replace(/academic|session|\s/g, '');
  const seen = new Set<string>();
  return list.filter(s => {
    const yr = s.year || s.name || '';
    const key = normSess(yr);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function initializeResultRecordsForSession(sessionData: any) {
  try {
    const sessionYear = sessionData.year.includes('Academic Session') ? sessionData.year : `${sessionData.year} Academic Session`;
    const students = await getAllStudents();
    const terms = await getAllTerms();
    const subjects = await getAllSubjects();

    const normSess = (s: string) => (s || '').toLowerCase().replace(/academic|session|\s/g, '');
    const getTermId = (t: string) => {
      const l = (t || '').toLowerCase();
      if (l.includes('first') || l.includes('1st') || l.includes('1')) return '1';
      if (l.includes('second') || l.includes('2nd') || l.includes('2')) return '2';
      if (l.includes('third') || l.includes('3rd') || l.includes('3')) return '3';
      return l.replace(/\s/g, '');
    };

    const defaultSubjects = subjects.map((sub: any, idx: number) => ({
      id: `sub-init-${idx + 1}`,
      subject: sub.name || sub.subject || 'General Subject',
      ca1: 0,
      ca2: 0,
      midterm: 0,
      caScore: 0,
      examScore: 0,
      total: 0,
      grade: 'F9',
      remark: 'UNPUBLISHED',
    }));

    const termsToUse = terms.length > 0 ? terms : [
      { name: 'First Term' },
      { name: 'Second Term' },
      { name: 'Third Term' },
    ];

    for (const st of students) {
      const existingTermRecords = [...(st.termRecords || [])];
      let hasChange = false;

      for (const t of termsToUse) {
        const termName = t.name;
        const exists = existingTermRecords.some(r => 
          normSess(r.academicSession) === normSess(sessionYear) && 
          getTermId(r.term) === getTermId(termName)
        );
        if (!exists) {
          existingTermRecords.push({
            academicSession: sessionYear,
            term: termName,
            className: st.className || 'JSS 1 Gold',
            subjects: [],
            overallTotal: 0,
            overallAverage: 0,
            gpa: 0,
            position: 'N/A',
            totalInClass: 0,
            status: 'Unpublished',
            isPublished: false,
            issueDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            updatedAt: new Date().toISOString(),
          });
          hasChange = true;
        }
      }

      if (hasChange) {
        await updateStudent(st.studentId, { termRecords: existingTermRecords });
      }
    }
  } catch (err) {
    console.error('[Session Initialization Error]:', err);
  }
}

export async function createSession(sessionData: any) {
  const { _id, ...cleanData } = sessionData || {};
  if (isMongoConnected && dbInstance) {
    await dbInstance.collection('sessions').insertOne({ ...cleanData });
  }
  memoryStore.sessions.push({ ...cleanData });
  await initializeResultRecordsForSession(cleanData);
  return cleanData;
}

export async function updateSession(id: string, updates: any) {
  if (isMongoConnected && dbInstance) {
    await dbInstance.collection('sessions').updateOne({ id: id }, { $set: updates });
  }
  memoryStore.sessions = memoryStore.sessions.map(s => s.id === id ? { ...s, ...updates } : s);
  return true;
}

export async function deleteSession(id: string) {
  if (isMongoConnected && dbInstance) {
    await dbInstance.collection('sessions').deleteOne({ id: id });
  }
  memoryStore.sessions = memoryStore.sessions.filter(s => s.id !== id);
  return true;
}

// Terms
export async function getAllTerms() {
  let list: any[] = [];
  if (isMongoConnected && dbInstance) {
    list = await dbInstance.collection('terms').find({}, { projection: { _id: 0 } }).toArray();
  } else {
    list = memoryStore.terms;
  }
  const getTermId = (t: string) => {
    const l = (t || '').toLowerCase();
    if (l.includes('first') || l.includes('1st') || l.includes('1')) return '1';
    if (l.includes('second') || l.includes('2nd') || l.includes('2')) return '2';
    if (l.includes('third') || l.includes('3rd') || l.includes('3')) return '3';
    return l.replace(/\s/g, '');
  };
  const seen = new Set<string>();
  return list.filter(t => {
    const name = t.name || '';
    const key = getTermId(name);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function initializeResultRecordsForTerm(termData: any) {
  try {
    const termName = termData.name;
    const students = await getAllStudents();
    const sessions = await getAllSessions();
    const subjects = await getAllSubjects();

    const normSess = (s: string) => (s || '').toLowerCase().replace(/academic|session|\s/g, '');
    const getTermId = (t: string) => {
      const l = (t || '').toLowerCase();
      if (l.includes('first') || l.includes('1st') || l.includes('1')) return '1';
      if (l.includes('second') || l.includes('2nd') || l.includes('2')) return '2';
      if (l.includes('third') || l.includes('3rd') || l.includes('3')) return '3';
      return l.replace(/\s/g, '');
    };

    const defaultSubjects = subjects.map((sub: any, idx: number) => ({
      id: `sub-init-${idx + 1}`,
      subject: sub.name || sub.subject || 'General Subject',
      ca1: 0,
      ca2: 0,
      midterm: 0,
      caScore: 0,
      examScore: 0,
      total: 0,
      grade: 'F9',
      remark: 'UNPUBLISHED',
    }));

    const sessionsToUse = sessions.length > 0 ? sessions : [
      { year: '2024/2025' },
      { year: '2025/2026' },
    ];

    for (const st of students) {
      const existingTermRecords = [...(st.termRecords || [])];
      let hasChange = false;

      for (const s of sessionsToUse) {
        const sessionYear = s.year.includes('Academic Session') ? s.year : `${s.year} Academic Session`;
        const exists = existingTermRecords.some(r => 
          normSess(r.academicSession) === normSess(sessionYear) && 
          getTermId(r.term) === getTermId(termName)
        );
        if (!exists) {
          existingTermRecords.push({
            academicSession: sessionYear,
            term: termName,
            className: st.className || 'JSS 1 Gold',
            subjects: [],
            overallTotal: 0,
            overallAverage: 0,
            gpa: 0,
            position: 'N/A',
            totalInClass: 0,
            status: 'Unpublished',
            isPublished: false,
            issueDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            updatedAt: new Date().toISOString(),
          });
          hasChange = true;
        }
      }

      if (hasChange) {
        await updateStudent(st.studentId, { termRecords: existingTermRecords });
      }
    }
  } catch (err) {
    console.error('[Term Initialization Error]:', err);
  }
}

export async function createTerm(termData: any) {
  const { _id, ...cleanData } = termData || {};
  if (isMongoConnected && dbInstance) {
    await dbInstance.collection('terms').insertOne({ ...cleanData });
  }
  memoryStore.terms.push({ ...cleanData });
  await initializeResultRecordsForTerm(cleanData);
  return cleanData;
}

export async function updateTerm(id: string, updates: any) {
  if (isMongoConnected && dbInstance) {
    await dbInstance.collection('terms').updateOne({ id: id }, { $set: updates });
  }
  memoryStore.terms = memoryStore.terms.map(t => t.id === id ? { ...t, ...updates } : t);
  return true;
}

export async function deleteTerm(id: string) {
  if (isMongoConnected && dbInstance) {
    await dbInstance.collection('terms').deleteOne({ id: id });
  }
  memoryStore.terms = memoryStore.terms.filter(t => t.id !== id);
  return true;
}

// Branding
export async function getBranding() {
  if (isMongoConnected && dbInstance) {
    const doc = await dbInstance.collection('branding').findOne({ type: 'school_branding' }, { projection: { _id: 0 } });
    if (doc) return doc;
  }
  return memoryStore.branding;
}

export async function updateBranding(typeOrObject: string | Record<string, any>, value?: any) {
  let update: Record<string, any> = { updatedAt: new Date().toISOString() };
  if (typeof typeOrObject === 'object' && typeOrObject !== null) {
    update = { ...update, ...typeOrObject };
  } else if (typeof typeOrObject === 'string') {
    update[typeOrObject] = value;
  }

  if (isMongoConnected && dbInstance) {
    await dbInstance.collection('branding').updateOne(
      { type: 'school_branding' },
      { $set: { ...update, type: 'school_branding' } },
      { upsert: true }
    );
  }
  memoryStore.branding = { ...memoryStore.branding, ...update };
  return memoryStore.branding;
}

export async function batchUpdateStudentsPrincipalRemark(remark: string) {
  if (isMongoConnected && dbInstance) {
    await dbInstance.collection('students').updateMany(
      {},
      { $set: { principalRemark: remark, updatedAt: new Date().toISOString() } }
    );
  }
  Object.values(memoryStore.students).forEach(s => {
    if (s) s.principalRemark = remark;
  });
}

// Admin Auth
export async function verifyAdmin(email: string, pass: string) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const envAdminEmail = (process.env.ADMIN_EMAIL || 'fariat@gmail.com').trim().toLowerCase();
  const envAdminPassword = process.env.ADMIN_PASSWORD || 'Adewale_@09';

  if (!pass) return null;

  // 1. Check environment variable configured admin
  if (normalizedEmail === envAdminEmail && pass === envAdminPassword) {
    return {
      name: 'Adewale (System Admin)',
      email: normalizedEmail,
      role: 'System Super Administrator'
    };
  }

  // 2. Check MongoDB collection
  if (isMongoConnected && dbInstance) {
    const admin = await dbInstance.collection('admins').findOne({ email: normalizedEmail });
    if (admin && admin.password === pass) {
      return {
        name: admin.name || 'System Admin',
        email: admin.email,
        role: admin.role || 'System Super Administrator'
      };
    }
  }

  // 3. Check Memory Store
  const memoryAdmin = memoryStore.admins.find(a => a.email.toLowerCase() === normalizedEmail);
  if (memoryAdmin && memoryAdmin.password === pass) {
    return { name: memoryAdmin.name, email: memoryAdmin.email, role: memoryAdmin.role };
  }

  return null;
}

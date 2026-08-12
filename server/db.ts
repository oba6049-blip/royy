import { MongoClient, Db } from 'mongodb';
import { MOCK_STUDENTS, ADMIN_MOCK_STUDENTS } from '../src/data/mockData.js';

let dbInstance: Db | null = null;
let mongoClient: MongoClient | null = null;
let isMongoConnected = false;

// Memory storage fallback if MongoDB URI is not provided or offline
let memoryStore = {
  students: Object.values(MOCK_STUDENTS).map(s => ({
    ...s,
    name: s.fullName,
    averageScore: s.overallAverage,
  })),
  classes: [
    { id: '1', name: 'JSS 1 Gold', arm: 'Gold', teacher: 'Mrs. O. Adeleke', capacity: 35, enrolled: 32 },
    { id: '2', name: 'JSS 2 Diamond', arm: 'Diamond', teacher: 'Mr. K. Okafor', capacity: 35, enrolled: 30 },
    { id: '3', name: 'JSS 3 Silver', arm: 'Silver', teacher: 'Dr. C. Nwosu', capacity: 35, enrolled: 34 },
    { id: '4', name: 'SSS 1 Science', arm: 'Science A', teacher: 'Engr. T. Balogun', capacity: 30, enrolled: 28 },
    { id: '5', name: 'SSS 2 Arts', arm: 'Arts', teacher: 'Mrs. A. Ibrahim', capacity: 30, enrolled: 25 },
    { id: '6', name: 'SSS 3 Commercial', arm: 'Commercial', teacher: 'Mr. B. Danjuma', capacity: 30, enrolled: 29 },
  ],
  subjects: [
    { id: '1', code: 'MTH', name: 'Mathematics', category: 'General Core', teacher: 'Dr. A. Ojo' },
    { id: '2', code: 'ENG', name: 'English Language', category: 'General Core', teacher: 'Mrs. B. Adeleke' },
    { id: '3', code: 'PHY', name: 'Physics', category: 'Sciences', teacher: 'Engr. C. Nwosu' },
    { id: '4', code: 'CHM', name: 'Chemistry', category: 'Sciences', teacher: 'Dr. D. Okon' },
    { id: '5', code: 'BIO', name: 'Biology', category: 'Sciences', teacher: 'Mrs. E. Ibrahim' },
    { id: '6', code: 'FMTH', name: 'Further Mathematics', category: 'Sciences', teacher: 'Mr. G. Alabi' },
    { id: '7', code: 'AGRIC', name: 'Agricultural Science', category: 'Vocational', teacher: 'Mr. K. Okafor' },
    { id: '8', code: 'CIVIC', name: 'Civic Education', category: 'General Core', teacher: 'Mrs. A. Ibrahim' },
    { id: '9', code: 'COMP', name: 'Computer Studies', category: 'Vocational', teacher: 'Mr. F. Danjuma' },
  ],
  sessions: [
    { id: '1', year: '2023/2024', status: 'Completed', startDate: 'Sept 2023', endDate: 'July 2024' },
    { id: '2', year: '2024/2025', status: 'Active Current Session', startDate: 'Sept 2024', endDate: 'July 2025' },
    { id: '3', year: '2025/2026', status: 'Upcoming', startDate: 'Sept 2025', endDate: 'July 2026' },
  ],
  terms: [
    { id: 't1', name: 'First Term (Fall)', status: 'Concluded', resumption: 'Sept 9, 2024' },
    { id: 't2', name: 'Second Term (Winter/Spring)', status: 'Concluded', resumption: 'Jan 8, 2025' },
    { id: 't3', name: 'Third Term (Summer)', status: 'Active Current Term', resumption: 'Apr 28, 2025' },
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
    if (studentCount === 0) {
      console.log('[MongoDB] Seeding initial student records into MongoDB collection...');
      await studentsColl.insertMany(memoryStore.students);
    }

    const classesColl = dbInstance.collection('classes');
    if (await classesColl.countDocuments() === 0) {
      await classesColl.insertMany(memoryStore.classes);
    }

    const subjectsColl = dbInstance.collection('subjects');
    if (await subjectsColl.countDocuments() === 0) {
      await subjectsColl.insertMany(memoryStore.subjects);
    }

    const sessionsColl = dbInstance.collection('sessions');
    if (await sessionsColl.countDocuments() === 0) {
      await sessionsColl.insertMany(memoryStore.sessions);
    }

    const termsColl = dbInstance.collection('terms');
    if (await termsColl.countDocuments() === 0) {
      await termsColl.insertMany(memoryStore.terms);
    }

    const adminsColl = dbInstance.collection('admins');
    await adminsColl.deleteMany({});
    await adminsColl.insertMany(memoryStore.admins);

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
  if (isMongoConnected && dbInstance) {
    return await dbInstance.collection('students').findOne({ studentId }, { projection: { _id: 0 } });
  }
  return memoryStore.students.find(s => s.studentId.toUpperCase() === studentId.toUpperCase()) || null;
}

export async function createStudent(studentData: any) {
  if (isMongoConnected && dbInstance) {
    await dbInstance.collection('students').updateOne(
      { studentId: studentData.studentId },
      { $set: studentData },
      { upsert: true }
    );
  }
  const idx = memoryStore.students.findIndex(s => s.studentId === studentData.studentId);
  if (idx >= 0) {
    memoryStore.students[idx] = studentData;
  } else {
    memoryStore.students.unshift(studentData);
  }
  return studentData;
}

export async function updateStudent(studentId: string, updateData: any) {
  if (isMongoConnected && dbInstance) {
    await dbInstance.collection('students').updateOne(
      { studentId },
      { $set: updateData }
    );
  }
  const idx = memoryStore.students.findIndex(s => s.studentId === studentId);
  if (idx >= 0) {
    memoryStore.students[idx] = { ...memoryStore.students[idx], ...updateData };
    return memoryStore.students[idx];
  }
  return null;
}

export async function deleteStudent(studentId: string) {
  if (isMongoConnected && dbInstance) {
    await dbInstance.collection('students').deleteOne({ studentId });
  }
  memoryStore.students = memoryStore.students.filter(s => s.studentId !== studentId);
  return true;
}

// Classes
export async function getAllClasses() {
  if (isMongoConnected && dbInstance) {
    return await dbInstance.collection('classes').find({}, { projection: { _id: 0 } }).toArray();
  }
  return memoryStore.classes;
}

export async function createClass(classData: any) {
  if (isMongoConnected && dbInstance) {
    await dbInstance.collection('classes').insertOne(classData);
  }
  memoryStore.classes.push(classData);
  return classData;
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
  if (isMongoConnected && dbInstance) {
    await dbInstance.collection('subjects').insertOne(subjectData);
  }
  memoryStore.subjects.push(subjectData);
  return subjectData;
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
  if (isMongoConnected && dbInstance) {
    return await dbInstance.collection('sessions').find({}, { projection: { _id: 0 } }).toArray();
  }
  return memoryStore.sessions;
}

export async function createSession(sessionData: any) {
  if (isMongoConnected && dbInstance) {
    await dbInstance.collection('sessions').insertOne(sessionData);
  }
  memoryStore.sessions.push(sessionData);
  return sessionData;
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
  if (isMongoConnected && dbInstance) {
    return await dbInstance.collection('terms').find({}, { projection: { _id: 0 } }).toArray();
  }
  return memoryStore.terms;
}

export async function createTerm(termData: any) {
  if (isMongoConnected && dbInstance) {
    await dbInstance.collection('terms').insertOne(termData);
  }
  memoryStore.terms.push(termData);
  return termData;
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

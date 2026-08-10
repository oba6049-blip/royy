import express from 'express';
import {
  connectToMongoDB,
  getDbStatus,
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getAllClasses,
  createClass,
  deleteClass,
  getAllSubjects,
  createSubject,
  deleteSubject,
  getAllSessions,
  createSession,
  updateSession,
  deleteSession,
  getAllTerms,
  createTerm,
  updateTerm,
  deleteTerm,
  getBranding,
  updateBranding,
  verifyAdmin,
} from './db.js';

export const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));

// Ensure MongoDB is connected on every API call (cached connection)
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try {
      await connectToMongoDB();
    } catch (e) {
      console.error('[MongoDB Middleware] Connection error:', e);
    }
  }
  next();
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/db/status', (req, res) => {
  res.json(getDbStatus());
});

// Students API
app.get('/api/students', async (req, res) => {
  try {
    const students = await getAllStudents();
    res.json(students);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await getStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student record not found in MongoDB database.' });
    }
    res.json(student);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const regId = String(req.body.studentId || '').trim();
    if (!/^\d{7}$/.test(regId)) {
      return res.status(400).json({ error: 'Registration ID must be a unique 7-digit number (e.g., 2026101).' });
    }

    const isUpdateMode = req.query.mode === 'update';
    const existing = await getStudentById(regId);
    if (existing && !isUpdateMode) {
      return res.status(400).json({
        error: `Registration ID "${regId}" is already assigned to another student (${existing.fullName || existing.name}). Reg ID must be unique!`
      });
    }

    const student = await createStudent(req.body);
    res.status(201).json({ success: true, student });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const updated = await updateStudent(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Student not found to update.' });
    }
    res.json({ success: true, student: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    await deleteStudent(req.params.id);
    res.json({ success: true, message: `Student ${req.params.id} deleted from database.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Classes & Subjects
app.get('/api/classes', async (req, res) => {
  try {
    const classes = await getAllClasses();
    res.json(classes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/classes', async (req, res) => {
  try {
    const newClass = await createClass(req.body);
    res.status(201).json({ success: true, class: newClass });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/classes/:id', async (req, res) => {
  try {
    await deleteClass(req.params.id);
    res.json({ success: true, message: `Class ${req.params.id} deleted from database.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/subjects', async (req, res) => {
  try {
    const subjects = await getAllSubjects();
    res.json(subjects);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/subjects', async (req, res) => {
  try {
    const newSub = await createSubject(req.body);
    res.status(201).json({ success: true, subject: newSub });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/subjects/:code', async (req, res) => {
  try {
    await deleteSubject(req.params.code);
    res.json({ success: true, message: `Subject ${req.params.code} deleted from database.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Sessions & Terms
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await getAllSessions();
    res.json(sessions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sessions', async (req, res) => {
  try {
    const created = await createSession(req.body);
    res.status(201).json({ success: true, session: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/sessions/:id', async (req, res) => {
  try {
    await updateSession(req.params.id, req.body);
    res.json({ success: true, message: `Session ${req.params.id} updated.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sessions/:id', async (req, res) => {
  try {
    await deleteSession(req.params.id);
    res.json({ success: true, message: `Session ${req.params.id} deleted.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/terms', async (req, res) => {
  try {
    const terms = await getAllTerms();
    res.json(terms);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/terms', async (req, res) => {
  try {
    const created = await createTerm(req.body);
    res.status(201).json({ success: true, term: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/terms/:id', async (req, res) => {
  try {
    await updateTerm(req.params.id, req.body);
    res.json({ success: true, message: `Term ${req.params.id} updated.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/terms/:id', async (req, res) => {
  try {
    await deleteTerm(req.params.id);
    res.json({ success: true, message: `Term ${req.params.id} deleted.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Branding (Logos, Stamp, Signature)
app.get('/api/branding', async (req, res) => {
  try {
    const branding = await getBranding();
    res.json(branding);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/branding', async (req, res) => {
  try {
    const { type, url } = req.body;
    if (!type || !url) {
      return res.status(400).json({ error: 'Type and URL required.' });
    }
    const updated = await updateBranding(type, url);
    res.json({ success: true, branding: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Auth Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await verifyAdmin(email, password);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid admin email or security password.' });
    }
    res.json({ success: true, admin });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

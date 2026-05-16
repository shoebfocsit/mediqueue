import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

dotenv.config();

async function startServer() {
  const app = express();
  const port = 3000;

  app.use(cors());
  app.use(express.json());

  const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

  // Helper to read/write credentials
  const getCredentials = () => {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      const initial = {
        users: [
          {
            id: 'admin_001',
            full_name: 'Super Admin',
            phone: '1234567890',
            password: 'admin',
            role: 'admin',
            email: 'admin@mediqueue.com',
            status: 'active'
          }
        ],
        queue: [],
        reports: [],
        prescriptions: [],
        messages: [],
        appointments: []
      };
      fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(initial, null, 2));
      return initial;
    }
    const data = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
    const parsed = JSON.parse(data);
    // Ensure nested arrays exist for older versions of the file
    if (!parsed.queue) parsed.queue = [];
    if (!parsed.reports) parsed.reports = [];
    if (!parsed.prescriptions) parsed.prescriptions = [];
    if (!parsed.messages) parsed.messages = [];
    if (!parsed.appointments) parsed.appointments = [];
    return parsed;
  };

  const saveCredentials = (data: any) => {
    try {
      console.log(`[DATABASE] Updating credentials.json...`);
      fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(data, null, 2));
      console.log(`[DATABASE] Save successful at ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      console.error(`[DATABASE] Critical error saving to ${CREDENTIALS_PATH}:`, err);
    }
  };

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Queue Endpoints
  app.get('/api/queue', (req, res) => {
    const { doctor_id, patient_id } = req.query;
    const db = getCredentials();
    let result = db.queue;
    if (doctor_id) result = result.filter((q: any) => q.doctor_id === doctor_id);
    if (patient_id) result = result.filter((q: any) => q.patient_id === patient_id);
    res.json(result);
  });

  app.post('/api/queue', (req, res) => {
    const db = getCredentials();
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = db.queue.filter((q: any) => q.created_at?.startsWith(today));
    const nextNumber = todayEntries.length + 1;

    const newEntry = {
      id: `q_${Date.now()}`,
      ...req.body,
      queue_number: nextNumber,
      status: req.body.status || 'waiting',
      created_at: new Date().toISOString()
    };
    db.queue.push(newEntry);
    saveCredentials(db);
    res.json(newEntry);
  });

  app.patch('/api/queue/:id', (req, res) => {
    const { id } = req.params;
    const db = getCredentials();
    const index = db.queue.findIndex((q: any) => q.id === id);
    if (index !== -1) {
      db.queue[index] = { ...db.queue[index], ...req.body, updated_at: new Date().toISOString() };
      saveCredentials(db);
      res.json(db.queue[index]);
    } else {
      res.status(404).json({ error: 'Queue entry not found' });
    }
  });

  // Reports Endpoints
  app.get('/api/reports', (req, res) => {
    const { patient_id } = req.query;
    const db = getCredentials();
    let result = db.reports;
    if (patient_id) result = result.filter((r: any) => r.patient_id === patient_id);
    res.json(result);
  });

  app.post('/api/reports/save', (req, res) => {
    const db = getCredentials();
    const newReport = {
      id: `rep_${Date.now()}`,
      ...req.body,
      created_at: new Date().toISOString()
    };
    db.reports.push(newReport);
    saveCredentials(db);
    res.json(newReport);
  });

  // Prescriptions Endpoints
  app.get('/api/prescriptions', (req, res) => {
    const { patient_id, doctor_id } = req.query;
    const db = getCredentials();
    let result = db.prescriptions;
    if (patient_id) result = result.filter((p: any) => p.patient_id === patient_id);
    if (doctor_id) result = result.filter((p: any) => p.doctor_id === doctor_id);
    res.json(result);
  });

  app.post('/api/prescriptions', (req, res) => {
    const db = getCredentials();
    const newPrescription = {
      id: `rx_${Date.now()}`,
      ...req.body,
      created_at: new Date().toISOString()
    };
    db.prescriptions.push(newPrescription);
    saveCredentials(db);
    res.json(newPrescription);
  });

  app.patch('/api/prescriptions/:id', (req, res) => {
    const { id } = req.params;
    const db = getCredentials();
    const index = db.prescriptions.findIndex((p: any) => p.id === id);
    if (index !== -1) {
      db.prescriptions[index] = { 
        ...db.prescriptions[index], 
        ...req.body, 
        updated_at: new Date().toISOString() 
      };
      saveCredentials(db);
      res.json(db.prescriptions[index]);
    } else {
      res.status(404).json({ error: 'Prescription not found' });
    }
  });

  // Combined Medical History for Patient
  app.get('/api/patient-history/:id', (req, res) => {
    const { id } = req.params;
    const db = getCredentials();
    const patientReports = db.reports.filter((r: any) => r.patient_id === id);
    const patientPrescriptions = db.prescriptions.filter((p: any) => p.patient_id === id);
    res.json({
      reports: patientReports,
      prescriptions: patientPrescriptions
    });
  });

  // Appointments Endpoints
  app.get('/api/appointments', (req, res) => {
    const { doctor_id, patient_id } = req.query;
    const db = getCredentials();
    let result = db.appointments;
    if (doctor_id) result = result.filter((a: any) => a.doctor_id === doctor_id);
    if (patient_id) result = result.filter((a: any) => a.patient_id === patient_id);
    res.json(result);
  });

  app.post('/api/appointments', (req, res) => {
    const db = getCredentials();
    const newAppt = {
      id: `appt_${Date.now()}`,
      ...req.body,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    db.appointments.push(newAppt);
    saveCredentials(db);
    res.json(newAppt);
  });

  app.patch('/api/appointments/:id', (req, res) => {
    const { id } = req.params;
    const db = getCredentials();
    const index = db.appointments.findIndex((a: any) => a.id === id);
    if (index !== -1) {
      db.appointments[index] = { ...db.appointments[index], ...req.body, updated_at: new Date().toISOString() };
      saveCredentials(db);
      res.json(db.appointments[index]);
    } else {
      res.status(404).json({ error: 'Appointment not found' });
    }
  });

  // Messaging Endpoints
  app.get('/api/messages', (req, res) => {
    const { user_id, other_id } = req.query;
    const db = getCredentials();
    // Return messages between two users
    const result = db.messages.filter((m: any) => 
      (m.sender_id === user_id && m.receiver_id === other_id) ||
      (m.sender_id === other_id && m.receiver_id === user_id)
    ).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    res.json(result);
  });

  app.post('/api/messages', (req, res) => {
    const db = getCredentials();
    const newMsg = {
      id: `msg_${Date.now()}`,
      ...req.body,
      created_at: new Date().toISOString()
    };
    db.messages.push(newMsg);
    saveCredentials(db);
    res.json(newMsg);
  });

  // Existing Auth Endpoints
  app.post('/api/auth/login', (req, res) => {
    const phone = req.body.phone?.toString().trim();
    const password = req.body.password?.toString().trim();
    const db = getCredentials();
    
    console.log(`[LOGIN] Attempt for phone: ${phone}`);
    const user = db.users.find((u: any) => u.phone === phone);
    
    if (!user) {
      console.log(`[LOGIN] Failed: User not found with phone ${phone}`);
      return res.status(401).json({ error: 'Invalid credentials or inactive account' });
    }

    if (user.password !== password) {
      console.log(`[LOGIN] Failed: Incorrect password for ${phone}`);
      return res.status(401).json({ error: 'Invalid credentials or inactive account' });
    }

    // Default status to 'active' if missing
    const rawStatus = (user.status || 'active').toLowerCase();
    const isActive = rawStatus === 'active' || rawStatus === 'available' || rawStatus === 'online';
    
    if (!isActive) {
      console.log(`[LOGIN] Failed: Account status is ${user.status} for ${phone}`);
      return res.status(401).json({ error: 'Invalid credentials or inactive account' });
    }
    
    // Return user without password
    const userWithoutPassword = { ...user, status: user.status || 'active' };
    delete (userWithoutPassword as any).password;
    console.log(`[LOGIN] Success for: ${user.phone} (${user.role})`);
    res.json(userWithoutPassword);
  });

  app.post('/api/auth/register-user', (req, res) => {
    const { full_name, email, role, assigned_doctor_id } = req.body;
    const phone = req.body.phone?.toString().trim();
    const password = req.body.password?.toString().trim();
    const db = getCredentials();
    
    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }

    if (db.users.find((u: any) => u.phone === phone)) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    const newUser = {
      id: `user_${Date.now()}`,
      full_name,
      phone,
      password,
      role,
      email: email || '',
      status: 'active'
    };

    db.users.push(newUser);

    // If doctor is assigned during registration, create a queue entry
    if (role === 'patient' && assigned_doctor_id) {
      const doctor = db.users.find((u: any) => u.id === assigned_doctor_id && u.role === 'doctor');
      if (doctor) {
        const today = new Date().toISOString().split('T')[0];
        const todayEntries = db.queue.filter((q: any) => q.created_at?.startsWith(today));
        const nextNumber = todayEntries.length + 1;

        const queueEntry = {
          id: `q_${Date.now()}`,
          patient_id: newUser.id,
          patient_name: newUser.full_name,
          doctor_id: assigned_doctor_id,
          doctor_name: doctor.full_name,
          queue_number: nextNumber,
          status: 'waiting',
          created_at: new Date().toISOString()
        };
        db.queue.push(queueEntry);
      }
    }

    saveCredentials(db);
    
    const userWithoutPassword = { ...newUser };
    delete (userWithoutPassword as any).password;
    res.json(userWithoutPassword);
    console.log(`Registered new ${role}: ${phone}`);
  });

  app.patch('/api/auth/users/:id', (req, res) => {
    const { id } = req.params;
    const db = getCredentials();
    const index = db.users.findIndex((u: any) => u.id === id);
    if (index !== -1) {
      const { password: newPassword, ...updates } = req.body;
      db.users[index] = { ...db.users[index], ...updates };
      
      // If a new password is provided (not empty), update it
      if (newPassword && newPassword.trim() !== "") {
        console.log(`[AUTH] Password updated for user: ${db.users[index].phone}`);
        db.users[index].password = newPassword.trim();
      }
      
      saveCredentials(db);
      const userWithoutPassword = { ...db.users[index] };
      delete (userWithoutPassword as any).password;
      res.json(userWithoutPassword);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });

  app.delete('/api/auth/users/:id', (req, res) => {
    const id = req.params.id?.toString().trim();
    console.log(`[DELETE] Request received for user ID: ${id}`);
    
    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const db = getCredentials();
    const userIndex = db.users.findIndex((u: any) => u.id === id);
    
    if (userIndex === -1) {
      console.log(`[DELETE] User ${id} not found in database. Current IDs:`, db.users.map((u: any) => u.id));
      return res.status(404).json({ error: 'User not found in database' });
    }

    const user = db.users[userIndex];
    const role = user.role;
    console.log(`[DELETE] Found user: ${user.full_name} (${role})`);

    if (role === 'admin') {
      const adminCount = db.users.filter((u: any) => u.role === 'admin').length;
      if (adminCount <= 1) {
        console.log(`[DELETE] Aborted: Cannot delete the last administrator`);
        return res.status(400).json({ error: 'Cannot delete the last administrator' });
      }
    }

    // Cascade delete: remove from users and all related collections
    const initialUserCount = db.users.length;
    db.users = db.users.filter((u: any) => u.id !== id);
    
    // Clean up related data
    const initialQueueCount = db.queue.length;
    db.queue = db.queue.filter((q: any) => q.patient_id !== id && q.doctor_id !== id);
    
    const initialApptCount = db.appointments.length;
    db.appointments = db.appointments.filter((a: any) => a.patient_id !== id && a.doctor_id !== id);
    
    db.reports = db.reports.filter((r: any) => r.patient_id !== id);
    db.messages = db.messages.filter((m: any) => m.sender_id !== id && m.receiver_id !== id);
    
    try {
      saveCredentials(db);
      console.log(`[DELETE] Success: Deleted ${role} ${id}. Status: Users reduced from ${initialUserCount} to ${db.users.length}. Queue entries reduced from ${initialQueueCount} to ${db.queue.length}. Appointments reduced from ${initialApptCount} to ${db.appointments.length}.`);
      res.json({ 
        success: true, 
        message: `User ${id} and associated data successfully deleted`,
        deleted_id: id,
        deleted_role: role
      });
    } catch (saveErr: any) {
      console.error(`[DELETE] Save failed:`, saveErr);
      res.status(500).json({ error: 'Failed to save database changes' });
    }
  });

  app.delete('/api/queue/:id', (req, res) => {
    const { id } = req.params;
    const db = getCredentials();
    const initialLength = db.queue.length;
    db.queue = db.queue.filter((q: any) => q.id !== id);
    
    if (db.queue.length < initialLength) {
      saveCredentials(db);
      res.json({ success: true, message: 'Queue entry deleted' });
    } else {
      res.status(404).json({ error: 'Queue entry not found' });
    }
  });

  app.get('/api/auth/users', (req, res) => {
    const { role } = req.query;
    const db = getCredentials();
    let users = db.users;
    if (role) users = users.filter((u: any) => u.role === role);
    
    // In this development mode, we'll keep the password field 
    // so the admin can manage and verify credentials.
    res.json(users);
  });

  // Doctor Endpoints
  app.get('/api/doctors', (req, res) => {
    const db = getCredentials();
    const doctors = db.users.filter((u: any) => u.role === 'doctor').map((d: any) => {
      const rest = { ...d };
      delete (rest as any).password;
      return {
        ...rest,
        status: (rest as any).status || 'Available',
        specialization: (rest as any).specialization || 'General Physician'
      };
    });
    res.json(doctors);
  });

  app.get('/api/doctors/:id', (req, res) => {
    const { id } = req.params;
    const db = getCredentials();
    const doctor = db.users.find((u: any) => u.id === id && u.role === 'doctor');
    if (doctor) {
      const rest = { ...doctor };
      delete (rest as any).password;
      res.json({
        ...rest,
        status: (rest as any).status || 'Available',
        specialization: (rest as any).specialization || 'General Physician'
      });
    } else {
      res.status(404).json({ error: 'Doctor not found' });
    }
  });

  app.patch('/api/doctors/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const db = getCredentials();
    const index = db.users.findIndex((u: any) => u.id === id);
    if (index !== -1) {
      db.users[index] = { ...db.users[index], status, updated_at: new Date().toISOString() };
      saveCredentials(db);
      res.json(db.users[index]);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

startServer();


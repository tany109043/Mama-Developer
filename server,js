const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // ✅ added
const app = express();
const PORT = 3000;

app.use(cors({
  origin: '*',        // ✅ allow any site (you can restrict to Udemy later)
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
})); // ✅ allow all CORS origins
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const DB_FILE = path.join(__dirname, 'users.json');
const SCRIPT_FILE = path.join(__dirname, 'protected.js');

function loadUsers() {
  if (!fs.existsSync(DB_FILE)) return {};
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveUsers(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

app.get('/check-access', (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).send('// Email required');

  const users = loadUsers();
  if (!users[email]) {
    users[email] = { status: 'pending', timestamp: new Date().toISOString() };
    saveUsers(users);
    return res.status(403).send('// Access is pending approval.');
  }

  if (users[email].status === 'approved') {
    try {
      const script = fs.readFileSync(SCRIPT_FILE, 'utf8');
      res.setHeader('Content-Type', 'application/javascript');
      return res.status(200).send(script);
    } catch (err) {
      return res.status(500).send('// Failed to load protected script.');
    }
  }

  return res.status(403).send(`// Access ${users[email].status}`);
});

app.get('/admin', (req, res) => {
  const users = loadUsers();
  const rows = Object.entries(users).map(([email, info]) => `
    <tr>
      <td>${email}</td>
      <td>${info.status}</td>
      <td>${info.timestamp || ''}</td>
      <td>
        <form method="POST" action="/action">
          <input type="hidden" name="email" value="${email}">
          <button name="decision" value="approved" ${info.status === 'approved' ? 'disabled' : ''}>✅ Approve</button>
          <button name="decision" value="rejected" ${info.status === 'rejected' ? 'disabled' : ''}>❌ Reject</button>
        </form>
      </td>
    </tr>
  `).join('');

  res.send(`
    <html>
      <body>
        <h2>Access Admin Panel</h2>
        <table border="1" cellpadding="8">
          <tr><th>Email</th><th>Status</th><th>Requested At</th><th>Actions</th></tr>
          ${rows}
        </table>
      </body>
    </html>
  `);
});

app.post('/action', (req, res) => {
  const email = req.body.email;
  const decision = req.body.decision;
  const users = loadUsers();

  if (users[email]) {
    users[email].status = decision;
    saveUsers(users);
  }

  res.redirect('/admin');
});

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});

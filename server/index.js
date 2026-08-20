import express from 'express';
import cors from 'cors';
import { pool, initDb } from './db.js';

const app = express();

// No user accounts exist yet, so anyone with a resume's id can read/write
// it — the id itself (a UUID, unguessable) is what stands in for
// authorization for now. If accounts get added later, this is the layer
// that would gain a check against a logged-in user's own resumes.
app.use(cors());
app.use(express.json({ limit: '5mb' })); // resumes can carry a base64 photo, so keep the limit generous

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Create a new resume, returns its generated id.
app.post('/api/resumes', async (req, res) => {
  const { resume, sectionOrder, hiddenSections } = req.body || {};
  if (!resume) {
    return res.status(400).json({ error: 'Missing "resume" in request body.' });
  }
  try {
    const data = { resume, sectionOrder, hiddenSections };
    const result = await pool.query(
      'INSERT INTO resumes (data) VALUES ($1) RETURNING id, created_at, updated_at',
      [data]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Failed to create resume:', err);
    res.status(500).json({ error: 'Failed to save resume.' });
  }
});

// Fetch a resume by id.
app.get('/api/resumes/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, data, created_at, updated_at FROM resumes WHERE id = $1', [
      req.params.id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found.' });
    }
    const row = result.rows[0];
    res.json({ id: row.id, created_at: row.created_at, updated_at: row.updated_at, ...row.data });
  } catch (err) {
    // An invalid UUID format throws at the DB layer before it ever gets to
    // the "not found" case above — treat it the same way from the client's
    // perspective rather than leaking a raw Postgres error.
    if (err.code === '22P02') {
      return res.status(404).json({ error: 'Resume not found.' });
    }
    console.error('Failed to fetch resume:', err);
    res.status(500).json({ error: 'Failed to fetch resume.' });
  }
});

// Overwrite an existing resume's data (used for "save" after the first save,
// once the client already has an id).
app.put('/api/resumes/:id', async (req, res) => {
  const { resume, sectionOrder, hiddenSections } = req.body || {};
  if (!resume) {
    return res.status(400).json({ error: 'Missing "resume" in request body.' });
  }
  try {
    const data = { resume, sectionOrder, hiddenSections };
    const result = await pool.query(
      'UPDATE resumes SET data = $1, updated_at = now() WHERE id = $2 RETURNING id, updated_at',
      [data, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '22P02') {
      return res.status(404).json({ error: 'Resume not found.' });
    }
    console.error('Failed to update resume:', err);
    res.status(500).json({ error: 'Failed to update resume.' });
  }
});

app.delete('/api/resumes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM resumes WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error('Failed to delete resume:', err);
    res.status(500).json({ error: 'Failed to delete resume.' });
  }
});

const PORT = process.env.PORT || 3001;

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Resume Builder API listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

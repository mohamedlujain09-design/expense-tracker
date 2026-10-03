
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// الاتصال بقاعدة البيانات
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});


const ALLOWED_CATEGORIES = ['Food', 'Transport', 'Bills', 'Entertainment', 'Other'];

  app.get('/api/expenses', async (req, res) => {
  try {
    const queryText = `
      SELECT id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') AS date
      FROM expenses
      ORDER BY date DESC, id DESC
    `;
    const result = await pool.query(queryText);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;
  
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid expense ID' });
  }

  try {
    const queryText = `
      SELECT id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') AS date
      FROM expenses
      WHERE id = $1
    `;
    const result = await pool.query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/api/expenses', async (req, res) => {
  const { title, amount, category, date } = req.body;

  // Validation
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ message: 'Title is required' });
  }
  if (amount === undefined || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ message: 'Amount must be a number greater than 0' });
  }
  if (!category || !ALLOWED_CATEGORIES.includes(category)) {
    return res.status(400).json({ message: `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}` });
  }
  if (!date || isNaN(Date.parse(date))) {
    return res.status(400).json({ message: 'Valid date is required (YYYY-MM-DD)' });
  }

  try {
    const queryText = `
      INSERT INTO expenses (title, amount, category, date)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') AS date
    `;
    const result = await pool.query(queryText, [title.trim(), amount, category, date]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.put('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;
  const { title, amount, category, date } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid expense ID' });
  }

  // Validation
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ message: 'Title is required' });
  }
  if (amount === undefined || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ message: 'Amount must be a number greater than 0' });
  }
  if (!category || !ALLOWED_CATEGORIES.includes(category)) {
    return res.status(400).json({ message: `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}` });
  }
  if (!date || isNaN(Date.parse(date))) {
    return res.status(400).json({ message: 'Valid date is required (YYYY-MM-DD)' });
  }

  try {
    const queryText = `
      UPDATE expenses
      SET title = $1, amount = $2, category = $3, date = $4
      WHERE id = $5
      RETURNING id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') AS date
    `;
    const result = await pool.query(queryText, [title.trim(), amount, category, date, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid expense ID' });
  }

  try {
    const queryText = 'DELETE FROM expenses WHERE id = $1 RETURNING id';
    const result = await pool.query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully', id: Number(id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
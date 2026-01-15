require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: (process.env.DB_HOST || '').trim(),
  port: parseInt((process.env.DB_PORT || '3306').trim()),
  user: (process.env.DB_USER || '').trim(),
  password: (process.env.DB_PASSWORD || '').trim(),
  database: (process.env.DB_NAME || '').trim()
});

const codes = new Map();

app.post('/api/auth/send-code', async (req, res) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  codes.set(req.body.email, {code, expires: Date.now() + 300000});
  res.json({success: true, message: 'Code: ' + code});
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const {email, code, nickname, lifeChoice, category} = req.body;
    const stored = codes.get(email);
    if (!stored || stored.code !== code) return res.json({success: false, message: 'Bad code'});
    const [result] = await pool.query('INSERT INTO users (email,nickname,life_choice,choice_category) VALUES (?,?,?,?)', [email, nickname, lifeChoice, category]);
    const token = jwt.sign({userId: result.insertId, email}, process.env.JWT_SECRET, {expiresIn: '30d'});
    res.json({success: true, token, user: {id: result.insertId, email, nickname, lifeChoice, choiceCategory: category}});
  } catch (e) { console.error(e); res.json({success: false, message: 'Error'}); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const {email, code} = req.body;
    const stored = codes.get(email);
    if (!stored || stored.code !== code) return res.json({success: false, message: 'Bad code'});
    const [users] = await pool.query('SELECT * FROM users WHERE email=?', [email]);
    if (users.length === 0) return res.json({success: false, message: 'Not found'});
    const u = users[0];
    const token = jwt.sign({userId: u.id, email}, process.env.JWT_SECRET, {expiresIn: '30d'});
    res.json({success: true, token, user: {id: u.id, email: u.email, nickname: u.nickname, lifeChoice: u.life_choice, choiceCategory: u.choice_category}});
  } catch (e) { console.error(e); res.json({success: false, message: 'Error'}); }
});

app.get('/api/posts/recommended', async (req, res) => {
  try {
    const [posts] = await pool.query('SELECT * FROM posts ORDER BY created_at DESC LIMIT 50');
    res.json({success: true, posts: posts.map(p => ({id: p.id, authorNickname: p.author_nickname, title: p.title, content: p.content, category: p.category, tags: JSON.parse(p.tags || '[]'), likesCount: p.likes_count, commentsCount: 0, createdAt: p.created_at})), total: posts.length});
  } catch (e) { console.error(e); res.json({success: false, posts: [], error: e.message}); }
});

app.get('/api/posts/category/:cat', async (req, res) => {
  try {
    const [posts] = await pool.query('SELECT * FROM posts WHERE category=? ORDER BY created_at DESC', [req.params.cat]);
    res.json({success: true, posts: posts.map(p => ({id: p.id, authorNickname: p.author_nickname, title: p.title, content: p.content, category: p.category, tags: JSON.parse(p.tags || '[]'), likesCount: p.likes_count, commentsCount: 0, createdAt: p.created_at})), total: posts.length});
  } catch (e) { console.error(e); res.json({success: false, posts: []}); }
});

app.get('/api/posts/:id/comments', async (req, res) => {
  try {
    const [comments] = await pool.query('SELECT * FROM comments WHERE post_id=?', [req.params.id]);
    res.json({success: true, comments: comments.map(c => ({id: c.id, postId: c.post_id, authorNickname: c.author_nickname, content: c.content, createdAt: c.created_at}))});
  } catch (e) { res.json({success: false, comments: []}); }
});

app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM posts');
    res.json({
      success: true,
      dbConnected: true,
      postsCount: rows[0].count,
      env: {
        DB_HOST: process.env.DB_HOST || 'NOT SET',
        DB_PORT: process.env.DB_PORT || 'NOT SET',
        DB_USER: process.env.DB_USER || 'NOT SET',
        DB_NAME: process.env.DB_NAME || 'NOT SET',
        DB_PASSWORD: process.env.DB_PASSWORD ? 'SET' : 'NOT SET'
      }
    });
  } catch (e) {
    res.json({
      success: false,
      dbConnected: false,
      error: e.message,
      env: {
        DB_HOST: process.env.DB_HOST || 'NOT SET',
        DB_PORT: process.env.DB_PORT || 'NOT SET',
        DB_USER: process.env.DB_USER || 'NOT SET',
        DB_NAME: process.env.DB_NAME || 'NOT SET',
        DB_PASSWORD: process.env.DB_PASSWORD ? 'SET' : 'NOT SET'
      }
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log('Server running on port ' + PORT));

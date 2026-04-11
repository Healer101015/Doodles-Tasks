require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'peeps_secret_change_in_production';

// ── Conexão MongoDB ──────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Conectado'))
    .catch(err => console.error('Erro no MongoDB:', err));

// ── Schemas ──────────────────────────────────────────────
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    avatarConfig: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now },
});

const taskSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    completed: { type: Boolean, default: false },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    dueDate: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Task = mongoose.model('Task', taskSchema);

// ── Middleware de autenticação ───────────────────────────
const auth = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }
    try {
        const token = header.split(' ')[1];
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Token inválido ou expirado' });
    }
};

// ── ROTAS DE AUTENTICAÇÃO ────────────────────────────────

// Cadastro
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ error: 'Preencha todos os campos' });
        if (password.length < 6)
            return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
        const exists = await User.findOne({ email });
        if (exists)
            return res.status(400).json({ error: 'Este e-mail já está cadastrado' });
        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashed });
        const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email, avatarConfig: user.avatarConfig },
        });
    } catch {
        res.status(500).json({ error: 'Erro ao criar conta' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ error: 'Preencha e-mail e senha' });
        const user = await User.findOne({ email });
        if (!user)
            return res.status(401).json({ error: 'E-mail ou senha incorretos' });
        const match = await bcrypt.compare(password, user.password);
        if (!match)
            return res.status(401).json({ error: 'E-mail ou senha incorretos' });
        const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, avatarConfig: user.avatarConfig },
        });
    } catch {
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

// Salvar avatar
app.put('/api/auth/avatar', auth, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { avatarConfig: req.body.avatarConfig },
            { new: true }
        );
        res.json({ avatarConfig: user.avatarConfig });
    } catch {
        res.status(500).json({ error: 'Erro ao salvar avatar' });
    }
});

// Perfil
app.get('/api/auth/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch {
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
});

// ── ROTAS DE TAREFAS (protegidas) ───────────────────────

app.get('/api/tasks', auth, async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(tasks);
    } catch {
        res.status(500).json({ error: 'Erro ao buscar tarefas' });
    }
});

app.post('/api/tasks', auth, async (req, res) => {
    try {
        const { title, description, priority, dueDate } = req.body;
        const task = await Task.create({ userId: req.user.id, title, description, priority, dueDate });
        res.status(201).json(task);
    } catch {
        res.status(500).json({ error: 'Erro ao criar tarefa' });
    }
});

app.put('/api/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            req.body,
            { new: true }
        );
        if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });
        res.json(task);
    } catch {
        res.status(500).json({ error: 'Erro ao atualizar tarefa' });
    }
});

app.patch('/api/tasks/:id/toggle', auth, async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
        if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });
        task.completed = !task.completed;
        await task.save();
        res.json(task);
    } catch {
        res.status(500).json({ error: 'Erro ao atualizar tarefa' });
    }
});

app.delete('/api/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });
        res.json({ message: 'Tarefa deletada' });
    } catch {
        res.status(500).json({ error: 'Erro ao deletar tarefa' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
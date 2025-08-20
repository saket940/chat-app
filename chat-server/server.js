// server.js
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chatapp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected')).catch(err => console.log(err));

// User schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    online: { type: Boolean, default: false }
});
const User = mongoose.model('User', userSchema);

// Conversation schema
const conversationSchema = new mongoose.Schema({
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    updatedAt: { type: Date, default: Date.now }
});
const Conversation = mongoose.model('Conversation', conversationSchema);

// Message schema
const messageSchema = new mongoose.Schema({
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Middleware to verify JWT
function auth(req, res, next) {
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
    if (!token) return res.status(401).json({ message: 'No token' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ message: 'Invalid token' });
    }
}

// Register
app.post('/auth/register', async(req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'All fields required' });
    try {
        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) return res.status(400).json({ message: 'User already exists' });
        const hashed = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashed });
        await user.save();
        res.status(201).json({ message: 'User registered' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Login
app.post('/auth/login', async(req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'All fields required' });
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: 'Invalid credentials' });
        const token = jwt.sign({ id: user._id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get all users (except self)
app.get('/users', auth, async(req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user.id } }, 'username email online');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get messages for a conversation
app.get('/conversations/:id/messages', auth, async(req, res) => {
    try {
        const messages = await Message.find({ conversation: req.params.id }).populate('sender', 'username email');
        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Ensure conversation exists between current user and otherUserId
app.post('/conversations/ensure', auth, async(req, res) => {
    try {
        const { otherUserId } = req.body;
        if (!otherUserId) return res.status(400).json({ message: 'otherUserId required' });

        let conv = await Conversation.findOne({ members: { $all: [req.user.id, otherUserId] } });
        if (!conv) {
            conv = new Conversation({ members: [req.user.id, otherUserId] });
            await conv.save();
        }
        res.json({ conversationId: conv._id });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// --- SOCKET.IO LOGIC ---
const onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
    // Authenticate user on connection
    socket.on('user:online', async(userId) => {
        onlineUsers.set(userId, socket.id);
        io.emit('user:status', { userId, online: true });
        await User.findByIdAndUpdate(userId, {
            online: true
        })
    });

    // Handle sending a message
    socket.on('message:send', async({ conversationId, senderId, text }) => {
        // Save message
        const message = new Message({ conversation: conversationId, sender: senderId, text });
        await message.save();
        // Update conversation lastMessage
        await Conversation.findByIdAndUpdate(conversationId, { lastMessage: message._id, updatedAt: Date.now() });
        // Emit to all members
        const conv = await Conversation.findById(conversationId);
        conv.members.forEach((memberId) => {
            const sid = onlineUsers.get(memberId.toString());
            if (sid) io.to(sid).emit('message:new', {...message.toObject(), conversationId });
        });
    });

    // Typing indicator
    socket.on('typing:start', ({ conversationId, userId }) => {
        // Notify other members
        Conversation.findById(conversationId).then(conv => {
            conv.members.forEach((memberId) => {
                if (memberId.toString() !== userId) {
                    const sid = onlineUsers.get(memberId.toString());
                    if (sid) io.to(sid).emit('typing:start', { conversationId, userId });
                }
            });
        });
    });
    socket.on('typing:stop', ({ conversationId, userId }) => {
        Conversation.findById(conversationId).then(conv => {
            conv.members.forEach((memberId) => {
                if (memberId.toString() !== userId) {
                    const sid = onlineUsers.get(memberId.toString());
                    if (sid) io.to(sid).emit('typing:stop', { conversationId, userId });
                }
            });
        });
    });

    // Message read
    socket.on('message:read', async({ conversationId, userId }) => {
        await Message.updateMany({ conversation: conversationId, read: false }, { read: true });
        // Notify other members
        Conversation.findById(conversationId).then(conv => {
            conv.members.forEach((memberId) => {
                if (memberId.toString() !== userId) {
                    const sid = onlineUsers.get(memberId.toString());
                    if (sid) io.to(sid).emit('message:read', { conversationId, userId });
                }
            });
        });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        for (const [userId, sid] of onlineUsers.entries()) {
            if (sid === socket.id) {
                onlineUsers.delete(userId);
                io.emit('user:status', { userId, online: false });
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Chat server running on port ${PORT}`));
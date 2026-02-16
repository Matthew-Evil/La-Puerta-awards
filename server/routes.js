const express = require('express');
const router = express.Router();

// Хранение данных в памяти (временное решение)
let registrations = [];
let users = [
    {
        id: 1,
        username: 'Matthew_Evil',
        status: 'approved',
        role: 'owner',
        registeredAt: new Date().toISOString()
    }
];
let logs = [
    {
        id: 1,
        userId: 1,
        action: 'Вход в админ-панель',
        details: 'Успешный вход создателя',
        ip: '127.0.0.1',
        timestamp: new Date().toISOString()
    }
];

// API для регистраций
router.post('/api/register', (req, res) => {
    const { username, passportImage, statsImage } = req.body;
    
    const newRegistration = {
        id: registrations.length + 1,
        username,
        passportImage,
        statsImage,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        ip: req.ip || '127.0.0.1'
    };
    
    registrations.push(newRegistration);
    
    // Логируем
    logs.push({
        id: logs.length + 1,
        userId: null,
        action: 'Заявка на регистрацию',
        details: `Пользователь: ${username}`,
        ip: req.ip || '127.0.0.1',
        timestamp: new Date().toISOString()
    });
    
    res.json({ success: true, message: 'Заявка отправлена на проверку' });
});

// API для получения регистраций
router.get('/api/registrations', (req, res) => {
    res.json(registrations);
});

// API для действий с регистрациями
router.post('/api/registration/:id/approve', (req, res) => {
    const id = parseInt(req.params.id);
    const registration = registrations.find(r => r.id === id);
    
    if (registration) {
        registration.status = 'approved';
        
        // Добавляем в пользователи
        users.push({
            id: users.length + 1,
            username: registration.username,
            status: 'active',
            role: 'user',
            registeredAt: new Date().toISOString()
        });
        
        logs.push({
            id: logs.length + 1,
            userId: 1,
            action: 'Одобрение регистрации',
            details: `Пользователь: ${registration.username}`,
            ip: req.ip || '127.0.0.1',
            timestamp: new Date().toISOString()
        });
        
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Заявка не найдена' });
    }
});

router.post('/api/registration/:id/reject', (req, res) => {
    const id = parseInt(req.params.id);
    const registration = registrations.find(r => r.id === id);
    
    if (registration) {
        registration.status = 'rejected';
        
        logs.push({
            id: logs.length + 1,
            userId: 1,
            action: 'Отклонение регистрации',
            details: `Пользователь: ${registration.username}`,
            ip: req.ip || '127.0.0.1',
            timestamp: new Date().toISOString()
        });
        
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Заявка не найдена' });
    }
});

// API для пользователей
router.get('/api/users', (req, res) => {
    res.json(users);
});

// API для логов
router.get('/api/logs', (req, res) => {
    res.json(logs);
});

// API для добавления админа
router.post('/api/admins', (req, res) => {
    const { username, password } = req.body;
    
    // Временное решение - в реальном проекте пароль бы хешировался
    users.push({
        id: users.length + 1,
        username,
        status: 'active',
        role: 'admin',
        password, // ВРЕМЕННО - так хранить нельзя!
        registeredAt: new Date().toISOString()
    });
    
    logs.push({
        id: logs.length + 1,
        userId: 1,
        action: 'Добавление администратора',
        details: `Новый админ: ${username}`,
        ip: req.ip || '127.0.0.1',
        timestamp: new Date().toISOString()
    });
    
    res.json({ success: true });
});

// API для удаления админа
router.delete('/api/admins/:username', (req, res) => {
    const { username } = req.params;
    const index = users.findIndex(u => u.username === username && u.role === 'admin');
    
    if (index !== -1 && username !== 'Matthew_Evil') {
        users.splice(index, 1);
        
        logs.push({
            id: logs.length + 1,
            userId: 1,
            action: 'Удаление администратора',
            details: `Удален админ: ${username}`,
            ip: req.ip || '127.0.0.1',
            timestamp: new Date().toISOString()
        });
        
        res.json({ success: true });
    } else {
        res.status(400).json({ error: 'Нельзя удалить создателя или админ не найден' });
    }
});

module.exports = router;
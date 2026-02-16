const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Пути к файлам данных
const dataPath = path.join(__dirname, 'data');
const categoriesPath = path.join(dataPath, 'categories.json');
const settingsPath = path.join(dataPath, 'settings.json');
const votesPath = path.join(dataPath, 'votes.json');
const usersPath = path.join(dataPath, 'users.json');
const logsPath = path.join(dataPath, 'logs.json');

// Вспомогательные функции для работы с файлами
async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Если файла нет, создаем пустой массив/объект
        if (error.code === 'ENOENT') {
            if (filePath.includes('categories')) return [];
            if (filePath.includes('votes')) return [];
            if (filePath.includes('users')) return [];
            if (filePath.includes('logs')) return [];
            return {};
        }
        console.error(`Ошибка чтения файла ${filePath}:`, error);
        throw error;
    }
}

async function writeJsonFile(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`Ошибка записи файла ${filePath}:`, error);
        throw error;
    }
}

async function logAction(action, details = {}) {
    try {
        const logs = await readJsonFile(logsPath);
        const newLog = {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            action,
            ...details
        };
        
        logs.unshift(newLog); // Добавляем в начало
        // Ограничиваем количество логов (последние 1000)
        if (logs.length > 1000) logs.length = 1000;
        
        await writeJsonFile(logsPath, logs);
        return newLog;
    } catch (error) {
        console.error('Ошибка записи лога:', error);
    }
}

// API Routes
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await readJsonFile(categoriesPath);
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка загрузки категорий' });
    }
});

app.get('/api/categories/:id', async (req, res) => {
    try {
        const categories = await readJsonFile(categoriesPath);
        const category = categories.find(c => c.id === parseInt(req.params.id));
        
        if (category) {
            res.json(category);
        } else {
            res.status(404).json({ error: 'Категория не найдена' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Ошибка загрузки категории' });
    }
});

app.post('/api/categories', async (req, res) => {
    try {
        const categories = await readJsonFile(categoriesPath);
        const newCategory = {
            id: categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1,
            ...req.body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        categories.push(newCategory);
        await writeJsonFile(categoriesPath, categories);
        
        await logAction('CATEGORY_CREATED', {
            categoryId: newCategory.id,
            categoryName: newCategory.name,
            admin: req.headers['x-admin-user'] || 'unknown'
        });
        
        res.json(newCategory);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка создания категории' });
    }
});

app.put('/api/categories/:id', async (req, res) => {
    try {
        const categories = await readJsonFile(categoriesPath);
        const index = categories.findIndex(c => c.id === parseInt(req.params.id));
        
        if (index !== -1) {
            categories[index] = {
                ...categories[index],
                ...req.body,
                updatedAt: new Date().toISOString()
            };
            
            await writeJsonFile(categoriesPath, categories);
            
            await logAction('CATEGORY_UPDATED', {
                categoryId: categories[index].id,
                categoryName: categories[index].name,
                admin: req.headers['x-admin-user'] || 'unknown',
                changes: req.body
            });
            
            res.json(categories[index]);
        } else {
            res.status(404).json({ error: 'Категория не найдена' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Ошибка обновления категории' });
    }
});

app.delete('/api/categories/:id', async (req, res) => {
    try {
        const categories = await readJsonFile(categoriesPath);
        const categoryToDelete = categories.find(c => c.id === parseInt(req.params.id));
        
        if (categoryToDelete) {
            const filteredCategories = categories.filter(c => c.id !== parseInt(req.params.id));
            await writeJsonFile(categoriesPath, filteredCategories);
            
            await logAction('CATEGORY_DELETED', {
                categoryId: categoryToDelete.id,
                categoryName: categoryToDelete.name,
                admin: req.headers['x-admin-user'] || 'unknown'
            });
            
            res.json({ success: true, message: 'Категория удалена' });
        } else {
            res.status(404).json({ error: 'Категория не найдена' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Ошибка удаления категории' });
    }
});

// Настройки
app.get('/api/settings', async (req, res) => {
    try {
        const settings = await readJsonFile(settingsPath);
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка загрузки настроек' });
    }
});

app.put('/api/settings', async (req, res) => {
    try {
        const currentSettings = await readJsonFile(settingsPath);
        const updatedSettings = {
            ...currentSettings,
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        
        await writeJsonFile(settingsPath, updatedSettings);
        
        await logAction('SETTINGS_UPDATED', {
            admin: req.headers['x-admin-user'] || 'unknown',
            changes: req.body
        });
        
        res.json(updatedSettings);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка обновления настроек' });
    }
});

// Голосование
app.post('/api/votes', async (req, res) => {
    try {
        const { categoryId, nominations, userId } = req.body;
        
        // Валидация ников
        const nicknameRegex = /^[A-Z][a-z]+_[A-Z][a-z]+$/;
        const validNominations = nominations.every(nick => nicknameRegex.test(nick));
        
        if (!validNominations) {
            return res.status(400).json({ error: 'Неверный формат ников. Используйте: Имя_Фамилия' });
        }
        
        // Проверка на одинаковые ники
        const uniqueNominations = [...new Set(nominations)];
        if (uniqueNominations.length !== nominations.length) {
            return res.status(400).json({ error: 'Нельзя голосовать за одного кандидата несколько раз' });
        }
        
        const votes = await readJsonFile(votesPath);
        
        // Проверяем, голосовал ли уже пользователь в этой категории
        const existingVoteIndex = votes.findIndex(v => 
            v.categoryId === categoryId && v.userId === userId && v.stage === 1
        );
        
        const voteData = {
            id: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            categoryId,
            nominations,
            userId,
            stage: 1,
            votedAt: new Date().toISOString(),
            ip: req.ip,
            userAgent: req.headers['user-agent']
        };
        
        if (existingVoteIndex !== -1) {
            // Перезапись голоса (разрешена один раз)
            const oldVote = votes[existingVoteIndex];
            if (oldVote.replaced) {
                return res.status(400).json({ 
                    error: 'Вы уже использовали возможность перезаписи голоса в этой категории',
                    code: 'REWRITE_USED'
                });
            }
            
            voteData.replaces = oldVote.id;
            voteData.replaced = true;
            votes[existingVoteIndex] = voteData;
        } else {
            // Новый голос
            votes.push(voteData);
        }
        
        await writeJsonFile(votesPath, votes);
        
        await logAction('VOTE_SUBMITTED', {
            categoryId,
            userId,
            stage: 1,
            isRewrite: existingVoteIndex !== -1
        });
        
        res.json({ 
            success: true, 
            message: existingVoteIndex !== -1 ? 'Голос перезаписан' : 'Голос принят',
            voteId: voteData.id
        });
        
    } catch (error) {
        console.error('Ошибка сохранения голоса:', error);
        res.status(500).json({ error: 'Ошибка сохранения голоса' });
    }
});

app.get('/api/votes/stats/:categoryId', async (req, res) => {
    try {
        const votes = await readJsonFile(votesPath);
        const categoryVotes = votes.filter(v => 
            v.categoryId === parseInt(req.params.categoryId) && v.stage === 1
        );
        
        // Подсчитываем голоса
        const voteCount = {};
        categoryVotes.forEach(vote => {
            vote.nominations.forEach(nick => {
                voteCount[nick] = (voteCount[nick] || 0) + 1;
            });
        });
        
        // Сортируем по количеству голосов
        const sorted = Object.entries(voteCount)
            .map(([nickname, count]) => ({ nickname, count }))
            .sort((a, b) => b.count - a.count);
        
        res.json({
            totalVotes: categoryVotes.length,
            topCandidates: sorted.slice(0, 10), // Топ-10 кандидатов
            allCandidates: sorted
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка загрузки статистики' });
    }
});

// Логи
app.get('/api/logs', async (req, res) => {
    try {
        const logs = await readJsonFile(logsPath);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка загрузки логов' });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📊 Данные хранятся в: ${dataPath}`);
});

// Получение топ-5 кандидатов для категории
app.get('/api/votes/top/:categoryId', async (req, res) => {
    try {
        const votes = await readJsonFile(votesPath);
        const categoryId = parseInt(req.params.categoryId);
        const limit = parseInt(req.query.limit) || 5;
        
        // Фильтруем голоса этапа 1 для этой категории
        const stage1Votes = votes.filter(v => 
            v.categoryId === categoryId && v.stage === 1
        );
        
        // Подсчитываем голоса
        const voteCount = {};
        stage1Votes.forEach(vote => {
            vote.nominations.forEach(nick => {
                voteCount[nick] = (voteCount[nick] || 0) + 1;
            });
        });
        
        // Сортируем и берем топ
        const topCandidates = Object.entries(voteCount)
            .map(([nickname, count]) => ({
                nickname,
                votes: count,
                avatar: null // Здесь можно добавить загрузку аватаров
            }))
            .sort((a, b) => b.votes - a.votes)
            .slice(0, limit);
        
        res.json(topCandidates);
        
    } catch (error) {
        console.error('Ошибка получения топ-кандидатов:', error);
        res.status(500).json({ error: 'Ошибка загрузки кандидатов' });
    }
});

// Голосование в этапе 2
app.post('/api/votes/stage2', async (req, res) => {
    try {
        const { categoryId, candidate, userId } = req.body;
        
        // Проверяем активность этапа 2
        const settings = await readJsonFile(settingsPath);
        const stage2 = settings.stage2;
        const now = new Date();
        
        if (!stage2 || !stage2.startDate) {
            return res.status(400).json({ error: 'Голосование еще не началось' });
        }
        
        const startDate = new Date(stage2.startDate);
        const endDate = stage2.endDate ? new Date(stage2.endDate) : null;
        
        if (now < startDate) {
            return res.status(400).json({ error: 'Голосование еще не началось' });
        }
        
        if (endDate && now > endDate) {
            return res.status(400).json({ error: 'Голосование уже завершено' });
        }
        
        // Проверяем, не голосовал ли уже пользователь в этой категории
        const votes = await readJsonFile(votesPath);
        const existingVote = votes.find(v => 
            v.categoryId === categoryId && 
            v.userId === userId && 
            v.stage === 2
        );
        
        if (existingVote) {
            return res.status(400).json({ error: 'Вы уже проголосовали в этой категории' });
        }
        
        // Создаем новый голос
        const voteData = {
            id: `vote2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            categoryId,
            candidate,
            userId,
            stage: 2,
            votedAt: new Date().toISOString(),
            ip: req.ip,
            userAgent: req.headers['user-agent']
        };
        
        votes.push(voteData);
        await writeJsonFile(votesPath, votes);
        
        // Логируем действие
        await logAction('VOTE_STAGE2', {
            categoryId,
            candidate,
            userId,
            ip: req.ip
        });
        
        res.json({ 
            success: true, 
            message: 'Голос принят',
            voteId: voteData.id
        });
        
    } catch (error) {
        console.error('Ошибка сохранения голоса:', error);
        res.status(500).json({ error: 'Ошибка сохранения голоса' });
    }
});

// Получение голосов пользователя в этапе 2
app.get('/api/votes/user/:userId/stage2', async (req, res) => {
    try {
        const votes = await readJsonFile(votesPath);
        const userVotes = votes
            .filter(v => v.userId === req.params.userId && v.stage === 2)
            .reduce((acc, v) => {
                acc[v.categoryId] = {
                    nickname: v.candidate,
                    votedAt: v.votedAt
                };
                return acc;
            }, {});
        
        res.json(userVotes);
        
    } catch (error) {
        console.error('Ошибка загрузки голосов:', error);
        res.status(500).json({ error: 'Ошибка загрузки голосов' });
    }
});
// ============= API ПОБЕДИТЕЛЕЙ =============

// Получение победителей
app.get('/api/winners', async (req, res) => {
    try {
        const votes = await readJsonFile(votesPath);
        const categories = await readJsonFile(categoriesPath);
        
        // Получаем голоса этапа 2
        const stage2Votes = votes.filter(v => v.stage === 2);
        
        // Группируем по категориям и считаем голоса
        const results = {};
        
        stage2Votes.forEach(vote => {
            if (!results[vote.categoryId]) {
                results[vote.categoryId] = {};
            }
            results[vote.categoryId][vote.candidate] = 
                (results[vote.categoryId][vote.candidate] || 0) + 1;
        });
        
        // Определяем победителей
        const winners = categories.map(category => {
            const categoryVotes = results[category.id] || {};
            
            // Находим кандидата с наибольшим количеством голосов
            let winner = null;
            let maxVotes = 0;
            
            Object.entries(categoryVotes).forEach(([candidate, count]) => {
                if (count > maxVotes) {
                    maxVotes = count;
                    winner = candidate;
                }
            });
            
            // Считаем общее количество голосов в категории
            const totalVotes = Object.values(categoryVotes).reduce((sum, count) => sum + count, 0);
            
            return {
                categoryId: category.id,
                categoryName: category.name,
                winner: winner ? {
                    name: winner,
                    votes: maxVotes
                } : null,
                votesCount: maxVotes,
                totalVotes: totalVotes
            };
        });
        
        res.json(winners.filter(w => w.winner !== null));
        
    } catch (error) {
        console.error('Ошибка получения победителей:', error);
        res.status(500).json({ error: 'Ошибка загрузки победителей' });
    }
});

// Получение статистики (общее количество проголосовавших)
app.get('/api/stats/total-voters', async (req, res) => {
    try {
        const votes = await readJsonFile(votesPath);
        
        // Уникальные пользователи в этапе 2
        const stage2Voters = new Set(
            votes.filter(v => v.stage === 2).map(v => v.userId)
        );
        
        res.json({ total: stage2Voters.size });
        
    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        res.json({ total: 0 });
    }
});

// Обновление настроек церемонии (для админ-панели)
app.put('/api/settings/ceremony', async (req, res) => {
    try {
        const settings = await readJsonFile(settingsPath);
        
        settings.ceremony = {
            date: req.body.date,
            place: req.body.place
        };
        
        if (req.body.prizeAmount) {
            settings.prizeAmount = req.body.prizeAmount;
        }
        
        settings.updatedAt = new Date().toISOString();
        
        await writeJsonFile(settingsPath, settings);
        
        await logAction('CEREMONY_UPDATED', {
            date: req.body.date,
            place: req.body.place,
            prize: req.body.prizeAmount,
            admin: req.headers['x-admin-user'] || 'unknown'
        });
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Ошибка обновления настроек:', error);
        res.status(500).json({ error: 'Ошибка обновления' });
    }
});
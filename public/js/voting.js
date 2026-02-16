// voting.js - Логика страницы голосования (упрощенная)

class VotingPage {
    constructor() {
        this.user = null;
        this.settings = {};
        this.categories = [];
        this.candidates = {}; // Топ-5 кандидатов для каждой категории
        this.userVotes = {}; // Голоса текущего пользователя
        this.currentSelection = {}; // Текущий выбор в каждой категории
        this.selectedCandidate = null; // Для модального окна
        
        this.init();
    }
    
    async init() {
        console.log('Инициализация страницы голосования...');
        
        // Загружаем данные пользователя
        this.user = this.getCurrentUser();
        
        // Загружаем настройки
        await this.loadSettings();
        
        // Загружаем категории и кандидатов
        await this.loadCategories();
        
        // Загружаем голоса пользователя
        if (this.user && this.user.status === 'approved') {
            await this.loadUserVotes();
        }
        
        // Отображаем категории
        this.renderCategories();
        
        // Настраиваем обработчики
        this.setupEventListeners();
        
        // Запускаем таймер (если есть дата)
        this.setupTimer();
        
        console.log('Страница голосования готова');
    }
    
    getCurrentUser() {
        try {
            const userData = localStorage.getItem('laPuertaUser');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Ошибка загрузки пользователя:', error);
            return null;
        }
    }
    
    async loadSettings() {
        try {
            const response = await fetch('/api/settings');
            this.settings = await response.json();
        } catch (error) {
            console.error('Ошибка загрузки настроек:', error);
            // Если сервер не отвечает, используем настройки по умолчанию
            this.settings = {
                stage2: {
                    startDate: null,
                    endDate: null
                }
            };
        }
    }
    
    async loadCategories() {
        try {
            const response = await fetch('/api/categories');
            this.categories = await response.json();
            
            // Загружаем топ-5 кандидатов для каждой категории
            await this.loadTopCandidates();
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
            // Тестовые данные для разработки
            this.categories = [
                { id: 1, name: 'Самый влиятельный человек штата', description: 'Игрок с наибольшим влиянием' },
                { id: 2, name: 'Самая влиятельная семья', description: 'Самая сплоченная группировка' },
                { id: 3, name: 'Криминальный авторитет', description: 'Уважаемый лидер криминала' }
            ];
        }
    }
    
    async loadTopCandidates() {
        for (const category of this.categories) {
            try {
                const response = await fetch(`/api/votes/top/${category.id}?limit=5`);
                if (response.ok) {
                    this.candidates[category.id] = await response.json();
                } else {
                    // Тестовые данные для разработки
                    this.candidates[category.id] = this.getTestCandidates(category.id);
                }
            } catch (error) {
                console.error(`Ошибка загрузки кандидатов для категории ${category.id}:`, error);
                // Тестовые данные для разработки
                this.candidates[category.id] = this.getTestCandidates(category.id);
            }
        }
    }
    
    // Тестовые кандидаты для разработки
    getTestCandidates(categoryId) {
        const testNames = [
            'John_Doe',
            'Jane_Smith',
            'Bob_Johnson',
            'Alice_Wonder',
            'Charlie_Brown'
        ];
        
        return testNames.map((name, index) => ({
            nickname: name,
            votes: Math.floor(Math.random() * 100) + 50,
            avatar: null
        })).sort((a, b) => b.votes - a.votes);
    }
    
    async loadUserVotes() {
        try {
            const response = await fetch(`/api/votes/user/${this.user.username}/stage2`);
            if (response.ok) {
                this.userVotes = await response.json();
            }
        } catch (error) {
            console.error('Ошибка загрузки голосов пользователя:', error);
            this.userVotes = {};
        }
    }
    
    renderCategories() {
        const container = document.getElementById('categoriesContainer');
        
        if (!container) return;
        
        if (!this.categories || this.categories.length === 0) {
            container.innerHTML = `
                <div class="empty-categories">
                    <i class="fas fa-inbox"></i>
                    <h3>Категории не найдены</h3>
                    <p>Администратор еще не добавил категории для голосования</p>
                </div>
            `;
            return;
        }
        
        let html = '<div class="categories-grid">';
        
        this.categories.forEach(category => {
            html += this.renderCategoryCard(category);
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // Добавляем обработчики для кандидатов
        this.setupCandidateListeners();
    }
    
    renderCategoryCard(category) {
        const candidates = this.candidates[category.id] || [];
        const hasVoted = this.userVotes && this.userVotes[category.id];
        
        // Проверяем, может ли пользователь голосовать
        const canVote = this.user && 
                       this.user.status === 'approved' && 
                       !hasVoted;
        
        let candidatesHtml = '';
        
        if (candidates.length === 0) {
            candidatesHtml = `
                <div class="no-candidates" style="text-align: center; padding: 20px; color: #888;">
                    <p>Нет кандидатов для голосования</p>
                    <small>Дождитесь окончания этапа 1</small>
                </div>
            `;
        } else {
            candidatesHtml = candidates.map((candidate, index) => {
                const isSelected = this.currentSelection[category.id] === candidate.nickname;
                const isVoted = hasVoted && hasVoted.nickname === candidate.nickname;
                
                return `
                    <div class="candidate-item ${isSelected ? 'selected' : ''} ${isVoted ? 'voted' : ''}" 
                         data-category="${category.id}"
                         data-candidate="${candidate.nickname}"
                         data-index="${index + 1}"
                         style="cursor: ${canVote ? 'pointer' : 'not-allowed'}; opacity: ${canVote ? 1 : 0.6}">
                        <div class="candidate-avatar">
                            <i class="fas fa-user-circle" style="font-size: 2rem; color: #FFA500;"></i>
                        </div>
                        <div class="candidate-info">
                            <div class="candidate-name">
                                ${candidate.nickname.replace('_', ' ')}
                                ${isVoted ? '<span class="voted-indicator"><i class="fas fa-check"></i> Ваш голос</span>' : ''}
                            </div>
                            <div class="candidate-stats">
                                <span class="candidate-rank">
                                    <i class="fas fa-star"></i> Топ-${index + 1}
                                </span>
                                <span style="color: #888;">
                                    <i class="fas fa-vote-yea"></i> ${candidate.votes || 0} голосов
                                </span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        const hasSelection = this.currentSelection[category.id];
        
        return `
            <div class="category-card-voting" data-category-id="${category.id}" 
                 style="background: #1A1A1A; border: 1px solid #333; border-radius: 10px; overflow: hidden;">
                <div class="category-header" style="background: rgba(255,165,0,0.1); padding: 20px;">
                    <h3 style="color: #FFA500; margin-bottom: 8px;">${category.name}</h3>
                    <p style="color: #888; font-size: 0.9rem;">${category.description || 'Выберите одного кандидата'}</p>
                </div>
                
                <div class="category-body" style="padding: 20px;">
                    <div class="candidates-list" style="margin-bottom: 20px;">
                        ${candidatesHtml}
                    </div>
                    
                    ${hasVoted ? `
                        <div class="already-voted-message" style="
                            background: rgba(68,255,68,0.1);
                            border: 1px solid #44FF44;
                            border-radius: 8px;
                            padding: 15px;
                            display: flex;
                            gap: 12px;
                            align-items: center;">
                            <i class="fas fa-check-circle" style="color: #44FF44; font-size: 1.3rem;"></i>
                            <div>
                                <strong style="color: #44FF44;">Вы проголосовали</strong>
                                <p style="color: #888; margin-top: 3px;">Ваш голос учтен в этой категории</p>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${canVote && candidates.length > 0 ? `
                        <div class="vote-action" style="margin-top: 20px;">
                            <button class="vote-submit-btn" 
                                    data-category="${category.id}"
                                    ${!hasSelection ? 'disabled' : ''}
                                    style="width: 100%; padding: 15px; background: ${hasSelection ? '#FFA500' : '#333'}; 
                                           color: ${hasSelection ? 'black' : '#888'}; border: none; 
                                           border-radius: 8px; font-weight: bold; cursor: pointer;
                                           transition: all 0.3s;">
                                <i class="fas fa-vote-yea"></i>
                                Проголосовать
                            </button>
                        </div>
                    ` : ''}
                    
                    ${!this.user ? `
                        <div style="text-align: center; margin-top: 20px; color: #888;">
                            <i class="fas fa-info-circle"></i>
                            <a href="#" onclick="window.authSystem.showLoginModal(); return false;" 
                               style="color: #FFA500; text-decoration: none;">
                                Войдите
                            </a> чтобы голосовать
                        </div>
                    ` : ''}
                    
                    ${this.user && this.user.status !== 'approved' ? `
                        <div style="text-align: center; margin-top: 20px; color: #FFA500;">
                            <i class="fas fa-clock"></i>
                            Ожидайте подтверждения регистрации
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    setupCandidateListeners() {
        // Клик по кандидату
        document.querySelectorAll('.candidate-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const categoryId = parseInt(item.dataset.category);
                
                // Проверяем, может ли пользователь голосовать
                if (!this.user) {
                    if (window.authSystem) {
                        window.authSystem.showLoginModal();
                    } else {
                        alert('Для голосования нужно войти в систему');
                    }
                    return;
                }
                
                if (this.user.status !== 'approved') {
                    alert('Ваша регистрация еще не подтверждена администрацией');
                    return;
                }
                
                if (this.userVotes[categoryId]) {
                    alert('Вы уже проголосовали в этой категории');
                    return;
                }
                
                const candidate = item.dataset.candidate;
                
                // Выбираем кандидата
                this.selectCandidate(categoryId, candidate);
            });
        });
        
        // Клик по кнопке голосования
        document.querySelectorAll('.vote-submit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const categoryId = parseInt(btn.dataset.category);
                const candidate = this.currentSelection[categoryId];
                
                if (candidate) {
                    this.showConfirmModal(categoryId, candidate);
                }
            });
        });
    }
    
    selectCandidate(categoryId, candidate) {
        // Снимаем выделение с других кандидатов в этой категории
        document.querySelectorAll(`.candidate-item[data-category="${categoryId}"]`).forEach(item => {
            item.classList.remove('selected');
            item.style.background = '';
            item.style.borderColor = '#333';
        });
        
        // Выделяем выбранного
        const selectedItem = document.querySelector(
            `.candidate-item[data-category="${categoryId}"][data-candidate="${candidate}"]`
        );
        if (selectedItem) {
            selectedItem.classList.add('selected');
            selectedItem.style.background = 'rgba(255,165,0,0.1)';
            selectedItem.style.borderColor = '#FFA500';
        }
        
        // Сохраняем выбор
        this.currentSelection[categoryId] = candidate;
        
        // Активируем кнопку голосования в этой категории
        const voteBtn = document.querySelector(`.vote-submit-btn[data-category="${categoryId}"]`);
        if (voteBtn) {
            voteBtn.disabled = false;
            voteBtn.style.background = '#FFA500';
            voteBtn.style.color = 'black';
        }
    }
    
    showConfirmModal(categoryId, candidate) {
        const category = this.categories.find(c => c.id === categoryId);
        const candidateData = this.candidates[categoryId]?.find(c => c.nickname === candidate);
        
        if (!category || !candidateData) return;
        
        // Сохраняем выбранного кандидата для отправки
        this.selectedCandidate = {
            categoryId,
            categoryName: category.name,
            candidate: candidateData
        };
        
        // Показываем простое подтверждение
        if (confirm(`Вы уверены, что хотите проголосовать за ${candidate.replace('_', ' ')} в категории "${category.name}"?\n\nГолос нельзя будет изменить!`)) {
            this.submitVote();
        }
    }
    
    async submitVote() {
        if (!this.selectedCandidate || !this.user) return;
        
        try {
            const response = await fetch('/api/votes/stage2', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    categoryId: this.selectedCandidate.categoryId,
                    candidate: this.selectedCandidate.candidate.nickname,
                    userId: this.user.username
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Сохраняем голос локально
                this.userVotes[this.selectedCandidate.categoryId] = {
                    nickname: this.selectedCandidate.candidate.nickname,
                    votedAt: new Date().toISOString()
                };
                
                // Обновляем интерфейс
                this.renderCategories();
                
                alert('✅ Голос успешно принят!');
                
            } else {
                alert(result.error || 'Ошибка при сохранении голоса');
            }
            
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка соединения с сервером');
        }
    }
    
    setupTimer() {
        // Простой таймер, если есть дата
        const stage2 = this.settings.stage2;
        
        if (stage2 && stage2.endDate) {
            const endDate = new Date(stage2.endDate);
            const now = new Date();
            
            if (endDate > now) {
                this.updateTimer();
                setInterval(() => this.updateTimer(), 1000);
            }
        }
    }
    
    updateTimer() {
        const stage2 = this.settings.stage2;
        
        if (!stage2 || !stage2.endDate) {
            document.getElementById('timerContainer').style.display = 'none';
            return;
        }
        
        const endDate = new Date(stage2.endDate);
        const now = new Date();
        const timeDiff = endDate - now;
        
        if (timeDiff <= 0) {
            document.getElementById('timerContainer').style.display = 'none';
            return;
        }
        
        document.getElementById('timerContainer').style.display = 'block';
        
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        document.getElementById('days').textContent = days.toString().padStart(2, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    }
    
    setupEventListeners() {
        // Обновление данных каждые 30 секунд
        setInterval(() => {
            this.loadSettings();
            this.loadCategories();
        }, 30000);
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.votingPage = new VotingPage();
});
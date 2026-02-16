// nominations.js - Логика страницы номинаций

class NominationsPage {
    constructor() {
        this.currentCategory = null;
        this.categories = [];
        this.settings = {};
        this.user = null;
        this.interval = null;
        this.userVotes = {};
        
        this.init();
    }
    
    async init() {
        // Загружаем данные пользователя
        this.user = this.getCurrentUser();
        
        // Загружаем категории и настройки
        await this.loadData();
        
        // Настраиваем таймер
        this.setupTimer();
        
        // Настраиваем обработчики событий
        this.setupEventListeners();
        
        // Обновляем данные каждые 30 секунд
        this.setupAutoRefresh();
        
        console.log('Страница номинаций инициализирована');
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
    
    async loadData() {
        try {
            // Загружаем категории
            const categoriesResponse = await fetch('/api/categories');
            this.categories = await categoriesResponse.json();
            
            // Загружаем настройки
            const settingsResponse = await fetch('/api/settings');
            this.settings = await settingsResponse.json();
            
            // Загружаем голоса пользователя (если авторизован)
            if (this.user) {
                await this.loadUserVotes();
            }
            
            // Отображаем категории
            this.renderCategories();
            
            // Обновляем таймер
            this.updateTimer();
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.showError('Ошибка загрузки данных. Пожалуйста, обновите страницу.');
        }
    }
    
    async loadUserVotes() {
        try {
            const response = await fetch(`/api/votes/user/${this.user.username}`);
            if (response.ok) {
                this.userVotes = await response.json();
            }
        } catch (error) {
            console.error('Ошибка загрузки голосов:', error);
        }
    }
    
    renderCategories() {
        const grid = document.getElementById('categoriesGrid');
        if (!grid) return;
        
        if (this.categories.length === 0) {
            grid.innerHTML = `
                <div class="empty-categories">
                    <i class="fas fa-inbox"></i>
                    <h3>Категории не найдены</h3>
                    <p>Администратор еще не добавил категории для голосования</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = this.categories.map(category => this.renderCategoryCard(category)).join('');
        
        // Назначаем обработчики для кнопок голосования
        document.querySelectorAll('.category-card-vote').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.vote-btn')) return;
                
                const categoryId = parseInt(card.dataset.categoryId);
                this.openVoteModal(categoryId);
            });
        });
    }
    
    renderCategoryCard(category) {
        const hasVoted = this.userVotes[category.id];
        const canVote = this.user && this.user.status === 'approved';
        
        return `
            <div class="category-card-vote" data-category-id="${category.id}">
                <div class="category-icon">
                    <i class="fas fa-${this.getCategoryIcon(category.id)}"></i>
                </div>
                
                <h3>${category.name}</h3>
                <p>${category.description || 'Описание категории'}</p>
                
                <div class="category-stats">
                    <div class="stat-item">
                        <div class="stat-value">${category.stage || 1}</div>
                        <div class="stat-label">Этап</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${category.voteCount || 0}</div>
                        <div class="stat-label">Голосов</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">3</div>
                        <div class="stat-label">Кандидатов</div>
                    </div>
                </div>
                
                <button class="vote-btn" ${!canVote ? 'disabled' : ''}>
                    <i class="fas fa-${hasVoted ? 'edit' : 'vote-yea'}"></i>
                    ${hasVoted ? 'Изменить голос' : 'Предложить кандидатов'}
                </button>
                
                ${!canVote ? `
                    <div class="vote-disabled">
                        <small>Требуется подтвержденная регистрация</small>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    getCategoryIcon(categoryId) {
        const icons = {
            1: 'crown',
            2: 'users',
            3: 'user-secret',
            4: 'shield-alt',
            5: 'star',
            6: 'award',
            7: 'trophy',
            8: 'medal'
        };
        return icons[categoryId] || 'star';
    }
    
    setupTimer() {
        // Обновляем таймер каждую секунду
        this.interval = setInterval(() => this.updateTimer(), 1000);
        this.updateTimer();
    }
    
    updateTimer() {
        const stageSettings = this.settings.stage1;
        const timerElement = document.getElementById('stageTimer');
        const messageElement = document.getElementById('timerMessage');
        
        if (!stageSettings || !stageSettings.startDate) {
            // Голосование еще не началось
            this.showTimerMessage('Ожидание начала голосования', timerElement, messageElement);
            return;
        }
        
        const startDate = new Date(stageSettings.startDate);
        const now = new Date();
        
        if (now < startDate) {
            // До начала голосования
            const timeDiff = startDate - now;
            this.updateCountdown(timeDiff, timerElement);
            messageElement.textContent = `Голосование начнется ${startDate.toLocaleDateString('ru-RU')}`;
            return;
        }
        
        if (!stageSettings.endDate) {
            // Голосование идет, но не установлена дата окончания
            messageElement.textContent = 'Голосование идет';
            return;
        }
        
        const endDate = new Date(stageSettings.endDate);
        
        if (now > endDate) {
            // Голосование завершено
            this.showTimerMessage('Прием номинаций завершен', timerElement, messageElement);
            return;
        }
        
        // Идет голосование, показываем обратный отсчет
        const timeDiff = endDate - now;
        this.updateCountdown(timeDiff, timerElement);
        messageElement.textContent = 'Идет прием номинаций';
    }
    
    updateCountdown(timeDiff, timerElement) {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        document.getElementById('days').textContent = days.toString().padStart(2, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    }
    
    showTimerMessage(message, timerElement, messageElement) {
        timerElement.style.display = 'none';
        messageElement.textContent = message;
        messageElement.style.fontSize = '1.2rem';
        messageElement.style.color = 'var(--primary)';
        messageElement.style.textAlign = 'center';
        messageElement.style.padding = '20px';
    }
    
    openVoteModal(categoryId) {
        // Проверяем авторизацию
        if (!this.user) {
            this.showNotification('Для голосования нужно войти в систему', 'warning');
            // Показываем модалку входа из auth.js
            if (window.authSystem) {
                window.authSystem.showLoginModal();
            }
            return;
        }
        
        // Проверяем статус пользователя
        if (this.user.status !== 'approved') {
            this.showNotification('Ваша регистрация еще не подтверждена администрацией', 'warning');
            return;
        }
        
        // Находим категорию
        this.currentCategory = this.categories.find(c => c.id === categoryId);
        if (!this.currentCategory) return;
        
        // Заполняем модальное окно
        document.getElementById('modalCategoryName').textContent = this.currentCategory.name;
        document.getElementById('modalCategoryDescription').textContent = 
            this.currentCategory.description || 'Описание категории';
        
        // Показываем существующий голос, если есть
        const existingVote = this.userVotes[categoryId];
        if (existingVote) {
            document.getElementById('existingVoteAlert').style.display = 'flex';
            document.getElementById('existingNominations').textContent = 
                existingVote.nominations.join(', ');
        } else {
            document.getElementById('existingVoteAlert').style.display = 'none';
        }
        
        // Сбрасываем форму
        this.resetVoteForm();
        
        // Показываем модальное окно
        document.getElementById('voteModal').classList.add('show');
        
        // Фокус на первое поле
        setTimeout(() => {
            document.getElementById('nomination1').focus();
        }, 300);
    }
    
    resetVoteForm() {
        // Очищаем поля
        ['1', '2', '3'].forEach(num => {
            document.getElementById(`nomination${num}`).value = '';
            document.getElementById(`error${num}`).textContent = '';
        });
        
        // Сбрасываем чекбокс
        document.getElementById('confirmVote').checked = false;
        
        // Очищаем сообщения
        document.getElementById('voteError').textContent = '';
        document.getElementById('voteSuccess').textContent = '';
        
        // Блокируем кнопку отправки
        document.getElementById('submitVoteBtn').disabled = true;
        
        // Валидация в реальном времени
        this.setupRealTimeValidation();
    }
    
    setupRealTimeValidation() {
        const inputs = document.querySelectorAll('.nomination-input');
        const confirmCheckbox = document.getElementById('confirmVote');
        const submitBtn = document.getElementById('submitVoteBtn');
        
        // Валидация каждого поля
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.validateNominationField(input);
                this.updateSubmitButton();
            });
        });
        
        // Валидация чекбокса
        confirmCheckbox.addEventListener('change', () => {
            this.updateSubmitButton();
        });
        
        // Проверка дубликатов при потере фокуса
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.checkForDuplicates();
            });
        });
    }
    
    validateNominationField(input) {
        const value = input.value.trim();
        const index = input.dataset.index;
        const errorElement = document.getElementById(`error${index}`);
        
        // Очищаем предыдущую ошибку
        errorElement.textContent = '';
        
        if (!value) {
            return false;
        }
        
        // Проверяем формат Nick_Name
        const nicknameRegex = /^[A-Z][a-z]+_[A-Z][a-z]+$/;
        
        if (!nicknameRegex.test(value)) {
            errorElement.textContent = 'Формат: Имя_Фамилия (например: John_Doe)';
            input.classList.add('error');
            return false;
        }
        
        input.classList.remove('error');
        return true;
    }
    
    checkForDuplicates() {
        const inputs = document.querySelectorAll('.nomination-input');
        const values = Array.from(inputs)
            .map(input => input.value.trim())
            .filter(value => value);
        
        // Проверяем дубликаты
        const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
        
        if (duplicates.length > 0) {
            inputs.forEach(input => {
                if (duplicates.includes(input.value.trim())) {
                    const index = input.dataset.index;
                    document.getElementById(`error${index}`).textContent = 
                        'Нельзя голосовать за одного кандидата несколько раз';
                    input.classList.add('error');
                }
            });
            return false;
        }
        
        return true;
    }
    
    updateSubmitButton() {
        const inputs = document.querySelectorAll('.nomination-input');
        const confirmCheckbox = document.getElementById('confirmVote');
        const submitBtn = document.getElementById('submitVoteBtn');
        
        // Проверяем, что все поля заполнены и валидны
        const allFilled = Array.from(inputs).every(input => {
            const value = input.value.trim();
            return value && !input.classList.contains('error');
        });
        
        // Проверяем, что нет дубликатов
        const noDuplicates = this.checkForDuplicates();
        
        // Проверяем подтверждение
        const confirmed = confirmCheckbox.checked;
        
        submitBtn.disabled = !(allFilled && noDuplicates && confirmed);
    }
    
    async submitVote() {
        if (!this.currentCategory || !this.user) return;
        
        const submitBtn = document.getElementById('submitVoteBtn');
        const errorElement = document.getElementById('voteError');
        const successElement = document.getElementById('voteSuccess');
        
        // Собираем данные
        const nominations = [1, 2, 3].map(num => 
            document.getElementById(`nomination${num}`).value.trim()
        );
        
        // Проверяем, что все поля заполнены
        if (nominations.some(nick => !nick)) {
            errorElement.textContent = 'Заполните все три поля';
            return;
        }
        
        // Проверяем формат всех ников
        const nicknameRegex = /^[A-Z][a-z]+_[A-Z][a-z]+$/;
        const invalidNick = nominations.find(nick => !nicknameRegex.test(nick));
        
        if (invalidNick) {
            errorElement.textContent = `Неверный формат ника: ${invalidNick}`;
            return;
        }
        
        // Проверяем дубликаты
        const uniqueNominations = [...new Set(nominations)];
        if (uniqueNominations.length !== nominations.length) {
            errorElement.textContent = 'Нельзя голосовать за одного кандидата несколько раз';
            return;
        }
        
        // Показываем загрузку
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Отправка...';
        submitBtn.disabled = true;
        errorElement.textContent = '';
        successElement.textContent = '';
        
        try {
            const response = await fetch('/api/votes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    categoryId: this.currentCategory.id,
                    nominations,
                    userId: this.user.username
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Успех
                successElement.textContent = result.message;
                successElement.style.color = '#44FF44';
                
                // Обновляем голоса пользователя
                this.userVotes[this.currentCategory.id] = {
                    nominations,
                    votedAt: new Date().toISOString()
                };
                
                // Обновляем интерфейс
                this.renderCategories();
                
                // Закрываем модалку через 3 секунды
                setTimeout(() => {
                    this.closeVoteModal();
                    this.showNotification(result.message, 'success');
                }, 3000);
                
            } else {
                // Ошибка
                errorElement.textContent = result.error || 'Ошибка при отправке голоса';
                errorElement.style.color = '#FF4444';
                
                // Особый случай: использована перезапись
                if (result.code === 'REWRITE_USED') {
                    this.showNotification('Вы уже использовали возможность перезаписи голоса', 'warning');
                }
            }
            
        } catch (error) {
            console.error('Ошибка при отправке голоса:', error);
            errorElement.textContent = 'Ошибка соединения с сервером';
            errorElement.style.color = '#FF4444';
            
        } finally {
            // Восстанавливаем кнопку
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Предложить кандидатов';
            submitBtn.disabled = false;
        }
    }
    
    closeVoteModal() {
        document.getElementById('voteModal').classList.remove('show');
        this.currentCategory = null;
    }
    
    setupEventListeners() {
        // Закрытие модального окна
        document.getElementById('closeModalBtn')?.addEventListener('click', () => {
            this.closeVoteModal();
        });
        
        document.getElementById('cancelVoteBtn')?.addEventListener('click', () => {
            this.closeVoteModal();
        });
        
        // Закрытие по клику вне окна
        document.getElementById('voteModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'voteModal') {
                this.closeVoteModal();
            }
        });
        
        // Отправка голоса
        document.getElementById('submitVoteBtn')?.addEventListener('click', () => {
            this.submitVote();
        });
        
        // Подтверждение по Enter
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && document.getElementById('voteModal').classList.contains('show')) {
                const submitBtn = document.getElementById('submitVoteBtn');
                if (!submitBtn.disabled) {
                    this.submitVote();
                }
            }
        });
    }
    
    setupAutoRefresh() {
        // Обновляем данные каждые 30 секунд
        setInterval(async () => {
            await this.loadData();
        }, 30000);
    }
    
    showNotification(message, type = 'info') {
        // Используем функцию из auth.js или создаем свою
        if (window.authSystem && window.authSystem.showNotification) {
            window.authSystem.showNotification(message, type);
        } else {
            // Простая реализация уведомления
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 25px;
                border-radius: 8px;
                background: ${type === 'success' ? '#44FF44' : 
                           type === 'warning' ? '#FFA500' : '#FF4444'};
                color: ${type === 'warning' ? '#000' : '#fff'};
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'global-error';
        errorDiv.innerHTML = `
            <div style="background: #FF4444; color: white; padding: 15px; 
                        border-radius: 5px; margin: 20px; text-align: center;">
                <i class="fas fa-exclamation-triangle"></i> ${message}
            </div>
        `;
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.prepend(errorDiv);
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.nominationsPage = new NominationsPage();
    
    // Проверяем авторизацию при загрузке
    const user = JSON.parse(localStorage.getItem('laPuertaUser') || 'null');
    if (!user) {
        console.log('Пользователь не авторизован');
    } else if (user.status !== 'approved') {
        console.log('Пользователь не подтвержден');
    }
});
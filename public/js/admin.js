// admin.js - Админ-панель La Puerta Awards

class AdminPanel {
    constructor() {
        this.currentAdmin = null;
        this.applications = [];
        this.init();
    }
    
    async init() {
        this.checkAdminAuth();
        this.loadApplications();
        this.setupEventListeners();
        this.renderApplications();
    }
    
    // Проверка авторизации админа
    checkAdminAuth() {
        // Простая проверка - в реальном проекте должна быть проверка через сервер
        const userData = localStorage.getItem('laPuertaUser');
        if (userData) {
            const user = JSON.parse(userData);
            if (user.role === 'admin' || user.role === 'owner') {
                this.currentAdmin = user;
                console.log('Админ авторизован:', user.username);
                return true;
            }
        }
        
        // Если не админ - показываем сообщение
        document.getElementById('applicationsContainer').innerHTML = `
            <div class="alert alert-danger">
                <h3>Доступ запрещен</h3>
                <p>Только администраторы имеют доступ к этой странице.</p>
                <a href="index.html" class="btn btn-primary">Вернуться на главную</a>
            </div>
        `;
        return false;
    }
    
    // Загрузка заявок
    loadApplications() {
        try {
            // Используем глобальную функцию из auth.js
            if (typeof window.getLaPuertaApplications === 'function') {
                this.applications = window.getLaPuertaApplications();
                console.log('Заявки загружены:', this.applications.length);
            } else {
                console.error('Функция getLaPuertaApplications не найдена!');
                // Пробуем загрузить напрямую из localStorage
                const appsData = localStorage.getItem('laPuertaApplications');
                this.applications = appsData ? JSON.parse(appsData) : [];
                console.log('Заявки загружены напрямую:', this.applications.length);
            }
        } catch (error) {
            console.error('Ошибка загрузки заявок:', error);
            this.applications = [];
        }
    }
    
    // Настройка обработчиков
    setupEventListeners() {
        // Кнопка обновления
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.loadApplications();
            this.renderApplications();
            this.showNotification('Список заявок обновлен', 'success');
        });
        
        // Кнопка добавления тестовых данных
        document.getElementById('testDataBtn')?.addEventListener('click', () => {
            if (typeof window.addTestLaPuertaApplications === 'function') {
                window.addTestLaPuertaApplications();
                this.loadApplications();
                this.renderApplications();
                this.showNotification('Тестовые заявки добавлены', 'success');
            } else {
                this.showNotification('Функция добавления тестовых данных не найдена', 'error');
            }
        });
        
        // Кнопка очистки
        document.getElementById('clearBtn')?.addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите удалить все заявки?')) {
                localStorage.removeItem('laPuertaApplications');
                this.applications = [];
                this.renderApplications();
                this.showNotification('Все заявки удалены', 'warning');
            }
        });
    }
    
    // Отображение заявок
    renderApplications() {
        const container = document.getElementById('applicationsContainer');
        if (!container) return;
        
        // Фильтруем заявки ожидающие проверки
        const pendingApps = this.applications.filter(app => app.status === 'pending');
        
        if (pendingApps.length === 0) {
            container.innerHTML = `
                <div class="no-applications">
                    <h3>Нет заявок на проверку</h3>
                    <p>Все пользователи уже обработаны</p>
                    <div class="no-applications-info">
                        <p><strong>Всего заявок в системе:</strong> ${this.applications.length}</p>
                        <p><strong>Одобрено:</strong> ${this.applications.filter(app => app.status === 'approved').length}</p>
                        <p><strong>Отклонено:</strong> ${this.applications.filter(app => app.status === 'rejected').length}</p>
                    </div>
                    <button id="testDataBtn" class="btn btn-secondary mt-3">Добавить тестовые заявки</button>
                    <button id="refreshBtn" class="btn btn-primary mt-3">Обновить</button>
                </div>
            `;
            
            document.getElementById('testDataBtn')?.addEventListener('click', () => {
                if (typeof window.addTestLaPuertaApplications === 'function') {
                    window.addTestLaPuertaApplications();
                    this.loadApplications();
                    this.renderApplications();
                }
            });
            
            document.getElementById('refreshBtn')?.addEventListener('click', () => {
                this.loadApplications();
                this.renderApplications();
            });
            
            return;
        }
        
        // Отображаем заявки
        let html = `
            <div class="applications-header">
                <h3>Заявки на проверку (${pendingApps.length})</h3>
                <div class="header-actions">
                    <button id="refreshBtn" class="btn btn-sm btn-primary">
                        <i class="fas fa-sync-alt"></i> Обновить
                    </button>
                </div>
            </div>
            <div class="applications-stats mb-4">
                <div class="stat-card">
                    <div class="stat-number">${pendingApps.length}</div>
                    <div class="stat-label">Ожидают</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${this.applications.filter(app => app.status === 'approved').length}</div>
                    <div class="stat-label">Одобрено</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${this.applications.filter(app => app.status === 'rejected').length}</div>
                    <div class="stat-label">Отклонено</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${this.applications.length}</div>
                    <div class="stat-label">Всего</div>
                </div>
            </div>
            <div class="applications-list">
        `;
        
        pendingApps.forEach((app, index) => {
            html += this.renderApplicationCard(app, index);
        });
        
        html += `</div>`;
        
        container.innerHTML = html;
        
        // Назначаем обработчики для кнопок
        this.setupApplicationButtons();
    }
    
    // Рендер карточки заявки
    renderApplicationCard(application, index) {
        return `
            <div class="application-card" data-id="${application.id}">
                <div class="application-header">
                    <div class="application-info">
                        <div class="application-number">#${index + 1}</div>
                        <div class="application-user">
                            <h4>${application.username}</h4>
                            <div class="application-meta">
                                <span class="application-date">
                                    <i class="far fa-clock"></i> ${application.applicationDate}
                                </span>
                                <span class="application-discord">
                                    <i class="fab fa-discord"></i> ${application.discord}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="application-status pending">
                        ? Ожидает проверки
                    </div>
                </div>
                
                <div class="application-body">
                    <div class="application-images">
                        <div class="image-preview">
                            <h5><i class="fas fa-passport"></i> Паспорт</h5>
                            <div class="image-container">
                                <img src="${application.passportImage}" 
                                     alt="Паспорт ${application.username}" 
                                     class="application-image"
                                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9IiMzMzMiPjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBzdHlsZT0iZmlsbDojMjIyO3N0cm9rZTojMzMzO3N0cm9rZS13aWR0aDoyIi8+PHRleHQgeD0iMTAwIiB5PSI3NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2Ij5QYXNzcG9ydCBJbWFnZTwvdGV4dD48L3N2Zz4='">
                                <button class="btn-view-image" data-image="${application.passportImage}" data-title="Паспорт ${application.username}">
                                    <i class="fas fa-expand"></i> Увеличить
                                </button>
                            </div>
                        </div>
                        <div class="image-preview">
                            <h5><i class="fas fa-chart-line"></i> Статистика</h5>
                            <div class="image-container">
                                <img src="${application.statsImage}" 
                                     alt="Статистика ${application.username}" 
                                     class="application-image"
                                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9IiMzMzMiPjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBzdHlsZT0iZmlsbDojMjIyO3N0cm9rZTojMzMzO3N0cm9rZS13aWR0aDoyIi8+PHRleHQgeD0iMTAwIiB5PSI3NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2Ij5TdGF0cyBJbWFnZTwvdGV4dD48L3N2Zz4='">
                                <button class="btn-view-image" data-image="${application.statsImage}" data-title="Статистика ${application.username}">
                                    <i class="fas fa-expand"></i> Увеличить
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="application-actions">
                        <button class="btn-approve" data-id="${application.id}">
                            <i class="fas fa-check"></i> Одобрить
                        </button>
                        <button class="btn-reject" data-id="${application.id}">
                            <i class="fas fa-times"></i> Отклонить
                        </button>
                        <button class="btn-view-details" data-id="${application.id}">
                            <i class="fas fa-info-circle"></i> Подробнее
                        </button>
                    </div>
                </div>
                
                <div class="application-footer">
                    <div class="application-id">
                        <strong>ID:</strong> ${application.id}
                    </div>
                </div>
            </div>
        `;
    }
    
    // Настройка кнопок заявок
    setupApplicationButtons() {
        // Кнопка обновления
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.loadApplications();
            this.renderApplications();
        });
        
        // Кнопки одобрить/отклонить
        document.querySelectorAll('.btn-approve').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const appId = e.target.closest('[data-id]').dataset.id;
                this.approveApplication(appId);
            });
        });
        
        document.querySelectorAll('.btn-reject').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const appId = e.target.closest('[data-id]').dataset.id;
                this.rejectApplication(appId);
            });
        });
        
        // Кнопки просмотра изображений
        document.querySelectorAll('.btn-view-image').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const imageSrc = btn.dataset.image;
                const title = btn.dataset.title;
                this.showImageModal(imageSrc, title);
            });
        });
        
        // Кнопки подробнее
        document.querySelectorAll('.btn-view-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const appId = e.target.closest('[data-id]').dataset.id;
                this.showApplicationDetails(appId);
            });
        });
    }
    
    // Одобрить заявку
    approveApplication(applicationId) {
        const notes = prompt('Введите комментарий для одобрения (необязательно):', 'Заявка одобрена');
        
        if (typeof window.updateLaPuertaApplication === 'function') {
            const success = window.updateLaPuertaApplication(
                applicationId, 
                'approved', 
                this.currentAdmin?.username || 'admin',
                notes || 'Заявка одобрена'
            );
            
            if (success) {
                this.loadApplications();
                this.renderApplications();
                this.showNotification('Заявка одобрена', 'success');
            } else {
                this.showNotification('Ошибка при одобрении заявки', 'error');
            }
        } else {
            this.showNotification('Функция обновления заявок не найдена', 'error');
        }
    }
    
    // Отклонить заявку
    rejectApplication(applicationId) {
        const notes = prompt('Введите причину отклонения:', 'Не указана причина');
        
        if (notes === null) return; // Пользователь отменил
        
        if (typeof window.updateLaPuertaApplication === 'function') {
            const success = window.updateLaPuertaApplication(
                applicationId, 
                'rejected', 
                this.currentAdmin?.username || 'admin',
                notes || 'Заявка отклонена'
            );
            
            if (success) {
                this.loadApplications();
                this.renderApplications();
                this.showNotification('Заявка отклонена', 'warning');
            } else {
                this.showNotification('Ошибка при отклонении заявки', 'error');
            }
        } else {
            this.showNotification('Функция обновления заявок не найдена', 'error');
        }
    }
    
    // Показать изображение
    showImageModal(imageSrc, title) {
        const modal = document.createElement('div');
        modal.className = 'image-modal-overlay';
        modal.innerHTML = `
            <div class="image-modal">
                <div class="image-modal-header">
                    <h3>${title}</h3>
                    <button class="image-modal-close">&times;</button>
                </div>
                <div class="image-modal-body">
                    <img src="${imageSrc}" alt="${title}" class="modal-image">
                </div>
                <div class="image-modal-footer">
                    <button class="btn btn-secondary image-modal-close">Закрыть</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelectorAll('.image-modal-close').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
    
    // Показать детали заявки
    showApplicationDetails(applicationId) {
        const application = this.applications.find(app => app.id === applicationId);
        if (!application) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>Детали заявки #${applicationId}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="detail-item">
                        <strong>Имя пользователя:</strong> ${application.username}
                    </div>
                    <div class="detail-item">
                        <strong>Discord:</strong> ${application.discord}
                    </div>
                    <div class="detail-item">
                        <strong>Дата подачи:</strong> ${application.applicationDate}
                    </div>
                    <div class="detail-item">
                        <strong>Статус:</strong> ${this.getStatusText(application.status)}
                    </div>
                    ${application.reviewed ? `
                        <div class="detail-item">
                            <strong>Проверено:</strong> ${application.reviewer || 'Не указано'}
                        </div>
                        <div class="detail-item">
                            <strong>Дата проверки:</strong> ${application.reviewDate || 'Не указано'}
                        </div>
                        <div class="detail-item">
                            <strong>Комментарий:</strong> ${application.notes || 'Нет комментария'}
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary modal-close">Закрыть</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
    
    // Получить текст статуса
    getStatusText(status) {
        const statusMap = {
            'pending': '? Ожидает проверки',
            'approved': '? Одобрено',
            'rejected': '? Отклонено'
        };
        return statusMap[status] || status;
    }
    
    // Показать уведомление
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `admin-notification ${type}`;
        notification.innerHTML = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Инициализация админ-панели
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
    
    // Добавляем стили для админ-панели
    const style = document.createElement('style');
    style.textContent = `
        .applications-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #333;
        }
        
        .applications-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: #2A2A2A;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #333;
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #FFA500;
            margin-bottom: 5px;
        }
        
        .stat-label {
            color: #CCC;
            font-size: 0.9rem;
        }
        
        .applications-list {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .application-card {
            background: #2A2A2A;
            border: 1px solid #333;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .application-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            background: #333;
        }
        
        .application-info {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .application-number {
            background: #FFA500;
            color: black;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 1.2rem;
        }
        
        .application-user h4 {
            margin: 0;
            color: white;
        }
        
        .application-meta {
            display: flex;
            gap: 15px;
            margin-top: 5px;
            font-size: 0.9rem;
            color: #AAA;
        }
        
        .application-status {
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: bold;
        }
        
        .application-status.pending {
            background: rgba(255, 165, 0, 0.2);
            color: #FFA500;
            border: 1px solid #FFA500;
        }
        
        .application-body {
            padding: 20px;
        }
        
        .application-images {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .image-preview h5 {
            color: #CCC;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .image-container {
            position: relative;
            background: #1A1A1A;
            border-radius: 5px;
            overflow: hidden;
            border: 1px solid #333;
        }
        
        .application-image {
            width: 100%;
            height: 150px;
            object-fit: cover;
        }
        
        .btn-view-image {
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 0.8rem;
        }
        
        .btn-view-image:hover {
            background: rgba(255, 165, 0, 0.7);
        }
        
        .application-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .btn-approve, .btn-reject, .btn-view-details {
            padding: 8px 15px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .btn-approve {
            background: #28a745;
            color: white;
        }
        
        .btn-approve:hover {
            background: #218838;
        }
        
        .btn-reject {
            background: #dc3545;
            color: white;
        }
        
        .btn-reject:hover {
            background: #c82333;
        }
        
        .btn-view-details {
            background: #6c757d;
            color: white;
        }
        
        .btn-view-details:hover {
            background: #5a6268;
        }
        
        .application-footer {
            padding: 10px 15px;
            background: #333;
            border-top: 1px solid #444;
        }
        
        .application-id {
            font-family: monospace;
            font-size: 0.8rem;
            color: #888;
        }
        
        .no-applications {
            text-align: center;
            padding: 50px 20px;
            background: #2A2A2A;
            border-radius: 8px;
            border: 2px dashed #333;
        }
        
        .no-applications h3 {
            color: #FFA500;
            margin-bottom: 10px;
        }
        
        .no-applications p {
            color: #AAA;
            margin-bottom: 20px;
        }
        
        .no-applications-info {
            background: #333;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            text-align: left;
            display: inline-block;
        }
        
        .admin-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        }
        
        .admin-notification.success {
            background: #28a745;
        }
        
        .admin-notification.error {
            background: #dc3545;
        }
        
        .admin-notification.warning {
            background: #ffc107;
            color: black;
        }
        
        .admin-notification.info {
            background: #17a2b8;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .image-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        }
        
        .image-modal {
            background: #2A2A2A;
            border-radius: 8px;
            max-width: 90%;
            max-height: 90%;
            overflow: hidden;
        }
        
        .image-modal-header {
            padding: 15px;
            background: #333;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .image-modal-header h3 {
            margin: 0;
            color: white;
        }
        
        .image-modal-close {
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
        }
        
        .image-modal-body {
            padding: 20px;
            max-height: 70vh;
            overflow: auto;
        }
        
        .modal-image {
            max-width: 100%;
            max-height: 60vh;
            display: block;
            margin: 0 auto;
        }
        
        .image-modal-footer {
            padding: 15px;
            background: #333;
            text-align: right;
        }
        
        .alert {
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }
        
        .alert-danger {
            background: #dc3545;
            color: white;
        }
        
        .mt-3 {
            margin-top: 15px;
        }
        
        .mb-4 {
            margin-bottom: 30px;
        }
    `;
    document.head.appendChild(style);
    
    // Проверяем данные при загрузке
    console.log('?? Админ-панель загружена');
    console.log('?? Проверка данных:', window.getLaPuertaApplications ? window.getLaPuertaApplications() : 'Функция не доступна');
});
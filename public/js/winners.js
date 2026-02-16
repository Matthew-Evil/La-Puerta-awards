// winners.js - Логика страницы победителей

class WinnersPage {
    constructor() {
        this.winners = [];
        this.settings = {};
        this.categories = [];
        this.prizeAmount = 100000; // По умолчанию 100,000$
        
        this.init();
    }
    
    async init() {
        console.log('Загрузка страницы победителей...');
        
        // Загружаем настройки
        await this.loadSettings();
        
        // Загружаем категории
        await this.loadCategories();
        
        // Загружаем победителей
        await this.loadWinners();
        
        // Отображаем информацию
        this.renderCeremonyInfo();
        this.renderWinners();
        
        console.log('Страница победителей загружена');
    }
    
    async loadSettings() {
        try {
            const response = await fetch('/api/settings');
            this.settings = await response.json();
            
            // Загружаем приз из настроек
            if (this.settings.prizeAmount) {
                this.prizeAmount = this.settings.prizeAmount;
            }
            
            // Загружаем дату и место награждения
            if (this.settings.ceremony) {
                this.ceremonyDate = this.settings.ceremony.date;
                this.ceremonyPlace = this.settings.ceremony.place;
            }
            
        } catch (error) {
            console.error('Ошибка загрузки настроек:', error);
            // Настройки по умолчанию
            this.ceremonyDate = 'Скоро будет объявлено';
            this.ceremonyPlace = 'La Puerta, Главная площадь';
        }
    }
    
    async loadCategories() {
        try {
            const response = await fetch('/api/categories');
            this.categories = await response.json();
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
            // Тестовые категории
            this.categories = [
                { id: 1, name: 'Самый влиятельный человек штата' },
                { id: 2, name: 'Самая влиятельная семья' },
                { id: 3, name: 'Криминальный авторитет' },
                { id: 4, name: 'Лучший сотрудник силовой структуры' }
            ];
        }
    }
    
    async loadWinners() {
        try {
            // Загружаем результаты голосования этапа 2
            const response = await fetch('/api/winners');
            
            if (response.ok) {
                this.winners = await response.json();
            } else {
                // Тестовые данные для разработки
                this.winners = this.getTestWinners();
            }
            
        } catch (error) {
            console.error('Ошибка загрузки победителей:', error);
            // Тестовые данные для разработки
            this.winners = this.getTestWinners();
        }
        
        // Подсчитываем общее количество проголосовавших
        await this.loadTotalVoters();
    }
    
    getTestWinners() {
        const testNames = [
            { name: 'John_Doe', votes: 156 },
            { name: 'Jane_Smith', votes: 142 },
            { name: 'Bob_Johnson', votes: 98 },
            { name: 'Alice_Wonder', votes: 87 }
        ];
        
        return this.categories.map((category, index) => ({
            categoryId: category.id,
            categoryName: category.name,
            winner: testNames[index % testNames.length],
            votesCount: Math.floor(Math.random() * 200) + 50,
            totalVotes: Math.floor(Math.random() * 500) + 200
        }));
    }
    
    async loadTotalVoters() {
        try {
            const response = await fetch('/api/stats/total-voters');
            if (response.ok) {
                const data = await response.json();
                document.getElementById('totalVoters').textContent = data.total;
            }
        } catch (error) {
            // Если не загрузилось, показываем сумму голосов из тестовых данных
            const total = this.winners.reduce((sum, w) => sum + (w.votesCount || 0), 0);
            document.getElementById('totalVoters').textContent = total || 1245;
        }
    }
    
    renderCeremonyInfo() {
        // Обновляем дату
        const dateElement = document.getElementById('ceremonyDate');
        if (this.ceremonyDate) {
            dateElement.textContent = this.ceremonyDate;
        }
        
        // Обновляем место
        const placeElement = document.getElementById('ceremonyPlace');
        if (this.ceremonyPlace) {
            placeElement.textContent = this.ceremonyPlace;
        }
        
        // Обновляем приз
        const prizeElement = document.getElementById('prizeAmount');
        prizeElement.textContent = this.formatPrize(this.prizeAmount);
    }
    
    renderWinners() {
        const grid = document.getElementById('winnersGrid');
        
        if (!grid) return;
        
        if (!this.winners || this.winners.length === 0) {
            grid.innerHTML = `
                <div class="no-winners">
                    <i class="fas fa-trophy"></i>
                    <h3>Победители еще не определены</h3>
                    <p>Дождитесь окончания голосования</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        this.winners.forEach((winner, index) => {
            html += this.renderWinnerCard(winner, index + 1);
        });
        
        grid.innerHTML = html;
    }
    
    renderWinnerCard(winner, rank) {
        // Определяем класс для ранга
        let rankClass = 'winner-rank';
        if (rank === 1) rankClass += ' winner-rank-1';
        else if (rank === 2) rankClass += ' winner-rank-2';
        else if (rank === 3) rankClass += ' winner-rank-3';
        
        // Иконка для ранга
        let rankIcon = '';
        if (rank === 1) rankIcon = '🥇';
        else if (rank === 2) rankIcon = '🥈';
        else if (rank === 3) rankIcon = '🥉';
        else rankIcon = `#${rank}`;
        
        const winnerName = winner.winner?.name || 'Не определен';
        const winnerDisplay = winnerName.replace('_', ' ');
        
        return `
            <div class="winner-card">
                <div class="${rankClass}">
                    ${rankIcon} ${winner.categoryName}
                </div>
                <div class="winner-content">
                    <div class="winner-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="winner-info">
                        <div class="winner-category">Победитель</div>
                        <div class="winner-name">
                            ${winnerDisplay}
                            <span>${winner.votesCount || 0} голосов</span>
                        </div>
                        <div class="winner-prize">
                            <i class="fas fa-money-bill-wave"></i>
                            ${this.formatPrize(this.prizeAmount)}
                        </div>
                        <div class="winner-stats">
                            <span>
                                <i class="fas fa-users"></i>
                                Всего голосов: ${winner.totalVotes || 0}
                            </span>
                            <span>
                                <i class="fas fa-percent"></i>
                                ${winner.votesCount ? Math.round((winner.votesCount / winner.totalVotes) * 100) : 0}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    formatPrize(amount) {
        if (amount >= 1000000) {
            return (amount / 1000000).toFixed(1) + ' млн $';
        } else if (amount >= 1000) {
            return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + '$';
        } else {
            return amount + '$';
        }
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.winnersPage = new WinnersPage();
});
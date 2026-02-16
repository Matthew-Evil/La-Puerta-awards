// Система авторизации и регистрации La Puerta Awards

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }
    
    init() {
        this.loadUserData();
        this.setupEventListeners();
        this.updateUI();
    }
    
    // Загрузка данных пользователя из LocalStorage
    loadUserData() {
        try {
            const userData = localStorage.getItem('laPuertaUser');
            if (userData) {
                this.currentUser = JSON.parse(userData);
                console.log('Пользователь загружен:', this.currentUser.username);
            }
        } catch (error) {
            console.error('Ошибка загрузки пользователя:', error);
            localStorage.removeItem('laPuertaUser');
        }
    }
    
    // Сохранение данных пользователя
    saveUserData() {
        if (this.currentUser) {
            localStorage.setItem('laPuertaUser', JSON.stringify(this.currentUser));
        }
    }
    
    // Загрузка всех заявок из LocalStorage
    loadApplications() {
        try {
            const apps = localStorage.getItem('laPuertaApplications');
            return apps ? JSON.parse(apps) : [];
        } catch (error) {
            console.error('Ошибка загрузки заявок:', error);
            return [];
        }
    }
    
    // Сохранение всех заявок в LocalStorage
    saveApplications(applications) {
        try {
            localStorage.setItem('laPuertaApplications', JSON.stringify(applications));
            console.log('Заявки сохранены, всего:', applications.length);
        } catch (error) {
            console.error('Ошибка сохранения заявок:', error);
        }
    }
    
    // Обновление интерфейса
    updateUI() {
        const userIcon = document.getElementById('userIcon');
        const userDropdown = document.getElementById('userDropdown');
        
        if (!userIcon || !userDropdown) return;
        
        // Очищаем дропдаун
        userDropdown.innerHTML = '';
        userDropdown.classList.remove('show');
        
        if (!this.currentUser) {
            // Не авторизован
            userIcon.className = 'user-icon';
            userIcon.innerHTML = '<i class="fas fa-user"></i>';
            this.renderGuestDropdown(userDropdown);
        } else {
            // Авторизован
            if (this.currentUser.status === 'pending') {
                // Ожидает проверки
                userIcon.className = 'user-icon pending';
                userIcon.innerHTML = '<i class="fas fa-user-clock"></i>';
                this.renderPendingDropdown(userDropdown);
            } else if (this.currentUser.role === 'admin' || this.currentUser.role === 'owner') {
                // Админ
                userIcon.className = 'user-icon admin';
                userIcon.innerHTML = '<i class="fas fa-user-shield"></i>';
                this.renderAdminDropdown(userDropdown);
            } else {
                // Обычный пользователь
                userIcon.className = 'user-icon logged-in';
                userIcon.innerHTML = '<i class="fas fa-user-check"></i>';
                this.renderUserDropdown(userDropdown);
            }
        }
    }
    
    // Дропдаун для гостя
    renderGuestDropdown(dropdown) {
        dropdown.innerHTML = `
            <div class="dropdown-menu">
                <li><button id="loginBtn"><i class="fas fa-sign-in-alt"></i> Вход</button></li>
                <li><button id="registerBtn"><i class="fas fa-user-plus"></i> Регистрация</button></li>
            </div>
        `;
    }
    
    // Дропдаун для ожидающего проверки
    renderPendingDropdown(dropdown) {
        dropdown.innerHTML = `
            <div class="dropdown-header">
                <div class="dropdown-username">${this.currentUser.username}</div>
                <div class="dropdown-status">⏳ На проверке</div>
            </div>
            <div class="dropdown-menu">
                <li><button id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Выйти</button></li>
            </div>
            <div class="dropdown-footer">
                Администрация проверит ваши данные в течение 24 часов
            </div>
        `;
    }
    
    // Дропдаун для обычного пользователя
    renderUserDropdown(dropdown) {
        dropdown.innerHTML = `
            <div class="dropdown-header">
                <div class="dropdown-username">${this.currentUser.username}</div>
                <div class="dropdown-status">✅ Подтвержден</div>
            </div>
            <div class="dropdown-menu">
                <li><button id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Выйти</button></li>
            </div>
        `;
    }
    
    // Дропдаун для админа
    renderAdminDropdown(dropdown) {
        dropdown.innerHTML = `
            <div class="dropdown-header">
                <div class="dropdown-username">${this.currentUser.username}</div>
                <div class="dropdown-status">${this.currentUser.role === 'owner' ? '👑 Создатель' : '⚙️ Администратор'}</div>
            </div>
            <div class="dropdown-menu">
                <li><a href="admin.html" id="adminPanelBtn"><i class="fas fa-cog"></i> Админ-панель</a></li>
                <div class="dropdown-divider"></div>
                <li><button id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Выйти</button></li>
            </div>
        `;
    }
    
    // Настройка обработчиков событий
    setupEventListeners() {
        // Иконка пользователя
        document.addEventListener('click', (e) => {
            const userIcon = document.getElementById('userIcon');
            const userDropdown = document.getElementById('userDropdown');
            
            if (userIcon && userIcon.contains(e.target)) {
                // Клик по иконке
                userDropdown.classList.toggle('show');
                
                // Закрытие при клике вне
                document.addEventListener('click', (e2) => {
                    if (!userDropdown.contains(e2.target) && !userIcon.contains(e2.target)) {
                        userDropdown.classList.remove('show');
                    }
                }, { once: true });
            }
        });
        
        // Делегирование событий в дропдауне
        document.addEventListener('click', (e) => {
            // Вход
            if (e.target.id === 'loginBtn' || e.target.closest('#loginBtn')) {
                this.showLoginModal();
                document.getElementById('userDropdown')?.classList.remove('show');
            }
            
            // Регистрация
            if (e.target.id === 'registerBtn' || e.target.closest('#registerBtn')) {
                this.showRegisterModal();
                document.getElementById('userDropdown')?.classList.remove('show');
            }
            
            // Выход
            if (e.target.id === 'logoutBtn' || e.target.closest('#logoutBtn')) {
                this.logout();
                document.getElementById('userDropdown')?.classList.remove('show');
            }
        });
    }
    
    // Показать модальное окно входа
    showLoginModal() {
        const modal = this.createLoginModal();
        document.body.appendChild(modal);
        
        // Обработчики для модалки входа
        document.getElementById('loginSubmitBtn')?.addEventListener('click', () => this.login());
        document.getElementById('switchToRegister')?.addEventListener('click', () => {
            this.closeModal();
            setTimeout(() => this.showRegisterModal(), 300);
        });
        
        // Enter для входа
        modal.querySelectorAll('input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.login();
            });
        });
    }
    
    // Показать модальное окно регистрации
    showRegisterModal() {
        const modal = this.createRegisterModal();
        document.body.appendChild(modal);
        
        // Начальная настройка
        this.setupRegisterForm();
    }
    
    // Создание модалки входа
    createLoginModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.id = 'loginModal';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title"><i class="fas fa-sign-in-alt"></i> Вход в аккаунт</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Имя пользователя (Nick_Name)</label>
                        <input type="text" id="loginUsername" placeholder="Пример: Matthew_Evil" class="form-control">
                    </div>
                    
                    <div class="form-group">
                        <label>Пароль</label>
                        <input type="password" id="loginPassword" placeholder="Введите пароль" class="form-control">
                    </div>
                    
                    <div id="loginError" class="error-message"></div>
                    
                    <button class="btn btn-primary" id="loginSubmitBtn" style="width: 100%; margin-top: 20px;">
                        <i class="fas fa-sign-in-alt"></i> Войти
                    </button>
                    
                    <button class="btn-login-switch" id="switchToRegister">
                        Нет аккаунта? Зарегистрироваться
                    </button>
                </div>
            </div>
        `;
        
        // Закрытие модалки
        modal.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });
        
        return modal;
    }
    
    // Создание модалки регистрации
    createRegisterModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.id = 'registerModal';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title"><i class="fas fa-user-plus"></i> Регистрация</h3>
                    <button class="modal-close">&times;</button>
                </div>
                
                <div class="modal-steps">
                    <div class="step active" id="step1">
                        <div class="step-number">1</div>
                        <div class="step-label">Аккаунт</div>
                    </div>
                    <div class="step" id="step2">
                        <div class="step-number">2</div>
                        <div class="step-label">Подтверждение</div>
                    </div>
                </div>
                
                <div class="modal-body">
                    <!-- Шаг 1: Аккаунт -->
                    <div class="form-step active" id="step1Form">
                        <div class="form-group">
                            <label>Имя пользователя (Nick_Name)</label>
                            <input type="text" id="regUsername" placeholder="Пример: Matthew_Evil" class="form-control">
                            <div class="error-message" id="usernameError"></div>
                        </div>
                        
                        <div class="form-group">
                            <label>Пароль</label>
                            <input type="password" id="regPassword" placeholder="Минимум 8 символов" class="form-control">
                            <div class="password-strength">
                                <div class="strength-bar" id="passwordStrength"></div>
                            </div>
                            <div class="password-rules" id="passwordRules"></div>
                        </div>
                        
                        <div class="form-group">
                            <label>Подтверждение пароля</label>
                            <input type="password" id="regPasswordConfirm" placeholder="Повторите пароль" class="form-control">
                            <div class="error-message" id="passwordConfirmError"></div>
                        </div>
                        
                        <div class="warning-note">
                            <i class="fas fa-exclamation-triangle"></i>
                            <strong>ВАЖНО:</strong> Не используйте пароль от игрового аккаунта!
                        </div>
                    </div>
                    
                    <!-- Шаг 2: Подтверждение -->
                    <div class="form-step" id="step2Form">
                        <div class="form-group">
                            <label>Discord для связи</label>
                            <input type="text" id="regDiscord" placeholder="Пример: username" class="form-control">
                            <div class="error-message" id="discordError"></div>
                        </div>
                        
                        <div class="form-group">
                            <label>Скриншот паспорта из игры</label>
                            <div class="file-upload-area" id="passportUpload">
                                <i class="fas fa-cloud-upload-alt" style="font-size: 2rem; color: #FFA500; margin-bottom: 10px;"></i>
                                <p>Перетащите файл сюда или нажмите для выбора</p>
                                <p style="font-size: 0.8rem; color: #888; margin-top: 5px;">JPG, PNG (макс. 5MB)</p>
                                <input type="file" id="passportFile" accept="image/*" hidden>
                            </div>
                            <div class="file-preview" id="passportPreview"></div>
                        </div>
                        
                        <div class="form-group">
                            <label>Скриншот статистики персонажа</label>
                            <div class="file-upload-area" id="statsUpload">
                                <i class="fas fa-cloud-upload-alt" style="font-size: 2rem; color: #FFA500; margin-bottom: 10px;"></i>
                                <p>Перетащите файл сюда или нажмите для выбора</p>
                                <p style="font-size: 0.8rem; color: #888; margin-top: 5px;">JPG, PNG (макс. 5MB)</p>
                                <input type="file" id="statsFile" accept="image/*" hidden>
                            </div>
                            <div class="file-preview" id="statsPreview"></div>
                        </div>
                    </div>
                    
                    <div id="registerError" class="error-message"></div>
                    <div id="registerSuccess" class="success-message"></div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-prev" id="prevStepBtn" disabled>Назад</button>
                    <button class="btn-next" id="nextStepBtn">Далее</button>
                    <button class="btn-submit" id="submitBtn" disabled>Зарегистрироваться</button>
                </div>
            </div>
        `;
        
        // Закрытие модалки
        modal.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });
        
        return modal;
    }
    
    // Настройка формы регистрации
    setupRegisterForm() {
        let currentStep = 1;
        const step1Form = document.getElementById('step1Form');
        const step2Form = document.getElementById('step2Form');
        const prevBtn = document.getElementById('prevStepBtn');
        const nextBtn = document.getElementById('nextStepBtn');
        const submitBtn = document.getElementById('submitBtn');
        const step1El = document.getElementById('step1');
        const step2El = document.getElementById('step2');
        
        // Автоматическая активация кнопки "Далее" при валидации шага 1
        const checkStep1Validity = () => {
            const username = document.getElementById('regUsername')?.value;
            const password = document.getElementById('regPassword')?.value;
            const passwordConfirm = document.getElementById('regPasswordConfirm')?.value;
            
            if (username && password && passwordConfirm) {
                if (this.validateStep1()) {
                    nextBtn.disabled = false;
                    nextBtn.style.opacity = '1';
                    nextBtn.style.cursor = 'pointer';
                } else {
                    nextBtn.disabled = true;
                    nextBtn.style.opacity = '0.5';
                    nextBtn.style.cursor = 'not-allowed';
                }
            }
        };
        
        // Автоматическая активация кнопки "Зарегистрироваться" при валидации шага 2
        const checkStep2Validity = () => {
            const discord = document.getElementById('regDiscord')?.value;
            const passportFile = document.getElementById('passportFile')?.files[0];
            const statsFile = document.getElementById('statsFile')?.files[0];
            
            if (discord && passportFile && statsFile) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
            } else {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
                submitBtn.style.cursor = 'not-allowed';
            }
        };
        
        // Проверка имени пользователя
        document.getElementById('regUsername')?.addEventListener('input', (e) => {
            this.validateUsername(e.target.value);
            checkStep1Validity();
        });
        
        // Проверка пароля
        document.getElementById('regPassword')?.addEventListener('input', (e) => {
            this.validatePassword(e.target.value);
            checkStep1Validity();
        });
        
        // Подтверждение пароля
        document.getElementById('regPasswordConfirm')?.addEventListener('input', (e) => {
            this.validatePasswordConfirm(e.target.value);
            checkStep1Validity();
        });
        
        // Проверка Discord
        document.getElementById('regDiscord')?.addEventListener('input', (e) => {
            this.validateDiscord(e.target.value);
            if (currentStep === 2) checkStep2Validity();
        });
        
        // Загрузка файлов
        this.setupFileUpload('passportUpload', 'passportFile', 'passportPreview', checkStep2Validity);
        this.setupFileUpload('statsUpload', 'statsFile', 'statsPreview', checkStep2Validity);
        
        // Кнопка "Далее"
        nextBtn?.addEventListener('click', () => {
            if (currentStep === 1) {
                if (this.validateStep1()) {
                    currentStep = 2;
                    this.updateRegisterSteps(currentStep);
                    checkStep2Validity(); // Проверяем шаг 2 после перехода
                }
            }
        });
        
        // Кнопка "Назад"
        prevBtn?.addEventListener('click', () => {
            if (currentStep === 2) {
                currentStep = 1;
                this.updateRegisterSteps(currentStep);
                checkStep1Validity(); // Проверяем шаг 1 после возврата
            }
        });
        
        // Кнопка "Зарегистрироваться"
        submitBtn?.addEventListener('click', () => {
            this.registerUser();
        });
        
        // Инициализируем проверку
        checkStep1Validity();
    }
    
    // Обновление шагов регистрации
    updateRegisterSteps(step) {
        const step1Form = document.getElementById('step1Form');
        const step2Form = document.getElementById('step2Form');
        const prevBtn = document.getElementById('prevStepBtn');
        const nextBtn = document.getElementById('nextStepBtn');
        const submitBtn = document.getElementById('submitBtn');
        const step1El = document.getElementById('step1');
        const step2El = document.getElementById('step2');
        
        if (step === 1) {
            step1Form.classList.add('active');
            step2Form.classList.remove('active');
            prevBtn.disabled = true;
            prevBtn.style.opacity = '0.5';
            nextBtn.style.display = 'block';
            submitBtn.style.display = 'none';
            step1El.classList.add('active');
            step2El.classList.remove('active');
            step2El.classList.remove('completed');
        } else {
            step1Form.classList.remove('active');
            step2Form.classList.add('active');
            prevBtn.disabled = false;
            prevBtn.style.opacity = '1';
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'block';
            step1El.classList.remove('active');
            step1El.classList.add('completed');
            step2El.classList.add('active');
        }
    }
    
    // Настройка загрузки файлов
    setupFileUpload(dropAreaId, fileInputId, previewId, callback = null) {
        const dropArea = document.getElementById(dropAreaId);
        const fileInput = document.getElementById(fileInputId);
        const preview = document.getElementById(previewId);
        
        if (!dropArea || !fileInput) return;
        
        // Клик по области
        dropArea.addEventListener('click', () => fileInput.click());
        
        // Перетаскивание файлов
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            dropArea.classList.add('dragover');
        }
        
        function unhighlight() {
            dropArea.classList.remove('dragover');
        }
        
        // Обработка drop
        dropArea.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles(files);
        }
        
        // Обработка выбора файла
        fileInput.addEventListener('change', () => {
            handleFiles(fileInput.files);
        });
        
        const handleFiles = (files) => {
            preview.innerHTML = '';
            
            [...files].forEach(file => {
                if (!file.type.match('image.*')) {
                    this.showNotification('Только изображения!', 'error');
                    return;
                }
                
                if (file.size > 5 * 1024 * 1024) {
                    this.showNotification('Файл слишком большой (макс. 5MB)', 'error');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-item';
                    fileItem.innerHTML = `
                        <i class="fas fa-image"></i>
                        <span>${file.name}</span>
                        <button class="file-remove" data-filename="${file.name}">&times;</button>
                    `;
                    preview.appendChild(fileItem);
                    
                    // Удаление файла
                    fileItem.querySelector('.file-remove').addEventListener('click', () => {
                        fileItem.remove();
                        fileInput.value = '';
                        if (callback) callback();
                    });
                };
                reader.readAsDataURL(file);
                
                // Вызываем callback для проверки валидности
                if (callback) callback();
            });
        };
    }
    
    // Валидация имени пользователя
    validateUsername(username) {
        const errorEl = document.getElementById('usernameError');
        if (!errorEl) return false;
        
        if (!username) {
            errorEl.textContent = 'Введите имя пользователя';
            return false;
        }
        
        // Проверяем наличие нижнего подчеркивания
        if (!username.includes('_')) {
            errorEl.textContent = 'Формат: Имя_Фамилия (с нижним подчеркиванием)';
            return false;
        }
        
        // Проверяем что обе части начинаются с заглавной буквы
        const parts = username.split('_');
        if (parts.length !== 2) {
            errorEl.textContent = 'Формат: Имя_Фамилия (ровно две части через _)';
            return false;
        }
        
        // Проверяем что каждая часть начинается с заглавной буквы
        if (!parts[0] || !parts[1]) {
            errorEl.textContent = 'Имя и фамилия не могут быть пустыми';
            return false;
        }
        
        // Проверяем заглавные буквы
        const namePart = parts[0];
        const surnamePart = parts[1];
        
        if (namePart.charAt(0) !== namePart.charAt(0).toUpperCase() || 
            surnamePart.charAt(0) !== surnamePart.charAt(0).toUpperCase()) {
            errorEl.textContent = 'Имя и фамилия должны начинаться с заглавной буквы';
            return false;
        }
        
        // Проверяем что после первой буквы идут маленькие буквы
        if (namePart.substring(1) !== namePart.substring(1).toLowerCase() ||
            surnamePart.substring(1) !== surnamePart.substring(1).toLowerCase()) {
            errorEl.textContent = 'После первой заглавной буквы должны быть маленькие буквы';
            return false;
        }
        
        // Проверка существующего пользователя (симуляция)
        const existingUsers = ['John_Doe', 'Jane_Smith']; // Временный список
        if (existingUsers.includes(username)) {
            errorEl.textContent = 'Пользователь уже существует';
            return false;
        }
        
        errorEl.textContent = '';
        return true;
    }
    
    // Валидация пароля
    validatePassword(password) {
        const strengthBar = document.getElementById('passwordStrength');
        const rulesEl = document.getElementById('passwordRules');
        
        if (!strengthBar || !rulesEl) return false;
        
        const rules = {
            length: password.length >= 8,
            letter: /[a-zA-Z]/.test(password),
            number: /\d/.test(password),
        };
        
        // Обновляем правила
        rulesEl.innerHTML = `
            <ul>
                <li class="${rules.length ? 'valid' : 'invalid'}">
                    <i class="fas fa-${rules.length ? 'check' : 'times'}"></i>
                    Минимум 8 символов
                </li>
                <li class="${rules.letter ? 'valid' : 'invalid'}">
                    <i class="fas fa-${rules.letter ? 'check' : 'times'}"></i>
                    Хотя бы одна буква
                </li>
                <li class="${rules.number ? 'valid' : 'invalid'}">
                    <i class="fas fa-${rules.number ? 'check' : 'times'}"></i>
                    Хотя бы одна цифра
                </li>
            </ul>
        `;
        
        // Определяем силу пароля
        const validRules = Object.values(rules).filter(v => v).length;
        let strength = 'weak';
        
        if (validRules === 3) strength = 'strong';
        else if (validRules >= 2) strength = 'medium';
        
        strengthBar.className = 'strength-bar';
        strengthBar.classList.add(`strength-${strength}`);
        
        return validRules === 3; // Все правила выполнены
    }
    
    // Подтверждение пароля
    validatePasswordConfirm(passwordConfirm) {
        const errorEl = document.getElementById('passwordConfirmError');
        const password = document.getElementById('regPassword')?.value;
        
        if (!errorEl) return false;
        
        if (!passwordConfirm) {
            errorEl.textContent = 'Подтвердите пароль';
            return false;
        }
        
        if (passwordConfirm !== password) {
            errorEl.textContent = 'Пароли не совпадают';
            return false;
        }
        
        errorEl.textContent = '';
        return true;
    }
    
    // Валидация Discord
    validateDiscord(discord) {
        const errorEl = document.getElementById('discordError');
        
        if (!errorEl) return false;
        
        if (!discord) {
            errorEl.textContent = 'Введите Discord для связи';
            return false;
        }
        
        // Убираем ограничения на длину и формат, только проверяем что не пусто
        if (discord.trim().length === 0) {
            errorEl.textContent = 'Введите Discord для связи';
            return false;
        }
        
        errorEl.textContent = '';
        return true;
    }
    
    // Валидация шага 1
    validateStep1() {
        const username = document.getElementById('regUsername')?.value;
        const password = document.getElementById('regPassword')?.value;
        const passwordConfirm = document.getElementById('regPasswordConfirm')?.value;
        
        const usernameValid = this.validateUsername(username);
        const passwordValid = this.validatePassword(password);
        const confirmValid = this.validatePasswordConfirm(passwordConfirm);
        
        return usernameValid && passwordValid && confirmValid;
    }
    
    // Валидация шага 2
    validateStep2() {
        const discord = document.getElementById('regDiscord')?.value;
        const passportFile = document.getElementById('passportFile')?.files[0];
        const statsFile = document.getElementById('statsFile')?.files[0];
        
        // Простая проверка заполненности полей
        if (!discord || !passportFile || !statsFile) {
            return false;
        }
        
        return true;
    }
    
    // Вход в систему
    async login() {
        const username = document.getElementById('loginUsername')?.value;
        const password = document.getElementById('loginPassword')?.value;
        const errorEl = document.getElementById('loginError');
        const submitBtn = document.getElementById('loginSubmitBtn');
        
        if (!username || !password) {
            if (errorEl) errorEl.textContent = 'Заполните все поля';
            return;
        }
        
        // Показываем загрузку
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Вход...';
        submitBtn.disabled = true;
        
        try {
            // Симуляция запроса к серверу
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Тестовые пользователи (временные)
            const testUsers = {
                'Matthew_Evil': { password: 'FGTcEq5Dlvmv', role: 'owner', status: 'approved' },
                'John_Doe': { password: 'Password123', role: 'user', status: 'approved' },
                'Jane_Smith': { password: 'Password123', role: 'user', status: 'pending' }
            };
            
            if (testUsers[username] && testUsers[username].password === password) {
                // Успешный вход
                this.currentUser = {
                    username,
                    role: testUsers[username].role,
                    status: testUsers[username].status,
                    discord: 'username',
                    joinedAt: new Date().toISOString()
                };
                
                this.saveUserData();
                this.updateUI();
                this.closeModal();
                this.showNotification('Успешный вход!', 'success');
                
            } else {
                // Неверные данные
                if (errorEl) errorEl.textContent = 'Неверное имя пользователя или пароль';
                this.showNotification('Ошибка входа', 'error');
            }
            
        } catch (error) {
            console.error('Ошибка входа:', error);
            if (errorEl) errorEl.textContent = 'Ошибка сервера';
            this.showNotification('Ошибка сервера', 'error');
        } finally {
            // Восстанавливаем кнопку
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
    
    // Регистрация пользователя
    async registerUser() {
        const username = document.getElementById('regUsername')?.value;
        const password = document.getElementById('regPassword')?.value;
        const discord = document.getElementById('regDiscord')?.value;
        const passportFile = document.getElementById('passportFile')?.files[0];
        const statsFile = document.getElementById('statsFile')?.files[0];
        const submitBtn = document.getElementById('submitBtn');
        const errorEl = document.getElementById('registerError');
        const successEl = document.getElementById('registerSuccess');
        
        // Базовая проверка перед отправкой
        if (!this.validateStep1() || !this.validateStep2()) {
            this.showNotification('Заполните все поля правильно', 'error');
            return;
        }
        
        // Показываем загрузку
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Регистрация...';
        submitBtn.disabled = true;
        
        if (errorEl) errorEl.textContent = '';
        if (successEl) successEl.textContent = '';
        
        try {
            // Симуляция запроса к серверу
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Чтение файлов как base64
            const toBase64 = file => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
            
            const passportImage = await toBase64(passportFile);
            const statsImage = await toBase64(statsFile);
            
            // Уникальный ID для заявки
            const applicationId = 'app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // Создаем объект заявки
            const application = {
                id: applicationId,
                username,
                discord,
                passportImage: passportImage.substring(0, 100) + '...', // Сохраняем только часть для экономии места
                statsImage: statsImage.substring(0, 100) + '...',
                status: 'pending',
                applicationDate: new Date().toLocaleString('ru-RU'),
                reviewed: false,
                reviewer: null,
                reviewDate: null,
                notes: ''
            };
            
            // Загружаем существующие заявки
            let applications = this.loadApplications();
            
            // Добавляем новую заявку
            applications.push(application);
            
            // Сохраняем заявки
            this.saveApplications(applications);
            
            // Создаем пользователя
            this.currentUser = {
                username,
                password: password,
                discord,
                role: 'user',
                status: 'pending',
                joinedAt: new Date().toISOString(),
                applicationId: applicationId
            };
            
            this.saveUserData();
            this.updateUI();
            
            if (successEl) {
                successEl.innerHTML = `
                    <div class="success-content">
                        <i class="fas fa-check-circle"></i> Регистрация успешна!<br>
                        <small>Ваша заявка отправлена на проверку. Обычно это занимает до 24 часов.</small>
                        <div class="application-id">
                            <strong>ID заявки:</strong> ${applicationId}
                        </div>
                    </div>
                `;
            }
            
            this.showNotification('Регистрация успешна! Ожидайте проверки.', 'success');
            
            // Отладочная информация в консоль
            console.log('✅ Новая заявка создана:', application);
            console.log('📊 Всего заявок в системе:', applications.length);
            console.log('📋 Все заявки:', applications);
            
            // Отправляем данные в глобальную переменную для тестирования
            window.lastApplication = application;
            window.allApplications = applications;
            
            // Проверяем сохранение в LocalStorage
            const savedApps = localStorage.getItem('laPuertaApplications');
            console.log('💾 Сохранено в LocalStorage:', savedApps);
            
            // Закрываем модалку через 5 секунды
            setTimeout(() => {
                this.closeModal();
            }, 5000);
            
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            if (errorEl) errorEl.textContent = 'Ошибка при регистрации';
            this.showNotification('Ошибка регистрации', 'error');
        } finally {
            // Восстанавливаем кнопку
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
    
    // Выход из системы
    logout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            this.currentUser = null;
            localStorage.removeItem('laPuertaUser');
            this.updateUI();
            this.showNotification('Вы вышли из системы', 'warning');
        }
    }
    
    // Закрытие модального окна
    closeModal() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
    }
    
    // Показать уведомление
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = message;
        
        document.body.appendChild(notification);
        
        // Удаляем через 3 секунды
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Проверка авторизации для доступа к страницам
    checkAuth(requiredRole = null) {
        if (!this.currentUser) {
            return false;
        }
        
        if (requiredRole === 'admin' && !['admin', 'owner'].includes(this.currentUser.role)) {
            return false;
        }
        
        if (requiredRole === 'owner' && this.currentUser.role !== 'owner') {
            return false;
        }
        
        return true;
    }
}

// Инициализация системы авторизации
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
    
    // Глобальные функции для работы с заявками (доступны из admin.js)
    window.getApplications = () => {
        try {
            const apps = localStorage.getItem('laPuertaApplications');
            return apps ? JSON.parse(apps) : [];
        } catch (error) {
            console.error('Ошибка получения заявок:', error);
            return [];
        }
    };
    
    window.updateApplicationStatus = (applicationId, newStatus, reviewer = null, notes = '') => {
        try {
            const applications = window.getApplications();
            const application = applications.find(app => app.id === applicationId);
            
            if (application) {
                application.status = newStatus;
                application.reviewed = true;
                application.reviewer = reviewer;
                application.reviewDate = new Date().toLocaleString('ru-RU');
                application.notes = notes;
                
                // Сохраняем обновленные заявки
                localStorage.setItem('laPuertaApplications', JSON.stringify(applications));
                
                console.log(`✅ Статус заявки ${applicationId} изменен на ${newStatus}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Ошибка обновления статуса заявки:', error);
            return false;
        }
    };
    
    window.deleteApplication = (applicationId) => {
        try {
            let applications = window.getApplications();
            const initialLength = applications.length;
            applications = applications.filter(app => app.id !== applicationId);
            
            if (applications.length < initialLength) {
                localStorage.setItem('laPuertaApplications', JSON.stringify(applications));
                console.log(`🗑️ Заявка ${applicationId} удалена`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Ошибка удаления заявки:', error);
            return false;
        }
    };
    
    // Тестовые данные (удалить в продакшене)
    window.addTestApplications = () => {
        const testApps = [
            {
                id: 'app_test_1',
                username: 'Test_User1',
                discord: 'testuser1',
                passportImage: 'data:image/test1...',
                statsImage: 'data:image/test1_stats...',
                status: 'pending',
                applicationDate: '01.01.2024, 12:00:00',
                reviewed: false,
                reviewer: null,
                reviewDate: null,
                notes: ''
            },
            {
                id: 'app_test_2',
                username: 'Test_User2',
                discord: 'testuser2',
                passportImage: 'data:image/test2...',
                statsImage: 'data:image/test2_stats...',
                status: 'pending',
                applicationDate: '02.01.2024, 14:30:00',
                reviewed: false,
                reviewer: null,
                reviewDate: null,
                notes: ''
            }
        ];
        
        localStorage.setItem('laPuertaApplications', JSON.stringify(testApps));
        console.log('✅ Тестовые заявки добавлены:', testApps);
    };
    
    // Проверяем наличие заявок при загрузке
    setTimeout(() => {
        const apps = window.getApplications();
        console.log('📋 Загружено заявок при старте:', apps.length);
        if (apps.length === 0) {
            console.log('ℹ️ Заявок нет. Зарегистрируйтесь чтобы создать первую заявку.');
        }
    }, 1000);
    
    // Добавляем стили для кнопок
    const style = document.createElement('style');
    style.textContent = `
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px 20px;
            background: #FFA500;
            color: #000;
            border: none;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            text-decoration: none;
        }
        
        .btn:hover {
            background: #FFB733;
            transform: translateY(-1px);
        }
        
        .btn-primary {
            background: #FFA500;
            color: #000;
        }
        
        .btn-secondary {
            background: #333;
            color: white;
        }
        
        .form-control {
            width: 100%;
            padding: 12px;
            background: #2A2A2A;
            border: 1px solid #333;
            border-radius: 5px;
            color: white;
            font-size: 1rem;
            transition: all 0.3s;
        }
        
        .form-control:focus {
            outline: none;
            border-color: #FFA500;
            box-shadow: 0 0 0 3px rgba(255, 165, 0, 0.1);
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #CCC;
            font-weight: 600;
        }
        
        .btn-next, .btn-submit {
            background: #FFA500;
            color: black;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .btn-next:disabled, .btn-submit:disabled {
            background: #666;
            cursor: not-allowed;
            opacity: 0.5;
        }
        
        .btn-next:hover:not(:disabled), .btn-submit:hover:not(:disabled) {
            background: #FFB733;
        }
        
        .btn-prev {
            background: #333;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
        }
        
        .btn-prev:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .success-content {
            text-align: center;
        }
        
        .application-id {
            margin-top: 10px;
            padding: 8px;
            background: rgba(255, 165, 0, 0.1);
            border-radius: 5px;
            font-family: monospace;
            font-size: 0.9rem;
        }
    `;
    document.head.appendChild(style);
});
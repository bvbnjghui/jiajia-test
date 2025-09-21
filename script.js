// script.js

function expenseTracker() {
    // --- Google API Configuration ---
    const CLIENT_ID = '1066473322934-ah4ib6b0pfvisb5ide4t1gj5s7up6uag.apps.googleusercontent.com';
    const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
    const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

    return {
        activeTab: 'info',
        userName: '',
        dailyBudget: 0,
        totalSpent: 0,
        expenses: [],
        categoryTotals: { food: 0, transport: 0, entertainment: 0, daily: 0 },
        userInput: { name: '', budget: null },
        newExpense: { category: '', description: '', amount: null },
        editingExpenseId: null,
        editedExpense: { description: '', amount: null },
        notification: { show: false, message: '', type: 'info' },
        notificationTimeout: null,
        showInstallButton: false,
        deferredPrompt: null,
        mobileCharacterExpanded: false,
        
        // ✨ Google API/GIS 相關狀態
        isGapiLoaded: false,
        isGisLoaded: false,
        isSignedIn: false,
        tokenClient: null,

        // 初始化
        init() {
            this.loadFromStorage();
            this.initPWA();
            this.loadGoogleScripts();
        },

        loadGoogleScripts() {
            const gapiScript = document.createElement('script');
            gapiScript.src = 'https://apis.google.com/js/api.js';
            gapiScript.async = true;
            gapiScript.defer = true;
            gapiScript.onload = () => {
                gapi.load('client', () => {
                    gapi.client.init({ discoveryDocs: DISCOVERY_DOCS })
                        .then(() => {
                            this.isGapiLoaded = true;
                        });
                });
            };
            document.head.appendChild(gapiScript);

            const gisScript = document.createElement('script');
            gisScript.src = 'https://accounts.google.com/gsi/client';
            gisScript.async = true;
            gisScript.defer = true;
            gisScript.onload = () => {
                this.tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: this.handleTokenResponse.bind(this),
                    error_callback: this.handleTokenError.bind(this),
                });
                this.isGisLoaded = true;
            };
            document.head.appendChild(gisScript);
        },

        // 靜態資料
        quotes: [
            "打工賺錢不容易，每一分錢都要精打細算。", "偶爾花點錢犒賞自己，這是應該的。", "嗯...花費有點超出預期，需要控制一下。",
            "這個消費速度有點快，得重新檢視預算。", "情況開始不妙，這個月可能會很緊。", "必須冷靜下來，不能再這樣亂花錢了。",
            "糟糕，照這樣下去會入不敷出。", "完了，生活費都快不夠了。", "這下真的麻煩了，錢包快見底了。", "徹底破產，連基本生活都成問題了。",
            "天啊！已經嚴重超支了！", "救命！這樣下去真的會完蛋！", "緊急狀態！必須立即停止消費！"
        ],
        categoryMeta: {
            food: { icon: '🍽️', name: '餐飲' },
            transport: { icon: '🚌', name: '交通' },
            entertainment: { icon: '🎮', name: '娛樂' },
            daily: { icon: '🧴', name: '日用品' }
        },

        // 衍生狀態 (Getters)
        get remainingAmount() { return Math.max(0, this.dailyBudget - this.totalSpent) },
        get percentage() { return this.dailyBudget > 0 ? Math.round((this.totalSpent / this.dailyBudget) * 100) : 0 },
        get level() { 
            if (this.percentage <= 0) return 0;
            if (this.percentage <= 10) return 1;
            if (this.percentage <= 20) return 2;
            if (this.percentage <= 30) return 3;
            if (this.percentage <= 40) return 4;
            if (this.percentage <= 50) return 5;
            if (this.percentage <= 60) return 6;
            if (this.percentage <= 70) return 7;
            if (this.percentage <= 80) return 8;
            if (this.percentage <= 90) return 9;
            if (this.percentage <= 100) return 10;
            return 11;
        },
        get currentQuote() { 
            const quoteIndex = Math.min(this.level, this.quotes.length - 1);
            return this.quotes[quoteIndex];
        },
        get currentCharacterImage() {
            return Character.getImageByPercentage(this.percentage);
        },
        get characterStatus() {
            return Character.getCharacterStatus(this.percentage);
        },

        // 方法 (Actions)
        setUserInfo() {
            if (!this.userInput.name.trim()) {
                this.showNotification('請輸入姓名', 'error');
                return;
            }
            if (!this.userInput.budget || this.userInput.budget <= 0) {
                this.showNotification('請設定有效的每日預算（大於 0）', 'error');
                return;
            }
            this.userName = this.userInput.name.trim();
            this.dailyBudget = this.userInput.budget;
            this.userInput.name = '';
            this.userInput.budget = null;
            this.saveToStorage();
            this.showNotification('個人資訊設定成功！', 'success');
        },

        addExpense() {
            if (!this.newExpense.category) {
                this.showNotification('請選擇花費類別', 'error');
                return;
            }
            if (!this.newExpense.description.trim()) {
                this.showNotification('請輸入花費描述', 'error');
                return;
            }
            if (!this.newExpense.amount || this.newExpense.amount <= 0) {
                this.showNotification('請輸入有效的金額（大於 0）', 'error');
                return;
            }
            const expenseToAdd = {
                id: Date.now(),
                ...this.newExpense,
                description: this.newExpense.description.trim(),
                icon: this.categoryMeta[this.newExpense.category].icon,
                categoryName: this.categoryMeta[this.newExpense.category].name,
                timestamp: new Date().toISOString()
            };
            this.expenses.unshift(expenseToAdd);
            this.totalSpent += this.newExpense.amount;
            this.categoryTotals[this.newExpense.category] += this.newExpense.amount;
            this.newExpense.category = '';
            this.newExpense.description = '';
            this.newExpense.amount = null;
            this.saveToStorage();
            this.showNotification('花費記錄已新增！', 'success');
        },

        deleteExpense(id) {
            if (confirm('確定要刪除這筆花費記錄嗎？')) {
                const index = this.expenses.findIndex(expense => expense.id === id);
                if (index > -1) {
                    const expenseToDelete = this.expenses[index];
                    this.totalSpent -= expenseToDelete.amount;
                    this.categoryTotals[expenseToDelete.category] -= expenseToDelete.amount;
                    this.expenses.splice(index, 1);
                    this.saveToStorage();
                    this.showNotification('花費記錄已刪除', 'success');
                }
            }
        },

        editExpense(expense) {
            this.editingExpenseId = expense.id;
            this.editedExpense.description = expense.description;
            this.editedExpense.amount = expense.amount;
        },

        updateExpense() {
            if (!this.editedExpense.description.trim()) {
                this.showNotification('請輸入花費描述', 'error');
                return;
            }
            if (!this.editedExpense.amount || this.editedExpense.amount <= 0) {
                this.showNotification('請輸入有效的金額（大於 0）', 'error');
                return;
            }
            const index = this.expenses.findIndex(expense => expense.id === this.editingExpenseId);
            if (index > -1) {
                const originalExpense = this.expenses[index];
                const amountDifference = this.editedExpense.amount - originalExpense.amount;
                
                this.totalSpent += amountDifference;
                this.categoryTotals[originalExpense.category] += amountDifference;

                originalExpense.description = this.editedExpense.description.trim();
                originalExpense.amount = this.editedExpense.amount;
                this.saveToStorage();
                this.showNotification('花費記錄已更新！', 'success');
            }
            this.cancelEdit();
        },

        cancelEdit() {
            this.editingExpenseId = null;
            this.editedExpense.description = '';
            this.editedExpense.amount = null;
        },

        saveToStorage() {
            const data = {
                userName: this.userName,
                dailyBudget: this.dailyBudget,
                expenses: this.expenses,
                categoryTotals: this.categoryTotals,
                totalSpent: this.totalSpent,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('expenseTracker', JSON.stringify(data));
        },

        loadFromStorage() {
            try {
                const saved = localStorage.getItem('expenseTracker');
                if (saved) {
                    const data = JSON.parse(saved);
                    this.userName = data.userName || '';
                    this.dailyBudget = data.dailyBudget || 0;
                    this.expenses = data.expenses || [];
                    this.categoryTotals = data.categoryTotals || { food: 0, transport: 0, entertainment: 0, daily: 0 };
                    this.totalSpent = data.totalSpent || 0;
                }
            } catch (error) {
                console.error('載入本地儲存資料時發生錯誤:', error);
            }
        },

        clearAllData() {
            if (confirm('確定要清除所有資料嗎？此操作無法復原！')) {
                this.userName = '';
                this.dailyBudget = 0;
                this.expenses = [];
                this.categoryTotals = { food: 0, transport: 0, entertainment: 0, daily: 0 };
                this.totalSpent = 0;
                localStorage.removeItem('expenseTracker');
                this.showNotification('所有資料已清除', 'success');
            }
        },

        showNotification(message, type = 'info', duration = 3000) {
            clearTimeout(this.notificationTimeout);
            this.notification = { show: true, message, type };
            if (duration > 0) {
                this.notificationTimeout = setTimeout(() => {
                    this.notification.show = false;
                }, duration);
            }
        },

        hideNotification() {
            this.notification.show = false;
        },

        // PWA 相關功能
        initPWA() {
            if (window.pwaInitialized) return;
            window.pwaInitialized = true;

            if ('serviceWorker' in navigator) {
                let refreshing = false;
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    if (refreshing) return;
                    refreshing = true;
                    window.location.reload();
                });

                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('./sw.js')
                        .then(registration => {
                            this.checkForUpdates(registration);
                        })
                        .catch(registrationError => {
                            console.log('SW registration failed: ', registrationError);
                        });
                });
            }
            this.setupInstallPrompt();
        },

        setupInstallPrompt() {
            let deferredPrompt;
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                this.showInstallButton = true;
                this.deferredPrompt = deferredPrompt;
            });
            window.addEventListener('appinstalled', (evt) => {
                console.log('PWA 已安裝');
                this.showInstallButton = false;
                this.showNotification('應用程式已成功安裝！', 'success');
            });
        },

        async installApp() {
            if (this.deferredPrompt) {
                this.deferredPrompt.prompt();
                const { outcome } = await this.deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    this.showNotification('正在安裝應用程式...', 'info');
                } else {
                    this.showNotification('安裝已取消', 'info');
                }
                this.deferredPrompt = null;
                this.showInstallButton = false;
            }
        },

        checkForUpdates(registration) {
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.showUpdateNotification();
                    }
                });
            });
        },

        showUpdateNotification() {
            if (confirm('發現新版本！是否立即更新？')) {
                this.updateApp();
            }
        },

        updateApp() {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistration().then(registration => {
                    if (registration && registration.waiting) {
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                });
            }
        },

        get isPWA() {
            return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        },

        get isOnline() {
            return navigator.onLine;
        },

        // --- Google Sheets Integration (GIS) ---
        handleAuthClick() {
            if (this.tokenClient) {
                this.tokenClient.requestAccessToken({ prompt: 'consent' });
            }
        },

        handleSignoutClick() {
            const token = gapi.client.getToken();
            if (token !== null) {
                google.accounts.oauth2.revoke(token.access_token, () => {
                    gapi.client.setToken('');
                    this.isSignedIn = false;
                    this.showNotification('您已成功登出', 'success');
                });
            }
        },

        handleTokenResponse(response) {
            if (response && response.access_token) {
                gapi.client.setToken(response);
                this.isSignedIn = true;
                this.showNotification('Google 登入成功！正在準備匯出...', 'info');
                this.performExport();
            } else {
                console.error('Provided token response was invalid.', response);
            }
        },

        handleTokenError(error) {
            console.error('Google Auth Error:', error);
            if (error && (error.type === 'popup_closed' || error.type === 'popup_failed_to_open')) {
                this.showNotification('登入視窗被您的瀏覽器或廣告攔截器擋下了。請允許本站的彈出式視窗，或將本站加入白名單後再試一次。', 'error', 0);
            }
        },

        exportToSheet() {
            if (this.isSignedIn) {
                this.performExport();
            } else {
                this.handleAuthClick();
            }
        },

        performExport() {
            if (this.expenses.length === 0) {
                this.showNotification('沒有資料可以匯出', 'error');
                return;
            }
            this.showNotification('正在建立 Google Sheet 並匯出資料...', 'info', 0);

            const spreadsheetTitle = `花費記錄_${this.userName || '使用者'}_${new Date().toISOString().split('T')[0]}`;

            gapi.client.sheets.spreadsheets.create({
                properties: {
                    title: spreadsheetTitle
                }
            }).then((response) => {
                const spreadsheetId = response.result.spreadsheetId;
                const spreadsheetUrl = response.result.spreadsheetUrl;

                const summaryData = [
                    ['報表生成時間', new Date().toLocaleString('zh-TW')],
                    ['使用者名稱', this.userName],
                    ['每日預算', this.dailyBudget],
                    ['總花費', this.totalSpent],
                    ['剩餘預算', this.remainingAmount],
                    ['預算使用率 (%)', this.percentage],
                    [],
                    ['分類統計'],
                    ['餐飲', this.categoryTotals.food],
                    ['交通', this.categoryTotals.transport],
                    ['娛樂', this.categoryTotals.entertainment],
                    ['日用品', this.categoryTotals.daily],
                ];

                const expensesHeader = ['日期', '類別', '描述', '金額'];
                const expensesRows = this.expenses.map(e => [
                    new Date(e.timestamp).toLocaleString('zh-TW'),
                    e.categoryName,
                    e.description,
                    e.amount
                ]);

                const data = [
                    { range: 'A1', values: summaryData },
                    { range: 'A15', values: [expensesHeader, ...expensesRows] }
                ];

                gapi.client.sheets.spreadsheets.values.batchUpdate({
                    spreadsheetId: spreadsheetId,
                    resource: {
                        valueInputOption: 'USER_ENTERED',
                        data: data
                    }
                }).then(() => {
                    this.hideNotification();
                    const message = `資料匯出成功！點擊 <a href="${spreadsheetUrl}" target="_blank" class="font-bold underline">這裡</a> 查看您的 Google Sheet。`;
                    this.showNotification(message, 'success', 0);
                }).catch((err) => {
                    console.error('Error writing to sheet:', err);
                    this.showNotification(`寫入 Google Sheet 失敗: ${err.result.error.message}`, 'error', 0);
                });

            }).catch((err) => {
                console.error('Error creating spreadsheet:', err);
                this.showNotification(`建立 Google Sheet 失敗: ${err.result.error.message}`, 'error', 0);
            });
        },

        // 匯出 CSV 格式
        exportCSV() {
            if (this.expenses.length === 0) {
                this.showNotification('沒有資料可以匯出', 'error');
                return;
            }

            const headers = ['日期', '類別', '描述', '金額'];
            const csvContent = [
                headers.join(','),
                ...this.expenses.map(expense => [
                    new Date(expense.timestamp).toLocaleDateString('zh-TW'),
                    expense.categoryName,
                    `"${expense.description}"`, 
                    expense.amount
                ].join(','))
            ].join('\n');

            const dataBlob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `花費記錄_${this.userName || '使用者'}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.showNotification('CSV 檔案匯出成功！', 'success');
        }
    };
}
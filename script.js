// script.js

function expenseTracker() {
    return {
        // ✨ 新增：用於控制手機版 Tab 的狀態，'info' 是預設開啟的 Tab
        activeTab: 'info', 

        // 狀態 (State)
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
        showInstallButton: false,
        deferredPrompt: null,

        // 初始化 - 從本地儲存載入資料
        init() {
            this.loadFromStorage();
            this.initPWA();
        },

        // 靜態資料
        quotes: [
            "打工賺錢不容易，每一分錢都要精打細算。", "偶爾花點錢犒賞自己，這是應該的。", "嗯...花費有點超出預期，需要控制一下。",
            "這個消費速度有點快，得重新檢視預算。", "情況開始不妙，這個月可能會很緊。", "必須冷靜下來，不能再這樣亂花錢了。",
            "糟糕，照這樣下去會入不敷出。", "完了，生活費都快不夠了。", "這下真的麻煩了，錢包快見底了。", "徹底破產，連基本生活都成問題了。"
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
        get level() { return Math.min(Math.floor(this.percentage / 10), 7) },
        get currentQuote() { return this.quotes[this.level] },
        get currentCharacterImage() {
            return Character.getImageByLevel(this.level);
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

        // 刪除花費
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

        // 開始編輯
        editExpense(expense) {
            this.editingExpenseId = expense.id;
            this.editedExpense.description = expense.description;
            this.editedExpense.amount = expense.amount;
        },

        // 更新花費
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

        // 取消編輯
        cancelEdit() {
            this.editingExpenseId = null;
            this.editedExpense.description = '';
            this.editedExpense.amount = null;
        },

        // 本地儲存相關方法
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

        // 通知系統
        showNotification(message, type = 'info') {
            this.notification = { show: true, message, type };
            setTimeout(() => {
                this.notification.show = false;
            }, 3000);
        },

        hideNotification() {
            this.notification.show = false;
        },

        // PWA 相關功能
        initPWA() {
            // 註冊 Service Worker
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('./sw.js')
                        .then(registration => {
                            console.log('SW registered: ', registration);
                            this.checkForUpdates(registration);
                        })
                        .catch(registrationError => {
                            console.log('SW registration failed: ', registrationError);
                        });
                });
            }

            // 監聽安裝提示
            this.setupInstallPrompt();
        },

        setupInstallPrompt() {
            let deferredPrompt;
            
            window.addEventListener('beforeinstallprompt', (e) => {
                // 防止瀏覽器預設的安裝提示
                e.preventDefault();
                deferredPrompt = e;
                
                // 顯示自定義安裝按鈕
                this.showInstallButton = true;
                this.deferredPrompt = deferredPrompt;
            });

            // 監聽應用程式安裝完成
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
                        // 有新版本可用
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
                        window.location.reload();
                    }
                });
            }
        },

        // 檢查是否為 PWA 模式
        get isPWA() {
            return window.matchMedia('(display-mode: standalone)').matches || 
                   window.navigator.standalone === true;
        },

        // 檢查網路狀態
        get isOnline() {
            return navigator.onLine;
        },

        // 匯出資料功能
        exportData() {
            if (this.expenses.length === 0) {
                this.showNotification('沒有資料可以匯出', 'error');
                return;
            }

            const exportData = {
                userName: this.userName,
                dailyBudget: this.dailyBudget,
                totalSpent: this.totalSpent,
                remainingAmount: this.remainingAmount,
                percentage: this.percentage,
                categoryTotals: this.categoryTotals,
                expenses: this.expenses,
                exportDate: new Date().toISOString(),
                summary: {
                    totalExpenses: this.expenses.length,
                    averageExpense: this.expenses.length > 0 ? Math.round(this.totalSpent / this.expenses.length) : 0,
                    mostExpensiveCategory: Object.keys(this.categoryTotals).reduce((a, b) => 
                        this.categoryTotals[a] > this.categoryTotals[b] ? a : b, 'food')
                }
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `花費記錄_${this.userName || '使用者'}_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.showNotification('資料匯出成功！', 'success');
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
// script.js

function expenseTracker() {
    return {
        // 狀態 (State)
        userName: '',
        dailyBudget: 0,
        totalSpent: 0,
        expenses: [],
        categoryTotals: { food: 0, transport: 0, entertainment: 0, daily: 0 },
        userInput: { name: '', budget: null },
        newExpense: { category: '', description: '', amount: null },

        // 靜態資料 (移除了 characterStates)
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
        get level() { return Math.min(Math.floor(this.percentage / 10), 9) },
        get currentQuote() { return this.quotes[this.level] },
        
        // ✨ 更新 ✨：新的 getter，用來從 character 模組獲取當前的圖片路徑
        get currentCharacterImage() {
            return Character.getImageByLevel(this.level);
        },

        // 方法 (Actions)
        setUserInfo() {
            if (this.userInput.name && this.userInput.budget > 0) {
                this.userName = this.userInput.name;
                this.dailyBudget = this.userInput.budget;
                this.userInput.name = '';
                this.userInput.budget = null;
            } else {
                alert('請確保已輸入姓名，且預算金額大於 0 ！');
            }
        },

        addExpense() {
            if (!this.newExpense.category || !this.newExpense.description || !(this.newExpense.amount > 0)) {
                alert('請填寫完整的花費資訊！');
                return;
            }
            const expenseToAdd = {
                id: Date.now(),
                ...this.newExpense,
                icon: this.categoryMeta[this.newExpense.category].icon,
                categoryName: this.categoryMeta[this.newExpense.category].name
            };
            this.expenses.unshift(expenseToAdd);
            this.totalSpent += this.newExpense.amount;
            this.categoryTotals[this.newExpense.category] += this.newExpense.amount;
            this.newExpense.category = '';
            this.newExpense.description = '';
            this.newExpense.amount = null;
        }
    };
}
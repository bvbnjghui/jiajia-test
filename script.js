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
        },

        // 刪除花費
        deleteExpense(id) {
            const index = this.expenses.findIndex(expense => expense.id === id);
            if (index > -1) {
                const expenseToDelete = this.expenses[index];
                this.totalSpent -= expenseToDelete.amount;
                this.categoryTotals[expenseToDelete.category] -= expenseToDelete.amount;
                this.expenses.splice(index, 1);
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
            if (!this.editedExpense.description || !(this.editedExpense.amount > 0)) {
                alert('請確保花費細節和金額都已填寫！');
                return;
            }
            const index = this.expenses.findIndex(expense => expense.id === this.editingExpenseId);
            if (index > -1) {
                const originalExpense = this.expenses[index];
                const amountDifference = this.editedExpense.amount - originalExpense.amount;
                
                this.totalSpent += amountDifference;
                this.categoryTotals[originalExpense.category] += amountDifference;

                originalExpense.description = this.editedExpense.description;
                originalExpense.amount = this.editedExpense.amount;
            }
            this.cancelEdit();
        },

        // 取消編輯
        cancelEdit() {
            this.editingExpenseId = null;
            this.editedExpense.description = '';
            this.editedExpense.amount = null;
        }
    };
}
// Classe para gerenciar transações
class FinanceManager {
    constructor() {
        this.transactions = this.loadTransactions();
        this.currentFilter = 'all';
    }

    // Carrega transações do localStorage
    loadTransactions() {
        const saved = localStorage.getItem('transactions');
        return saved ? JSON.parse(saved) : [];
    }

    // Salva transações no localStorage
    saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
    }

    // Adiciona nova transação
    addTransaction(description, amount, type, date) {
        const transaction = {
            id: Date.now(),
            description,
            amount: parseFloat(amount),
            type,
            date,
            timestamp: new Date().toISOString()
        };

        this.transactions.unshift(transaction);
        this.saveTransactions();
        return transaction;
    }

    // Remove transação
    deleteTransaction(id) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveTransactions();
    }

    // Calcula totais
    calculateTotals() {
        const income = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expense = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const total = income - expense;

        return { income, expense, total };
    }

    // Filtra transações
    getFilteredTransactions() {
        if (this.currentFilter === 'all') {
            return this.transactions;
        }
        return this.transactions.filter(t => t.type === this.currentFilter);
    }

    // Define filtro atual
    setFilter(filter) {
        this.currentFilter = filter;
    }
}

// Classe para gerenciar a interface
class UIManager {
    constructor(financeManager) {
        this.finance = financeManager;
        this.form = document.getElementById('transaction-form');
        this.transactionsList = document.getElementById('transactions-list');
        this.incomeDisplay = document.getElementById('income-display');
        this.expenseDisplay = document.getElementById('expense-display');
        this.totalDisplay = document.getElementById('total-display');
        this.filterButtons = document.querySelectorAll('.filter-btn');

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDate();
        this.updateDisplay();
    }

    setupEventListeners() {
        // Submit do formulário
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Botões de filtro
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleFilterChange(btn);
            });
        });
    }

    setDefaultDate() {
        const dateInput = document.getElementById('date');
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    handleFormSubmit() {
        const description = document.getElementById('description').value.trim();
        const amount = document.getElementById('amount').value;
        const type = document.getElementById('type').value;
        const date = document.getElementById('date').value;

        if (!description || !amount || !date) {
            this.showMessage('Preencha todos os campos!', 'error');
            return;
        }

        this.finance.addTransaction(description, amount, type, date);
        this.form.reset();
        this.setDefaultDate();
        this.updateDisplay();
        this.showMessage('Transação adicionada com sucesso!', 'success');
    }

    handleFilterChange(button) {
        this.filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const filter = button.dataset.filter;
        this.finance.setFilter(filter);
        this.updateTransactionsList();
    }

    updateDisplay() {
        this.updateTotals();
        this.updateTransactionsList();
    }

    updateTotals() {
        const { income, expense, total } = this.finance.calculateTotals();

        this.incomeDisplay.textContent = this.formatCurrency(income);
        this.expenseDisplay.textContent = this.formatCurrency(expense);
        this.totalDisplay.textContent = this.formatCurrency(total);

        // Adiciona classe para saldo negativo
        if (total < 0) {
            this.totalDisplay.parentElement.classList.add('negative');
        } else {
            this.totalDisplay.parentElement.classList.remove('negative');
        }
    }

    updateTransactionsList() {
        const transactions = this.finance.getFilteredTransactions();

        if (transactions.length === 0) {
            this.transactionsList.innerHTML = '<p class="empty-message">Nenhuma transação encontrada.</p>';
            return;
        }

        this.transactionsList.innerHTML = transactions.map(t => this.createTransactionHTML(t)).join('');

        // Adiciona event listeners aos botões de deletar
        this.transactionsList.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.handleDelete(id);
            });
        });
    }

    createTransactionHTML(transaction) {
        const formattedDate = this.formatDate(transaction.date);
        const formattedAmount = this.formatCurrency(transaction.amount);
        const sign = transaction.type === 'income' ? '+' : '-';

        return `
            <div class="transaction-item ${transaction.type}">
                <div class="transaction-info">
                    <div class="transaction-description">${this.escapeHtml(transaction.description)}</div>
                    <div class="transaction-date">${formattedDate}</div>
                </div>
                <div class="transaction-amount">${sign} ${formattedAmount}</div>
                <button class="btn-delete" data-id="${transaction.id}">Excluir</button>
            </div>
        `;
    }

    handleDelete(id) {
        if (confirm('Tem certeza que deseja excluir esta transação?')) {
            this.finance.deleteTransaction(id);
            this.updateDisplay();
            this.showMessage('Transação excluída!', 'success');
        }
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    formatDate(dateString) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showMessage(message, type) {
        // Cria elemento de mensagem
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(messageEl);

        // Remove após 3 segundos
        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => messageEl.remove(), 300);
        }, 3000);
    }
}

// Adiciona animações CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    .balance-item.negative .balance-value {
        color: var(--expense-color) !important;
    }
`;
document.head.appendChild(style);

// Inicializa a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    const financeManager = new FinanceManager();
    const uiManager = new UIManager(financeManager);
});
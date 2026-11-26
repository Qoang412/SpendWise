// ========================================
// SPENDWISE - INTERACTIVE BUDGET TRACKER
// ========================================

// 1. APPLICATION DATA

let monthlyBudget = Number(localStorage.getItem("spendwiseBudget")) || 0;

let transactions = [];

try {
    transactions = JSON.parse(
        localStorage.getItem("spendwiseTransactions")
    ) || [];
} catch {
    transactions = [];
}

// 2. HTML ELEMENTS

const budgetForm = document.getElementById("budget-form");
const budgetInput = document.getElementById("monthly-budget");

const expenseForm = document.getElementById("expense-form");
const transactionType = document.getElementById("transaction-type");
const expenseName = document.getElementById("expense-name");
const expenseAmount = document.getElementById("expense-amount");
const expenseCategory = document.getElementById("expense-category");
const expenseDate = document.getElementById("expense-date");

const budgetTotal = document.getElementById("budget-total");
const incomeTotal = document.getElementById("income-total");
const expenseTotal = document.getElementById("expense-total");
const remainingBalance = document.getElementById("remaining-balance");

const tableBody = document.getElementById("expenses-table-body");
const transactionSearch = document.getElementById("transaction-search");
const categoryFilter = document.getElementById("category-filter");

transactionSearch.addEventListener("input", renderTransactions);
categoryFilter.addEventListener("change", renderTransactions);

// 3. FORMAT CURRENCY

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES"
    }).format(amount);
}

// 4. SAVE DATA

function saveData() {
    localStorage.setItem("spendwiseBudget", monthlyBudget);
    localStorage.setItem(
        "spendwiseTransactions",
        JSON.stringify(transactions)
    );
}

// 5. SET MONTHLY BUDGET

budgetForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const budget = Number(budgetInput.value);

    if (!Number.isFinite(budget) || budget < 0) {
        alert("Please enter a valid budget.");
        return;
    }

    monthlyBudget = budget;

    saveData();
    updateDashboard();

    budgetForm.reset();

    alert("Monthly budget updated successfully!");
});

// 6. ADD INCOME OR EXPENSE

expenseForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = expenseName.value.trim();
    const amount = Number(expenseAmount.value);
    const category = expenseCategory.value;
    const date = expenseDate.value;
    const type = transactionType.value;

    if (!name || !category || !date ||
        !Number.isFinite(amount) || amount <= 0) {
        alert("Please enter valid transaction details.");
        return;
    }

    const transaction = {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        name: name,
        amount: amount,
        category: category,
        date: date,
        type: type
    };

    transactions.push(transaction);

    saveData();
    updateDashboard();

    expenseForm.reset();
    expenseDate.value = new Date().toISOString().split("T")[0];

    alert("Transaction added successfully!");
});

// 7. CALCULATE DASHBOARD TOTALS

function updateDashboard() {

    const totalIncome = transactions
        .filter(item => item.type === "income")
        .reduce((total, item) => total + item.amount, 0);

    const totalExpenses = transactions
        .filter(item => item.type === "expense")
        .reduce((total, item) => total + item.amount, 0);

    const balance = monthlyBudget + totalIncome - totalExpenses;

    budgetTotal.textContent = formatCurrency(monthlyBudget);
    incomeTotal.textContent = formatCurrency(totalIncome);
    expenseTotal.textContent = formatCurrency(totalExpenses);
    remainingBalance.textContent = formatCurrency(balance);

// Update budget usage progress
const progressBar = document.getElementById("budget-progress");
const progressLabel = document.getElementById("budget-progress-label");
const progressNote = document.getElementById("budget-progress-note");

const percentage = monthlyBudget > 0
    ? (totalExpenses / monthlyBudget) * 100
    : 0;

const safePercentage = Math.min(percentage, 100);

progressBar.style.width = safePercentage + "%";
progressLabel.textContent = percentage.toFixed(1) + "% used";

if (monthlyBudget <= 0) {
    progressNote.textContent = "Set your monthly budget to monitor your spending.";
    progressBar.style.backgroundColor = "#22c55e";
} else if (percentage >= 100) {
    progressNote.textContent = "You have reached or exceeded your monthly budget.";
    progressBar.style.backgroundColor = "#dc2626";
} else if (percentage >= 80) {
    progressNote.textContent = "Warning: You are approaching your budget limit.";
    progressBar.style.backgroundColor = "#f59e0b";
} else {
    progressNote.textContent = "Your spending is within your monthly budget.";
    progressBar.style.backgroundColor = "#22c55e";
}

    renderTransactions();
    renderCategoryChart();
}

// 8. DISPLAY TRANSACTION HISTORY

function renderTransactions() {

    tableBody.replaceChildren();

    if (transactions.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 6;
        cell.textContent = "No transactions yet.";

        row.appendChild(cell);
        tableBody.appendChild(row);

        return;
    }

    const searchTerm = transactionSearch.value.toLowerCase().trim();
    const selectedCategory = categoryFilter.value;

    const filteredTransactions = transactions.filter(function(item) {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === "all" ||
            item.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    if (filteredTransactions.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 6;
        cell.textContent = transactions.length === 0
            ? "No transactions yet."
            : "No matching transactions found.";
        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }

    filteredTransactions.forEach(function(item) {

        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        nameCell.textContent = item.name;

        const typeCell = document.createElement("td");
        typeCell.textContent = item.type;

        const amountCell = document.createElement("td");
        amountCell.textContent = formatCurrency(item.amount);

        const categoryCell = document.createElement("td");
        categoryCell.textContent = item.category;

        const dateCell = document.createElement("td");
        dateCell.textContent = item.date;

        const actionCell = document.createElement("td");

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";
        deleteButton.type = "button";

        deleteButton.addEventListener("click", function() {
            deleteTransaction(item.id);
        });

        actionCell.appendChild(deleteButton);

        row.append(
            nameCell,
            typeCell,
            amountCell,
            categoryCell,
            dateCell,
            actionCell
        );

        tableBody.appendChild(row);
    });
}


// 11. MONTHLY SPENDING CHART

function renderCategoryChart() {
    const chart = document.getElementById("spending-chart");
    chart.replaceChildren();

    const expenses = transactions.filter(
        item => item.type === "expense"
    );

    const categoryTotals = {};

    expenses.forEach(function(item) {
        categoryTotals[item.category] =
            (categoryTotals[item.category] || 0) + item.amount;
    });

    const categories = Object.entries(categoryTotals);
    const maximum = Math.max(
        ...categories.map(item => item[1]),
        1
    );

    if (categories.length === 0) {
        const message = document.createElement("p");
        message.textContent = "No expense data available yet.";
        chart.appendChild(message);
        return;
    }

    categories.sort((a, b) => b[1] - a[1]);

    categories.forEach(function(item) {
        const [category, amount] = item;

        const row = document.createElement("div");
        row.className = "chart-row";

        const name = document.createElement("span");
        name.className = "chart-category";
        name.textContent = category;

        const track = document.createElement("div");
        track.className = "chart-track";

        const bar = document.createElement("div");
        bar.className = "chart-bar";
        bar.style.width = (amount / maximum * 100) + "%";

        track.appendChild(bar);

        const value = document.createElement("span");
        value.className = "chart-amount";
        value.textContent = formatCurrency(amount);

        row.append(name, track, value);
        chart.appendChild(row);
    });
}

// 9. DELETE TRANSACTIONS

function deleteTransaction(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) return;

    transactions = transactions.filter(
        item => item.id !== id
    );

    saveData();
    updateDashboard();
}

// 10. INITIALIZE APPLICATION

budgetInput.value = monthlyBudget || "";

expenseDate.value = new Date().toISOString().split("T")[0];

updateDashboard();

console.log("SpendWise application loaded successfully!");




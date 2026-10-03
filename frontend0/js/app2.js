const API_URL = "http://localhost:3000/api/expenses";
let editingId = null;

console.log("APP.JS IS WORKING");

function showSpinner() {
    document.querySelector(".spinner-border").parentElement.style.display = "block";
}

function hideSpinner() {
    document.querySelector(".spinner-border").parentElement.style.display = "none";
}

function showAlert(message, type = "danger") {
    const alertBox = document.querySelector(".alert");

    alertBox.textContent = message;

    alertBox.className = `alert alert-${type}`;

    alertBox.style.display = "block";
}
function hideAlert() {
    const alertBox = document.querySelector(".alert");

    alertBox.style.display = "none";
}

async function getExpenses() {

    showSpinner();

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to fetch expenses");
        }

        const data = await response.json();

        return data;

    } catch (error) {
        console.error(error);
        showAlert(error.message);
        return null;

    } finally {
        hideSpinner();
    }
}


function renderTable(list) {
    const tableBody = document.getElementById("expenseTableBody");

    tableBody.innerHTML = "";

    list.forEach(expense => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${expense.title}</td>
            <td>${expense.amount}</td>
            <td>${expense.category}</td>
            <td>${expense.date}</td>
            <td>
                <button class="btn btn-outline-success btn-sm edit-btn" data-id="${expense.id}">
                    Edit
                </button>

                <button class="btn btn-success btn-sm delete-btn" data-id="${expense.id}">
                    Delete
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}
function renderSummary(list) {

    const total = list.reduce((sum, expense) => {
        return sum + Number(expense.amount);
    }, 0);

    const count = list.length;

    let highest = null;

    if (list.length > 0) {
        highest = list.reduce((max, expense) => {
            return Number(expense.amount) > Number(max.amount)
                ? expense
                : max;
        });
    }

    document.getElementById("totalAmount").textContent = total.toFixed(2);

    document.getElementById("expenseCount").textContent = count;

    if (highest) {
        document.getElementById("highestAmount").textContent =
            Number(highest.amount).toFixed(2);

        document.getElementById("highestTitle").textContent =
            highest.title;
    } else {
        document.getElementById("highestAmount").textContent = "0";
        document.getElementById("highestTitle").textContent = "";
    }
}

let expensesList = [];
async function refresh() {

    const expenses = await getExpenses();

    if (!expenses) {
        showAlert("Failed to load expenses");
        return;
    }

    expensesList = expenses;

    renderTable(expenses);
    renderSummary(expenses);
    updateChart(expenses)

}


async function addExpense(data) {

    showSpinner();

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to add expense");
        }

        return result;

    } catch (error) {
        console.error(error);
        showAlert(error.message);
        return null;

    } finally {
        hideSpinner();
    }
}
async function updateExpense(id, data) {

    showSpinner();

    try {
        const response = await fetch(API_URL + "/" + id, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to update expense");
        }

        return result;

    } catch (error) {
        console.error(error);
        showAlert(error.message);
        return null;

    } finally {
        hideSpinner();
    }
}

async function deleteExpense(id) {

    showSpinner();

    try {
        const response = await fetch(API_URL + "/" + id, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to delete expense");
        }

        return result;

    } catch (error) {
        console.error(error);
        showAlert(error.message);
        return null;

    } finally {
        hideSpinner();
    }
}

//-------------------------------------------------------------------------------


document.getElementById("addBtn").addEventListener("click", async function () {

    hideAlert();

    const title = document.getElementById("title").value.trim();

    const amount = Number(
        document.getElementById("eamount").value
    );

    const category = document.getElementById("category").value;

    const date = document.getElementById("date").value;


    // Title validation
    if (title === "") {
        showAlert("Title is required");
        return;
    }


    // Amount validation
    if (isNaN(amount) || amount <= 0) {
        showAlert("Amount must be greater than 0");
        return;
    }


    // Category validation
    if (!category || category === "Select Category") {
        showAlert("Please select a category");
        return;
    }


    // Date validation
    if (!date) {
        showAlert("Date is required");
        return;
    }


    const today = new Date().toISOString().split("T")[0];

    if (date > today) {
        showAlert("Date cannot be in the future");
        return;
    }


    const data = {
        title: title,
        amount: amount,
        category: category,
        date: date
    };


    // UPDATE
    if (editingId !== null) {

        const result = await updateExpense(editingId, data);

        if (result) {

            document.getElementById("title").value = "";
            document.getElementById("eamount").value = "";
            document.getElementById("category").value = "";
            document.getElementById("date").value = "";

            editingId = null;

            this.textContent = "Add";

            showAlert("Expense updated successfully", "success");

            await refresh();
        }

        return;
    }


    // ADD
    const result = await addExpense(data);

    if (result) {

        document.getElementById("title").value = "";
        document.getElementById("eamount").value = "";
        document.getElementById("category").value = "";
        document.getElementById("date").value = "";

        showAlert("Expense added successfully", "success");

        await refresh();
    }

});


document.getElementById("expenseTableBody").addEventListener("click", async function (event) {

    if (!event.target.classList.contains("edit-btn")) {
        return;
    }

    hideAlert();

    const id = event.target.dataset.id;

    const expenses = await getExpenses();

    if (!expenses) {
        return;
    }

    const expense = expenses.find(item => item.id == id);

    if (!expense) {
        showAlert("Expense not found");
        return;
    }


    // Put expense data into the form
    document.getElementById("title").value = expense.title;

    document.getElementById("eamount").value = expense.amount;

    document.getElementById("category").value = expense.category;

    document.getElementById("date").value = expense.date;


    // Store the ID of the expense being edited
    editingId = id;


    // Change button text
    document.getElementById("addBtn").textContent = "Update";

});

document.getElementById("expenseTableBody").addEventListener("click", async function (event) {

    if (!event.target.classList.contains("delete-btn")) {
        return;
    }

    hideAlert();

    const id = event.target.dataset.id;

    const result = await deleteExpense(id);

    if (result) {

        showAlert("Expense deleted successfully", "success");

        await refresh();
    }

});


//-------------------------------------------------------------------------------


// Prevent selecting future dates
const dateInput = document.getElementById("date");

const today = new Date().toISOString().split("T")[0];

dateInput.setAttribute("max", today);


//-------------------------------------------------------------------------------

//---بونص-----------------
function updateChart(expenses) {

    const categoryCounts = {
        Food: 0,
        Transport: 0,
        Bills: 0,
        Entertainment: 0,
        Other: 0
    };

    expenses.forEach(expense => {
        categoryCounts[expense.category]++;
    });

    const categories = Object.keys(categoryCounts);
    const counts = Object.values(categoryCounts);

    const ctx = document.getElementById("expenseChart");

    new Chart(ctx, {
        type: "doughnut",

        data: {
            labels: categories,

            datasets: [{
                label: "Expenses",
                data: counts
            }]
        }
    });
}

//-------------------------------------------------------


refresh();

function applyFilter() {
    const selectedCategory =
        document.getElementById("categoryFilter").value;

    if (selectedCategory === "all") {
        renderTable(expensesList);
        return;
    }

    const filteredList = expensesList.filter(expense =>
        expense.category === selectedCategory
    );

    renderTable(filteredList);
}
document.getElementById("categoryFilter").addEventListener("change", applyFilter);
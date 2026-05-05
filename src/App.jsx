import { Analytics } from "@vercel/analytics/react";
import { useState, useEffect } from "react";
import "./App.css";

export default function App() {
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const [selectedDate, setSelectedDate] = useState(null);

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem("calendar-expenses");
    return saved ? JSON.parse(saved) : {};
  });

  const [showModal, setShowModal] = useState(false);

  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseReason, setExpenseReason] = useState("");

  useEffect(() => {
    localStorage.setItem(
      "calendar-expenses",
      JSON.stringify(expenses)
    );
  }, [expenses]);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const daysInMonth = new Date(
    currentYear,
    currentMonth + 1,
    0
  ).getDate();

  const firstDay = new Date(
    currentYear,
    currentMonth,
    1
  ).getDay();

  const totalSpent = Object.values(expenses)
    .flat()
    .reduce(
      (total, item) => total + Number(item.amount),
      0
    );

  const noSpendDays = Object.keys(expenses).filter(
    (date) => expenses[date]?.length === 0
  ).length;

  const generateDateKey = (day) => {
    return `${currentYear}-${currentMonth + 1}-${day}`;
  };

  const markNoSpendDay = (day) => {
    const key = generateDateKey(day);

    setExpenses({
      ...expenses,
      [key]: [],
    });
  };

  const addExpense = () => {
    if (
      !expenseAmount ||
      !expenseReason ||
      !selectedDate
    )
      return;

    const newExpense = {
      id: Date.now(),
      amount: expenseAmount,
      reason: expenseReason,
    };

    const currentExpenses =
      expenses[selectedDate] || [];

    setExpenses({
      ...expenses,
      [selectedDate]: [
        ...currentExpenses,
        newExpense,
      ],
    });

    setExpenseAmount("");
    setExpenseReason("");
    setShowModal(false);
  };

  const getDateExpenses = (day) => {
    const key = generateDateKey(day);
    return expenses[key];
  };

  const openExpenseModal = (day) => {
    const key = generateDateKey(day);

    setSelectedDate(key);

    setShowModal(true);
  };

  const previousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <div className="top-bar">
          <h1 className="title">
            Expense Tracker
          </h1>

          <div className="stats">
            <div className="stat-card spent">
              <p>Total Spent</p>
              <h2>₹{totalSpent}</h2>
            </div>

            <div className="stat-card nospend">
              <p>No Spend Days</p>
              <h2>{noSpendDays}</h2>
            </div>
          </div>
        </div>

        <div className="month-navigation">
          <button
            onClick={previousMonth}
            className="nav-button"
          >
            ←
          </button>

          <h2 className="month-title">
            {monthNames[currentMonth]}{" "}
            {currentYear}
          </h2>

          <button
            onClick={nextMonth}
            className="nav-button"
          >
            →
          </button>
        </div>

        <div className="weekdays">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        <div className="calendar-grid">
          {Array.from({ length: firstDay }).map(
            (_, index) => (
              <div key={index}></div>
            )
          )}

          {Array.from({
            length: daysInMonth,
          }).map((_, index) => {
            const day = index + 1;

            const dateExpenses =
              getDateExpenses(day);

            const isNoSpend =
              dateExpenses &&
              dateExpenses.length === 0;

            const spentAmount = dateExpenses
              ? dateExpenses.reduce(
                  (total, item) =>
                    total + Number(item.amount),
                  0
                )
              : 0;

            return (
              <div
                key={day}
                className={`day-card ${
                  isNoSpend
                    ? "no-spend-day"
                    : ""
                }`}
              >
                <h3 className="day-number">
                  {day}
                </h3>

                {isNoSpend && (
                  <div className="no-spend-text">
                    ✓ No Spend Day
                  </div>
                )}

                {!isNoSpend &&
                  dateExpenses && (
                    <div className="expense-content">
                      <p className="spent-amount">
                        ₹{spentAmount}
                      </p>

                      {dateExpenses
                        .slice(0, 3)
                        .map((expense) => (
                          <p
                            key={expense.id}
                            className="expense-reason"
                          >
                            • {expense.reason}
                          </p>
                        ))}
                    </div>
                  )}

                <div className="card-button-area">
                  <button
                    onClick={() => {
                      const didSpend =
                        window.confirm(
                          "Press OK if you spent money today.\nPress Cancel for No Spend Day."
                        );

                      if (didSpend) {
                        openExpenseModal(day);
                      } else {
                        markNoSpendDay(day);
                      }
                    }}
                    className="update-button"
                  >
                    Update Day
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">
              Add Expense
            </h2>

            <input
              type="number"
              placeholder="Amount"
              value={expenseAmount}
              onChange={(e) =>
                setExpenseAmount(
                  e.target.value
                )
              }
              className="modal-input"
            />

            <input
              type="text"
              placeholder="Reason"
              value={expenseReason}
              onChange={(e) =>
                setExpenseReason(
                  e.target.value
                )
              }
              className="modal-input"
            />

            <div className="modal-buttons">
              <button
                onClick={addExpense}
                className="save-button"
              >
                Save Expense
              </button>

              <button
                onClick={() =>
                  setShowModal(false)
                }
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <Analytics />
    </div>
  );
}
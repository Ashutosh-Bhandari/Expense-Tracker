import { useState, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
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
    localStorage.setItem("calendar-expenses", JSON.stringify(expenses));
  }, [expenses]);

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const generateDateKey = (day) => {
    return `${currentYear}-${currentMonth + 1}-${day}`;
  };

  // ✅ MONTH FILTERED TOTAL
  const totalSpent = Object.entries(expenses)
    .filter(([date]) => {
      const [year, month] = date.split("-");
      return (
        Number(year) === currentYear &&
        Number(month) === currentMonth + 1
      );
    })
    .flatMap(([, value]) => value)
    .reduce((total, item) => total + Number(item.amount), 0);

  // ✅ MONTH FILTERED NO-SPEND
  const noSpendDays = Object.entries(expenses).filter(
    ([date, value]) => {
      const [year, month] = date.split("-");
      return (
        Number(year) === currentYear &&
        Number(month) === currentMonth + 1 &&
        value.length === 0
      );
    }
  ).length;

  const getDateExpenses = (day) => {
    const key = generateDateKey(day);
    return expenses[key];
  };

  const openExpenseModal = (day) => {
    const key = generateDateKey(day);
    setSelectedDate(key);
    setShowModal(true);
  };

  const addExpense = () => {
    if (!expenseAmount || !expenseReason || !selectedDate) return;

    const newExpense = {
      id: Date.now(),
      amount: expenseAmount,
      reason: expenseReason,
    };

    const currentExpenses = expenses[selectedDate] || [];

    setExpenses({
      ...expenses,
      [selectedDate]: [...currentExpenses, newExpense],
    });

    setExpenseAmount("");
    setExpenseReason("");
    setShowModal(false);
  };

  const markNoSpendFromModal = () => {
    if (!selectedDate) return;

    setExpenses({
      ...expenses,
      [selectedDate]: [],
    });

    setShowModal(false);
  };

  const deleteDay = (day) => {
    const key = generateDateKey(day);
    const updated = { ...expenses };
    delete updated[key];
    setExpenses(updated);
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
          <h1 className="title">Expense Tracker</h1>

          <div className="stats">
            <div className="stat-card spent">
              <p>This Month</p>
              <h2>₹{totalSpent}</h2>
            </div>

            <div className="stat-card nospend">
              <p>No Spend Days</p>
              <h2>{noSpendDays}</h2>
            </div>
          </div>
        </div>

        <div className="month-navigation">
          <button onClick={previousMonth} className="nav-button">←</button>
          <h2 className="month-title">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <button onClick={nextMonth} className="nav-button">→</button>
        </div>

        <div className="weekdays">
          <div>Sun</div><div>Mon</div><div>Tue</div>
          <div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>

        <div className="calendar-grid">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={i}></div>
          ))}

          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dateExpenses = getDateExpenses(day);

            const isFutureDate =
              currentYear === today.getFullYear() &&
              currentMonth === today.getMonth() &&
              day > today.getDate();

            const isNoSpend =
              dateExpenses && dateExpenses.length === 0;

            const spentAmount = dateExpenses
              ? dateExpenses.reduce(
                  (total, item) => total + Number(item.amount),
                  0
                )
              : 0;

            return (
              <div
                key={day}
                className={`day-card ${isNoSpend ? "no-spend-day" : ""}`}
                onClick={() => !isFutureDate && openExpenseModal(day)}
              >
                <h3 className="day-number">{day}</h3>

                {dateExpenses && (
                  <button
                    className="delete-day"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDay(day);
                    }}
                  >
                    🗑
                  </button>
                )}

                {isNoSpend && (
                  <div className="no-spend-text">✓ No Spend</div>
                )}

                {!isNoSpend && dateExpenses && (
                  <div className="expense-content">
                    <p className="spent-amount">₹{spentAmount}</p>
                    {dateExpenses.slice(0, 2).map((e) => (
                      <p key={e.id} className="expense-reason">
                        • {e.reason}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add Expense</h2>

            <input
              type="number"
              placeholder="Amount"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
            />

            <input
              type="text"
              placeholder="Reason"
              value={expenseReason}
              onChange={(e) => setExpenseReason(e.target.value)}
            />

            <div className="modal-buttons">
              <button onClick={addExpense}>Save</button>
              <button onClick={markNoSpendFromModal}>No Spend</button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ VERCEL ANALYTICS */}
      <Analytics />
    </div>
  );
}
import { useState, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import "../App.css";
import {
  registerServiceWorker,
  requestNotificationPermission,
  scheduleDailyReminder,
  checkStreakNotification,
  checkBudgetNotification,
  checkMonthlySummary,
} from "../utils/notifications";

export default function Dashboard() {
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

  const [userName, setUserName] = useState(() => {
    return localStorage.getItem("user-name") || "";
  });
  const [showNameModal, setShowNameModal] = useState(() => {
    return !localStorage.getItem("user-name");
  });
  const [nameInput, setNameInput] = useState("");

  const [monthlyGoal, setMonthlyGoal] = useState(() => {
    return Number(localStorage.getItem("monthly-goal")) || 10000;
  });
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  const [activeTab, setActiveTab] = useState("home");

  const [prevBestStreak, setPrevBestStreak] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    localStorage.setItem("calendar-expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    const init = async () => {
      await registerServiceWorker();
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotificationsEnabled(true);
        scheduleDailyReminder();
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!notificationsEnabled) return;
    checkStreakNotification(currentStreak, bestStreak, prevBestStreak);
    setPrevBestStreak(bestStreak);
    checkBudgetNotification(totalSpent, monthlyGoal);
    checkMonthlySummary(totalSpent, noSpendDays, bestStreak);
  }, [expenses]);

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const generateDateKey = (day) => `${currentYear}-${currentMonth + 1}-${day}`;

  const totalSpent = Object.entries(expenses)
    .filter(([date]) => {
      const [year, month] = date.split("-");
      return Number(year) === currentYear && Number(month) === currentMonth + 1;
    })
    .flatMap(([, value]) => value)
    .reduce((total, item) => total + Number(item.amount), 0);

  const noSpendDays = Object.entries(expenses)
    .filter(([date, value]) => {
      const [year, month] = date.split("-");
      return (
        Number(year) === currentYear &&
        Number(month) === currentMonth + 1 &&
        value.length === 0
      );
    }).length;

  const calculateStreaks = () => {
    let best = 0;
    let temp = 0;

    for (let d = 1; d <= today.getDate(); d++) {
      const key = `${today.getFullYear()}-${today.getMonth() + 1}-${d}`;
      const entry = expenses[key];
      if (entry && entry.length === 0) {
        temp++;
        if (temp > best) best = temp;
      } else if (entry !== undefined) {
        temp = 0;
      }
    }
    const current = temp;

    const allKeys = Object.keys(expenses).sort();
    let runningBest = 0;
    let runningTemp = 0;
    allKeys.forEach((key) => {
      if (expenses[key] && expenses[key].length === 0) {
        runningTemp++;
        if (runningTemp > runningBest) runningBest = runningTemp;
      } else {
        runningTemp = 0;
      }
    });

    return { current, best: Math.max(best, runningBest) };
  };

  const { current: currentStreak, best: bestStreak } = calculateStreaks();

  const goalPercent = Math.min(
    Math.round((totalSpent / monthlyGoal) * 100),
    100
  );

  const recentExpenses = Object.entries(expenses)
    .filter(([, value]) => value.length > 0)
    .flatMap(([date, items]) =>
      items.map((item) => ({ ...item, date }))
    )
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);

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
    const newExpense = { id: Date.now(), amount: expenseAmount, reason: expenseReason };
    const currentExpenses = expenses[selectedDate] || [];
    setExpenses({ ...expenses, [selectedDate]: [...currentExpenses, newExpense] });
    setExpenseAmount("");
    setExpenseReason("");
    setShowModal(false);
  };

  const markNoSpendFromModal = () => {
    if (!selectedDate) return;
    setExpenses({ ...expenses, [selectedDate]: [] });
    setShowModal(false);
  };

  const deleteDay = (day) => {
    const key = generateDateKey(day);
    const updated = { ...expenses };
    delete updated[key];
    setExpenses(updated);
  };

  const previousMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const saveName = () => {
    if (!nameInput.trim()) return;
    localStorage.setItem("user-name", nameInput.trim());
    setUserName(nameInput.trim());
    setShowNameModal(false);
  };

  const saveGoal = () => {
    const val = Number(goalInput);
    if (!val || val <= 0) return;
    localStorage.setItem("monthly-goal", val);
    setMonthlyGoal(val);
    setGoalInput("");
    setShowGoalModal(false);
  };

  const formatDate = (dateKey) => {
    const [year, month, day] = dateKey.split("-");
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div className="app">
      <div className="container">

        {/* GREETING */}
        <div className="greeting-bar">
          <div>
            <p className="greeting-text">{getGreeting()}, {userName || "there"} 👋</p>
            <p className="greeting-sub">Stay consistent, see the difference.</p>
          </div>
          <button className="edit-name-btn" onClick={() => setShowNameModal(true)}>
            ✏️
          </button>
        </div>

        {/* STATS */}
        <div className="top-bar">
          <div className="stats">
            <div className="stat-card spent">
              <p>This Month</p>
              <h2>₹{totalSpent.toLocaleString("en-IN")}</h2>
            </div>
            <div className="stat-card nospend">
              <p>No Spend Days</p>
              <h2>{noSpendDays}</h2>
            </div>
            <div className="stat-card streak">
              <p>Current Streak</p>
              <h2>{currentStreak} 🔥</h2>
            </div>
            <div className="stat-card best-streak">
              <p>Best Streak</p>
              <h2>{bestStreak} 🏆</h2>
            </div>
          </div>
        </div>

        {/* GOAL PROGRESS */}
        <div className="goal-section">
          <div className="goal-header">
            <span className="goal-label">Monthly Goal</span>
            <div className="goal-right">
              <span className="goal-amount">₹{monthlyGoal.toLocaleString("en-IN")}</span>
              <button className="edit-goal-btn" onClick={() => setShowGoalModal(true)}>Edit</button>
            </div>
          </div>
          <div className="goal-bar-bg">
            <div
              className="goal-bar-fill"
              style={{
                width: `${goalPercent}%`,
                background: goalPercent >= 100 ? "#dc2626" : goalPercent >= 75 ? "#ea580c" : "#16a34a"
              }}
            />
          </div>
          <div className="goal-footer">
            <span style={{ color: goalPercent >= 100 ? "#dc2626" : "#16a34a" }}>
              {goalPercent}% of goal
            </span>
            <span className="goal-left">
              {totalSpent >= monthlyGoal
                ? `₹${(totalSpent - monthlyGoal).toLocaleString("en-IN")} over budget`
                : `₹${(monthlyGoal - totalSpent).toLocaleString("en-IN")} left`}
            </span>
          </div>
        </div>

        {/* MONTH NAV */}
        <div className="month-navigation">
          <button onClick={previousMonth} className="nav-button">←</button>
          <h2 className="month-title">{monthNames[currentMonth]} {currentYear}</h2>
          <button onClick={nextMonth} className="nav-button">→</button>
        </div>

        {/* WEEKDAYS */}
        <div className="weekdays">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div>
          <div>Thu</div><div>Fri</div><div>Sat</div>
        </div>

        {/* CALENDAR */}
        <div className="calendar-grid">
          {Array.from({ length: firstDay }).map((_, i) => <div key={i}></div>)}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dateExpenses = getDateExpenses(day);
            const isFutureDate =
              currentYear === today.getFullYear() &&
              currentMonth === today.getMonth() &&
              day > today.getDate();
            const isToday =
              currentYear === today.getFullYear() &&
              currentMonth === today.getMonth() &&
              day === today.getDate();
            const isNoSpend = dateExpenses && dateExpenses.length === 0;
            const spentAmount = dateExpenses
              ? dateExpenses.reduce((total, item) => total + Number(item.amount), 0)
              : 0;

            return (
              <div
                key={day}
                className={`day-card ${isNoSpend ? "no-spend-day" : ""} ${isToday ? "today-card" : ""} ${isFutureDate ? "future-card" : ""}`}
                onClick={() => !isFutureDate && openExpenseModal(day)}
              >
                <h3 className="day-number">{day}</h3>

                {dateExpenses && (
                  <button className="delete-day" onClick={(e) => { e.stopPropagation(); deleteDay(day); }}>🗑</button>
                )}

                {isNoSpend && <div className="no-spend-text">✓ No Spend</div>}

                {!isNoSpend && spentAmount > 0 && (
                  <div className="expense-content">
                    <p className="spent-amount">₹{spentAmount.toLocaleString("en-IN")}</p>
                    {dateExpenses.slice(0, 2).map((e) => (
                      <p key={e.id} className="expense-reason">• {e.reason}</p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* RECENT EXPENSES */}
        {recentExpenses.length > 0 && (
          <div className="recent-section">
            <h3 className="recent-title">Recent Expenses</h3>
            {recentExpenses.map((item) => (
              <div key={item.id} className="recent-item">
                <div className="recent-left">
                  <span className="recent-reason">{item.reason}</span>
                  <span className="recent-date">{formatDate(item.date)}</span>
                </div>
                <span className="recent-amount">₹{Number(item.amount).toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* BOTTOM NAV */}
      <div className="bottom-nav">
        <button className={`nav-tab ${activeTab === "home" ? "active" : ""}`} onClick={() => setActiveTab("home")}>
          <span>🏠</span><span>Home</span>
        </button>
        <button className={`nav-tab ${activeTab === "analytics" ? "active" : ""}`} onClick={() => setActiveTab("analytics")}>
          <span>📊</span><span>Analytics</span>
        </button>
        <button className={`nav-tab ${activeTab === "goals" ? "active" : ""}`} onClick={() => setActiveTab("goals")}>
          <span>🎯</span><span>Goals</span>
        </button>
        <button className={`nav-tab ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
          <span>👤</span><span>Profile</span>
        </button>
      </div>

      {/* EXPENSE MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add Expense</h2>
            <input type="number" placeholder="Amount (₹)" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} />
            <input type="text" placeholder="Reason" value={expenseReason} onChange={(e) => setExpenseReason(e.target.value)} />
            <div className="modal-buttons">
              <button onClick={addExpense}>Save</button>
              <button onClick={markNoSpendFromModal}>No Spend</button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* NAME MODAL */}
      {showNameModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Welcome! 👋</h2>
            <p style={{ color: "#666", marginTop: "8px", fontSize: "14px" }}>What should we call you?</p>
            <input type="text" placeholder="Your name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveName()} />
            <div className="modal-buttons">
              <button onClick={saveName}>Let's go!</button>
            </div>
          </div>
        </div>
      )}

      {/* GOAL MODAL */}
      {showGoalModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Set Monthly Goal</h2>
            <p style={{ color: "#666", marginTop: "8px", fontSize: "14px" }}>Current goal: ₹{monthlyGoal.toLocaleString("en-IN")}</p>
            <input type="number" placeholder="New goal amount (₹)" value={goalInput} onChange={(e) => setGoalInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveGoal()} />
            <div className="modal-buttons">
              <button onClick={saveGoal}>Save</button>
              <button onClick={() => setShowGoalModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <Analytics />
    </div>
  );
}
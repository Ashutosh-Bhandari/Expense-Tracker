import { useState, useEffect } from "react";

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
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f4f4f4",
        padding: "30px",
        fontFamily: "Arial",
      }}
    >
    <div
      style={{
        maxWidth: "1200px",
        margin: "auto",
        background:
          "linear-gradient(to bottom right, #ffffff, #f0f4ff)",
        borderRadius: "25px",
        padding: "30px",
        boxShadow: "0px 10px 30px rgba(0,0,0,0.12)",
        border: "1px solid #dbe4ff",
      }}
    >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
        <h1
          style={{
            fontSize: "48px",
            margin: 0,
            fontWeight: "bold",
            color: "#111",
            letterSpacing: "-1px",
          }}
        >
            Expense Tracker
          </h1>

          <div
            style={{
              display: "flex",
              gap: "50px",
            }}
          >
            <div>
              <p
                style={{
                  color: "gray",
                  margin: 0,
                }}
              >
                Total Spent
              </p>

              <h2
                style={{
                  color: "red",
                  margin: 0,
                  fontSize: "36px",
                }}
              >
                ₹{totalSpent}
              </h2>
            </div>

            <div>
              <p
                style={{
                  color: "gray",
                  margin: 0,
                }}
              >
                No Spend Days
              </p>

              <h2
                style={{
                  color: "green",
                  margin: 0,
                  fontSize: "36px",
                }}
              >
                {noSpendDays}
              </h2>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "40px",
            marginBottom: "30px",
          }}
        >
          <button
            onClick={previousMonth}
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              backgroundColor: "#111",
              cursor: "pointer",
              fontSize: "20px",
              color: "white",
            }}
          >
            ←
          </button>

          <h2
            style={{
              fontSize: "42px",
              margin: 0,
              fontWeight: "bold",
              color: "#222",
              backgroundColor: "#eef2ff",
              padding: "10px 24px",
              borderRadius: "14px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
            }}
          >
            {monthNames[currentMonth]} {currentYear}
          </h2>

          <button
            onClick={nextMonth}
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              backgroundColor: "#111",
              cursor: "pointer",
              fontSize: "20px",
              color: "white",
            }}
          >
            →
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "10px",
            marginBottom: "10px",
            textAlign: "center",
            fontWeight: "bold",
            color: "#666",
          }}
        >
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "12px",
          }}
        >
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
                style={{
                  minHeight: "140px",
                  borderRadius: "18px",
                  padding: "14px",
                  backgroundColor: isNoSpend
                    ? "#eef9ee"
                    : "white",
                  border: isNoSpend
                    ? "2px solid #bde5bd"
                    : "1px solid #e2e2e2",
                  position: "relative",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "24px",
                  }}
                >
                  {day}
                </h3>

                {isNoSpend && (
                  <div
                    style={{
                      color: "green",
                      marginTop: "10px",
                      fontWeight: "bold",
                    }}
                  >
                    ✓ No Spend
                  </div>
                )}

                {!isNoSpend &&
                  dateExpenses && (
                    <div
                      style={{
                        marginTop: "10px",
                      }}
                    >
                      <p
                        style={{
                          color: "red",
                          fontWeight: "bold",
                          fontSize: "22px",
                          margin: 0,
                        }}
                      >
                        ₹{spentAmount}
                      </p>

                      {dateExpenses
                        .slice(0, 2)
                        .map((expense) => (
                          <p
                            key={expense.id}
                            style={{
                              margin: "5px 0",
                              fontSize: "14px",
                              color: "#555",
                            }}
                          >
                            • {expense.reason}
                          </p>
                        ))}
                    </div>
                  )}

                <div
                  style={{
                    position: "absolute",
                    bottom: "12px",
                    left: "12px",
                    right: "12px",
                    display: "flex",
                    gap: "8px",
                  }}
                >
                  <button
                    onClick={() =>
                      markNoSpendDay(day)
                    }
                    style={{
                      flex: 1,
                      padding: "8px",
                      backgroundColor: "green",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    No Spend
                  </button>

                  <button
                    onClick={() =>
                      openExpenseModal(day)
                    }
                    style={{
                      flex: 1,
                      padding: "8px",
                      backgroundColor: "red",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Add Expense
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor:
              "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "20px",
              width: "400px",
            }}
          >
            <h2>Add Expense</h2>

            <input
              type="number"
              placeholder="Amount"
              value={expenseAmount}
              onChange={(e) =>
                setExpenseAmount(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "15px",
                borderRadius: "10px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
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
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "15px",
                borderRadius: "10px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                onClick={addExpense}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "black",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                }}
              >
                Save
              </button>

              <button
                onClick={() =>
                  setShowModal(false)
                }
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#ddd",
                  color: "black",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
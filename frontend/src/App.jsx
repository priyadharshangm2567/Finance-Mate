import { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import { Pie } from "react-chartjs-2";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import "./App.css";

ChartJS.register(ArcElement, Tooltip, Legend);

function App() {
  const [form, setForm] = useState({
    income: "",
    food: "",
    shopping: "",
    travel: "",
    bills: "",
  });

  const [result, setResult] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: Number(e.target.value),
    });
  };

  const analyzeFinance = async () => {
    const totalExpense =
      Number(form.food || 0) +
      Number(form.shopping || 0) +
      Number(form.travel || 0) +
      Number(form.bills || 0);

    if (totalExpense > Number(form.income || 0)) {
      alert(
        `⚠️ Your total expenses (₹${totalExpense}) exceed your income (₹${form.income}). Please review your entries before analyzing.`
      );
      return;
    }

    try {
const response = await axios.post(
  `${import.meta.env.VITE_API_URL}/analyze-finance`,
  form
);

      setResult(response.data);
    } catch (error) {
      console.log(error);
      alert("Backend is not running.");
    }
  };

  const uploadFile = async () => {
    if (!file) {
      alert("Please choose a file.");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/upload-file`,
      formData
);
      setUploadResult(response.data);
    } catch (error) {
      console.log(error);
      alert("File upload failed.");
    }
  };

  const downloadReport = () => {
    if (!result) {
      alert("Analyze your finances first.");
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("FinMate AI Financial Report", 20, 20);

    doc.setFontSize(12);

    doc.text(`Total Expense: Rs. ${result.total_expense}`, 20, 40);
    doc.text(`Savings: Rs. ${result.savings}`, 20, 50);
    doc.text(`Health Score: ${result.health_score}/100`, 20, 60);
    doc.text(
      `Predicted Next Month Expense: Rs. ${result.predicted_next_month_expense}`,
      20,
      70
    );

    doc.text("AI Recommendations:", 20, 90);

    let y = 100;

    result.advice.forEach((item) => {
      doc.text("- " + item, 25, y);
      y += 10;
    });

    doc.save("FinMate_AI_Report.pdf");
  };

  let chartData = null;

  if (uploadResult) {
    const chartColors = [
      "#E8A83C", "#34D399", "#60A5FA", "#F87171",
      "#A78BFA", "#22D3EE", "#FB923C", "#4ADE80",
      "#F472B6", "#94A3B8", "#A3E635", "#C084FC",
      "#38BDF8", "#FACC15", "#FB7185",
    ];

    const labels = Object.keys(uploadResult.category_breakdown);
    const values = Object.values(uploadResult.category_breakdown);

    chartData = {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: labels.map(
            (_, i) => chartColors[i % chartColors.length]
          ),
          borderColor: "#0A1628",
          borderWidth: 2,
        },
      ],
    };
  }

  return (
    <div className="container">
      {/* HEADER */}
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">₹</span>
          <div>
            <h1>FinMate <span className="accent-text">AI</span></h1>
            <p>AI-powered personal finance analyzer</p>
          </div>
        </div>
      </header>

      {/* KPI CARDS */}
      <div className="kpi-row">
        <div className="kpi-card">
          <span className="kpi-label">Income</span>
          <span className="kpi-value mono">
            {form.income ? `₹${form.income}` : "—"}
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Expense</span>
          <span className="kpi-value mono">
            {result ? `₹${result.total_expense}` : "—"}
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Savings</span>
          <span className="kpi-value mono accent-text">
            {result ? `₹${result.savings}` : "—"}
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Health Score</span>
          <span className="kpi-value mono">
            {result ? `${result.health_score}/100` : "—"}
          </span>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-grid">
        {/* LEFT COLUMN */}
        <div className="fm-card form-card">
          <h3><span className="rule" />Monthly Finance</h3>

          <label className="field-label">Income</label>
          <input
            name="income"
            placeholder="Enter income"
            onChange={handleChange}
          />

          <label className="field-label">Food</label>
          <input
            name="food"
            placeholder="Enter food expense"
            onChange={handleChange}
          />

          <label className="field-label">Shopping</label>
          <input
            name="shopping"
            placeholder="Enter shopping expense"
            onChange={handleChange}
          />

          <label className="field-label">Travel</label>
          <input
            name="travel"
            placeholder="Enter travel expense"
            onChange={handleChange}
          />

          <label className="field-label">Bills</label>
          <input
            name="bills"
            placeholder="Enter bills"
            onChange={handleChange}
          />

          <button className="btn-primary" onClick={analyzeFinance}>
            Analyze Finance
          </button>
        </div>

        {/* RIGHT COLUMN */}
        <div className="fm-card summary-card">
          <h3><span className="rule" />Financial Summary</h3>

          {result ? (
            <>
              <div className="result-grid">
                <div className="result-item">
                  <span className="result-label">Total Expense</span>
                  <span className="result-value mono">₹{result.total_expense}</span>
                </div>

                <div className="result-item">
                  <span className="result-label">Savings</span>
                  <span className="result-value mono accent-text">₹{result.savings}</span>
                </div>

                <div className="result-item">
                  <span className="result-label">Health Score</span>
                  <span className="result-value mono">{result.health_score}/100</span>
                </div>

                <div className="result-item">
                  <span className="result-label">Predicted Next Month Expense</span>
                  <span className="result-value mono">
                    ₹{result.predicted_next_month_expense}
                  </span>
                </div>
              </div>

              <h4 className="sub-heading">AI Recommendations</h4>

              <div className="advice-list">
                {result.advice.map((item, index) => (
                  <div className="advice" key={index}>
                    <span className="advice-dot" />
                    {item}
                  </div>
                ))}
              </div>

              <button className="btn-success" onClick={downloadReport}>
                Download PDF Report
              </button>
            </>
          ) : (
            <div className="empty-state">
              Fill in your monthly finance details and click Analyze to see
              your summary here.
            </div>
          )}
        </div>
      </div>

      {/* UPLOAD SECTION */}
      <div className="fm-card upload-card">
        <h3><span className="rule" />Upload Bank Statement</h3>

        <div className="upload-row">
          <label className="file-input">
            <input
              type="file"
              accept=".xlsx,.csv,.xls"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <span>{file ? file.name : "Choose file (.csv / .xlsx)"}</span>
          </label>

          <button className="btn-primary" onClick={uploadFile}>
            Analyze Transactions
          </button>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      {uploadResult && (
        <div className="main-grid bottom-grid">
          <div className="fm-card chart-card">
            <h3><span className="rule" />Expense Distribution</h3>
            <div className="chart-wrap">
              <Pie data={chartData} />
            </div>
          </div>

          <div className="fm-card insights-card">
            <h3><span className="rule" />Transaction Summary</h3>

            <div className="result-item">
              <span className="result-label">Highest Spending Category</span>
              <span className="result-value">
                {uploadResult.highest_spending_category}
              </span>
            </div>

            <div className="result-item">
              <span className="result-label">Total Spending</span>
              <span className="result-value mono">
                ₹{uploadResult.total_spending}
              </span>
            </div>

            <h4 className="sub-heading">AI Suggestions</h4>

            <div className="advice">
              <span className="advice-dot" />
              Try reducing your spending in{" "}
              <b>{uploadResult.highest_spending_category}</b> to improve your
              savings.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

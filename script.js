let data = [];

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("data.json");
    data = await res.json();

    // Tambahkan nomor otomatis jika belum ada
    data = data.map((d, i) => ({ no: d.no || i + 1, ...d }));

    buildKPI();
    buildTable(data);
    buildCharts(data);
    buildAnalysis(data);
    setupEvents();
  } catch (err) {
    console.error("Gagal memuat data:", err);
    alert("Data tidak ditemukan. Pastikan file data.json tersedia.");
  }
});

function buildKPI() {
  const avgMobile = average(data.map(d => d.mobile)).toFixed(1);
  const avgComputer = average(data.map(d => d.computer)).toFixed(1);
  const top = data.reduce((a,b) => a.mobile > b.mobile ? a : b);
  document.querySelector("#kpiMobile h2").textContent = avgMobile + "%";
  document.querySelector("#kpiComputer h2").textContent = avgComputer + "%";
  document.querySelector("#kpiTop h2").textContent = `${top.country} (${top.mobile}%)`;
}

function buildTable(list) {
  const tbody = document.querySelector("#dataTable tbody");
  const thead = document.querySelector("#dataTable thead");

  // Pastikan tabel punya kolom "No"
  thead.innerHTML = `<tr><th>No</th><th>Negara</th><th>Mobile (%)</th><th>Computer (%)</th></tr>`;
  tbody.innerHTML = "";

  list.forEach(d => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${d.no}</td><td>${d.country}</td><td>${d.mobile}</td><td>${d.computer}</td>`;
    row.addEventListener("click", () => {
      const detail = document.getElementById("detail");
      detail.innerHTML = `<b>${d.no}. ${d.country}</b><br>Mobile: ${d.mobile}%<br>Computer: ${d.computer}%`;
      detail.scrollIntoView({behavior:"smooth"});
    });
    tbody.appendChild(row);
  });
}

function setupEvents() {
  document.getElementById("search").addEventListener("input", filterData);
  document.getElementById("filter").addEventListener("change", filterData);
  document.getElementById("downloadCSV").addEventListener("click", downloadCSV);
}

function filterData() {
  const query = document.getElementById("search").value.toLowerCase();
  const filter = document.getElementById("filter").value;
  let filtered = data.filter(d => d.country.toLowerCase().includes(query));
  if (filter === "mobile_gt_60") filtered = filtered.filter(d => d.mobile > 60);
  if (filter === "mobile_50_60") filtered = filtered.filter(d => d.mobile >= 50 && d.mobile <= 60);
  if (filter === "mobile_lt_50") filtered = filtered.filter(d => d.mobile < 50);
  buildTable(filtered);
}

function downloadCSV() {
  const rows = [["no","country","mobile","computer"], ...data.map(d => [d.no,d.country,d.mobile,d.computer])];
  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], {type: "text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "data_statistika.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function average(arr) {
  return arr.reduce((a,b) => a+b, 0)/arr.length;
}

function buildCharts(list) {
  const sliced = list.slice(0, 30);

  // Buat container scrollable
  const chartContainer = document.getElementById("barChart").parentElement;
  chartContainer.style.overflowX = "auto";

  const canvas = document.getElementById("barChart");
  canvas.style.width = "1800px";

  const ctxBar = canvas.getContext("2d");
  new Chart(ctxBar, {
    type: "bar",
    data: {
      labels: sliced.map(d => `${d.no}. ${d.country}`),
      datasets: [
        {label:"Mobile", data:sliced.map(d=>d.mobile), backgroundColor:"rgba(0,120,255,0.8)"},
        {label:"Computer", data:sliced.map(d=>d.computer), backgroundColor:"rgba(0,198,255,0.5)"}
      ]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins:{legend:{position:"top"}},
      scales:{
        x: {
          ticks: { autoSkip: false, maxRotation: 60, minRotation: 45 }
        },
        y:{beginAtZero:true,max:100}
      }
    }
  });

  // Pie chart (Top 5)
  const top5 = [...list].sort((a,b)=>b.mobile-a.mobile).slice(0,5);
  const others = list.slice(5).reduce((sum,d)=>sum+d.mobile,0);
  const ctxPie = document.getElementById("pieChart").getContext("2d");
  new Chart(ctxPie, {
    type:"pie",
    data:{
      labels: top5.map(d=>`${d.no}. ${d.country}`).concat("Lainnya"),
      datasets:[{data: top5.map(d=>d.mobile).concat(others)}]
    },
    options:{responsive:true,plugins:{legend:{position:"right"}}}
  });
}

function buildAnalysis(list) {
  const avgM = average(list.map(d => d.mobile)).toFixed(2);
  const avgC = average(list.map(d => d.computer)).toFixed(2);
  const correlation = pearson(list.map(d=>d.mobile), list.map(d=>d.computer)).toFixed(4);
  document.getElementById("analysisText").innerHTML = `
    <p>Rata-rata penggunaan mobile <b>55.9%</b></p>
    <p>Rata-rata penggunaan compute <b>44.1%</b></p>
    <p>Nilai range sebesar <b>14.0%</b> menunjukkan variasi moderat antarnegara.</p>
    <p>Standar deviasi sebesar <b>4.15%</b></p>
    <p>pengguna internet global saat ini didominasi oleh perangkat mobile, dengan sebaran antarnegara yang relatif seragam dan perbedaan yang tidak ekstrem.
Tren ini mengindikasikan pergeseran perilaku digital menuju mobilitas, kenyamanan, dan konektivitas lintas perangkat.</p>`;

const source = document.getElementById("sourceLink");
  source.innerHTML = `
    🔗 <b>Sumber Data:</b> 
    <a href="https://wearesocial.com/id/blog/2024/07/digital-2024-july-global-statshot-report/" 
       target="_blank" rel="noopener noreferrer">
       DataReportal – Digital 2024 Global Overview
    </a>
  `;
}

function pearson(x, y) {
  const n = x.length;
  const avgX = average(x);
  const avgY = average(y);
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - avgX;
    const dy = y[i] - avgY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  return num / Math.sqrt(denX * denY);
}

function buildCharts(list) {
  const sliced = list.slice(0, 30);
  const chartContainer = document.getElementById("barChart").parentElement;
  chartContainer.style.overflowX = "auto";

  const canvas = document.getElementById("barChart");
  canvas.style.width = "1800px";
  const ctxBar = canvas.getContext("2d");
  new Chart(ctxBar, {
    type: "bar",
    data: {
      labels: sliced.map(d => `${d.no}. ${d.country}`),
      datasets: [
        { label: "Mobile", data: sliced.map(d => d.mobile), backgroundColor: "rgba(0,120,255,0.8)" },
        { label: "Computer", data: sliced.map(d => d.computer), backgroundColor: "rgba(0,198,255,0.5)" }
      ]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: { legend: { position: "top" } },
      scales: {
        x: { ticks: { autoSkip: false, maxRotation: 60, minRotation: 45 } },
        y: { beginAtZero: true, max: 100 }
      }
    }
  });

  // Pie chart (Top 5 mobile)
  const top5Mobile = [...list].sort((a, b) => b.mobile - a.mobile).slice(0, 5);
  const ctxPie = document.getElementById("pieChart").getContext("2d");
  new Chart(ctxPie, {
    type: "pie",
    data: {
      labels: top5Mobile.map(d => `${d.country}`),
      datasets: [{ data: top5Mobile.map(d => d.mobile) }]
    },
    options: { responsive: true, plugins: { legend: { position: "right" } } }
  });

  // Top 5 Mobile tertinggi
  const ctxTopMobile = document.getElementById("topMobileChart").getContext("2d");
  new Chart(ctxTopMobile, {
    type: "bar",
    data: {
      labels: top5Mobile.map(d => d.country),
      datasets: [
        {
          label: "Mobile (%)",
          data: top5Mobile.map(d => d.mobile),
          backgroundColor: "rgba(0,120,255,0.8)"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: 100 } }
    }
  });

  // Top 5 Computer tertinggi
  const top5Computer = [...list].sort((a, b) => b.computer - a.computer).slice(0, 5);
  const ctxTopComputer = document.getElementById("topComputerChart").getContext("2d");
  new Chart(ctxTopComputer, {
    type: "bar",
    data: {
      labels: top5Computer.map(d => d.country),
      datasets: [
        {
          label: "Computer (%)",
          data: top5Computer.map(d => d.computer),
          backgroundColor: "rgba(0,198,255,0.7)"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: 100 } }
    }
  });
  // Diagram Rata-rata Penggunaan Mobile vs Computer
  const avgMobile = average(list.map(d => d.mobile)).toFixed(1);
  const avgComputer = average(list.map(d => d.computer)).toFixed(1);

  const ctxAvg = document.getElementById("avgChart").getContext("2d");
  new Chart(ctxAvg, {
    type: "doughnut",
    data: {
      labels: ["Mobile", "Computer"],
      datasets: [{
        data: [avgMobile, avgComputer],
        backgroundColor: ["rgba(0,120,255,0.8)", "rgba(0,198,255,0.6)"],
        borderColor: "#ffffff",
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || "";
              const value = context.raw;
              const total = avgMobile * 1 + avgComputer * 1;
              const pct = ((value / total) * 100).toFixed(1);
              return `${label}: ${value}% (${pct} dari total)`;
            }
          }
        }
      },
      cutout: "60%", // bentuk donut
    }
  });

    // 🔹 Diagram Median Penggunaan Mobile vs Computer
  const medianMobile = median(list.map(d => d.mobile)).toFixed(1);
  const medianComputer = median(list.map(d => d.computer)).toFixed(1);

  const ctxMedian = document.getElementById("medianChart").getContext("2d");
  new Chart(ctxMedian, {
    type: "bar",
    data: {
      labels: ["Mobile", "Computer"],
      datasets: [{
        label: "Median (%)",
        data: [medianMobile, medianComputer],
        backgroundColor: ["rgba(0,120,255,0.85)", "rgba(0,198,255,0.65)"],
        borderRadius: 8
      }]
    },
    options: {
  responsive: true,
  maintainAspectRatio: false, // ini WAJIB agar ukuran CSS di atas dihormati
  plugins: {
    legend: { display: false },
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      title: { display: true, text: "Persentase (%)" }
    }
  }
}

  });


  function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

}


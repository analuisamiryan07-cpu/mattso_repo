@extends('layouts.app')
@section('title', 'Panel administrativo — MATsso')

@push('styles')
<style>
.kpi-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:1rem; margin-bottom:1.5rem; }
.kpi-card { background:#fff; border-radius:10px; padding:1.25rem 1rem; box-shadow:0 1px 6px rgba(0,0,0,.08); text-align:center; border-top:4px solid var(--accent,#0f2a5c); }
.kpi-card.green  { --accent:#16a34a; }
.kpi-card.yellow { --accent:#d97706; }
.kpi-card.red    { --accent:#dc2626; }
.kpi-card.blue   { --accent:#2563eb; }
.kpi-num  { font-size:2rem; font-weight:700; color:var(--accent,#0f2a5c); line-height:1.1; }
.kpi-lbl  { font-size:.78rem; color:#6b7280; margin-top:.25rem; }
.charts-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; margin-bottom:1.5rem; }
@media(max-width:768px){ .charts-grid{ grid-template-columns:1fr; } }
.chart-card { background:#fff; border-radius:10px; padding:1.25rem; box-shadow:0 1px 6px rgba(0,0,0,.08); }
.chart-card h3 { font-size:.95rem; font-weight:600; color:#0f2a5c; margin-bottom:1rem; }
</style>
@endpush

@section('content')
<h1>Panel administrativo</h1>
<p class="muted">Resumen del sistema.</p>

{{-- KPIs ÓRDENES --}}
<div class="kpi-grid" style="margin-top:1rem;">
  <div class="kpi-card green">
    <div class="kpi-num">${{ number_format($totalRevenue, 2) }}</div>
    <div class="kpi-lbl">Ingresos Totales</div>
  </div>
  <div class="kpi-card blue">
    <div class="kpi-num">{{ $paidCount }}</div>
    <div class="kpi-lbl">Pagos Confirmados</div>
  </div>
  <div class="kpi-card yellow">
    <div class="kpi-num">{{ $pendingCount }}</div>
    <div class="kpi-lbl">Pagos Pendientes</div>
  </div>
  <div class="kpi-card yellow">
    <div class="kpi-num">${{ number_format($pendingAmount, 2) }}</div>
    <div class="kpi-lbl">Monto Pendiente</div>
  </div>
  <div class="kpi-card red">
    <div class="kpi-num">{{ $rejectedCount }}</div>
    <div class="kpi-lbl">Rechazados</div>
  </div>
</div>

{{-- KPIs PLATAFORMA --}}
<div class="grid" style="margin-bottom:1.5rem;">
  <div class="card"><div class="stat">{{ $documentClientCount }}</div><div>Candidatos con documentos</div></div>
  <div class="card"><div class="stat">{{ $clientRecordsWithoutDocuments }}</div><div>Registros sin documentos (revisar)</div></div>
  <div class="card"><div class="stat">{{ $certCount }}</div><div>Certificaciones activas</div></div>
  <div class="card"><div class="stat">{{ $capCount }}</div><div>Capacitaciones activas</div></div>
  <div class="card"><div class="stat">{{ $webUserCount }}</div><div>Usuarios web</div></div>
</div>

{{-- GRÁFICOS --}}
@if(count($revenueByMonth) > 0)
<div class="charts-grid">
  {{-- Ingresos por mes --}}
  <div class="chart-card">
    <h3>💰 Ingresos por mes (pagos confirmados)</h3>
    <canvas id="chartRevenue" height="220"></canvas>
  </div>
  {{-- Órdenes pagadas por mes --}}
  <div class="chart-card">
    <h3>📦 Órdenes pagadas por mes</h3>
    <canvas id="chartOrders" height="220"></canvas>
  </div>
  {{-- Distribución de estados --}}
  <div class="chart-card">
    <h3>📊 Estado de todas las órdenes</h3>
    <canvas id="chartStatus" height="220"></canvas>
  </div>
</div>
@else
<div class="card" style="text-align:center;color:#6b7280;padding:2rem;">
  No hay datos de órdenes aún para mostrar gráficos.
</div>
@endif

@endsection

@push('scripts')
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script>
(function() {
  const labels  = @json(array_keys($revenueByMonth));
  const revenue = @json(array_values($revenueByMonth));
  const orders  = @json(array_values($ordersByMonth));

  const monthLabel = (ym) => {
    const [y, m] = ym.split('-');
    const names = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return names[parseInt(m)-1] + ' ' + y;
  };
  const prettyLabels = labels.map(monthLabel);

  // Colores base
  const blue   = 'rgba(15,42,92,0.85)';
  const blueBg = 'rgba(15,42,92,0.12)';
  const gold   = 'rgba(217,119,6,0.85)';
  const goldBg = 'rgba(217,119,6,0.12)';

  // Chart 1 — ingresos línea
  new Chart(document.getElementById('chartRevenue'), {
    type: 'line',
    data: {
      labels: prettyLabels,
      datasets: [{
        label: 'Ingresos ($)',
        data: revenue,
        borderColor: blue,
        backgroundColor: blueBg,
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: blue,
        fill: true,
        tension: 0.35,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => '$' + v.toLocaleString() } }
      }
    }
  });

  // Chart 2 — órdenes barras
  new Chart(document.getElementById('chartOrders'), {
    type: 'bar',
    data: {
      labels: prettyLabels,
      datasets: [{
        label: 'Órdenes pagadas',
        data: orders,
        backgroundColor: goldBg,
        borderColor: gold,
        borderWidth: 2,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });

  // Chart 3 — donut estados
  new Chart(document.getElementById('chartStatus'), {
    type: 'doughnut',
    data: {
      labels: ['Pagadas', 'Pendientes', 'Rechazadas'],
      datasets: [{
        data: [{{ $paidCount }}, {{ $pendingCount }}, {{ $rejectedCount }}],
        backgroundColor: ['#16a34a','#d97706','#dc2626'],
        borderWidth: 2,
        borderColor: '#fff',
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 12 } } }
      },
      cutout: '60%',
    }
  });
})();
</script>
@endpush

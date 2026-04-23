/* ============================================================
   googleCharts.js
   Purpose : Render 3 charts using Google Charts API
   Charts  :
     1. Job Role Distribution      — Donut Chart
     2. Top Job Locations          — Column Bar Chart
     3. Remote vs Onsite Jobs      — Pie Chart
   Data    : window.appData (parsed from CSV by D3)
   ============================================================ */

/**
 * Main entry point. Called from index.html once both
 * Google Charts API AND CSV data are ready.
 */
function drawGoogleCharts() {
    const data = window.filteredData;
    drawRoleDistribution(data);
    drawCityDistribution(data);
    drawRemoteVsOnsite(data);
}

/* ---------------------------------------------------------- */
/* CHART 1 : Job Role Distribution — Donut Chart             */
/* ---------------------------------------------------------- */
function drawRoleDistribution(data) {
    // Count occurrences of each job role
    const roleCounts = {};
    data.forEach(function(row) {
        const role = row.role.trim();
        roleCounts[role] = (roleCounts[role] || 0) + 1;
    });

    // Build Google DataTable
    const tableData = new google.visualization.DataTable();
    tableData.addColumn('string', 'Role');
    tableData.addColumn('number', 'Job Count');

    // Sort roles by count descending
    Object.entries(roleCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(function([role, count]) {
            tableData.addRow([role, count]);
        });

    const options = {
        backgroundColor:   'transparent',
        legend:            { position: 'right', textStyle: { color: '#8bacc8', fontSize: 11, fontName: 'DM Sans' } },
        pieHole:           0.45,  // Donut style
        pieSliceTextStyle: { color: '#e2ecf7', fontSize: 10, fontName: 'DM Sans' },
        chartArea:         { width: '62%', height: '84%' },
        tooltip:           { textStyle: { color: '#0d1f35', fontSize: 12 } },
        colors:            ['#00d4ff','#00e5b3','#ff6b35','#a78bfa','#fbbf24',
                            '#f87171','#38bdf8','#34d399','#fb923c','#c084fc'],
        fontName:          'DM Sans',
    };

    const chart = new google.visualization.PieChart(
        document.getElementById('roleDistribution')
    );
    chart.draw(tableData, options);
}

/* ---------------------------------------------------------- */
/* CHART 2 : Top Job Locations — Column Chart                */
/* ---------------------------------------------------------- */
function drawCityDistribution(data) {
    // Count jobs per city
    const cityCounts = {};
    data.forEach(function(row) {
        const city = row.city.trim();
        cityCounts[city] = (cityCounts[city] || 0) + 1;
    });

    // Sort and take top 8 cities
    const top8 = Object.entries(cityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    const tableData = new google.visualization.DataTable();
    tableData.addColumn('string', 'City');
    tableData.addColumn('number', 'Job Postings');
    tableData.addColumn({ type: 'string', role: 'tooltip' });
    tableData.addColumn({ type: 'string', role: 'style' });

    top8.forEach(function([city, count], index) {
        // Lighter bars for top cities
        const opacity = 1 - (index * 0.07);
        tableData.addRow([
            city,
            count,
            city + ': ' + count + ' postings',
            'color: #00d4ff; opacity: ' + opacity
        ]);
    });

    const options = {
        backgroundColor:  'transparent',
        legend:           { position: 'none' },
        hAxis: {
            textStyle:     { color: '#8bacc8', fontSize: 10, fontName: 'DM Sans' },
            gridlines:     { color: '#1a3a5c', count: 4 },
            baselineColor: '#1a3a5c'
        },
        vAxis: {
            textStyle:     { color: '#8bacc8', fontSize: 10, fontName: 'DM Sans' },
            gridlines:     { color: '#1a3a5c' },
            baselineColor: '#1a3a5c',
            minValue: 0
        },
        chartArea:   { width: '80%', height: '72%' },
        bar:         { groupWidth: '60%' },
        tooltip:     { textStyle: { color: '#0d1f35', fontSize: 12 } },
        fontName:    'DM Sans',
        animation:   { startup: true, duration: 800, easing: 'out' },
    };

    const chart = new google.visualization.ColumnChart(
        document.getElementById('cityDistribution')
    );
    chart.draw(tableData, options);
}

/* ---------------------------------------------------------- */
/* CHART 3 : Remote vs Onsite vs Hybrid — Pie Chart          */
/* ---------------------------------------------------------- */
function drawRemoteVsOnsite(data) {
    // Count each work mode (CSV uses 0 = Onsite, 1 = Remote)
    const counts = { 'Remote': 0, 'Onsite': 0 };
    data.forEach(function(row) {
        const r = parseInt(row.remote);
        if (r === 1) counts['Remote']++;
        else counts['Onsite']++;
    });

    const tableData = new google.visualization.DataTable();
    tableData.addColumn('string', 'Work Mode');
    tableData.addColumn('number', 'Count');
    tableData.addRow(['Remote',  counts['Remote']]);
    tableData.addRow(['Onsite',  counts['Onsite']]);

    const options = {
        backgroundColor:   'transparent',
        legend:            { position: 'bottom', textStyle: { color: '#8bacc8', fontSize: 11, fontName: 'DM Sans' } },
        pieSliceTextStyle: { color: '#050d1a', fontSize: 12, bold: true, fontName: 'DM Sans' },
        chartArea:         { width: '88%', height: '70%' },
        colors:            ['#00e5b3', '#ff6b35'],
        tooltip:           { textStyle: { color: '#0d1f35', fontSize: 12 } },
        fontName:          'DM Sans',
        animation:         { startup: true, duration: 900, easing: 'out' },
    };

    const chart = new google.visualization.PieChart(
        document.getElementById('remoteVsOnsite')
    );
    chart.draw(tableData, options);
}

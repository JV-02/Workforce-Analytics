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
 * Returns the current filter selections for overview chart highlighting.
 */
function getOverviewFilterState() {
    return {
        role: document.getElementById('roleFilter')?.value.trim() || '',
        location: document.getElementById('locationFilter')?.value.trim() || '',
        remote: document.getElementById('remoteFilter')?.value.trim() || '',
    };
}

/**
 * Main entry point. Called from index.html once both
 * Google Charts API AND CSV data are ready.
 */
function drawGoogleCharts(fullData = window.appData, filteredData = window.filteredData) {
    if (!fullData) fullData = filteredData || [];
    if (!filteredData) filteredData = fullData;
    const filters = getOverviewFilterState();

    drawRoleDistribution(fullData, filters, filteredData);
    drawCityDistribution(fullData, filters, filteredData);
    drawRemoteVsOnsite(fullData, filters, filteredData);
}

/* ---------------------------------------------------------- */
/* CHART 1 : Job Role Distribution — Donut Chart             */
/* ---------------------------------------------------------- */
function drawRoleDistribution(fullData, filters, filteredData) {
    const roleCounts = {};
    fullData.forEach(function(row) {
        const role = row.role.trim();
        roleCounts[role] = (roleCounts[role] || 0) + 1;
    });

    const selectedRole = filters.role;
    const selectedCount = selectedRole ? filteredData.filter(d => d.role.trim() === selectedRole).length : 0;

    const tableData = new google.visualization.DataTable();
    tableData.addColumn('string', 'Role');
    tableData.addColumn('number', 'Job Count');
    tableData.addColumn({ type: 'string', role: 'tooltip' });

    const palette = ['#00d4ff','#00e5b3','#ff6b35','#a78bfa','#fbbf24','#f87171','#38bdf8','#34d399','#fb923c','#c084fc'];
    const colors = [];

    Object.entries(roleCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(function([role, count], index) {
            const tooltipLabel = selectedRole === role && selectedCount > 0
                ? `${role}: ${count} total jobs\nSelected subset: ${selectedCount} jobs`
                : `${role}: ${count} total jobs`;

            tableData.addRow([role, count, tooltipLabel]);

            if (selectedRole && role === selectedRole) {
                colors.push('#00e5b3');
            } else if (selectedRole) {
                colors.push('#6b7280');
            } else {
                colors.push(palette[index % palette.length]);
            }
        });

    const options = {
        backgroundColor:   'transparent',
        legend:            { position: 'right', textStyle: { color: '#8bacc8', fontSize: 11, fontName: 'DM Sans' } },
        pieHole:           0.45,
        pieSliceTextStyle: { color: '#e2ecf7', fontSize: 10, fontName: 'DM Sans' },
        chartArea:         { width: '62%', height: '84%' },
        tooltip:           { textStyle: { color: '#0d1f35', fontSize: 12 } },
        colors:            colors,
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
function drawCityDistribution(fullData, filters, filteredData) {
    const cityCounts = {};
    fullData.forEach(function(row) {
        const city = row.city.trim();
        cityCounts[city] = (cityCounts[city] || 0) + 1;
    });

    const selectedLocation = filters.location;
    const selectedCount = selectedLocation ? filteredData.filter(d => d.city.trim() === selectedLocation).length : 0;

    const top8 = Object.entries(cityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    const tableData = new google.visualization.DataTable();
    tableData.addColumn('string', 'City');
    tableData.addColumn('number', 'Job Postings');
    tableData.addColumn({ type: 'string', role: 'tooltip' });
    tableData.addColumn({ type: 'string', role: 'style' });

    top8.forEach(function([city, count], index) {
        const tooltipLabel = selectedLocation === city && selectedCount > 0
            ? `${city}: ${count} total jobs\nSelected subset: ${selectedCount} jobs`
            : `${city}: ${count} total jobs`;

        const color = selectedLocation === city
            ? 'color: #00e5b3'
            : `color: rgba(45, 198, 255, ${0.75 - index * 0.04})`;

        tableData.addRow([
            city,
            count,
            tooltipLabel,
            color
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
function drawRemoteVsOnsite(fullData, filters, filteredData) {
    const counts = { 'Remote': 0, 'Onsite': 0 };
    fullData.forEach(function(row) {
        const r = parseInt(row.remote);
        if (r === 1) counts['Remote']++;
        else counts['Onsite']++;
    });

    const selectedRemote = filters.remote;
    const selectedCount = selectedRemote
        ? filteredData.filter(d => d.remote.toString() === selectedRemote).length
        : 0;

    const tableData = new google.visualization.DataTable();
    tableData.addColumn('string', 'Work Mode');
    tableData.addColumn('number', 'Count');
    tableData.addColumn({ type: 'string', role: 'tooltip' });
    tableData.addRow([
        'Remote',
        counts['Remote'],
        selectedRemote === '1' && selectedCount > 0
            ? `Remote: ${counts['Remote']} total jobs\nSelected subset: ${selectedCount} jobs`
            : `Remote: ${counts['Remote']} total jobs`
    ]);
    tableData.addRow([
        'Onsite',
        counts['Onsite'],
        selectedRemote === '0' && selectedCount > 0
            ? `Onsite: ${counts['Onsite']} total jobs\nSelected subset: ${selectedCount} jobs`
            : `Onsite: ${counts['Onsite']} total jobs`
    ]);

    const colors = selectedRemote === '1'
        ? ['#00e5b3', '#6b7280']
        : selectedRemote === '0'
            ? ['#6b7280', '#ff6b35']
            : ['#00e5b3', '#ff6b35'];

    const options = {
        backgroundColor:   'transparent',
        legend:            { position: 'bottom', textStyle: { color: '#8bacc8', fontSize: 11, fontName: 'DM Sans' } },
        pieSliceTextStyle: { color: '#050d1a', fontSize: 12, bold: true, fontName: 'DM Sans' },
        chartArea:         { width: '88%', height: '70%' },
        colors:            colors,
        tooltip:           { textStyle: { color: '#0d1f35', fontSize: 12 } },
        fontName:          'DM Sans',
        animation:         { startup: true, duration: 900, easing: 'out' },
    };

    const chart = new google.visualization.PieChart(
        document.getElementById('remoteVsOnsite')
    );
    chart.draw(tableData, options);
}

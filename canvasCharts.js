/* ============================================================
   canvasCharts.js
   Purpose : Render 3 interactive charts using CanvasJS
   Charts  :
     1. Average Salary by Job Role     — Horizontal Bar
     2. Interview Count Distribution   — Column Chart
     3. Jobs by Company Type           — Doughnut Chart
   Data    : window.appData (parsed from CSV)
   ============================================================ */

/**
 * Main entry point. Called after CSV data is loaded.
 */
function drawCanvasCharts() {
    const data = window.filteredData;
    drawSalaryByRole(data);
    drawInterviewDistribution(data);
    drawCompanyTypeJobs(data);
    drawOfferRateTrend(data);
    drawSalaryCandleChart(data);
}

/* ---------------------------------------------------------- */
/* CHART 1 : Average Salary by Job Role — Horizontal Bar     */
/* ---------------------------------------------------------- */
function drawSalaryByRole(data) {
    // Group salaries by role and compute average
    const salaryGroups = {};
    data.forEach(function(row) {
        const role = row.role.trim();
        const sal  = parseFloat(row.salary_lpa);
        if (!isNaN(sal)) {
            if (!salaryGroups[role]) salaryGroups[role] = [];
            salaryGroups[role].push(sal);
        }
    });

    // Calculate averages and sort
    const avgSalaries = Object.entries(salaryGroups).map(function([role, salaries]) {
        const avg = salaries.reduce((a, b) => a + b, 0) / salaries.length;
        return { role, avg: Math.round(avg * 100) / 100 };
    }).sort((a, b) => b.avg - a.avg);

    // Build CanvasJS dataPoints array
    const dataPoints = avgSalaries.map(function(item) {
        return {
            label: item.role,
            y:     item.avg,
            // Color bars based on salary level
            color: item.avg >= 10 ? '#00e5b3' :
                   item.avg >= 7  ? '#00d4ff' :
                   item.avg >= 5  ? '#a78bfa' : '#ff6b35'
        };
    });

    const chart = new CanvasJS.Chart('salaryByRole', {
        animationEnabled: true,
        animationDuration: 1000,
        backgroundColor:  'transparent',
        theme:            'dark2',
        title: {
            text: '',   // Title handled by card header in HTML
        },
        axisX: {
            labelFontFamily: 'DM Sans',
            labelFontSize:   11,
            labelFontColor:  '#8bacc8',
            tickLength:      0,
            lineColor:       '#1a3a5c',
            gridColor:       '#1a3a5c',
        },
        axisY: {
            title:           'Avg Salary (LPA)',
            titleFontFamily: 'DM Sans',
            titleFontSize:   11,
            titleFontColor:  '#8bacc8',
            labelFontFamily: 'DM Sans',
            labelFontSize:   10,
            labelFontColor:  '#8bacc8',
            gridColor:       '#1a3a5c',
            lineColor:       '#1a3a5c',
            suffix:          ' L',
        },
        toolTip: {
            fontFamily:   'DM Sans',
            fontSize:     13,
            borderColor:  '#1a3a5c',
            backgroundColor: 'rgba(13,31,53,0.95)',
            fontColor:    '#e2ecf7',
            content:      '{label}: ₹{y} LPA (avg)',
        },
        data: [{
            type:              'bar',   // Horizontal bar chart
            indexLabel:        '₹{y}L',
            indexLabelFontFamily: 'DM Sans',
            indexLabelFontSize:   10,
            indexLabelFontColor:  '#e2ecf7',
            indexLabelPlacement:  'outside',
            dataPoints:        dataPoints
        }]
    });
    chart.render();
}
/* ---------------------------------------------------------- */
/* CHART 4 : Offer Rate Trend Line — CanvasJS                */
/* ---------------------------------------------------------- */
function drawOfferRateTrend(data) {
    // Offer rate for internship vs no internship
    const withIntern = data.filter(d => parseInt(d.internship_experience) === 1);
    const withoutIntern = data.filter(d => parseInt(d.internship_experience) === 0);

    const rateWith = withIntern.filter(d => parseInt(d.offer_made) === 1).length / withIntern.length * 100;
    const rateWithout = withoutIntern.filter(d => parseInt(d.offer_made) === 1).length / withoutIntern.length * 100;

    const dataPoints = [
        { label: 'With Internship', y: rateWith },
        { label: 'Without Internship', y: rateWithout }
    ];

    const chart = new CanvasJS.Chart('offerRateTrend', {
        animationEnabled: true,
        backgroundColor: 'transparent',
        theme: 'dark2',
        title: { text: '' },
        axisX: {
            labelFontFamily: 'DM Sans',
            labelFontSize: 11,
            labelFontColor: '#8bacc8',
            lineColor: '#1a3a5c',
            gridColor: 'transparent',
        },
        axisY: {
            title: 'Offer Rate (%)',
            titleFontFamily: 'DM Sans',
            titleFontSize: 11,
            titleFontColor: '#8bacc8',
            labelFontFamily: 'DM Sans',
            labelFontSize: 10,
            labelFontColor: '#8bacc8',
            gridColor: '#1a3a5c',
            lineColor: '#1a3a5c',
            suffix: '%',
        },
        toolTip: {
            fontFamily: 'DM Sans',
            fontSize: 13,
            borderColor: '#1a3a5c',
            backgroundColor: 'rgba(13,31,53,0.95)',
            fontColor: '#e2ecf7',
            content: '{label}: {y}%',
        },
        data: [{
            type: 'line',
            markerType: 'circle',
            markerSize: 8,
            lineThickness: 3,
            color: '#00e5b3',
            dataPoints: dataPoints
        }]
    });
    chart.render();
}

/* ---------------------------------------------------------- */
/* CHART 5 : Salary Range Candle Chart — CanvasJS            */
/* ---------------------------------------------------------- */
function drawSalaryCandleChart(data) {
    // For each role, get min, max, avg
    const roles = [...new Set(data.map(d => d.role.trim()))];
    const dataPoints = roles.map(role => {
        const salaries = data.filter(d => d.role.trim() === role).map(d => d.salary_lpa).filter(s => !isNaN(s));
        const min = Math.min(...salaries);
        const max = Math.max(...salaries);
        const avg = salaries.reduce((a,b) => a+b, 0) / salaries.length;
        return { label: role, y: [min, max, avg, avg] }; // For candle: open, high, low, close, but here min, max, avg, avg
    });

    const chart = new CanvasJS.Chart('salaryCandleChart', {
        animationEnabled: true,
        backgroundColor: 'transparent',
        theme: 'dark2',
        title: { text: '' },
        axisX: {
            labelFontFamily: 'DM Sans',
            labelFontSize: 10,
            labelFontColor: '#8bacc8',
            lineColor: '#1a3a5c',
            gridColor: 'transparent',
        },
        axisY: {
            title: 'Salary (LPA)',
            titleFontFamily: 'DM Sans',
            titleFontSize: 11,
            titleFontColor: '#8bacc8',
            labelFontFamily: 'DM Sans',
            labelFontSize: 10,
            labelFontColor: '#8bacc8',
            gridColor: '#1a3a5c',
            lineColor: '#1a3a5c',
        },
        toolTip: {
            fontFamily: 'DM Sans',
            fontSize: 13,
            borderColor: '#1a3a5c',
            backgroundColor: 'rgba(13,31,53,0.95)',
            fontColor: '#e2ecf7',
            content: '{label}<br>Min: {y[0]}<br>Max: {y[1]}<br>Avg: {y[2]}',
        },
        data: [{
            type: 'candlestick',
            risingColor: '#00e5b3',
            fallingColor: '#ff6b35',
            color: '#00d4ff',
            dataPoints: dataPoints
        }]
    });
    chart.render();
}
/* ---------------------------------------------------------- */
/* CHART 2 : Interview Count Distribution — Column Chart     */
/* ---------------------------------------------------------- */
function drawInterviewDistribution(data) {
    // Count how many candidates had 1, 2, 3, 4, 5 interview rounds
    const interviewCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    data.forEach(function(row) {
        const n = parseInt(row.interview_count);
        if (interviewCounts[n] !== undefined) interviewCounts[n]++;
    });

    // Also split by offer_made (Yes/No) for stacked view
    const offerYes = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const offerNo  = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    data.forEach(function(row) {
        const n = parseInt(row.interview_count);
        if ([1,2,3,4,5].includes(n)) {
            if (row.offer_made.trim() === 'Yes') offerYes[n]++;
            else offerNo[n]++;
        }
    });

    // Build stacked data: offered vs not offered
    const dpOffered = [1,2,3,4,5].map(function(n) {
        return { label: n + ' Round' + (n > 1 ? 's' : ''), y: offerYes[n] };
    });
    const dpRejected = [1,2,3,4,5].map(function(n) {
        return { label: n + ' Round' + (n > 1 ? 's' : ''), y: offerNo[n] };
    });

    const chart = new CanvasJS.Chart('interviewDistribution', {
        animationEnabled: true,
        animationDuration: 900,
        backgroundColor:  'transparent',
        theme:            'dark2',
        axisX: {
            labelFontFamily: 'DM Sans',
            labelFontSize:   11,
            labelFontColor:  '#8bacc8',
            lineColor:       '#1a3a5c',
            gridColor:       'transparent',
        },
        axisY: {
            title:           'Number of Candidates',
            titleFontFamily: 'DM Sans',
            titleFontSize:   11,
            titleFontColor:  '#8bacc8',
            labelFontFamily: 'DM Sans',
            labelFontSize:   10,
            labelFontColor:  '#8bacc8',
            gridColor:       '#1a3a5c',
            lineColor:       '#1a3a5c',
        },
        legend: {
            fontFamily:  'DM Sans',
            fontSize:    11,
            fontColor:   '#8bacc8',
            cursor:      'pointer',
            itemclick:   function(e) { e.dataSeries.visible = !(e.dataSeries.visible === false); e.chart.render(); }
        },
        toolTip: {
            shared:          true,
            fontFamily:      'DM Sans',
            fontSize:        12,
            borderColor:     '#1a3a5c',
            backgroundColor: 'rgba(13,31,53,0.95)',
            fontColor:       '#e2ecf7',
        },
        data: [
            {
                type:       'stackedColumn',
                name:       'Offer Made',
                showInLegend: true,
                color:      '#00e5b3',
                dataPoints: dpOffered
            },
            {
                type:       'stackedColumn',
                name:       'No Offer',
                showInLegend: true,
                color:      '#ff6b35',
                dataPoints: dpRejected
            }
        ]
    });
    chart.render();
}

/* ---------------------------------------------------------- */
/* CHART 3 : Jobs by Company Type — Doughnut Chart           */
/* ---------------------------------------------------------- */
function drawCompanyTypeJobs(data) {
    // Count jobs per company type
    const typeCounts = {};
    data.forEach(function(row) {
        const t = row.company_type.trim();
        typeCounts[t] = (typeCounts[t] || 0) + 1;
    });

    const colors = { 'MNC': '#00d4ff', 'Startup': '#ff6b35', 'Product': '#00e5b3', 'SME': '#a78bfa', 'PSU': '#fbbf24' };

    const dataPoints = Object.entries(typeCounts).map(function([type, count]) {
        return {
            label:       type,
            y:           count,
            color:       colors[type] || '#8bacc8',
            indexLabel:  type + '\n' + count,
        };
    });

    const chart = new CanvasJS.Chart('companyTypeJobs', {
        animationEnabled:  true,
        animationDuration: 1000,
        backgroundColor:   'transparent',
        theme:             'dark2',
        legend: {
            fontFamily: 'DM Sans',
            fontSize:   11,
            fontColor:  '#8bacc8',
            cursor:     'pointer',
        },
        toolTip: {
            fontFamily:      'DM Sans',
            fontSize:        12,
            borderColor:     '#1a3a5c',
            backgroundColor: 'rgba(13,31,53,0.95)',
            fontColor:       '#e2ecf7',
            content:         '{label}: {y} jobs ({percent}%)',
        },
        data: [{
            type:                'doughnut',
            innerRadius:         '50%',
            indexLabel:          '{label}: {y}',
            indexLabelFontFamily: 'DM Sans',
            indexLabelFontSize:   10,
            indexLabelFontColor:  '#8bacc8',
            startAngle:          -90,
            showInLegend:        true,
            legendText:          '{label}',
            dataPoints:          dataPoints
        }]
    });
    chart.render();
}

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
    const data = window.appData;
    drawSalaryByRole(data);
    drawInterviewDistribution(data);
    drawCompanyTypeJobs(data);
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

/* ============================================================
   d3charts.js
   Purpose : Render 2 custom visualizations using D3.js v7
   Charts  :
     1. Offer Rate by Job Role       — Horizontal Progress Bars
     2. Top Skills in Demand         — Horizontal Bar Chart
   Data    : window.appData (set during CSV loading in this file)
   ============================================================ */

/**
 * loadAndInit() : Loads the CSV using D3, stores globally,
 * then triggers all chart modules.
 * Called directly from index.html on page load.
 */
function loadAndInit() {
    // Show loading spinners
    ['roleDistribution','cityDistribution','remoteVsOnsite',
     'salaryByRole','interviewDistribution','companyTypeJobs',
     'offerRateChart','skillsDemandChart'].forEach(function(id) {
        const el = document.getElementById(id);
        if (el && !el.innerHTML.trim()) {
            el.innerHTML = `
              <div class="loading-spinner">
                <div class="spinner-ring"></div>
                <span>Loading chart...</span>
              </div>`;
        }
    });

    // Load CSV via D3's built-in CSV parser
    d3.csv('./dataset/Indian_Fresher_Salary_Skills_2025.csv').then(function(rawData) {

        // --- Type-cast numeric fields ---
        rawData.forEach(function(row) {
            row.salary_lpa      = +row.salary_lpa;
            row.interview_count = +row.interview_count;
        });

        // Store globally so Google Charts and CanvasJS modules can use it
        window.appData = rawData;

        // Update KPI stat cards
        updateKPICards(rawData);

        // Signal to index.html that data is ready (Google Charts waits for this)
        if (typeof window.onDataReady === 'function') {
            window.onDataReady();
        }

        // Draw D3 charts (they don't need the Google Charts API)
        drawD3Charts(rawData);

        // Draw CanvasJS charts (also independent of Google Charts)
        if (typeof drawCanvasCharts === 'function') drawCanvasCharts();

    }).catch(function(err) {
        console.error('CSV Load Error:', err);
        document.body.insertAdjacentHTML('afterbegin',
            '<div style="color:#f87171;padding:1rem;text-align:center">'+
            '⚠️ Error loading dataset. Make sure you\'re running a local server (VS Code Live Server).'+
            '</div>');
    });
}

/* ---------------------------------------------------------- */
/* KPI CARDS UPDATER                                         */
/* ---------------------------------------------------------- */
function updateKPICards(data) {
    const total    = data.length;
    const offered  = data.filter(d => parseInt(d.offer_made) === 1).length;
    const offerRate = Math.round((offered / total) * 100);
    const avgSalary = (data.reduce((s, d) => s + d.salary_lpa, 0) / total).toFixed(1);
    const uniqueRoles = new Set(data.map(d => d.role.trim())).size;

    // Animated counter helper
    function animateCount(el, target, suffix, prefix) {
        let start = 0;
        const duration = 1200;
        const step = 16;
        const increment = target / (duration / step);
        const timer = setInterval(function() {
            start = Math.min(start + increment, target);
            el.textContent = (prefix || '') + Math.round(start) + (suffix || '');
            if (start >= target) clearInterval(timer);
        }, step);
    }

    const s1 = document.getElementById('stat-total');
    const s2 = document.getElementById('stat-offer');
    const s3 = document.getElementById('stat-salary');
    const s4 = document.getElementById('stat-roles');

    if (s1) animateCount(s1, total, '+', '');
    if (s2) animateCount(s2, offerRate, '%', '');
    if (s3) { setTimeout(() => { s3.textContent = '₹' + avgSalary + 'L'; }, 600); }
    if (s4) animateCount(s4, uniqueRoles, '', '');
}

/* ---------------------------------------------------------- */
/* CHART 1 : Offer Rate by Job Role — D3 Horizontal Bars     */
/* ---------------------------------------------------------- */
function drawOfferRateChart(data) {
    // --- 1. Compute offer rate per role ---
    const roleStats = {};
    data.forEach(function(row) {
        const role = row.role.trim();
        if (!roleStats[role]) roleStats[role] = { total: 0, offered: 0 };
        roleStats[role].total++;
        if (parseInt(row.offer_made) === 1) roleStats[role].offered++;
    });

    const roles = Object.entries(roleStats).map(function([role, s]) {
        return { role, rate: Math.round((s.offered / s.total) * 100), total: s.total };
    }).sort((a, b) => b.rate - a.rate);

    // --- 2. Setup SVG dimensions ---
    const container = document.getElementById('offerRateChart');
    container.innerHTML = '';  // clear loader
    const margin = { top: 10, right: 70, bottom: 30, left: 150 };
    const width  = container.clientWidth  || 560;
    const height = Math.max(roles.length * 42 + margin.top + margin.bottom, 300);

    const svg = d3.select('#offerRateChart')
        .append('svg')
        .attr('width', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    // --- 3. Scales ---
    const x = d3.scaleLinear().domain([0, 100]).range([0, innerW]);
    const y = d3.scaleBand()
        .domain(roles.map(d => d.role))
        .range([0, innerH])
        .padding(0.35);

    // --- 4. Gridlines ---
    g.append('g')
        .attr('class', 'd3-gridlines')
        .selectAll('line')
        .data([0, 25, 50, 75, 100])
        .enter().append('line')
        .attr('x1', d => x(d)).attr('x2', d => x(d))
        .attr('y1', 0).attr('y2', innerH)
        .attr('stroke', '#1a3a5c')
        .attr('stroke-dasharray', '3,3')
        .attr('stroke-width', 1);

    // --- 5. Background track bars (grey) ---
    g.selectAll('.bar-track')
        .data(roles)
        .enter().append('rect')
        .attr('class', 'bar-track')
        .attr('x', 0)
        .attr('y', d => y(d.role))
        .attr('width', innerW)
        .attr('height', y.bandwidth())
        .attr('fill', 'rgba(26, 58, 92, 0.3)')
        .attr('rx', 4);

    // --- 6. Color scale based on offer rate ---
    function barColor(rate) {
        if (rate >= 75) return '#00e5b3';   // High — teal
        if (rate >= 60) return '#00d4ff';   // Good — cyan
        if (rate >= 50) return '#a78bfa';   // Mid  — purple
        return '#ff6b35';                   // Low  — orange
    }

    // --- 7. Animated data bars ---
    g.selectAll('.bar-data')
        .data(roles)
        .enter().append('rect')
        .attr('class', 'bar-data')
        .attr('x', 0)
        .attr('y', d => y(d.role))
        .attr('height', y.bandwidth())
        .attr('rx', 4)
        .attr('fill', d => barColor(d.rate))
        .attr('width', 0)   // Start at 0 for animation
        .transition()
        .duration(900)
        .delay((d, i) => i * 60)
        .attr('width', d => x(d.rate));

    // --- 8. Role labels (Y-axis) ---
    g.selectAll('.bar-label')
        .data(roles)
        .enter().append('text')
        .attr('class', 'bar-label')
        .attr('x', -8)
        .attr('y', d => y(d.role) + y.bandwidth() / 2 + 4)
        .attr('text-anchor', 'end')
        .attr('font-family', 'DM Sans')
        .attr('font-size', 11)
        .attr('fill', '#8bacc8')
        .text(d => d.role);

    // --- 9. Percentage labels at end of bars ---
    g.selectAll('.pct-label')
        .data(roles)
        .enter().append('text')
        .attr('class', 'pct-label')
        .attr('x', d => x(d.rate) + 6)
        .attr('y', d => y(d.role) + y.bandwidth() / 2 + 4)
        .attr('font-family', 'DM Sans')
        .attr('font-size', 11)
        .attr('font-weight', '700')
        .attr('fill', d => barColor(d.rate))
        .attr('opacity', 0)
        .text(d => d.rate + '%')
        .transition().delay((d, i) => i * 60 + 900).duration(300)
        .attr('opacity', 1);

    // --- 10. X Axis (0–100%) ---
    g.append('g')
        .attr('transform', `translate(0, ${innerH})`)
        .call(d3.axisBottom(x).tickValues([0,25,50,75,100]).tickFormat(d => d + '%'))
        .call(gx => {
            gx.select('.domain').attr('stroke', '#1a3a5c');
            gx.selectAll('.tick line').attr('stroke', '#1a3a5c');
            gx.selectAll('.tick text').attr('fill', '#8bacc8').attr('font-size', 10).attr('font-family', 'DM Sans');
        });

    // --- 11. Tooltip ---
    const tooltip = d3.select('body').append('div').attr('class', 'd3-tooltip').style('opacity', 0);

    g.selectAll('.bar-data')
        .on('mouseover', function(event, d) {
            tooltip.transition().duration(200).style('opacity', 1);
            tooltip.html(`<strong>${d.role}</strong><br>Offer Rate: <span style="color:#00e5b3">${d.rate}%</span><br>Total Postings: ${d.total}`)
                .style('left', (event.pageX + 12) + 'px')
                .style('top',  (event.pageY - 36) + 'px');
        })
        .on('mouseout', function() {
            tooltip.transition().duration(200).style('opacity', 0);
        });
}

/* ---------------------------------------------------------- */
/* CHART 2 : Top Skills in Demand — D3 Bubble-Bar Chart      */
/* ---------------------------------------------------------- */
function drawSkillsDemandChart(data) {
    // --- 1. Count primary skill frequencies ---
    const skillCounts = {};
    data.forEach(function(row) {
        const skill = row.primary_skill.trim();
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });

    // Take top 12 skills
    const skills = Object.entries(skillCounts)
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);

    // --- 2. SVG setup ---
    const container = document.getElementById('skillsDemandChart');
    container.innerHTML = '';  // clear loader
    const margin = { top: 10, right: 70, bottom: 30, left: 130 };
    const width  = container.clientWidth || 560;
    const height = Math.max(skills.length * 40 + margin.top + margin.bottom, 300);

    const svg = d3.select('#skillsDemandChart')
        .append('svg')
        .attr('width', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    // --- 3. Scales ---
    const x = d3.scaleLinear()
        .domain([0, d3.max(skills, d => d.count) * 1.15])
        .range([0, innerW]);

    const y = d3.scaleBand()
        .domain(skills.map(d => d.skill))
        .range([0, innerH])
        .padding(0.3);

    // Color scale — each skill gets a unique color from a palette
    const palette = ['#00d4ff','#00e5b3','#a78bfa','#ff6b35','#fbbf24',
                     '#f87171','#38bdf8','#34d399','#fb923c','#c084fc',
                     '#e879f9','#4ade80'];
    const colorMap = {};
    skills.forEach((d, i) => colorMap[d.skill] = palette[i % palette.length]);

    // --- 4. Gridlines ---
    g.append('g')
        .selectAll('line.grid')
        .data(x.ticks(5))
        .enter().append('line')
        .attr('x1', d => x(d)).attr('x2', d => x(d))
        .attr('y1', 0).attr('y2', innerH)
        .attr('stroke', '#1a3a5c').attr('stroke-dasharray', '3,3');

    // --- 5. Bars ---
    g.selectAll('.skill-bar')
        .data(skills)
        .enter().append('rect')
        .attr('class', 'skill-bar')
        .attr('x', 0)
        .attr('y', d => y(d.skill))
        .attr('height', y.bandwidth())
        .attr('rx', 4)
        .attr('fill', d => colorMap[d.skill])
        .attr('fill-opacity', 0.85)
        .attr('width', 0)
        .transition().duration(800).delay((d, i) => i * 55)
        .attr('width', d => x(d.count));

    // --- 6. Count labels ---
    g.selectAll('.count-label')
        .data(skills)
        .enter().append('text')
        .attr('x', d => x(d.count) + 6)
        .attr('y', d => y(d.skill) + y.bandwidth() / 2 + 4)
        .attr('font-family', 'DM Sans')
        .attr('font-size', 11)
        .attr('font-weight', '700')
        .attr('fill', d => colorMap[d.skill])
        .attr('opacity', 0)
        .text(d => d.count + ' jobs')
        .transition().delay((d, i) => i * 55 + 800).duration(200)
        .attr('opacity', 1);

    // --- 7. Skill name labels ---
    g.selectAll('.skill-label')
        .data(skills)
        .enter().append('text')
        .attr('x', -8)
        .attr('y', d => y(d.skill) + y.bandwidth() / 2 + 4)
        .attr('text-anchor', 'end')
        .attr('font-family', 'DM Sans')
        .attr('font-size', 11)
        .attr('fill', '#8bacc8')
        .text(d => d.skill);

    // --- 8. X Axis ---
    g.append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d => d + ' postings'))
        .call(gx => {
            gx.select('.domain').attr('stroke', '#1a3a5c');
            gx.selectAll('.tick line').attr('stroke', '#1a3a5c');
            gx.selectAll('.tick text').attr('fill', '#8bacc8').attr('font-size', 10).attr('font-family', 'DM Sans');
        });

    // --- 9. Tooltip ---
    const tooltip = d3.select('body').select('.d3-tooltip');
    const ttip = tooltip.empty()
        ? d3.select('body').append('div').attr('class', 'd3-tooltip').style('opacity', 0)
        : tooltip;

    g.selectAll('.skill-bar')
        .on('mouseover', function(event, d) {
            const pct = Math.round((d.count / data.length) * 100);
            ttip.transition().duration(200).style('opacity', 1);
            ttip.html(`<strong>${d.skill}</strong><br>Demand: <span style="color:#00d4ff">${d.count} postings</span><br>Market Share: ${pct}%`)
                .style('left', (event.pageX + 12) + 'px')
                .style('top',  (event.pageY - 36) + 'px');
        })
        .on('mouseout', function() {
            ttip.transition().duration(200).style('opacity', 0);
        });
}

/* ---------------------------------------------------------- */
/* drawD3Charts() — called after CSV loads                   */
/* ---------------------------------------------------------- */
function drawD3Charts(data) {
    drawOfferRateChart(data);
    drawSkillsDemandChart(data);
}

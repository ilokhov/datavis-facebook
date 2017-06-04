window.addEventListener("load", () => {

  const margin = {top: 150, right: 40, bottom: 20, left: 10};
  const width = 1180 - margin.left - margin.right;
  const height = 550 - margin.top - margin.bottom;

  const chartContainer = d3.select("#compare");
  const chart = chartContainer.append("svg")
                                .attr("width", width + margin.left + margin.right)
                                .attr("height", height  + margin.top + margin.bottom)
                              .append("g")
                                .attr("transform", `translate(${margin.left}, ${margin.top})`);



  // queue up and load data
  d3.queue()
    .defer(d3.csv, "data/compare_timeline.csv")
    .defer(d3.csv, "data/compare_messages.csv")
    .await(function(error, timeline, messages) {
      if (error) {
        throw error;
      }
      else {
        main(timeline, messages);
      }
    });



  function main(timeline, messages) {

    // prepare data
    timeline.forEach((d, i) => {
      for (let key in d) {
        if (key === "month") {
          // parse months
          d.month = parseDate(d.month);
        }
        else {
          // coerce data to numbers
          d[key] = +d[key];
        }
      }
    });

    messages.forEach((d, i) => {
      for (let key in d) {
        if (key === "month") {
          // parse months
          d.month = parseDate(d.month);
        }
        else {
          // coerce data to numbers
          d[key] = +d[key];
        }
      }
    });



    // scales and domains
    const x = d3.scaleTime()
                .range([0, width])
                .domain(d3.extent(timeline, d => d.month))
                .clamp(true);

    const yTimeline = d3.scaleLinear()
                        .range([height, 0])
                        .domain([0, d3.max(timeline, d => d.num)])
                        .nice();

    const yMessages = d3.scaleLinear()
                        .range([height, 0])
                        .domain([0, d3.max(messages, d => d.num)])
                        .nice();



    // define areas
    const areaTimeline = d3.area()
      .x(d => x(d.month))
      .y0(height)
      .y1(d => yTimeline(d.num))
      .curve(d3.curveMonotoneX);

    const areaMessages = d3.area()
      .x(d => x(d.month))
      .y0(height)
      .y1(d => yMessages(d.num))
      .curve(d3.curveMonotoneX);



    // axis
    const xAxis = d3.axisBottom(x);
    const yAxisTimeline = d3.axisRight(yTimeline)
                            .ticks(5);
    const yAxisMessages = d3.axisRight(yMessages)
                            .ticks(5);

    chart.append("g")
          .attr("class", "axis x-axis")
          .attr("transform", `translate(0,${height})`)
          .call(xAxis);

    const gYAxisTimeline = chart.append("g")
                                  .attr("class", "axis y-axis")
                                  .attr("transform", `translate(${width},0)`)
                                  .call(yAxisTimeline);

    const gYAxisMessages = chart.append("g")
                                  .attr("class", "axis y-axis active")
                                  .attr("transform", `translate(${width},0)`)
                                  .call(yAxisMessages);

    

    // append areas
    const pathAreaTimeline = chart.append("path")
                                    .datum(timeline)
                                    .attr("class", "area area-timeline")
                                    .attr("d", areaTimeline);

    const pathAreaMessages = chart.append("path")
                                    .datum(messages)
                                    .attr("class", "area area-messages active")
                                    .attr("d", areaMessages);



    // annotations
    const annotations = [
      {
        note: {
          title: "My move to Berlin",
          label: "September 2011",
          wrap: 120,
          padding: 10,
        },
        data: {
          month: "2011-09",
          num: "2697"
        },
        dy: -100,
        dx: -100,
        subject: {
          radius: 25,
        }
      },
      {
        type: d3.annotationCallout,
        note: {
          title: "Facebook launches Messenger app",
          label: "August 2011",
          wrap: 120,
          padding: 10,
        },
        data: {
          month: "2011-08",
          num: "538"
        },
        dy: -120,
        dx: -120,
      },
      {
        type: d3.annotationCallout,
        note: {
          title: "Facebook removes message function from Facebook app",
          label: "April 2014",
          wrap: 130,
          padding: 10,
        },
        data: {
          month: "2014-04",
          num: "629"
        },
        dy: -250,
        dx: -60,
        subject: {
          radius: 25,
        }
      }];

    const makeAnnotations = d3.annotation()
                              .type(d3.annotationCalloutCircle)
                              .accessors({
                                x: d => x(parseDate(d.month)),
                                y: d => yMessages(d.num)
                              })
                              .annotations(annotations);

    const annotation = chart.append("g")
                              .attr("class", "annotation-container")
                              .call(makeAnnotations);



    // create dark indicator in the background
    const indicatorBg = chart.insert("line", ":first-child")
                              .attr("class", "indicator-bg")
                              .attr("y1", -margin.top + 20)
                              .attr("y2", height);



    // create indicators and clip path definitions for both areas
    d3.selectAll(".area").each(function(d, i) {
      const thisIndex = String(i);
      const thisId = `compare-path-${thisIndex}`;
      const thisPathD = this.getAttribute("d");

      chart.insert("defs", ":first-child")
           .append("clipPath")
            .attr("id", thisId)
           .append("path")
            .attr("d", thisPathD);

      chart.append("line")
            .attr("class", () => `indicator indicator-${thisIndex}`)
            .attr("y1", "0")
            .attr("y2", height)
            .attr("clip-path", `url(#${thisId})`);
    });

    const indicator = d3.selectAll(".indicator");



    // chart info area
    const chartInfo = chartContainer.append("div")
                      .attr("class", "chart-info")
                      .html(`<div id="compare-chart-info-date" class="chart-info-date"></div>
                             <div id="compare-chart-info-inner"></div>`);

    const chartDate = document.getElementById("compare-chart-info-date");
    const chartInner = document.getElementById("compare-chart-info-inner");



    // set intial chart mode
    chartContainer.classed("mode-messages", true);




    // update
    chartContainer.selectAll(".button-update").on("click", function() {
      chartContainer.selectAll(".button-update").classed("button-update--active", false);
      d3.select(this).classed("button-update--active", true);

      // determine if we are updating to messages or timeline using the id
      update(this.id);
    });
    
    function update(type) {
      // messages
      if (type === "messages-update") {
        // update areas
        pathAreaMessages.moveToFront();
        pathAreaMessages.classed("active", true);
        pathAreaTimeline.classed("active", false);

        // update axis
        gYAxisMessages.classed("active", true);
        gYAxisTimeline.classed("active", false);
        
        // enable annotations
        annotation.moveToFront();
        annotation.classed("disabled", false);

        // update chart mode
        chartContainer.classed("mode-timeline", false);
        chartContainer.classed("mode-messages", true);
      }
      // timeline
      else {
        // update areas
        pathAreaTimeline.moveToFront();
        pathAreaTimeline.classed("active", true);
        pathAreaMessages.classed("active", false);

        // update axis
        gYAxisTimeline.classed("active", true);
        gYAxisMessages.classed("active", false);
        
        // disable annotations
        annotation.classed("disabled", true);

        // update chart mode
        chartContainer.classed("mode-timeline", true);
        chartContainer.classed("mode-messages", false);
      }

      // hide info area
      chartInfo.style("display", "none");

      // move indicator to front and hide it
      indicatorBg.style("display", "none");
      indicator.moveToFront();
      indicator.style("display", "none");
    }



    // chart hover interaction
    chartContainer.on("mousemove", function() {
      // hide annotations
      annotation.style("opacity", "0");

      // get current position
      const xPos = d3.mouse(this)[0];

      // check that position is within the chart
      if (xPos > margin.left && xPos < width + margin.left) {
        // position indicator lines
        const indicatorPos = `${String(xPos) - margin.left}`;
        indicatorBg.attr("x1", indicatorPos)
                   .attr("x2", indicatorPos)
                   .style("display", "block");
        indicator.attr("x1", indicatorPos)
                 .attr("x2", indicatorPos)
                 .style("display", "block");



        // get and format position date
        const posDate = x.invert(xPos - margin.left + 5); // add 5 to center the location of date position
        const posDateFormatted = formatDate(posDate);

        let chartInnerString;
        // check if the current mode is messages or timeline
        // messages
        if (chartContainer.node().classList.contains("mode-messages")) {
          // get number of messages at this date
          let numMessages;
          messages.forEach(function(d, i) {
            if (posDateFormatted === formatDate(d.month)) {
              numMessages = d.num;
            }
          });

          // set string
          chartInnerString = `Messages: <span class="bold">${numMessages}</span>`;
        }
        // timeline
        else {
          // get number of timeline posts at this date
          let numTimeline;
          timeline.forEach(function(d, i) {
            if (posDateFormatted === formatDate(d.month)) {
              numTimeline = d.num;
            }
          });

          // set string
          chartInnerString = `Timeline posts: <span class="bold">${numTimeline}</span>`;
        }

        // show chart info
        chartInfo.style("display", "block");

        // update chart info text
        chartDate.textContent = posDateFormatted;
        chartInner.innerHTML = chartInnerString;
      }
      // if position not within chart, hide indicator and chart info
      else {
        indicatorBg.style("display", "none");
        indicator.style("display", "none");
        chartInfo.style("display", "none");
      }
    })
    .on("mouseleave", () => {
      // show annotations
      annotation.style("opacity", "1");

      // hide indicator and chart info
      indicatorBg.style("display", "none");
      indicator.style("display", "none");
      chartInfo.style("display", "none");
    });
  }
});
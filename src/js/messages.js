window.addEventListener("load", () => {

  const margin = {top: 20, right: 40, bottom: 20, left: 10};
  const width = 1180 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const chartContainer = d3.select("#messages");
  const chart = chartContainer.append("svg")
                                .attr("width", width + margin.left + margin.right)
                                .attr("height", height  + margin.top + margin.bottom)
                              .append("g")
                                .attr("transform", `translate(${margin.left}, ${margin.top})`);

  

  // load data
  d3.csv("data/messages.csv", (error, data) => {
    if (error) {
      throw error;
    }

    // prepare data
    let stackKeys = [];

    data.forEach((d, i) => {
      let monthTotal = 0;

      for (let key in d) {
        if (key === "month") {
          // parse months
          d.month = parseDate(d.month);
        }
        else {
          // coerce data to numbers
          d[key] = +d[key];

          // calculate total messages for the month
          monthTotal = monthTotal + d[key];

          // collect keys needed for the stack
          if (i === 0) {
            stackKeys.push(key);
          }
        }
      }

      d.total = monthTotal;
    });



    // create object and array with a total of messages in each thread
    let stackSums = {};
    let stackSumsArr = [];
    stackKeys.forEach(key => {
      let thisSum = d3.sum(data, d => d[key]);
      stackSums[key] = thisSum;
      stackSumsArr.push(thisSum);
    });



    // define stack and layers
    const stack = d3.stack()
      .keys(stackKeys)
      .order(d3.stackOrderAscending)
      .offset(d3.stackOffsetNone);

    const layers = stack(data);



    // scales
    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);
    const stackColours = ["#65def1", "#32936f", "#1c4c5e", "#75ed85", "#0085ff"];
    const z = d3.scaleOrdinal(stackColours);



    // domains
    x.domain(d3.extent(data, d => d.month))
      .clamp(true);

    y.domain([0, d3.max(layers, layer =>
      d3.max(layer, d => d[1])
    )]);



    // define area
    const area = d3.area()
      .x(d => x(d.data.month))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveMonotoneX);



    // axis
    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisRight(y).ticks(5);

    chart.append("g")
          .attr("class", "axis x-axis")
          .attr("transform", `translate(0,${height})`)
          .call(xAxis);

    chart.append("g")
          .attr("class", "axis y-axis")
          .attr("transform", `translate(${width},0)`)
          .call(yAxis);



    // layers
    const layer = chart.selectAll(".layer")
                       .data(layers)
                       .enter().append("g")
                        .attr("class", "layer");

    const pathArea = layer.append("path")
                            .attr("class", "path-area")
                            .attr("fill", d => z(d.key))
                            .attr("d", area);



    // create dark indicator in the background
    const indicatorBg = chart.insert("line", ":first-child")
                              .attr("class", "indicator-bg")
                              .attr("y1", "0")
                              .attr("y2", height);



    // create indicators and clip path definitions in each layer
    layer.each(function(d, i) {
      const thisId = `messages-path-${String(i)}`;
      const thisPathD = this.getElementsByTagName("path")[0].getAttribute("d");

      d3.select(this).insert("defs", ":first-child")
                     .append("clipPath")
                      .attr("id", thisId)
                     .append("path")
                      .attr("d", thisPathD);

      d3.select(this).append("line")
                      .attr("class", "indicator")
                      .attr("y1", "0")
                      .attr("y2", height)
                      .attr("clip-path", `url(#${thisId})`);
    });

    const indicator = d3.selectAll(".indicator");



    // y-axis label
    chartContainer.append("div")
                    .attr("class", "y-axis-label")
                    .html("Number of messages");

    // chart info area
    const chartInfo = chartContainer.append("div")
                      .attr("class", "chart-info")
                      .html(`<div id="messages-chart-info-date" class="chart-info-date"></div>
                             <div>Messages total: <span id="messages-total" class="bold"></span></div>
                             <div id="messages-thread-container">
                               In this thread: <span id="messages-thread" class="bold"></span> <span id="messages-thread-colour">&#9679;</span>
                             </div>`);

    const chartDate = document.getElementById("messages-chart-info-date");
    const chartMsgTotal = document.getElementById("messages-total");
    const chartMsgThreadContainer = document.getElementById("messages-thread-container");
    const chartMsgThread = document.getElementById("messages-thread");
    const chartMsgThreadColour = document.getElementById("messages-thread-colour");



    // create blocker to hide strokes at the bottom of the chart
    chartContainer.append("div")
                    .attr("class", "blocker")
                    .style("width", `${width}px`)
                    .style("height", "1px")
                    .style("bottom", `${margin.bottom - 1}px`)
                    .style("left", `${margin.left}px`);



    // chart hover interaction
    chartContainer.on("mousemove", function() {
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

        // get total number of messages at this date
        let posTotalMsg;
        data.forEach((d, i) => {
          if (posDateFormatted === formatDate(d.month)) {
            posTotalMsg = d.total;
          }
        });

        // show chart info
        chartInfo.style("display", "block");

        // update chart info text
        chartDate.textContent = posDateFormatted;
        chartMsgTotal.textContent = posTotalMsg;
      }
      // if position not within chart, hide indicator and chart info
      else {
        indicatorBg.style("display", "none");
        indicator.style("display", "none");
        chartInfo.style("display", "none");
      }
    })
    .on("mouseleave", () => {
      // hide indicator and chart info
      indicatorBg.style("display", "none");
      indicator.style("display", "none");
      chartInfo.style("display", "none");
    });



    // layer hover interaction
    layer.on("mouseover", (d, i) => {
      // if layer index is matching then highlight its path area
      pathArea.style("opacity", (d, j) => {
        return j === i ? 1 : 0.35;
      });

      pathArea.style("stroke-width", (d, j) => {
        return j === i ? 1 : 0;
      });
    })
    .on("mousemove", function(d, i) {
      // get colour of current layer
      const layerColour = d3.select(this).select(".path-area").attr("fill");

      // get current position
      const xPos = d3.mouse(this)[0];

      // get and format position date
      const posDate = x.invert(xPos + 5); // add 5 to center the location of date position
      const posDateFormatted = formatDate(posDate);

      // get number of messages at this date for this layer
      let threadNumMsg;
      d.forEach(function(d, i) {
        if (posDateFormatted === formatDate(d.data.month)) {
          threadNumMsg = d[1] - d[0];
        }
      });

      // show messages thread container
      chartMsgThreadContainer.style.display = "block";

      // update chart info text
      chartMsgThread.textContent = threadNumMsg;
      chartMsgThreadColour.style.color = layerColour;
    })
    .on("mouseleave", () => {
      // restore all path areas' opacity and stroke to normal
      pathArea.style("opacity", null);
      pathArea.style("stroke-width", null);

      // hide messages thread container
      chartMsgThreadContainer.style.display = "none";
    });
  });
});
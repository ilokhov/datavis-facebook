window.addEventListener("load", () => {

  const baseWidth = 960;
  const margin = {top: 20, right: 40, bottom: 20, left: 10};
  const width = baseWidth - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const chartContainer = d3.select("#friends");
  document.getElementById("friends").style.width = `${baseWidth}px`; // container width = chart width
  const chart = chartContainer.append("svg")
                                .attr("width", width + margin.left + margin.right)
                                .attr("height", height  + margin.top + margin.bottom)
                              .append("g")
                                .attr("transform", `translate(${margin.left}, ${margin.top})`);

  

  // load data
  d3.csv("data/friends.csv", (error, data) => {
    if (error) {
      throw error;
    }

    // prepare data
    data.forEach((d, i) => {
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



    // scales
    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);



    // domains
    x.domain(d3.extent(data, d => d.month))
      .clamp(true);

    y.domain([0, d3.max(data, d => d.num)]).nice();



    // axis
    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisRight(y)
                    .ticks(5)
                    .tickSizeInner(-width)
                    .tickSizeOuter(0);

    chart.append("g")
          .attr("class", "axis x-axis")
          .attr("transform", `translate(0,${height})`)
          .call(xAxis);

    chart.append("g")
          .attr("class", "axis y-axis")
          .attr("transform", `translate(${width},0)`)
          .call(yAxis)
         .append("text")
          .attr("class", "y-axis-label")
          .attr("y", -10)
          .attr("x", 20)
          .text("Total number of friends");



    // define line
    const line = d3.line()
                    .x((d) => x(d.month))
                    .y((d) => y(d.num))
                    .curve(d3.curveCatmullRom);



    // append line
    chart.append("path")
          .datum(data)
          .attr("class", "line")
          .attr("d", line);

    // append outline to use for hovering
    const outline = chart.append("path")
                          .datum(data)
                          .attr("class", "outline")
                          .attr("d", line);



    // annotations
    const annotations = [
      {
        note: {
          title: "196 friends deleted",
          label: "July 2010",
          wrap: 120,
          padding: 10,
        },
        data: {
          month: "2010-07",
          num: "249"
        },
        dy: 69,
        dx: 69,
        subject: {
          radius: 25,
        }
      }];

    const makeAnnotations = d3.annotation()
                              .type(d3.annotationCalloutCircle)
                              .accessors({
                                x: d => x(parseDate(d.month)),
                                y: d => y(d.num)
                              })
                              .annotations(annotations);

    const annotation = chart.append("g")
                              .attr("class", "annotation-container")
                              .call(makeAnnotations);



    // tooltip
    const tooltip = chartContainer.append("div")
                                    .attr("class", "tooltip");



    // line hover interaction
    outline.on("mousemove", function(d) {
      // hide annotations
      annotation.style("opacity", "0");

      // get current position
      const xPos = d3.mouse(this)[0];
      const yPos = d3.mouse(this)[1];

      // get and format position date
      const posDate = x.invert(xPos);
      const posDateFormatted = formatDate(posDate);

      // get number of friends at this date
      let numFriends;
      d.forEach(function(d, i) {
        if (posDateFormatted === formatDate(d.month)) {
          numFriends = d.num;
        }
      });

      // show and populate tooltip
      tooltip.style("display", "block")
             .style("left", `${xPos + 20}px`)
             .style("top", `${yPos - 50}px`)
             .html(`${posDateFormatted}<br><span class="bold">${numFriends}</span> friends`);
    })
    .on("mouseleave", () => {
      // show annotations
      annotation.style("opacity", "1");

      // hide tooltip
      tooltip.style("display", "none");
    });
  });
});
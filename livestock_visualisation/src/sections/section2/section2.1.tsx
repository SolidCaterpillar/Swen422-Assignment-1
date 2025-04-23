import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { getRawData } from '../../database/database'

interface Section2Props {
  year: string
  location: string
}

// Data structure for our chart
interface ChartData {
  year: string;
  [animal: string]: string | number;
}

// Function to get data across all years for a specific location
const getMultiYearData = (location: string): ChartData[] => {
  const rawData = getRawData();
  const filteredByLocation = rawData.filter(item => item.geography_name === location);
  
  // Group by year
  const dataByYear = new Map<string, Map<string, number>>();
  
  filteredByLocation.forEach(item => {
    if (!dataByYear.has(item.year)) {
      dataByYear.set(item.year, new Map<string, number>());
    }
    const yearData = dataByYear.get(item.year)!;
    if (item.count !== null) {
      yearData.set(item.animal, item.count);
    }
  });
  
  // Convert to chart data format
  const chartData: ChartData[] = [];
  dataByYear.forEach((animalCounts, year) => {
    const yearData: ChartData = { year };
    animalCounts.forEach((count, animal) => {
      yearData[animal] = count;
    });
    chartData.push(yearData);
  });
  
  // Sort by year
  return chartData.sort((a, b) => a.year.localeCompare(b.year));
};

// Jackie Section 2
const Section2: React.FC<Section2Props> = ({ year, location }) => {
  const chartRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!location) return;
    
    const data = getMultiYearData(location);
    if (data.length === 0) return;
    
    // Get all animal types from the data
    const animals = new Set<string>();
    data.forEach(d => {
      Object.keys(d).forEach(key => {
        if (key !== 'year') animals.add(key);
      });
    });
    const animalArray = Array.from(animals);
    renderChart(data, animalArray, year);
  }, [location, year]);

  const renderChart = (data: ChartData[], animals: string[], selectedYear: string) => {
    if (!chartRef.current) return;

    // Clear previous chart
    d3.select(chartRef.current).selectAll("*").remove();
    // Remove existing tooltip and create new one using parentElement
    const container = chartRef.current.parentElement as HTMLElement;
    d3.select(container).selectAll(".tooltip").remove();
    const tooltip = d3.select(container)
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "#fff")
      .style("border", "1px solid #ccc")
      .style("padding", "5px")
      .style("pointer-events", "none")
      .style("visibility", "hidden");

    // Set up dimensions - Increased bottom margin further
    const margin = { top: 5, right: 110, bottom: 70, left: 70 };
    // Use offsetWidth/offsetHeight for potentially more accurate dimensions if available
    const svgElement = chartRef.current;
    const availableWidth = svgElement.clientWidth || 900; // Fallback width
    const availableHeight = svgElement.clientHeight || 500; // Fallback height
    const width = availableWidth - margin.left - margin.right;
    const height = availableHeight - margin.top - margin.bottom; // Height is reduced due to increased margin

    // Create SVG group
    const svg = d3.select(chartRef.current)
      .attr("viewBox", `0 0 ${availableWidth} ${availableHeight}`) // Ensure viewBox matches available dimensions
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Stack the data
    const stack = d3.stack<ChartData>()
      .keys(animals)
      .value((d, key) => Number(d[key]) || 0);

    const stackedData = stack(data);
    
    // Set up scales
    const x = d3.scalePoint<string>()
      .domain(data.map(d => d.year))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(stackedData[stackedData.length - 1], d => d[1]) || 0])
      .range([height, 0]);

    const color = d3.scaleOrdinal<string>()
      .domain(animals)
      .range(d3.schemeCategory10);

    // Create the area generator
    const area = d3.area<d3.SeriesPoint<ChartData>>()
      .x(d => x(d.data.year) as number)
      .y0(d => y(d[0]))
      .y1(d => y(d[1]));

    // Add areas with interactivity
    svg.selectAll(".area")
      .data(stackedData)
      .join("path")
      .attr("class", "area")
      .attr("fill", d => color(d.key))
      .attr("opacity", 0.7)
      .attr("d", area)
      .on("mouseover", function(_, d) {
        d3.select(this).attr("opacity", 1);
        tooltip.style("visibility", "visible").html(d.key);
      })
      .on("mousemove", function(event) {
        const [mouseX, mouseY] = d3.pointer(event);
        
        tooltip
          .style("left", (mouseX + margin.left + 10) + "px")
          .style("top", (mouseY + margin.top + 60) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("opacity", 0.7);
        tooltip.style("visibility", "hidden");
      });

    // Add X axis - Show ticks every 2 years for more granularity
    const years = data.map(d => d.year);
    const tickYears = years.filter((_, i) => i % 2 === 0); // Show every 2nd year

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .tickValues(tickYears)) // Use specific tick values (every 2 years)
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-0.8em")
      .attr("dy", "0.15em");

    // Add Y axis
    svg.append("g")
      .call(d3.axisLeft(y).tickFormat(d3.format(".2s"))); // Format ticks (e.g., 60M)

    // Add titles - Adjusted Y position for "Years" title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 25) // Adjusted y position further up to ensure visibility
      .style("text-anchor", "middle")
      .text("Years");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 15) // Adjusted y position closer to axis
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .text("Livestock Count");

    const legend = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "start")
      .selectAll("g")
      .data(animals)
      .join("g")
      .attr("transform", (_, i) => `translate(${width + 20}, ${i * 20})`);

    legend.append("rect")
      .attr("x", 0)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", color);

    legend.append("text")
      .attr("x", 24)
      .attr("y", 9.5)
      .attr("dy", "0.35em")
      .text(d => d);

    // Add vertical line for selected year
    const xPos = x(selectedYear as string);
    if (xPos !== undefined) {
      svg.append("line")
        .attr("class", "selected-year-line")
        .attr("x1", xPos)
        .attr("x2", xPos)
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4");
    }
  };

  return (
    <div className="w-full h-[90%]">
        <svg
          ref={chartRef}
          className="w-full h-full"
        />
    </div>
  )
}

export default Section2;
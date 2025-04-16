import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { getRawData, LivestockData } from '../../database/database';

interface Section2Props {
  year: string;
  location: string;
}

interface ScatterDataPoint {
  animal: string;
  year: string;
  count: number;
}

// Jackie Section 2
const Section2: React.FC<Section2Props> = ({ year, location }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<ScatterDataPoint[]>([]);

  // Fetch and prepare data
  useEffect(() => {
    if (!location) return;

    const rawData = getRawData();
    
    // Filter for the selected location and remove null values
    const filteredData = rawData
      .filter(item => item.geography_name === location && item.count !== null)
      .map(item => ({
        animal: item.animal,
        year: item.year,
        count: item.count as number
      }));
    
    setData(filteredData);
  }, [location]);

  // Create/update scatterplot
  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    // Get container dimensions
    const containerWidth = containerRef.current?.clientWidth || 800;
    const containerHeight = Math.min(500, window.innerHeight * 0.7); // Limit height

    const margin = { top: 40, right: 80, bottom: 70, left: 80 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    // Create SVG with viewBox for better scaling
    const svg = d3
      .select(svgRef.current)
      .attr("width", containerWidth)
      .attr("height", containerHeight)
      .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Get unique animals for color scale
    const animals = Array.from(new Set(data.map(d => d.animal)));
    
    // Create color scale
    const colorScale = d3.scaleOrdinal()
      .domain(animals)
      .range(d3.schemeCategory10);

    // Create X scale
    const xScale = d3.scalePoint()
      .domain(Array.from(new Set(data.map(d => d.year))).sort())
      .range([0, width])
      .padding(0.5);

    // Evaluate if we need a logarithmic scale
    const maxCount = d3.max(data, d => d.count) || 0;
    const minCount = d3.min(data, d => d.count) || 0;
    
    // Create Y scale (using log scale if data range is large)
    const yScale = (maxCount / minCount > 100 && minCount > 0) 
      ? d3.scaleLog()
          .domain([Math.max(1, minCount), maxCount])
          .range([height, 0])
          .nice()
      : d3.scaleLinear()
          .domain([0, maxCount * 1.05]) // Add 5% padding at the top
          .range([height, 0])
          .nice();

    // Add X axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    // Add Y axis
    svg.append("g")
      .call(d3.axisLeft(yScale));

    // Add dots
    svg.selectAll("dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.year) || 0)
      .attr("cy", d => yScale(d.count))
      .attr("r", 5)
      .style("fill", d => colorScale(d.animal) as string)
      .style("opacity", 0.7);

    // Add X axis label
    svg.append("text")
      .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 10})`)
      .style("text-anchor", "middle")
      .text("Year");

    // Add Y axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Livestock Count");

    // Add title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 0 - margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text(`Livestock Population in ${location} Across Years`);
      
    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 100}, 10)`);
      
    animals.forEach((animal, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);
        
      legendRow.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", colorScale(animal) as string);
        
      legendRow.append("text")
        .attr("x", 20)
        .attr("y", 10)
        .attr("text-anchor", "start")
        .style("font-size", "12px")
        .text(animal);
    });

  }, [data]);

  return (
    <div ref={containerRef} className="h-full w-full flex flex-col items-center justify-center">
      <svg ref={svgRef} className="max-w-full"></svg>
      <p className="text-gray-500 mt-4">
        Scatterplot showing livestock counts for {location} across years
        {year !== 'all' && ` (Current year: ${year})`}
      </p>
    </div>
  );
};

export default Section2;
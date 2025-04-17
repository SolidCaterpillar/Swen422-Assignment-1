import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { filterData, getRawData, LivestockData } from '../../database/database'

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
  const [animalTypes, setAnimalTypes] = useState<string[]>([]);

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
    setAnimalTypes(Array.from(animals));
    
    renderChart(data, Array.from(animals));
  }, [location]);

  const renderChart = (data: ChartData[], animals: string[]) => {
    if (!chartRef.current) return;
    
    // Clear previous chart
    d3.select(chartRef.current).selectAll("*").remove();
    
    // Set up dimensions
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const svgElement = chartRef.current;
    const width = svgElement.clientWidth - margin.left - margin.right;
    const height = svgElement.clientHeight - margin.top - margin.bottom;
    
    // Create SVG group
    const svg = d3.select(chartRef.current)
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
    
    // Color scale
    const color = d3.scaleOrdinal<string>()
      .domain(animals)
      .range(d3.schemeCategory10);
    
    // Create the area generator
    const area = d3.area<d3.SeriesPoint<ChartData>>()
      .x(d => x(d.data.year) as number)
      .y0(d => y(d[0]))
      .y1(d => y(d[1]));
    
    // Add areas
    svg.selectAll(".area")
      .data(stackedData)
      .join("path")
      .attr("class", "area")
      .attr("fill", (d, i) => color(d.key))
      .attr("opacity", 0.7)
      .attr("d", area);
    
    // Add X axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");
    
    // Add Y axis
    svg.append("g")
      .call(d3.axisLeft(y));
    
    // Add titles
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 10)
      .style("text-anchor", "middle")
      .text("Years");
    
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 20)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .text("Livestock Count");
    
    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 100}, 0)`);
    
    animals.forEach((animal, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);
        
      legendRow.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", color(animal));
        
      legendRow.append("text")
        .attr("x", 20)
        .attr("y", 12.5)
        .attr("text-anchor", "start")
        .text(animal);
    });
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      <div className="w-full h-[90%]">
        <svg 
          ref={chartRef} 
          className="w-full h-full"
          viewBox={`0 0 900 500`}
          preserveAspectRatio="xMidYMid meet"
        />
      </div>
    </div>
  )
}

export default Section2
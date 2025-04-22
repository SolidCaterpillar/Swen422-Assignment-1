import React, { useEffect, useState, useRef, useMemo } from 'react'
import { getCurrentData, FilteredData, getRawData, filterData } from '../../database/database'
import * as d3 from 'd3'

interface TimelineData {
  year: string
  animal: string
  count: number | null
}

interface Section4Props {
  year: string
  location: string
}

const Section4: React.FC<Section4Props> = ({ year, location }) => {
  const [data, setData] = useState<FilteredData | null>(null)
  const [timelineData, setTimelineData] = useState<TimelineData[]>([])
  const chartRef = useRef<SVGSVGElement | null>(null)

  // Get the 5-year range with selected year in the middle
  const year2Before = String(parseInt(year) - 2)
  const year1Before = String(parseInt(year) - 1)
  const year1After = String(parseInt(year) + 1)
  const year2After = String(parseInt(year) + 2)
  const yearRange = useMemo(() => {
    const year2Before = String(parseInt(year) - 2);
    const year1Before = String(parseInt(year) - 1);
    const year1After = String(parseInt(year) + 1);
    const year2After = String(parseInt(year) + 2);
    return [year2Before, year1Before, year, year1After, year2After];
  }, [year]);

    // Load data for all years in the range
  useEffect(() => {
    // Function to load data for a specific year
    const fetchDataForYear = (targetYear: string): TimelineData[] => {
      // Filter raw data for the specified year and location
      const filteredData = getRawData().filter(
        item => item.year === targetYear && item.geography_name === location
      );
      
      // Convert to TimelineData format
      return filteredData.map(item => ({
        year: item.year,
        animal: item.animal,
        count: item.count
      }));
    };

    // Get data for the current year using the existing function
    const currentFiltered = filterData(year, location);
    setData(currentFiltered);
    
    // Get data for all years in our range
    const allYearsData: TimelineData[] = [];
    
    // Add data for each year in the range
    yearRange.forEach(yr => {
      const yearData = fetchDataForYear(yr);
      if (yearData.length > 0) {
        allYearsData.push(...yearData);
      }
    });
    
    // Update the state with all years' data
    setTimelineData(allYearsData);
  }, [year, location, yearRange]);

  // Render the line chart using D3
  useEffect(() => {
    // If there's no data or no chart container, do nothing
    if (timelineData.length === 0 || !chartRef.current) return

    // Clear any previous chart
    d3.select(chartRef.current).selectAll('*').remove()

    // Get unique animals for creating multiple lines
    const animals = Array.from(new Set(timelineData.map(d => d.animal)))

    // Setup dimensions and margins
    const margin = { top: 15, right: 150, bottom: 60, left: 80 }
    const width = chartRef.current.clientWidth - margin.left - margin.right
    const height = chartRef.current.clientHeight - margin.top - margin.bottom

    // Create the SVG container
    const svg = d3.select(chartRef.current)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    // X scale for years
    const x = d3.scalePoint()
      .domain(yearRange)
      .range([0, width])
      .padding(0.5)

    // Find the maximum count for y scale (considering all counts)
    const maxCount = d3.max(timelineData.filter(d => d.count !== null), d => d.count as number) || 0

    // Y scale for counts
    const y = d3.scaleLinear()
      .domain([0, maxCount * 1.1]) // Add 10% padding at the top
      .nice()
      .range([height, 0])

    // Color scale for different animals
    const color = d3.scaleOrdinal<string>()
      .domain(animals)
      .range(d3.schemeCategory10)

    // Line style variations (solid, dashed, dotted, etc.)
    const lineStyles = [
      "0", // solid
      "5,5", // dashed
      "2,2", // dotted
      "10,3,3,3", // dash-dot
      "15,5,2,5", // long dash-short dash
      "5,2,5" // dash-gap-dash
    ];

    // Line generator
    const line = d3.line<TimelineData>()
      .x(d => x(d.year) || 0)
      .y(d => y(d.count as number))
      .defined(d => d.count !== null) // Skip null values
      .curve(d3.curveMonotoneX) // Smooth curve

    // Add the x-axis
    svg.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('font-size', '12px')
      .style('font-weight', d => d === year ? 'bold' : 'normal')

    // Add the y-axis
    svg.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => d3.format(','+(maxCount > 1000 ? '.2s' : ''))(+d)))
      .style('font-size', '12px')
      
    // Add grid lines
    // Horizontal grid lines (based on y-axis ticks)
    svg.append('g')
      .attr('class', 'grid-lines')
      .selectAll('line.horizontal-grid')
      .data(y.ticks(5))
      .join('line')
      .attr('class', 'horizontal-grid')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .attr('stroke', '#e0e0e0')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      
    // Vertical grid lines (based on x-axis ticks)
    svg.append('g')
      .attr('class', 'grid-lines')
      .selectAll('line.vertical-grid')
      .data(yearRange)
      .join('line')
      .attr('class', 'vertical-grid')
      .attr('x1', d => x(d) || 0)
      .attr('x2', d => x(d) || 0)
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#e0e0e0')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')

    // Add y-axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 30)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Count')

    // Add x-axis label
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Year')

    // Removed title section

    // Highlight the selected year with a vertical line
    svg.append('line')
      .attr('x1', x(year) || 0)
      .attr('x2', x(year) || 0)
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#333')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.9)

    // Add a total line if we have enough animals
    if (animals.length > 1) {
      // Create total data points by summing all animals for each year
      const totalByYear = yearRange.map(yr => {
        const yearData = timelineData.filter(d => d.year === yr && d.count !== null);
        const total = yearData.reduce((sum, d) => sum + (d.count as number), 0);
        return {
          year: yr,
          animal: 'Total',
          count: total
        };
      });

      // Draw the total line (thicker)
      svg.append('path')
        .datum(totalByYear)
        .attr('fill', 'none')
        .attr('stroke', '#333')
        .attr('stroke-width', 3)
        .attr('d', line)

      // Add circle markers for total
      svg.selectAll('.total-point')
        .data(totalByYear)
        .join('circle')
        .attr('class', 'total-point')
        .attr('cx', d => x(d.year) || 0)
        .attr('cy', d => y(d.count as number))
        .attr('r', 5)
        .attr('fill', 'white')
        .attr('stroke', '#333')
        .attr('stroke-width', 2)
        .on('mouseover', function (event, d) {
          // Highlight point
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 8)

          // Show tooltip
          svg.append('text')
            .attr('class', 'tooltip')
            .attr('x', x(d.year) || 0)
            .attr('y', y(d.count as number) - 15)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .text(`Total: ${d.count !== null ? d3.format(',')(d.count) : 'N/A'}`)
        })
        .on('mouseout', function () {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 5)

          svg.selectAll('.tooltip').remove()
        })
    }

    // Create individual lines for each animal
    animals.forEach((animal, i) => {
      const animalData = timelineData
        .filter(d => d.animal === animal && d.count !== null)
        .sort((a, b) => yearRange.indexOf(a.year) - yearRange.indexOf(b.year));

      // Only draw lines if we have enough data points
      if (animalData.length > 1) {
        // Add the line path
        svg.append('path')
          .datum(animalData)
          .attr('fill', 'none')
          .attr('stroke', color(animal))
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', lineStyles[i % lineStyles.length])
          .attr('d', line as any)

        // Add data points
        svg.selectAll(`.point-${animal.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '_')}`)
          .data(animalData)
          .join('circle')
          .attr('class', `point-${animal.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '_')}`)
          .attr('cx', d => x(d.year) || 0)
          .attr('cy', d => y(d.count as number))
          .attr('r', 4)
          .attr('fill', color(animal))
          .attr('stroke', 'white')
          .attr('stroke-width', 1)
          .on('mouseover', function (event, d) {
            // Highlight point
            d3.select(this)
              .transition()
              .duration(200)
              .attr('r', 7)

            // Show tooltip
            svg.append('text')
              .attr('class', 'tooltip')
              .attr('x', x(d.year) || 0)
              .attr('y', y(d.count as number) - 15)
              .attr('text-anchor', 'middle')
              .style('font-size', '12px')
              .style('font-weight', 'bold')
              .text(`${d.animal}: ${d.count !== null ? d3.format(',')(d.count) : 'N/A'}`)
          })
          .on('mouseout', function () {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('r', 4)

            svg.selectAll('.tooltip').remove()
          })
      }
    })

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width + 20}, 0)`)

    // Add Total to legend first if we have multiple animals
    if (animals.length > 1) {
      const totalLegendRow = legend.append('g')
        .attr('transform', 'translate(0, 0)')

      totalLegendRow.append('line')
        .attr('x1', 0)
        .attr('y1', 7.5)
        .attr('x2', 30)
        .attr('y2', 7.5)
        .attr('stroke', '#333')
        .attr('stroke-width', 3)

      totalLegendRow.append('circle')
        .attr('cx', 15)
        .attr('cy', 7.5)
        .attr('r', 4)
        .attr('fill', 'white')
        .attr('stroke', '#333')
        .attr('stroke-width', 2)

      totalLegendRow.append('text')
        .attr('x', 35)
        .attr('y', 10)
        .attr('text-anchor', 'start')
        .style('font-size', '12px')
        .style('alignment-baseline', 'middle')
        .style('font-weight', 'bold')
        .text('Total')
    }

    // Add animal entries to legend
    animals.forEach((animal, i) => {
      const yOffset = animals.length > 1 ? 25 : 0; // Add space if we have a Total
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${yOffset + i * 25})`)

      // Line style sample
      legendRow.append('line')
        .attr('x1', 0)
        .attr('y1', 7.5)
        .attr('x2', 30)
        .attr('y2', 7.5)
        .attr('stroke', color(animal))
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', lineStyles[i % lineStyles.length])

      // Point sample
      legendRow.append('circle')
        .attr('cx', 15)
        .attr('cy', 7.5)
        .attr('r', 4)
        .attr('fill', color(animal))
        .attr('stroke', 'white')
        .attr('stroke-width', 1)

      // Label
      legendRow.append('text')
        .attr('x', 35)
        .attr('y', 10)
        .attr('text-anchor', 'start')
        .style('font-size', '12px')
        .style('alignment-baseline', 'middle')
        .text(animal)
    })

  }, [timelineData, chartRef, year, location, yearRange, year2Before, year2After]);

  // Render fallback if no data
  if (!data) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-gray-500">
          Loading data...
        </p>
      </div>
    )
  }

  // Calculate totals for the chart but no longer needed for table
  yearRange.forEach(yr => {
    const yearData = timelineData.filter(d => d.year === yr && d.count !== null);
    // We still calculate totals as they're used for the total line
  });

  // Main render with chart only (no data table)
  return (
    <div className="h-full w-full">
      <svg ref={chartRef} width="100%" height="92%"></svg>
    </div>
  )
}

export default Section4
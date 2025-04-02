import React, { useEffect, useState, useRef } from 'react'
import { getCurrentData, FilteredData } from '../../database/database'
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
  const yearRange = [year2Before, year1Before, year, year1After, year2After]

  // Load real data for all years in the range
  useEffect(() => {
    // This is where you would call your database function to get real data for each year
    // For demonstration purposes, I'm assuming you have a function like:
    // getDataForYearAndLocation(year: string, location: string): Promise<FilteredData>
    
    // Import this function from your database module
    const getDataForYearAndLocation = async (yearStr: string, locationStr: string) => {
      // Replace this with actual API call to your database
      // For now, let's use getCurrentData() as a mock and pretend it's for the specified year
      return getCurrentData();
    };

    const fetchDataForAllYears = async () => {
      try {
        // Get current year data first to display something immediately
        const currentYearData = await getDataForYearAndLocation(year, location);
        setData(currentYearData);
        
        // Fetch data for all years
        const allYearsData: TimelineData[] = [];
        
        // Process each year in parallel
        const dataPromises = yearRange.map(async (yr) => {
          try {
            const yearData = await getDataForYearAndLocation(yr, location);
            
            // Convert to TimelineData format
            if (yearData && yearData.data) {
              return Object.entries(yearData.data).map(([animal, count]) => ({
                year: yr,
                animal,
                count
              }));
            }
            return [];
          } catch (error) {
            console.error(`Error fetching data for year ${yr}:`, error);
            return [];
          }
        });
        
        // Wait for all data to be fetched
        const yearsDataArrays = await Promise.all(dataPromises);
        
        // Combine all data
        yearsDataArrays.forEach(yearDataArray => {
          allYearsData.push(...yearDataArray);
        });
        
        setTimelineData(allYearsData);
      } catch (error) {
        console.error("Error fetching timeline data:", error);
      }
    };

    fetchDataForAllYears();
  }, [year, location, yearRange]);

  // Render the line chart using D3
  useEffect(() => {
    // If there's no data or no chart container, do nothing
    if (timelineData.length === 0 || !chartRef.current) return

    // Clear any previous chart
    d3.select(chartRef.current).selectAll('*').remove()

    // Get unique animals for creating multiple lines
    const animals = Array.from(new Set(timelineData.map(d => d.animal)))

    // Get valid data points (no null counts)
    const validTimelineData = timelineData.filter(d => d.count !== null)

    // Setup dimensions and margins
    const margin = { top: 50, right: 150, bottom: 60, left: 80 }
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

    // Find the maximum count for y scale
    const maxCount = d3.max(validTimelineData, d => d.count as number) || 0

    // Y scale for counts
    const y = d3.scaleLinear()
      .domain([0, maxCount * 1.1]) // Add 10% padding at the top
      .nice()
      .range([height, 0])

    // Color scale for different animals
    const color = d3.scaleOrdinal<string>()
      .domain(animals)
      .range(d3.schemeCategory10)

    // Line generator
    const line = d3.line<TimelineData>()
      .x(d => x(d.year) || 0)
      .y(d => y(d.count as number))
      .defined(d => d.count !== null)  // Skip null values
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

    // Add chart title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text(`Livestock Trends in ${location} (${year2Before}-${year2After})`)

    // Highlight the selected year with a vertical line
    svg.append('line')
      .attr('x1', x(year) || 0)
      .attr('x2', x(year) || 0)
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#888')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.7)

    // Create a group for each animal and draw its line
    animals.forEach(animal => {
      const animalData = timelineData
        .filter(d => d.animal === animal && d.count !== null)
        .sort((a, b) => yearRange.indexOf(a.year) - yearRange.indexOf(b.year))

      // Only draw lines if we have enough data points
      if (animalData.length > 1) {
        // Add the line path
        svg.append('path')
          .datum(animalData)
          .attr('fill', 'none')
          .attr('stroke', color(animal))
          .attr('stroke-width', 3)
          .attr('d', line as any) // Type assertion needed due to null handling
      }

      // Add data points for non-null values
      svg.selectAll(`.point-${animal.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '_')}`)
        .data(animalData)
        .join('circle')
        .attr('class', `point-${animal.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '_')}`)
        .attr('cx', d => x(d.year) || 0)
        .attr('cy', d => y(d.count as number))
        .attr('r', 5)
        .attr('fill', color(animal))
        .attr('stroke', 'white')
        .attr('stroke-width', 1.5)
        .on('mouseover', function (event, d) {
          // Highlight point on hover
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
            .text(`${d.animal}: ${d3.format(',')(d.count as number)}`)
        })
        .on('mouseout', function () {
          // Remove highlight and tooltip
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 5)

          svg.selectAll('.tooltip').remove()
        })
    })

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width + 20}, 0)`)

    animals.forEach((animal, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`)

      legendRow.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', color(animal))

      legendRow.append('text')
        .attr('x', 20)
        .attr('y', 10)
        .attr('text-anchor', 'start')
        .style('font-size', '12px')
        .style('alignment-baseline', 'middle')
        .text(animal)
    })

  }, [timelineData, chartRef, year, location, yearRange, year2Before, year2After])

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

  // Main render with chart and data table
  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-grow">
        <svg ref={chartRef} width="100%" height="100%"></svg>
      </div>
      <div className="p-2 overflow-auto max-h-[100px]">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="border px-2 py-1">Animal</th>
              {yearRange.map(yr => (
                <th key={yr} className={`border px-2 py-1 ${yr === year ? 'font-bold' : ''}`}>
                  {yr}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from(new Set(timelineData.map(d => d.animal))).map(animal => (
              <tr key={animal}>
                <td className="border px-2 py-1">{animal}</td>
                {yearRange.map(yr => {
                  const animalYearData = timelineData.find(d => d.animal === animal && d.year === yr)
                  return (
                    <td key={yr} className={`border px-2 py-1 text-right ${yr === year ? 'font-bold' : ''}`}>
                      {animalYearData && animalYearData.count !== null ? animalYearData.count.toLocaleString() : 'N/A'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Section4
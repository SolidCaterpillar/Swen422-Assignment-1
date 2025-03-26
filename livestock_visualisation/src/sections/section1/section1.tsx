import React, { useEffect, useState, useRef } from 'react'
import { getCurrentData, FilteredData } from '../../database/database'
import * as d3 from 'd3'

interface Section1Props {
  year: string
  location: string
}

// Patrick Section 1
const Section1: React.FC<Section1Props> = ({ year, location }) => {
  const [data, setData] = useState<FilteredData | null>(null)
  const chartRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    // Get the current filtered data
    const currentData = getCurrentData()
    setData(currentData)
  }, [year, location])

  // D3 chart rendering effect
  useEffect(() => {
    if (!data || !chartRef.current) return

    // Clear previous chart
    d3.select(chartRef.current).selectAll('*').remove()

    // Convert data to array format for D3
    const chartData = Object.entries(data.data)
      .filter(([_, count]) => count !== null)
      .map(([animal, count]) => ({ animal, count: count as number }))
      .sort((a, b) => b.count - a.count) // Sort by count descending
      .slice(0, 5) // Take top 5 for better visibility

    // Set up chart dimensions
    const margin = { top: 20, right: 20, bottom: 60, left: 60 }
    const width = chartRef.current.clientWidth - margin.left - margin.right
    const height = chartRef.current.clientHeight - margin.top - margin.bottom

    // Create SVG container
    const svg = d3.select(chartRef.current)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Set up scales
    const xScale = d3.scaleBand()
      .domain(chartData.map(d => d.animal))
      .range([0, width])
      .padding(0.2)

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.count) || 0])
      .nice()
      .range([height, 0])

    // Add X axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '12px')

    // Add Y axis
    svg.append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => d3.format('.2s')(d as number)))
      .style('font-size', '12px')

    // Add Y axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 15)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .text('Count')
      .style('font-size', '12px')

    // Add bars
    svg.selectAll('.bar')
      .data(chartData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.animal) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', d => yScale(d.count))
      .attr('height', d => height - yScale(d.count))
      .attr('fill', '#4f46e5')
      .attr('rx', 4) // Rounded corners
      .on('mouseover', function(event, d) {
        d3.select(this).attr('fill', '#818cf8')
        
        // Add tooltip
        svg.append('text')
          .attr('class', 'tooltip')
          .attr('x', (xScale(d.animal) || 0) + xScale.bandwidth() / 2)
          .attr('y', yScale(d.count) - 5)
          .attr('text-anchor', 'middle')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text(d3.format(',')(d.count))
      })
      .on('mouseout', function() {
        d3.select(this).attr('fill', '#4f46e5')
        svg.selectAll('.tooltip').remove()
      })

    // Add chart title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text(`Top Livestock in ${location} (${year})`)

  }, [data, chartRef])

  if (!data) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-gray-500">No data available for {year}, {location}</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Chart container */}
      <div className="flex-grow">
        <svg ref={chartRef} width="100%" height="100%"></svg>
      </div>
      
      {/* Data table (optional - you can remove if you prefer just the chart) */}
      <div className="p-2 overflow-auto max-h-[100px]">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="border px-2 py-1">Animal</th>
              <th className="border px-2 py-1">Count</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.data).map(([animal, count]) => (
              <tr key={animal}>
                <td className="border px-2 py-1">{animal}</td>
                <td className="border px-2 py-1 text-right">{count === null ? 'N/A' : count.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Section1
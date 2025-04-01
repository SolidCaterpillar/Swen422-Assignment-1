import React, { useEffect, useState, useRef } from 'react'
import { getCurrentData, FilteredData } from '../../database/database'
import * as d3 from 'd3'

interface DonutData {
  animal: string
  count: number
}

interface Section3Props {
  year: string
  location: string
}

const Section3: React.FC<Section3Props> = ({ year, location }) => {
  const [data, setData] = useState<FilteredData | null>(null)
  const chartRef = useRef<SVGSVGElement | null>(null)

  // Load the current filtered data whenever year or location changes
  useEffect(() => {
    const currentData = getCurrentData()
    setData(currentData)
  }, [year, location])

  // Render the donut chart using D3
  useEffect(() => {
    // If there's no data or no chart container, do nothing
    if (!data || !chartRef.current) return

    // Clear any previous chart
    d3.select(chartRef.current).selectAll('*').remove()

    // Convert the data object into an array for D3
    const chartData: DonutData[] = Object.entries(data.data)
      .filter(([_, count]) => count !== null) // filter out null counts
      .map(([animal, count]) => ({
        animal,
        // Safely cast null to 0 if needed
        count: typeof count === 'number' ? count : 0
      }))

    // Log to check if you’re actually getting data
    console.log('Section3 chartData:', chartData)

    // If chartData is empty, there's nothing to show
    if (chartData.length === 0) return

    // Dimensions based on the container size
    const width = chartRef.current.clientWidth
    const height = chartRef.current.clientHeight
    const radius = Math.min(width, height) / 2

    // Append a group element to center the chart
    const svg = d3.select(chartRef.current)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`)

    // Color scale for different animals
    const color = d3.scaleOrdinal<string>()
      .domain(chartData.map(d => d.animal))
      .range(d3.schemeCategory10)

    // Pie layout generator
    const pie = d3.pie<DonutData>()
      .value(d => d.count)
      .sort(null)

    // Arc generators
    const arc = d3.arc<d3.PieArcDatum<DonutData>>()
      .innerRadius(radius * 0.5) // size of the donut hole
      .outerRadius(radius * 0.8)

    const outerArc = d3.arc<d3.PieArcDatum<DonutData>>()
      .innerRadius(radius * 0.9)
      .outerRadius(radius * 0.9)

    const arcs = pie(chartData)

    // 3. Draw donut slices
    svg.selectAll<SVGPathElement, d3.PieArcDatum<DonutData>>('path')
      .data(arcs)
      .join('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.animal) || '#ccc')
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .on('mouseover', function (event, d) {
        // Slightly expand the slice on hover
        d3.select<SVGPathElement, d3.PieArcDatum<DonutData>>(this)
          .transition()
          .duration(200)
          .attr('d', d3.arc<d3.PieArcDatum<DonutData>>()
            .innerRadius(radius * 0.5)
            .outerRadius(radius * 0.85)
          )

        // Show tooltip text in the center
        svg.append('text')
          .attr('class', 'tooltip')
          .attr('text-anchor', 'middle')
          .attr('dy', '-0.5em')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text(`${d.data.animal}: ${d3.format(',')(d.data.count)}`)
      })
      .on('mouseout', function () {
        // Revert slice size and remove tooltip
        d3.select<SVGPathElement, d3.PieArcDatum<DonutData>>(this)
          .transition()
          .duration(200)
          .attr('d', arc)

        svg.selectAll('.tooltip').remove()
      })

    // 4. Add labels outside slices
    svg.selectAll('allLabels')
      .data(arcs)
      .join('text')
      .text(d => d.data.animal)
      .attr('transform', d => {
        const pos = outerArc.centroid(d)
        const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2
        pos[0] = radius * 0.95 * (midAngle < Math.PI ? 1 : -1)
        return `translate(${pos})`
      })
      .style('text-anchor', d => {
        const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2
        return midAngle < Math.PI ? 'start' : 'end'
      })
      .style('font-size', '12px')

    // 5. Chart title
    svg.append('text')
      .attr('x', 0)
      .attr('y', -radius - 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text(`Livestock Distribution in ${location} (${year})`)

  }, [data, chartRef, year, location])

  // 6. Render fallback if no data
  if (!data) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-gray-500">
          No data available for {year}, {location}
        </p>
      </div>
    )
  }

  // 7. Main render with chart and optional data table
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
              <th className="border px-2 py-1">Count</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.data).map(([animal, count]) => (
              <tr key={animal}>
                <td className="border px-2 py-1">{animal}</td>
                <td className="border px-2 py-1 text-right">
                  {count === null ? 'N/A' : count.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Section3

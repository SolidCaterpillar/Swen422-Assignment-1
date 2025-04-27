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
  // Toggle between main chart and cattle breakdown view
  const [showCattleBreakdown, setShowCattleBreakdown] = useState(false)

  // Initialise the selected animals with the main chart options by default
  const availableAnimalsMain = ['Sheep', 'Total cattle', 'Deer']
  const availableAnimalsDetail = ['Beef cattle', 'Dairy cattle']
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>(availableAnimalsMain)

  // Store filtered data from database
  const [filteredData, setFilteredData] = useState<FilteredData | null>(null)

  // State for the hovered slice (to display at the bottom)
  const [hoveredSlice, setHoveredSlice] = useState<{ animal: string; count: number } | null>(null)

  const chartRef = useRef<SVGSVGElement | null>(null)

  // When year or location changes, load data
  useEffect(() => {
    const currentData = getCurrentData()
    setFilteredData(currentData)
    console.log('[Section3] Loaded data for', { year, location, currentData })
  }, [year, location])

  // When switching views, update the selected animal list
  useEffect(() => {
    if (showCattleBreakdown) {
      setSelectedAnimals(availableAnimalsDetail)
    } else {
      setSelectedAnimals(availableAnimalsMain)
    }
  }, [showCattleBreakdown])

  // Render the donut chart
  useEffect(() => {
    try {
      if (!filteredData || !chartRef.current) {
        console.log('[Section3] No data or chartRef available; skipping rendering.')
        return
      }

      // Clear any previous content from the svg
      d3.select(chartRef.current).selectAll('*').remove()

      // Extract numeric values; default to 0 if missing
      const sheep = filteredData.data['Sheep'] ?? 0
      const deer = filteredData.data['Deer'] ?? 0
      const beef = filteredData.data['Beef cattle'] ?? 0
      const dairy = filteredData.data['Dairy cattle'] ?? 0
      const totalCattle = beef + dairy

      // Build the two data sets
      const mainChartData: DonutData[] = [
        { animal: 'Sheep', count: Number(sheep) },
        { animal: 'Total cattle', count: Number(totalCattle) },
        { animal: 'Deer', count: Number(deer) },
      ]
      const detailChartData: DonutData[] = [
        { animal: 'Beef cattle', count: Number(beef) },
        { animal: 'Dairy cattle', count: Number(dairy) },
      ]

      // Choose which dataset to use based on the view
      const rawData = showCattleBreakdown ? detailChartData : mainChartData
      const chartData = rawData.filter(d => selectedAnimals.includes(d.animal))

      // If no data remains after filtering, show fallback text
      if (chartData.length === 0) {
        console.log('[Section3] Chart data is empty after filtering.')
        const svg = d3.select(chartRef.current)
        const w = chartRef.current.clientWidth
        const h = chartRef.current.clientHeight
        svg.append('text')
          .attr('x', w / 2)
          .attr('y', h / 2)
          .attr('text-anchor', 'middle')
          .style('font-size', '14px')
          .style('font-weight', 'bold')
          .text('No data to display.')
        return
      }

      console.log('[Section3] ChartData:', chartData)

      // Dimensions and radius
      const size = 400            // drawing coordinate system is 0→400 in both directions
      const radius = size / 2

      // tell D3 to treat the SVG as a 400×400 viewport
      const svg = d3.select(chartRef.current)
          .attr('viewBox', `0 0 ${size} ${size}`)
          .append('g')
          .attr('transform', `translate(${radius},${radius})`)

      // Add a drop-shadow filter
      const defs = svg.append('defs')
      const filter = defs.append('filter')
        .attr('id', 'drop-shadow')
        .attr('height', '130%')
      filter.append('feGaussianBlur')
        .attr('in', 'SourceAlpha')
        .attr('stdDeviation', 2)
        .attr('result', 'blur')
      filter.append('feOffset')
        .attr('in', 'blur')
        .attr('dx', 2)
        .attr('dy', 2)
        .attr('result', 'offsetBlur')
      const feMerge = filter.append('feMerge')
      feMerge.append('feMergeNode').attr('in', 'offsetBlur')
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

      // Use fixed colors 
      const mainColorList      = ['#575757', '#8B0000', '#964B00']
      const breakdownColorList = ['#8B0000', '#FFFDD0']
      const colorList = showCattleBreakdown ? breakdownColorList : mainColorList

      const colorScale = d3.scaleOrdinal<string>()
        .domain(chartData.map(d => d.animal))
        .range(colorList)

      // Create a pie layout
      const pie = d3.pie<DonutData>()
        .value(d => d.count)
        .sort(null)
      const arcs = pie(chartData)

      // Arc generators
      const arcGen = d3.arc<d3.PieArcDatum<DonutData>>()
        .innerRadius(radius * 0.5)
        .outerRadius(radius * 0.8)
      const arcHoverGen = d3.arc<d3.PieArcDatum<DonutData>>()
        .innerRadius(radius * 0.5)
        .outerRadius(radius * 0.85)

      // Animation tween for arc transition
      const arcTween = (d: d3.PieArcDatum<DonutData>) => {
        const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d)
        return (t: number) => arcGen(i(t)) as string
      }

      // Draw slices with transition
      svg.selectAll('path.slice')
        .data(arcs)
        .enter()
        .append('path')
        .attr('class', 'slice')
        .attr('fill', d => colorScale(d.data.animal) || '#ccc')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('d', arcGen)
        .transition()
        .duration(500)
        .attrTween('d', d => arcTween(d))

      // Add hover interactions
      svg.selectAll('path.slice')
        .on('mouseover', (event, d) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(50)
            .ease(d3.easeBounce)
            .attr('d', arcHoverGen)
            .style('filter', 'url(#drop-shadow)')
          const total = d3.sum(chartData, cd => cd.count)
          const pct = ((d.data.count / total) * 100).toFixed(1)
          setHoveredSlice({ animal: d.data.animal, count: d.data.count })
        })
        .on('mouseout', (event) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(50)
            .attr('d', arcGen)
            .style('filter', 'none')
          setHoveredSlice(null)
        })

      // Add fixed title "Donut Chart"
      svg.append('text')
        .attr('x', 0)
        .attr('y', -radius - 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Donut Chart')
    } catch (err) {
      console.error('[Section3] Error during rendering:', err)
    }
  }, [filteredData, showCattleBreakdown, selectedAnimals, year, location])

  // If no filtered data, show fallback message
  if (!filteredData) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-gray-500">No data available for {year}, {location}</p>
      </div>
    )
  }

  // Prepare legend data
  const sheep = filteredData.data['Sheep'] ?? 0
  const deer = filteredData.data['Deer'] ?? 0
  const beef = filteredData.data['Beef cattle'] ?? 0
  const dairy = filteredData.data['Dairy cattle'] ?? 0
  const totalCattle = beef + dairy

  const mainTableData = [
    { animal: 'Sheep', count: Number(sheep) },
    { animal: 'Total cattle', count: Number(totalCattle) },
    { animal: 'Deer', count: Number(deer) },
  ]
  const detailTableData = [
    { animal: 'Beef cattle', count: Number(beef) },
    { animal: 'Dairy cattle', count: Number(dairy) },
  ]
  const rawRows = showCattleBreakdown ? detailTableData : mainTableData
  const tableRows = rawRows.filter(d => selectedAnimals.includes(d.animal))
  const legendData = tableRows.map(item => item.animal)
  const legendColorList = showCattleBreakdown
  ? ['#8B0000', '#FFFDD0']
  : ['#575757', '#8B0000', '#964B00']

  const legendColorScale = d3.scaleOrdinal<string>()
  .domain(legendData)
  .range(legendColorList)

  // Define available animals for checkboxes
  const availableAnimals = showCattleBreakdown ? availableAnimalsDetail : availableAnimalsMain
  const handleCheckboxChange = (animal: string) => {
    setSelectedAnimals(prev => {
      if (prev.includes(animal)) {
        const updated = prev.filter(a => a !== animal)
        return updated.length > 0 ? updated : prev
      } else {
        return [...prev, animal]
      }
    })
  }

  return (
    <div className="w-full flex flex-col p-2 relative">
      {/* Toggle Button */}
      <div className="mb-2">
        {!showCattleBreakdown ? (
          <button
            onClick={() => setShowCattleBreakdown(true)}
            className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded"
          >
            View Cattle Breakdown
          </button>
        ) : (
          <button
            onClick={() => setShowCattleBreakdown(false)}
            className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded"
          >
            Back to Main Chart
          </button>
        )}
      </div>

      {/* Vertical Checklist below the button */}
      <div className="mb-2">
        <p className="font-bold mb-1">Select animals to display:</p>
        <div className="flex flex-col space-y-1">
          {availableAnimals.map(animal => (
            <label key={animal} className="text-sm">
              <input
                type="checkbox"
                checked={selectedAnimals.includes(animal)}
                onChange={() => handleCheckboxChange(animal)}
                className="mr-1"
              />
              {animal}
            </label>
          ))}
        </div>
      </div>

      {/* Legend in top-right */}
      <div className="absolute top-0 right-0 m-2 bg-white p-2 rounded shadow text-sm">
          <p className="font-bold mb-1">Legend:</p>
          {legendData.map(animal => (
            <div key={animal} className="flex items-center mb-1">
              <div
                className="w-3 h-3 mr-2"
                style={{ backgroundColor: legendColorScale(animal) }}
              ></div>
              <span>{animal}</span>
            </div>
          ))}
        </div>

      {/* Donut Chart Container */}
      <div className="w-full aspect-square p-2 relative">
          <svg
              ref={chartRef}
              className="w-full h-full"
              viewBox="0 0 400 400"
              preserveAspectRatio="xMidYMid meet"
          />

        {/* Center overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {hoveredSlice ? (
              <div className="text-center font-bold text-lg">
                {hoveredSlice.animal} – {hoveredSlice.count.toLocaleString()}
              </div>
            ) : null}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2 text-center">
        <p className="text-gray-500">
          Hover over a slice to see details
        </p>
      </div>
  </div>
  )
}

export default Section3

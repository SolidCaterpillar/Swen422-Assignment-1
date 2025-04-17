import React from 'react'
import DotMatrixChart from './dot_matrix/DotMatrix.tsx'
import { filterData } from '../../database/database'

interface Section2Props {
  year: string
  location: string
}

const dummyDataset = [
  { category: 'A', group: 'Group1', count: 10 },
  { category: 'B', group: 'Group1', count: 5 },

]


const dotMatrixOptions = {
    dot_radius: 6,
    no_of_circles_in_a_row: 25,
    dot_padding_left: 8,
    dot_padding_right: 8,
    dot_padding_top: 18,
    dot_padding_bottom: 8,
}

// Jackie Section 2
const Section2: React.FC<Section2Props> = ({ year, location }) => {
  const filteredData = filterData(year, location)

  if (!filteredData) {
    return <div>No data available for the selected year and location.</div>
  }

  // Convert the filtered data into the dataset structure expected by DotMatrixChart.
  // Here, we treat each animal as a category, use the location as the group,
  // and default null counts to 0.
  const dataset = Object.entries(filteredData.data).map(([animal, count]) => ({
    category: animal,
    group: filteredData.location,
    count: Math.ceil((count ?? 0) / 150000),
  }))

  return (
    <div className="h-full w-full flex items-center justify-center">
      <DotMatrixChart dataset={dataset} options={dotMatrixOptions} />
    </div>
  )
}

export default Section2
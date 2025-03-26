import React, { useEffect, useState } from 'react'
import { getCurrentData, FilteredData } from '../../database/database'

interface Section1Props {
  year: string
  location: string
}

// Patrick Section 1
const Section1: React.FC<Section1Props> = ({ year, location }) => {
  const [data, setData] = useState<FilteredData | null>(null)

  useEffect(() => {
    // Get the current filtered data
    const currentData = getCurrentData()
    setData(currentData)
  }, [year, location])

  if (!data) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-gray-500">No data available for {year}, {location}</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">Livestock Data for {location}, {year}</h3>
        <div className="overflow-auto max-h-[200px]">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="border px-4 py-2">Animal</th>
                <th className="border px-4 py-2">Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.data).map(([animal, count]) => (
                <tr key={animal}>
                  <td className="border px-4 py-2">{animal}</td>
                  <td className="border px-4 py-2">{count === null ? 'N/A' : count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Section1
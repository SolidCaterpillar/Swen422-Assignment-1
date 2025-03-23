import React from 'react'

interface Section1Props {
  year: string
  location: string
}

const Section1: React.FC<Section1Props> = ({ year, location }) => {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <p className="text-gray-500">Main Visualization ({year}, {location})</p>
    </div>
  )
}

export default Section1
import React from 'react'

interface Section3Props {
  year: string
  location: string
}

// Aryan Section 3
const Section3: React.FC<Section3Props> = ({ year, location }) => {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <p className="text-gray-500">Detail View 1 ({year}, {location})</p>
    </div>
  )
}

export default Section3
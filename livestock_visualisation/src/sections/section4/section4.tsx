import React from 'react'

interface Section4Props {
  year: string
  location: string
}

const Section4: React.FC<Section4Props> = ({ year, location }) => {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <p className="text-gray-500">Detail View 2 ({year}, {location})</p>
    </div>
  )
}

export default Section4
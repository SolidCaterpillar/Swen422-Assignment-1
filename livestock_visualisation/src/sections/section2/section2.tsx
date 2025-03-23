import React from 'react'

interface Section2Props {
  year: string
  location: string
}

const Section2: React.FC<Section2Props> = ({ year, location }) => {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <p className="text-gray-500">Secondary Visualization ({year}, {location})</p>
    </div>
  )
}

export default Section2
import { useState, useEffect } from 'react'
import './App.css'
import Section1 from './sections/section1/section1'
import Section2 from './sections/section2/section2.1'
import Section3 from './sections/section3/section3'
import Section4 from './sections/section4/section4'
import { loadData, updateData } from './database/dataloader'
import { getAvailableYears, getAvailableLocations } from './database/database'

function App() {
  const [year, setYear] = useState('2019')
  const [location, setLocation] = useState('New Zealand')
  const [dataLoaded, setDataLoaded] = useState(false)
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [availableLocations, setAvailableLocations] = useState<string[]>([])

  // Load data on component mount
  useEffect(() => {
    const initData = async () => {
      const success = await loadData();
      if (success) {
        setDataLoaded(true);
        setAvailableYears(getAvailableYears());
        setAvailableLocations(getAvailableLocations());
        updateData(year, location);
      }
    };

    initData();
  }, []);

  // Update filtered data when year or location changes
  useEffect(() => {
    if (dataLoaded) {
      updateData(year, location);
    }
  }, [year, location, dataLoaded]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Design 1 - Walkthrough</h1>
      
      {/* Main container - converts to column on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-auto md:h-[calc(100vh-100px)]">
        {/* Left panel - Year selector and Section 1 */}
        <div className="md:col-span-5 flex flex-col gap-4">
          {/* Year selector */}
          <div className="bg-white rounded-lg shadow p-2 h-12">
            <select 
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full h-full px-2 bg-gray-100 rounded"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          
          {/* Section 1 - Main visualization */}
          <div className="bg-white rounded-lg shadow h-[300px] md:flex-grow">
            <Section1 year={year} location={location} setLocation={setLocation} />
          </div>
          
          {/* Location selector */}
          <div className="bg-white rounded-lg shadow p-2 h-12">
            <select 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full h-full px-2 bg-gray-100 rounded"
            >
              {availableLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Right panel - Sections 2, 3, and 4 */}
        <div className="md:col-span-7 flex flex-col gap-4">
          {/* Section 2 - Top visualization */}
          <div className="bg-white rounded-lg shadow h-[300px] md:h-1/2">
            <div className="p-2 bg-gray-100 text-center">Livestock Trends in {location}</div>
            <Section2 year={year} location={location} />
          </div>
          
          {/* Bottom row with Sections 3 and 4 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-auto md:h-1/2">
            {/* Section 3 */}
            <div className="bg-white rounded-lg shadow h-[250px] md:h-auto">
              <div className="p-2 bg-gray-100 text-center">Distribution of Livestock at {location} in {year} </div>
              <Section3 year={year} location={location} />
            </div>
            
            {/* Section 4 */}
            <div className="bg-white rounded-lg shadow h-[250px] md:h-auto">
              <div className="p-2 bg-gray-100 text-center">5 Years Trends in {location} </div>
              <Section4 year={year} location={location} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

import { useState, useEffect } from 'react'
import './App.css'
import Section1 from './sections/section1/section1'
import Section2_1 from './sections/section2/section2.1'
import Section2_2 from './sections/section2/section2.2'
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
  const [activeSection, setActiveSection] = useState('section2_1')

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
    <div className="min-h-screen p-4 overflow-auto">
      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-center bg-white/50 backdrop-blur-md rounded-lg p-3 shadow">New Zealand Livestock Data Visualization</h1>
      
      {/* Main container - converts to column on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-auto md:h-[calc(100vh-100px)] overflow-auto">
        {/* Left panel - Year selector and Section 1 */}
        <div className="md:col-span-5 flex flex-col gap-4 max-h-[calc(100vh-120px)]">
          {/* Year selector */}
          <div className="bg-white/50 backdrop-blur-md rounded-lg shadow p-2 h-12">
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
            <div className="bg-white/50 backdrop-blur-md rounded-lg shadow h-[300px] md:flex-grow overflow-hidden">
            <Section1 year={year} location={location} setLocation={setLocation} />
            </div>
          
          {/* Location selector */}
          <div className="bg-white/50 backdrop-blur-md rounded-lg shadow p-2 h-12">
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
        <div className="md:col-span-7 flex flex-col gap-4 max-h-[calc(100vh-120px)] overflow-auto">
          {/* Section 2 - Top visualization */}
            <div className="bg-white/50 backdrop-blur-md rounded-lg shadow h-[300px] md:h-1/2">
            <div className="p-2 bg-white/50 backdrop-blur-md rounded-lg shadow text-center">
              <div className="flex justify-between items-center font-semibold">
              <span className="text-base sm:text-lg md:text-xl lg:text-2xl">All-time Trends</span>
              <div>
                <button 
                className={`btn mr-2 ${activeSection === 'section2_1' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => setActiveSection('section2_1')}
                >
                Area Graph
                </button>
                <button 
                className={`btn ${activeSection === 'section2_2' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => setActiveSection('section2_2')}
                >
                Scatter Plot
                </button>
              </div>
              </div>
            </div>
            {activeSection === 'section2_1' ? (
              <Section2_1 year={year} location={location} />
            ) : (
              <Section2_2 year={year} location={location} />
            )}
            </div>
          
          {/* Bottom row with Sections 3 and 4 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-auto md:h-1/2">
            {/* Section 3 */}
            <div className="bg-white/50 backdrop-blur-md rounded-lg shadow h-[250px] md:h-auto">
              <div className="p-2 bg-white/50 backdrop-blur-md rounded-lg shadow text-center font-semibold text-base sm:text-lg md:text-xl lg:text-2xl">Distribution of Livestock at {location}</div>
              <Section3 year={year} location={location} />
            </div>
            
            {/* Section 4 */}
            <div className="bg-white/50 backdrop-blur-md rounded-lg shadow h-[250px] md:h-auto">
              <div className="p-2 bg-white/50 backdrop-blur-md rounded-lg shadow text-center font-semibold text-base sm:text-lg md:text-xl lg:text-2xl">5 Years Trends in {location}</div>
              <Section4 year={year} location={location} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

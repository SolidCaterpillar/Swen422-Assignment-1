import { LivestockData, setRawData, filterData } from './database';

// Function to load and parse the CSV data
export const loadData = async (): Promise<boolean> => {
  try {
    const response = await fetch('/src/assets/Data/livestock-numbers-clean-1990-2019.csv');
    const csvText = await response.text();
    
    // Parse CSV
    const rows = csvText.split('\n');
    const headers = rows[0].split(',');
    
    const data: LivestockData[] = [];
    
    // Start from index 1 to skip headers
    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].trim()) continue; // Skip empty rows
      
      const values = rows[i].split(',');
      const rowData: LivestockData = {
        geography_type: values[0],
        geography_name: values[1],
        year: values[2],
        animal: values[3],
        count: values[4] === 'NA' ? null : parseInt(values[4], 10)
      };
      
      data.push(rowData);
    }
    
    // Store the parsed data
    setRawData(data);
    return true;
  } catch (error) {
    console.error('Error loading data:', error);
    return false;
  }
};

// Function to update data based on selected year and location
export const updateData = (year: string, location: string) => {
  return filterData(year, location);
};
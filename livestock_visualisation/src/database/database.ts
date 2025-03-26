// Define the structure of our livestock data
export interface LivestockData {
  geography_type: string;
  geography_name: string;
  year: string;
  animal: string;
  count: number | null; // Using null for NA values
}

// Define the structure of our filtered data
export interface FilteredData {
  year: string;
  location: string;
  data: {
    [animal: string]: number | null;
  };
}

// Store for the raw data loaded from CSV
let rawData: LivestockData[] = [];

// Store for the currently filtered data
let currentData: FilteredData | null = null;

// Function to set the raw data
export const setRawData = (data: LivestockData[]) => {
  rawData = data;
};

// Function to get all raw data
export const getRawData = (): LivestockData[] => {
  return rawData;
};

// Function to filter and set current data based on year and location
export const filterData = (year: string, location: string): FilteredData | null => {
  // Filter the raw data based on year and location
  const filtered = rawData.filter(
    (item) => item.year === year && item.geography_name === location
  );

  if (filtered.length === 0) {
    currentData = null;
    return null;
  }

  // Group by animal type
  const animalData: { [animal: string]: number | null } = {};
  
  filtered.forEach((item) => {
    animalData[item.animal] = item.count;
  });

  currentData = {
    year,
    location,
    data: animalData,
  };

  return currentData;
};

// Function to get the current filtered data
export const getCurrentData = (): FilteredData | null => {
  return currentData;
};

// Function to get all available years in the dataset
export const getAvailableYears = (): string[] => {
  const years = new Set<string>();
  rawData.forEach((item) => years.add(item.year));
  return Array.from(years).sort();
};

// Function to get all available locations in the dataset
export const getAvailableLocations = (): string[] => {
  const locations = new Set<string>();
  rawData.forEach((item) => locations.add(item.geography_name));
  return Array.from(locations).sort();
};

// Function to get all animal types in the dataset
export const getAnimalTypes = (): string[] => {
  const animals = new Set<string>();
  rawData.forEach((item) => animals.add(item.animal));
  return Array.from(animals).sort();
};
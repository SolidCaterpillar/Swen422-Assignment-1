import pandas as pd

# 1) Read the input
df = pd.read_csv('livestock-numbers-clean-1971-2019.csv')

# 2) Coerce the 'count' column to numeric, turning 'NA' (and similar) into NaN
df['count'] = pd.to_numeric(df['count'], errors='coerce')

# 3) Linearly interpolate missing values in 'count'
#    limit_direction='both' ensures that leading/trailing NaNs are also filled
df['count'] = df['count'].interpolate(method='linear', limit_direction='both').astype(int)

# 4) Keep only the years between 1990 and 2019 (inclusive)
#    (make sure 'year' is numeric)
df['year'] = pd.to_numeric(df['year'], errors='coerce')
df = df[(df['year'] >= 1990) & (df['year'] <= 2019)]

# 5) Write out the completed dataset
df.to_csv('livestock-numbers-completed.csv', index=False)
print("Completed dataset (1990–2019) written to 'livestock-numbers-completed.csv'")

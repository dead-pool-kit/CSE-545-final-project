import numpy as np
import pandas as pd
import pyflux as pf
from datetime import datetime
import matplotlib.pyplot as plt

# Data Preprocessing
countries = ["United States", "India", "China", "Australia", "Brazil", "Portugal"]
n = len(countries)
for i in range(n):
  df = pd.read_csv('dfCountryImputed2.csv')
  df = df[df["Country Name"] == countries[i]]
  df.to_csv("output{}.csv".format(i))

## ---------------------------------Forecasting for Urban population (% of total population)---------------------------------
dependent_feature = "Urban_population_percent_of_total_population"
independent_features = ["Urban_population_growth_annual_percent", "Forest_area_percent_of_land_area"]

data = []
colors = ['blue', 'orange', 'green', 'red', 'purple', 'yellow', 'brown', 'maroon', 'lime', 'darkviolet']
for i in range(n):
  df = pd.read_csv("output{}.csv".format(i))
  df.rename(columns = {' "Urban population (% of total population)"':dependent_feature, ' "Urban population growth (annual %)"':independent_features[0], ' "Forest area (% of land area)"':independent_features[1]}, inplace = True)
  df.index = df[' "Year"']
  df.filter(items=independent_features+[dependent_feature])
  data.append(df)

models = []
predictions = []
for i in range(n):
  model = pf.ARIMAX(data=data[i], formula='{0}~{1}+{2}'.format(dependent_feature, independent_features[0], \
                                                            independent_features[1]), ar=1, ma=1, family=pf.Normal())
  models.append(model)
  x = model.fit("MLE")
  print("-------------------------------------------------------------------------")
  print("ARIMAX Model summary for {} is as follows:".format(countries[i]))
  # x.summary()
  print("-------------------------------------------------------------------------")
  print("Forecasted values for {} from 2021 to 2030 are as follows:".format(countries[i]))
  prediction = model.predict(h=10, oos_data=data[i][-12:])
  print(prediction)  
  print("-------------------------------------------------------------------------")
  print()
  print()
  print()
  print()
  predictions.append(prediction)

plt.figure(figsize=(15,5));
future_years = [val for val in range(2021, 2031)]
for i in range(n):
  plt.plot(data[i].index, data[i][dependent_feature], color=colors[i])
  plt.plot(future_years, predictions[i].values.tolist(), color=colors[i], label='_nolegend_')
plt.xlabel('Year')
plt.ylabel('Urban population (% of total population)');
plt.title('Forecast for Urban population (% of total population)');
plt.legend(countries, loc='best')


## ------------------------------Cost_of_business_startup_procedures_percent_of_GNI_per_capita------------------------------
dependent_feature = "Cost_of_business_startup_procedures_percent_of_GNI_per_capita"
independent_features = ["Trade_percent_of_GDP", "Forest_rents_percent_of_GDP", "GDP_current_USD"]

data = []
colors = ['blue', 'orange', 'green', 'red', 'purple', 'yellow', 'brown', 'maroon', 'lime', 'darkviolet']
for i in range(n):
  df = pd.read_csv("output{}.csv".format(i))
  df.rename(columns = {' "Cost of business start-up procedures (% of GNI per capita)"':dependent_feature, \
                       ' "Merchandise trade (% of GDP)"':independent_features[0], ' "Forest rents (% of GDP)"':independent_features[1], \
                       ' "GDP (current US$)"':independent_features[2]}, inplace = True)
  df.index = df[' "Year"']
  df.filter(items=independent_features+[dependent_feature])
  data.append(df)

models = []
predictions = []
for i in range(n):
  model = pf.ARIMAX(data=data[i], formula='{0}~{1}+{2}+{3}'.format(dependent_feature, independent_features[0], \
                                                            independent_features[1], independent_features[2]), ar=1, ma=1, family=pf.Normal())
  models.append(model)
  x = model.fit("MLE")
  print("-------------------------------------------------------------------------")
  print("ARIMAX Model summary for {} is as follows:".format(countries[i]))
  # x.summary()
  print("-------------------------------------------------------------------------")
  print("Forecasted values for {} from 2021 to 2030 are as follows:".format(countries[i]))
  prediction = model.predict(h=10, oos_data=data[i][-12:])
  print(prediction)  
  print("-------------------------------------------------------------------------")
  print()
  print()
  print()
  print()
  predictions.append(prediction)

plt.figure(figsize=(15,5));
future_years = [val for val in range(2021, 2031)]
for i in range(n):
  plt.plot(data[i].index, data[i][dependent_feature], color=colors[i])
  plt.plot(future_years, predictions[i].values.tolist(), color=colors[i], label='_nolegend_')
plt.xlabel('Year')
plt.ylabel('Cost of business start-up procedures (% of GNI per capita)');
plt.title('Forecast for Cost of business start-up procedures (% of GNI per capita)');
plt.legend(countries, loc='best')

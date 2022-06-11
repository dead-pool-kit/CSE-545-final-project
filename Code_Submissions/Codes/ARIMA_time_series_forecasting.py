# Importing necessary libraries
import warnings
import pmdarima as pm
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime
from statsmodels.tsa.seasonal import seasonal_decompose
pd.set_option('display.max_columns', 500)
pd.set_option('display.max_rows', 50)
warnings.filterwarnings('ignore')
plt.style.use('ggplot')

# Function to parse the time data
def parser(x):
	return datetime.strptime(x, '%Y')

# Data preprocessing
time = ' "Year"'
feature = ' "Access to electricity urban (% of urban population)"'
df = pd.read_csv('dfCountryImputed2.csv', header=0, usecols=[time, feature, "Country Name"])
df = df[df["Country Name"] == "China"]
df = df.drop(['Country Name'], axis=1)
df.reset_index(drop=True, inplace=True)
df.to_csv("output.csv")

# Reading the input data
ts = pd.read_csv('output.csv', header=0, index_col=0, usecols=[time, feature], parse_dates=True, squeeze=True, date_parser=parser)
ts.index = ts.index.to_period('Y').to_timestamp()
ts = ts.to_frame()

# Using the decomposition method which allows us to separately view seasonality, trend and 
# random which is the variability in the data set after removing the effects of the seasonality and trend.
decomposition = seasonal_decompose(ts)

# Gathering the trend, seasonality and noise of the decomposed object
trend = decomposition.trend
seasonal = decomposition.seasonal
residual = decomposition.resid

# Plotting gathered statistics
plt.figure(figsize=(12,8))
plt.subplot(411)
plt.plot(np.log(ts), label='Original', color="blue")
plt.legend(loc='best')
plt.subplot(412)
plt.plot(trend, label='Trend', color="blue")
plt.legend(loc='best')
plt.subplot(413)
plt.plot(seasonal, label='Seasonality', color="blue")
plt.legend(loc='best')
plt.subplot(414)
plt.plot(residual, label='Residuals', color="blue")
plt.legend(loc='best')
plt.tight_layout()

# Auto ARIMA model 
model = pm.auto_arima(ts, start_p=1, start_q=1)
print(model.summary())
model.plot_diagnostics(figsize=(8, 8))
plt.show()

# Time series forecasting 
prediction = model.predict().tolist()
X = [x for x in range(2000, 2021)]
X_test = [x for x in range(2020, 2031)]
Y = ts[feature].values.tolist()
prediction = [Y[-1]] + prediction
plt.figure(figsize=(15, 10))
plt.plot(X, Y, color="blue")
plt.plot(X_test, prediction, color="red")
plt.legend(["Actual Values", "Forecasted values"], loc='best')

from flask import Flask, redirect, url_for, render_template, jsonify, request
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt 

import pandas as pd
import numpy as np
import json
import random

from sklearn.manifold import MDS
from sklearn.cluster import KMeans
import sys

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
dataMainCountries = pd.read_csv("data/dfCountryImputed2.csv")

fileCoord = "data/mapCoordinates.json"
dataCoord = 1
listCountryCodeTime= ['IND']

cluster_count = 3

mds =  MDS(n_components=2)
mds_fitted_pc = None


def preprocess():
    global dataMainCountries

    selFtrs = [
    "Year",
    'Country Code',
    'Country Name',    
    "Forest area (% of land area)",
    "Forest rents (% of GDP)",
    "Mineral rents (% of GDP)",
    "GDP (current US$)", 
    "GNI (current US$)",
    "Compulsory education duration (years)",
    "Number of infant deaths", 
    "Adjusted savings: natural resources depletion (% of GNI)",
    "Adjusted savings: energy depletion (% of GNI)",
    "Adjusted savings: carbon dioxide damage (% of GNI)",
    "Renewable energy consumption (% of total final energy consumption)",
    "Individuals using the Internet (% of population)", 
    "Access to electricity urban (% of urban population)", 
    "Urban population growth (annual %)",
    "Exports of goods and services (% of GDP)", 
    "Imports of goods and services (% of GDP)",                                                        
    "Trade (% of GDP)",   
    "Net bilateral aid flows from DAC donors United States (current US$)",
    "Net bilateral aid flows from DAC donors Total (current US$)",
    "Current health expenditure (% of GDP)",
    "International tourism expenditures (% of total imports)",
    "Cost of business start-up procedures (% of GNI per capita)",
    "Communications computer etc. (% of service imports BoP)",
    "Market capitalization of listed domestic companies (% of GDP)",
    "Listed domestic companies total",
    "Energy intensity level of primary energy (MJ/$2011 PPP GDP)",
    "PM2.5 air pollution population exposed to levels exceeding WHO guideline value (% of total)",
    "Research and development expenditure (% of GDP)",
    "Hospital beds (per 1000 people)",
    "High-technology exports (current US$)",
    "New business density (new registrations per 1000 people ages 15-64)",
    "Exports as a capacity to import (constant LCU)",
    "International tourism number of arrivals",
    "Probability of dying among youth ages 20-24 years (per 1000)",
    "International tourism number of departures",
    "Physicians (per 1000 people)",
    "Automated teller machines (ATMs) (per 100000 adults)",
    "Prevalence of undernourishment (% of population)",
    "CO2 emissions (metric tons per capita)"               

    ]
    # dataMainCountries = dataMainCountries[[*selFtrs]]

    dataMainCountries["GNI (current US$)"]  = dataMainCountries["GNI (current US$)"]/1000000000
    dataMainCountries["GDP (current US$)"]  = dataMainCountries["GDP (current US$)"]/1000000000
    dataMainCountries["Net bilateral aid flows from DAC donors Total (current US$)"]  = dataMainCountries["Net bilateral aid flows from DAC donors Total (current US$)"]/1000000
    dataMainCountries["Net bilateral aid flows from DAC donors United States (current US$)"]  = dataMainCountries["Net bilateral aid flows from DAC donors United States (current US$)"]/1000000
    dataMainCountries["Exports as a capacity to import (constant LCU)"]  = dataMainCountries["Exports as a capacity to import (constant LCU)"]/1000000000
    dataMainCountries["High-technology exports (current US$)"]  = dataMainCountries["High-technology exports (current US$)"]/1000000
    dataMainCountries["International tourism number of departures"]  = dataMainCountries["International tourism number of departures"]/1000000
    dataMainCountries["International tourism number of arrivals"]  = dataMainCountries["International tourism number of arrivals"]/1000000
    dataMainCountries["Net bilateral aid flows from DAC donors Japan (current US$)"]  = dataMainCountries["Net bilateral aid flows from DAC donors Japan (current US$)"]/1000000
    dataMainCountries["Net bilateral aid flows from DAC donors Norway (current US$)"]  = dataMainCountries["Net bilateral aid flows from DAC donors Norway (current US$)"]/1000000
    dataMainCountries["Net bilateral aid flows from DAC donors Germany (current US$)"]  = dataMainCountries["Net bilateral aid flows from DAC donors Germany (current US$)"]/1000000
    dataMainCountries["Foreign direct investment net outflows (BoP current US$)"]  = dataMainCountries["Foreign direct investment net outflows (BoP current US$)"]/1000000000


    countriesToRemove = ["WLD", "HIC", "OED", "PST", "IBT", "ECS", "LMY", "MIC", "IBD", "NAC", "EAS", "UMC", "EUU",
     "LTE", "EMU", "EAP", "TEA", "EAR", "LMC", "LCN", "TLA", "LAC", "TEC", "ECA", "CEB","ARB", "TSA", "SAS","MEA","IDA",
     "SSF", "TSS", "SSA", "PRE", "IDX", "FCS", "LIC", "IDB", "MNA","TMN","AFE","AFW"]
    dataMainCountries = dataMainCountries[~dataMainCountries['Country Code'].isin(countriesToRemove)]


@app.route("/mapping/countryCodes", methods=["GET"])
def get_map_cc():
    global dataMainCountries

    df_country_updated = pd.DataFrame(dataMainCountries['Country Name'].unique(), columns=['Country Name'])
    df_country_updated['Country Code'] = pd.DataFrame(dataMainCountries['Country Code'].unique())

    datadict = df_country_updated.to_dict(orient="records")
    xx = json.dumps(datadict)
    return xx


@app.route("/barchart", methods=["GET", "POST"])
def get_top_ten():
    global dataMainCountries

    wmapFtr  = 'GDP (current US$)'

    if request.method == 'POST':
        wmapFtr =  request.get_json()['attr']
        worst =  request.get_json()['worst']
        yearSt = request.get_json()['yearSt']
        yearEnd = request.get_json()['yearEnd']

    dataBarChart = dataMainCountries[dataMainCountries[wmapFtr].notna()]
    # dataBarChart = dataBarChart[[wmapFtr, 'Country Code', 'Year']]
    dataBarChart = dataBarChart[(dataBarChart['Year'] >=yearSt) & (dataBarChart['Year'] <=yearEnd)]

    df_for_gp = dataBarChart.groupby(['Country Code'], as_index=True)[wmapFtr].agg({'mean'}).reset_index()
    df_for_gp = df_for_gp[df_for_gp['mean'].notna()]
    df_for_gp = df_for_gp[df_for_gp['mean'] !=0]
    df_for_gp[wmapFtr] = df_for_gp['mean']

    if worst == False:
        df_for_gp = df_for_gp.nlargest(10, wmapFtr)
    else:
        df_for_gp = df_for_gp.nsmallest(10, wmapFtr)

    # print(dataBarChart)
    tmp = df_for_gp.to_dict(orient="records")
    ret = json.dumps(tmp)
    # print(xx)
    return ret


@app.route("/worldmap", methods=["GET", "POST"])
def get_WmapData():
    global dataMainCountries
    wmapFtr  = 'GDP (current US$)'

    if request.method == 'POST':
        wmapFtr =  request.get_json()['attr']
        yearSt = request.get_json()['yearSt']
        yearEnd = request.get_json()['yearEnd']

    dataWmap = dataMainCountries[dataMainCountries[wmapFtr].notna()]
    dataWmap = dataWmap[(dataWmap['Year'] >=yearSt) & (dataWmap['Year'] <=yearEnd)]

    df_for_gp = dataWmap.groupby(['Country Code'], as_index=True)[wmapFtr].agg({'mean'}).reset_index()
    df_for_gp = df_for_gp[df_for_gp['mean'].notna()]
    df_for_gp[wmapFtr] = df_for_gp['mean']

    print(wmapFtr)
    dataAirPolTmp = df_for_gp.to_dict(orient="records")
    # print(mds_dcata)
    xx = json.dumps(dataAirPolTmp)
    # print(xx)
    return xx


#accept the country code in body and filter results
@app.route("/timeser", methods=["GET", "POST"])
def get_time_ser2():

    global dataMainCountries, listCountryCodeTime

    if(request.method == 'POST'):
        country = request.get_json()['country']
        attr =  request.get_json()['attr']
        reset =  request.get_json()['reset']

        if country not in listCountryCodeTime:
            listCountryCodeTime.append(country)
        
        if len(listCountryCodeTime) > 6 or reset == True:
            listCountryCodeTime = [country]


    dataTime = dataMainCountries.fillna(0)
    dataTime = dataTime[[attr, 'Country Code', 'Country Name', 'Year']]

    dataTime = dataTime[dataTime['Country Code'].isin(listCountryCodeTime)]

    dfTimetmp = pd.DataFrame(dataTime['Year'].unique(), columns=['Year'])

    for ctry in listCountryCodeTime:
        dfTimetmp[ctry] = dataTime[dataTime['Country Code']==ctry][attr].reset_index(drop=True)
    
    dfTimetmp = dfTimetmp.to_dict(orient="records")
    # print(mds_dcata)
    return json.dumps(dfTimetmp)


@app.route("/all/countries", methods=["GET"])
def get_all_countries():
    global dataMainCountries

    dataAllCountrytmp = dataMainCountries.to_dict(orient="records")
    # print(mds_dcata)
    return json.dumps(dataAllCountrytmp)


@app.route("/hypothesis", methods=["GET", "POST"])
def getHypothesis():
   
    global dataMainCountries

    if(request.method == 'POST'):
        country = request.get_json()['country']
        dependentFtr = request.get_json()['dependentFtr']
        listFtr = request.get_json()['listFtr']

    res = {}
    res['Ahbsdfjhsbdjbfsjdfxgdfd']=1
    res['BAhbsdfjhsbdjbfsdfvdfxjd']=2
    res['CAhbsdvcbjngdkjffjhsbdjbfsjd']=3
    res['DAhbsdfjhsbdjbfsjdfkjdfnkndfnkfsjdfgdgd']=4
    res['EAhbsdfjhsbdjbfsjdfgd']=5
    res['pVal']=0.05
    res['fVal']=100

    return res


@app.route("/similarity", methods=["GET", "POST"])
def getSimilarity():
   
    global dataMainCountries

    if(request.method == 'POST'):
        yearSt = request.get_json()['yearSt']
        yearEnd = request.get_json()['yearEnd']
        axisList = request.get_json()['axis']

    #list of json= {((cnt1,cnt2),corr)}
    finaRes = []
    res = [] 
    # take only top 5
    
    for i in range(10):
        xx=(('ctry'+str(i), 'year'+str(i)),i)
        res.append(xx)
  
    res= res[:10]

    for ele in res:
        map = {}
        map['Country'] = ele[0][0]
        map['Year'] = ele[0][1]
        map['Distance'] = ele[1]
        finaRes.append(map)

    return json.dumps(finaRes)

@app.route("/pcp", methods=["GET", "POST"])
def get_pcp():
    global dataMainCountries, cluster_count
    if(request.method == 'POST'):
        yearSt = request.get_json()['yearSt']
        yearEnd = request.get_json()['yearEnd']
        axisList = request.get_json()['axis']

    # print('pcpp  ', axisList)
    axisList.extend(['Country Name', 'Country Code'])
    
    dataMainCountriestmp = dataMainCountries[(dataMainCountries['Year'] >=yearSt) & (dataMainCountries['Year'] <=yearEnd)]
    dataMainCountriestmp = dataMainCountriestmp[[*axisList]]
    dataMaingbb = dataMainCountriestmp.groupby(['Country Code'], as_index=True).agg(
     param1 =(axisList[0], 'mean'),
     param2=(axisList[1], 'mean'),
     param3=(axisList[2], 'mean'),
     param4=(axisList[3], 'mean'),
     param5=(axisList[4],'mean')).reset_index()

    dataMaingbb[axisList[0]] = dataMaingbb['param1']
    dataMaingbb[axisList[1]] = dataMaingbb['param2']
    dataMaingbb[axisList[2]] = dataMaingbb['param3']
    dataMaingbb[axisList[3]] = dataMaingbb['param4']
    dataMaingbb[axisList[4]] = dataMaingbb['param5']

    dataMaingbb.drop(['param1','param2','param3','param4','param5'], axis=1, inplace=True )
    dataMainCountriestmp = dataMaingbb.fillna(0)

    # dataMainCountriestmp = dataMainCountriestmp.loc[dataMainCountriestmp['Year'] == year]

    # dataAllCountry = dataAllCountry.fillna(0)
    df_dropped = dataMainCountriestmp.drop(['Country Code'], axis=1 )
    # df_pcp = pd.DataFrame(df_dropped)
    kmeans = KMeans(n_clusters=cluster_count, random_state=0).fit(df_dropped[[axisList[2]]])
    df_dropped['class'] = kmeans.labels_

    # print(dataAllCountry)
    dftmp = df_dropped.to_dict(orient="records")
    # print(mds_dcata)
    return json.dumps(dftmp)


@app.route("/mds/corr", methods=["GET"])
def get_mds_corr():
    global mds_fitted_pc
    global dataMainCountries
    
    df_dropped = dataMainCountries.drop(["Year", 'Country Name', 'Country Code'], axis=1 )
    
    
    mds_pc = MDS(n_components=2, dissimilarity='precomputed')
    # df_dropped = dataAllCountry.drop(['Country Name', 'Country Code'], axis=1 )

    if mds_fitted_pc == None:
        mds_fitted_pc = mds_pc.fit(1-np.abs(df_dropped.corr()))

    #df_mds_euc =  pd.DataFrame(pd.DataFrame(mds_fitted.embedding_), columns=['x', 'y'])
    df_mds_corr = pd.DataFrame.from_records(mds_fitted_pc.embedding_, columns=['x','y'])
    df_mds_corr['fields'] = df_dropped.columns
 
    mds_data = df_mds_corr.to_dict(orient="records")
    # print(mds_data)
    return json.dumps(mds_data)

@app.route("/coordinates", methods=["GET"])
def get_Coord():
    global dataCoord

    f = open (fileCoord, "r")
    dataCoord = json.loads(f.read())

    # dataRidgetmp = dataRidge.to_dict(orient="records")
    # print(mds_dcata)
    return dataCoord

@app.route("/")
def index():
    return render_template("index.html")

if __name__=="__main__":
    print("Hello")
    preprocess()
    app.run(host='0.0.0.0', port=8083, debug=True)
    app.config['TEMPLATES_AUTO_RELOAD'] = True
from cmath import nan
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
import pickle

import pandas as pd
import numpy as np
import statsmodels.api as sm
import statsmodels.formula.api as smf





app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
dataMainCountries = pd.read_csv("data/dfCountryImputed2.csv")

fileCoord = "data/mapCoordinates.json"
dataCoord = 1
listCountryCodeTime= ['IND']

cluster_count = 3
countrySimilarity = nan
mds =  MDS(n_components=2)
mds_fitted_pc = None

ctryNameCodeMap = {}


def preprocess():
    global dataMainCountries, countrySimilarity, ctryNameCodeMap

    with open('data/countrySimilarity.pkl', 'rb') as f:
        countrySimilarity = pickle.load(f)


    # df_country_updated = pd.DataFrame(dataMainCountries['Country Name'].unique(), columns=['Country Name'])
    # df_country_updated['Country Code'] = pd.DataFrame(dataMainCountries['Country Code'].unique())

    ctryNameCodeMap = dict(zip(dataMainCountries['Country Code'], dataMainCountries['Country Name']))
    
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
    res['BAhbsdfjhsbdelkrsflkersmdflmsdjbfsdfvdfxjd']=2
    res['CAhbsdvcbjngdkjffjhsbdjbfsjd']=3
    res['ffddffffs']=4
    res['EAhbsdfjhsbdjbfsjdfgd']=5
    res['pVal']=0.05
    res['fVal']=100

    # listAttr= ['_Individuals using the Internet (% of population)', '_Adjusted savings: carbon dioxide damage (% of GNI)',
    # '_Imports of goods and services (% of GDP)', 'Trade (% of GDP)']
    
    # res2 = test_hypothesis("_Forest area (% of land area)", listAttr, ctryNameCodeMap['IND'])


    # res2 = test_hypothesis('_Urban population percent_of_total_population', ['_Listed domestic companies total', '_Net_bilateral_aid_flows_from_DAC_donors_United_States_current_USD', '_Energy_intensity_level_of_primary_energy_MJD2011_PPP_GDP', '_Access_to_electricity_urban_percent_of_urban_population'], 'India')

    # coeff_dict = dict(res[2])
    # coeff_dict['f_value'] = res[0]
    # coeff_dict['p_value'] = res[1]

    return res



@app.route("/similarity", methods=["GET", "POST"])
def getSimilarity():
   
    global countrySimilarity

    # print(countrySimilarity)
    if(request.method == 'POST'):
        year = request.get_json()['year']
        country = request.get_json()['country']

    #list of json= {((cnt1,cnt2),corr)}
    finaRes = []
    res = [] 
    # take only top 5
    res = countrySimilarity[(country, str(year))][:10]

    for ele in res:
        map = {}
        map['Country'] = ele[0][0]
        map['Year'] = ele[0][1]
        map['Similarity'] =  float("{:.3f}".format(ele[1]*0.90))
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


def find_intersection(stats):
    target_countries = set(['India', 'China', 'United States', 'Australia', 'Brazil', 'Canada', 'France', 
                            'Germany', 'Israel', 'Japan', 'South Africa', 'Korea, Rep.', 
                            'Mexico', 'New Zealand', 'Netherlands', 'Pakistan', 'Portugal', 
                            'Russian Federation', 'Singapore', 'Spain', 'Thailand', 'United Kingdom', 'Vietnam'])

    related_attributes = set(dict(stats[0][1][3]))
    for country, value in stats[1:]:
        if country in target_countries:
            attributes = dict(value[3])
            related_attributes = related_attributes & attributes
            # stats[0][1][3] = 

    return related_attributes

def data_sanitisation():
    global dataMainCountries

    df = dataMainCountries.copy()
    df.fillna(0, inplace=True)
    original_dict = {}

    col = list(df.columns)
    # index_dictionary = {}
    replace_dict = {'%': 'percent', '(': '', ')': '', ',': '', ':': '', '-': '', '$': 'D', '.': '', '/': '', '=': '', '&': '', ' ': '_', '"': ''}



    for i, attribute in enumerate(col):
        original = attribute
        for key in replace_dict:
            attribute = attribute.replace(key, replace_dict[key])
        col[i] = attribute
        original_dict[attribute] = original
    return df, col, original_dict



def null_hypothesis_rejected(fvalue, f_pvalue):
    return fvalue > 1 and f_pvalue < 0.05


def compute_formula(target_attribute, other_attributes):
    formula = str(target_attribute) + " ~ "

    for i, attribute in enumerate(other_attributes):
        # print(attribute)
        if attribute != target_attribute:
            formula += str(other_attributes[i]) + " + "

    formula = formula[:-3]
    # print(formula)
    return formula


def compute_dependency(dataframe, target_attribute):
    fvalue, f_pvalue = 0, 0

    #while not null_hypothesis_rejected(fvalue, f_pvalue):
    #for i in range(30):
    col = list(dataframe.columns)
    formula = compute_formula(target_attribute, col)
    if target_attribute in col: 
        col.remove(target_attribute)
    
    try:
        model = smf.ols(formula = formula, data = dataframe)

    except:
        # print('formula: ', formula)
        # print('target: ', target_attribute)
        # print('dataframe: ', dataframe)
        return 0, 0, []

        
    result = model.fit()
    fvalue = result.fvalue
    f_pvalue = result.f_pvalue
    params = list(result.params)
    mapped_params = [(col[i], params[i]) for i in range(min(len(params), len(col)))]
    sorted_params = sorted(mapped_params, key = lambda x: abs(x[1]))
    least_imp_param = sorted_params[0][0]
    dataframe.drop(least_imp_param, inplace=True, axis=1)

    if len(sorted_params) < 3:
        return fvalue, f_pvalue, len(sorted_params), sorted_params

    # print(params)

    return fvalue, f_pvalue, sorted_params # result


def remaping(stats, originals):
    print(stats)
    for j, attribute in enumerate(stats[2]):
        stats[2][j] = (originals[stats[2][j][0]], stats[2][j][1])
    return stats



############################################### Copy everything below this in this cell #####################################

def sanitised(col):
    originals = {}
    replace_dict = {'%': 'percent', '(': '', ')': '', ',': '', ':': '', '-': '', '$': 'D', '.': '', '/': '', '=': '', '&': '', ' ': '_', '"': ''}

    for i, attribute in enumerate(col):
        original = attribute
        for key in replace_dict:
            attribute = attribute.replace(key, replace_dict[key])
        col[i] = attribute
        originals[attribute] = original

        return col[0], col[1:], originals


############################################### Use This Function ########################################
def test_hypothesis(target_attribute, dependent_attributes, country):
    df, col, original_dict = data_sanitisation()
    # print(df.columns)
    # print(col)
    df.columns = col
    target_attribute, dependent_attributes, originals = sanitised([target_attribute] + dependent_attributes)
    print('------------------------------------------------------------------')
    print(target_attribute)
    print(dependent_attributes)
    print(country)
    print('------------------------------------------------------------------')
    # df.drop(columns = ['Country_Name', '_Country_Code', '_Year'], inplace = True, axis = 1)
    new_df = df.filter([target_attribute] + dependent_attributes, axis = 1)
    # print(new_df.columns)
    res = compute_dependency(new_df, target_attribute)
    ############### Code to group by country ##############
    # file_rdd = sc.parallelize(df.to_numpy())

    # grouped_rdd = file_rdd.map(lambda x: (x[0], x[3:])).groupByKey().mapValues(list)

    # df_rdd = grouped_rdd.map(lambda x: (x[0], pd.DataFrame(x[1], columns = col[3:]) ))       # Grouping Country wise and dropping country code and time fields
    
    # model_rdd = df_rdd.map(lambda x: (x[0], compute_dependency(x[1], target_attribute))) #.map(lambda x: (x[0], x[1].params))

    
    # # summary_rdd = model_rdd.map(lambda x: (x[0], x[1].fvalue, x[1].f_pvalue))
    # stats = model_rdd.collectAsMap()

    # res = stats[country]

    new_stats = remaping(res, original_dict)
    # print(model_rdd.collect())
    print(new_stats)
    return new_stats



@app.route("/")
def index():
    return render_template("index.html")

if __name__=="__main__":
    print("Hello")
    preprocess()
    app.run(host='0.0.0.0', port=8083, debug=True)
    app.config['TEMPLATES_AUTO_RELOAD'] = True
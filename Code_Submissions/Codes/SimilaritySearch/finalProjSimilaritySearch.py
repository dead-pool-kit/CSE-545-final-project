
# name: Pulkit Varshney
# sbu-id-number: 114709284
# Brief Description: 
#1. Reads rdd and standardize(min-max scalar) all features values before finding similarity matrix 
#2. Puts min-max values and headers in broadcast variables
#3. first finds cosine similarity among all user-user items. Here User-User I refer to similarity of a country in a year X
#   based on 57 SDG:11 features to a country X in Year Y. Some Interesting finds are Brazil in 2019 and Poland in 2014 shows similar trends. 
#4. Found top 100 most highly correlated feature for each row
#5. Imputed the missing values in the dataset based on similarity matrix wrt to the countries having feature value present
#6. de-normalized the feature values back to the unscaled version
#7. Saved the CSV again with attached header to validate null hypothesis


from ast import Lambda
import json
from numpy import NAN
from pyspark import SparkContext
from pyspark.sql import SparkSession
from math import log10, floor
import csv
import random
from random import seed
import sys
import collections
import time
import pandas as pd
import numpy as np
from dateutil import parser


#########################################################

#findSimilarity: finds cosine similarity distance matrix between each pair of rows

#########################################################

def findSimilarity(rdd, sc):
    rddRead = rdd.mapPartitions(lambda line: csv.reader(line))
    dfHeader  = rddRead.first()
    bcHeaders = sc.broadcast(dfHeader)
    rddData = rddRead.filter(lambda x: x!=dfHeader)

    minMaxTpl = []
    for i in range(3, 57):
        tmprdd = rddData.filter(lambda x: x[i]).map(lambda x: (i, (float(x[i]),float(x[i]))))\
                    .reduceByKey(lambda a,b: (min(a[0],b[0]), max(a[1],b[1])))
                        
        # print(tmprdd.collect()[0])

        minMaxTpl.append(tmprdd.collect()[0])
    minMaxTpl = dict(minMaxTpl)


    def minMaxScale(row):
        newRow = []
        for i in range(len(row)):
            if i<3:
                newRow.append(row[i])
            else:
                if row[i]:
                   newRow.append((float(row[i]) - minMaxTpl[i][0])/(minMaxTpl[i][1] - minMaxTpl[i][0])) 
                else:
                    newRow.append(row[i])
       
        return newRow


    #Did Min-Max scaling on all columns
    scaledRDD = rddData.map(minMaxScale)


    #Similarity search start, finding highly correlated country to each wrt to that year
    #format = Dict<(country, year), Dict<(country, year), corrVal>>
    country_yr_corr_matrix= {} 

    listFtrs = scaledRDD.collect()
    # print(len(listFtrs))

    def findCosineSimilar(row):

        # print(row)

        #compute similarity
        cntry_yr={}
        for ftrs in listFtrs:
            if not(ftrs[1] == row[1] and ftrs[2] == row[2]):
            
                sumSqX = 0
                sumSqY = 0
                dotProd = 0
                for i in range(3, 57):
                    x1 = 0
                    if ftrs[i]:
                        x1 = ftrs[i]

                    y1 = 0
                    if row[i]:
                        y1 = row[i]

                    sumSqX+= float(x1)**2
                    sumSqY+= float(y1)**2
                    dotProd+= float(x1)*float(y1)

                corr = dotProd/((sumSqX**(0.5))* (sumSqY**(0.5)))
                cntry_yr[(ftrs[1], ftrs[2])] = corr

        country_yr_corr_matrix[(row[1], row[2])] = cntry_yr 
        return ((row[1], row[2]), cntry_yr)  

    # correlated_ctry_yr = scaledRDD.map(lambda x: findCosineSimilar(x))

    def findCosineSimilar2(row):

        # print(row)

        #compute similarity
        # cntry_yr={}
        arr = []

        for ftrs in listFtrs:
            if not(ftrs[1] == row[1] and ftrs[2] == row[2]):
            
                sumSqX = 0
                sumSqY = 0
                dotProd = 0
                for i in range(3, 57):
                    x1 = 0
                    if ftrs[i]:
                        x1 = ftrs[i]

                    y1 = 0
                    if row[i]:
                        y1 = row[i]

                    sumSqX+= float(x1)**2
                    sumSqY+= float(y1)**2
                    dotProd+= float(x1)*float(y1)

                corr = dotProd/((sumSqX**(0.5))* (sumSqY**(0.5)))

                x1 = (ftrs[1], ftrs[2])
                y1 = (row[1], row[2])
                # if (x1[0] > y1[0]) or (x1[0] == y1[0] and x1[1] > y1[1]):
                #     tmp = x1
                #     x1= y1
                #     y1= tmp 
                
                arr.append(((x1, y1), corr))

        return arr
            
    
    correlated_ctry_yr = scaledRDD.flatMap(findCosineSimilar2)
    correlated_ctry_yr.saveAsPickleFile('data/correlated_ctry_yr_nu')
    scaledRDD.saveAsPickleFile('data/scaledRDD')

    # correlated_ctry_list = correlated_ctry_yr.collect()

    #filter to best 23 countries to check features, we can remove it later if added to UI
    selCtry = ['IND', 'CHN', 'USA', 'AUS', 'BRA', 'CAN', 'FRA', 'DEU', 'ISR', 'JPN', 'ZAF',
    'KOR', 'MEX', 'NZL', 'NLD', 'PAK', 'PRT', 'RUS', 'SGP', 'ESP', 'THA', 'GBR', 'VNM']

    sortedCntrySelected = correlated_ctry_yr.filter(lambda x: (x[0][0][0] in selCtry and int(x[0][0][1])>2018))\
        .reduceByKey(lambda a,b: a).filter(lambda x: x[0][0][0] != x[0][1][0]).takeOrdered(100, key = lambda x: -x[1])

    sortedCntry2 = correlated_ctry_yr.filter(lambda x: x[0][0][0] != x[0][1][0]).takeOrdered(100, key = lambda x: -x[1])

    # print(sortedCntry2)
    # print(correlated_ctry_yr.take(1))
    # print(correlated_cnt_yr.take(1)[0][1][('IND', '2019')])




#########################################################

#imputeMissing: imputes the missing values in Dataframe based on the top 100 most correlated values of each row

#########################################################
def imputeMissing(rdd, sc):

    rddRead = rdd.mapPartitions(lambda line: csv.reader(line))
    dfHeader  = rddRead.first()
    rddData = rddRead.filter(lambda x: x!=dfHeader)

    minMaxTpl = []
    for i in range(3, 57):
        tmprdd = rddData.filter(lambda x: x[i]).map(lambda x: (i, (float(x[i]),float(x[i]))))\
                    .reduceByKey(lambda a,b: (min(a[0],b[0]), max(a[1],b[1])))
                        

        minMaxTpl.append(tmprdd.collect()[0])

    minMaxTpl = dict(minMaxTpl)


    correlated_ctry_yr = sc.pickleFile('data/correlated_ctry_yr_nu')
    scaledRDD = sc.pickleFile('data/scaledRDD')

    def findValuesPresentForFtr(row):
        arr = []
        for i in range(3, 57):
            if row[i]:
                tpl = (i, ((row[1], row[2]), row[i]))
                arr.append(tpl)
        return arr


    presentValRdd = scaledRDD.flatMap(findValuesPresentForFtr).groupByKey().mapValues(dict)

    #find top 100 highly correlated country year for imputing
    def sort_find50(row):            
        row.sort(key = lambda x: -x[1])
        return row[:100]

    top50Corr = correlated_ctry_yr.map(lambda x: (x[0][0],(x[0][1], x[1])))\
                        .groupByKey().mapValues(list).mapValues(sort_find50)

    #presentValDict, format= <colNo, <(ctry,yr), value>>
    presentValDict  = dict(presentValRdd.collect())
    

    top50CorrList = sc.broadcast(dict(top50Corr.collect()))

    def findMissing(row):
        arr = []
        for i in range(len(row)):

            #if not present then impute the value
            if i>2 and not(row[i]):
                minMax = minMaxTpl[i]
                ftrVals = presentValDict[i]

                sumx = 0
                sumOfSim = 0
                for tpl in top50CorrList.value[(row[1], row[2])]:
                    if tpl[0] in ftrVals:
                        sumx+= tpl[1] * ftrVals[tpl[0]]
                        sumOfSim+= tpl[1]

                val = np.nan
                if sumOfSim != 0:
                    val =  (sumx/sumOfSim)*(minMax[1]-minMax[0]) +  minMax[0] 
                arr.append(val)

            else:
                if i>2:
                    minMax = minMaxTpl[i]
                    val = row[i]*(minMax[1]-minMax[0]) +  minMax[0] 
                    arr.append(val)

                else:
                    arr.append(row[i])
        return arr

    rddImputed = scaledRDD.map(findMissing)

    rddImputed.saveAsPickleFile('data/rddImputed')

    
    # print(rddImputed.take(1))


#########################################################

#saveToCSV:saves the imputed rdd back to csv for hypothesis testing

#########################################################
def saveToCSV(rdd, sc):

    rddRead = rdd.mapPartitions(lambda line: csv.reader(line))
    dfHeader  = rddRead.first()
    dfHeader = sc.parallelize(dfHeader)
    imputedRdd = sc.pickleFile('data/rddImputed')

    def toCSVLine(data):
        return ','.join(str(d) for d in data)

    dfHeader.union(imputedRdd.map(toCSVLine)).repartition(1).saveAsTextFile('data/finalImputed.csv')

    print(imputedRdd.take(10))



#########################################################

#removeUnnecessaryCountries: removes unnecessary countries from the csv and saves it

#########################################################
def removeUnnecessaryCountries():
    dfCtry = pd.read_csv("data/dfCorrected14May.csv")

    countriesToRemove = ["WLD", "HIC", "OED", "PST", "IBT", "ECS", "LMY", "MIC", "IBD", "NAC", "EAS", "UMC", "EUU",
     "LTE", "EMU", "EAP", "TEA", "EAR", "LMC", "LCN", "TLA", "LAC", "TEC", "ECA", "CEB","ARB", "TSA", "SAS","MEA","IDA",
     "SSF", "TSS", "SSA", "PRE", "IDX", "FCS", "LIC", "IDB", "MNA","TMN","AFE","AFW"]

    countriesToRemove2 = ['OSS',"SST"]
    dfCtry = dfCtry[~dfCtry['Country Code'].isin(countriesToRemove)]

    dfCtry.to_csv('dfFltrd14May.csv', index=False)


#########################################################

#Driver function

#########################################################
if __name__ == "__main__":
    dfCountries = "data/dfCorrected14May.csv"
    # trReviewFile = sys.argv[1]
    spark = SparkSession.builder.appName("distinct").getOrCreate()
    sc = spark.sparkContext
    sc.setLogLevel("ERROR")
    rdd = sc.textFile(dfCountries)

    start_time = time.time()
    file_path = 'similarityRes.txt'
    # sys.stdout = open(file_path, "w")
    saveToCSV(rdd, sc)


    # print("This text will be added to the file")
    timetaken = "{:.2f}".format((time.time() - start_time))
    print("Total time taken taken for execution: %s seconds." % timetaken)











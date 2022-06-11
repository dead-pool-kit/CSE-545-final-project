"""
#########################################################

Team Members : Pulkit Varshney, Pratik Thorwe, Purva Makarand Mhasakar, Saurabh Parekh

Code Description:
Hypothesis Testing: 
1. Here first we assume null hypothesis for the target features.
2. Thus, we assume that all the features have equal impact on our target features.
3. Then we perform multiple linear regression on the set of features to obtain the f-value and p-value
4. We remove the attribute on which the dependent variable is least dependent.
5. we repeat step 3 and 4 until we obtain the required fvalue and pvalue to reject the null hypothesis.
6. If null hypothesis is successfully rejected, then we say we have obtained the desired attributes.
7. If the null hypothesis cannot be rejected, we ignore the target attribute from our recommendation system

#########################################################

#########################################################

Importing required libraries 

#########################################################
"""

import pyspark
from pyspark.sql import SparkSession
import pandas as pd
import numpy as np
import sys
import csv
import json
import time
from calendar import timegm
from collections import defaultdict
import pickle
import re
from collections import defaultdict
import statsmodels.api as sm
import statsmodels.formula.api as smf

sc = pyspark.SparkContext()

"""
#########################################################

Function Name: null_hypothesis_rejected()

Parameters: None

Return Type: tuple

Output: returns dataframe and its columns in a tuple

#########################################################

"""

def data_sanitisation():
    df = pd.read_csv('/content/drive/MyDrive/dfCountryImputed2.csv')
    df.fillna(0, inplace=True)


    col = list(df.columns)
    # index_dictionary = {}
    replace_dict = {'%': 'percent', '(': '', ')': '', ',': '', ':': '', '-': '', '$': 'D', '.': '', '/': '', '=': '', '&': '', ' ': '_', '"': ''}



    for i, attribute in enumerate(col):
        for key in replace_dict:
            attribute = attribute.replace(key, replace_dict[key])
        col[i] = attribute
    
    return df, col

"""
#########################################################

Function Name: null_hypothesis_rejected()

Parameters:
1. fvalue: F-statistic of the hypothesis model
2. f_pvalue: probability of F-statistic given null hypothesis is true

Return Type: Boolean

Output: returns if null hypothesis can be rejected or not based on the provided parameters

#########################################################
"""

def null_hypothesis_rejected(fvalue, f_pvalue):
    return fvalue > 1 and f_pvalue < 0.05


"""
#########################################################

Function Name: compute_formula()

Parameters:
1. target_attribute: Dependent variable - 'y' (attribute for which we derive the hypothesis)
2. other_attributes: List of all other attributes ('x[i]') on which 'y' is depended 

Return Type: string

Output: returns the formula to be applied for regression model

#########################################################
"""

def compute_formula(target_attribute, other_attributes):
    formula = str(target_attribute) + " ~ "

    for i, attribute in enumerate(other_attributes):
        # print(attribute)
        if attribute != target_attribute:
            formula += str(other_attributes[i]) + " + "

    formula = formula[:-3]
    # print(formula)
    return formula

"""#########################################################

Function Name: compute_dependency()

Parameters:
1. dataframe: DataFrame of the attributes and its dataset
2. target_attribute: attribute for which we derive the hypothesis

Return Type: tuple

Output: tuple of (fvalue, pvalue, number of independent variables obtained, another tuple (attribute x[i], its weight 'beta')

#########################################################
"""

def compute_dependency(dataframe, target_attribute):
    fvalue, f_pvalue = 0, 0

    while not null_hypothesis_rejected(fvalue, f_pvalue):
    #for i in range(30):
        col = list(dataframe.columns)
        formula = compute_formula(target_attribute, col)
        if target_attribute in col: 
            col.remove(target_attribute)
        
        try:
            model = smf.ols(formula = formula, data = dataframe)

        except:
            print('formula: ', formula)
            print('target: ', target_attribute)
            print('dataframe: ', dataframe)
            return 0, 0, 0, []

        
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

    return fvalue, f_pvalue, len(sorted_params), sorted_params # result

"""
#########################################################

Function Name: test_hypothesis

Parameters:
1. target_attribute: attribute for which we derive the hypothesis

Return Type: tuple

Output: tuple of (country, regression output)

#########################################################
"""

def test_hypothesis(target_attribute):

        # ############### Code to group by country ##############
        grouped_rdd = file_rdd.map(lambda x: (x[0], x[3:])).groupByKey().mapValues(list)

        df_rdd = grouped_rdd.map(lambda x: (x[0], pd.DataFrame(x[1], columns = col[3:]) ))       # Grouping Country wise and dropping country code and time fields
        
        df_list = df_rdd.collect()
        print(len(df_list))
        # print(df_rdd.first())

        model_rdd = df_rdd.map(lambda x: (x[0], compute_dependency(x[1], target_attribute))) #.map(lambda x: (x[0], x[1].params))

        
        # summary_rdd = model_rdd.map(lambda x: (x[0], x[1].fvalue, x[1].f_pvalue))
        stats = model_rdd.collect()
        # print(model_rdd.collect())
        return stats

all_stats['_Urban_population_percent_of_total_population']

"""
#########################################################

Function Name: find_intersection

Parameters: 
1. stats: statistics obtained after hypothesis testing

Return Type: dictionary

Output: key = target attributes, value = the list of attributes it is depended on 

#########################################################
"""

def find_intersection(stats):
    target_countries = set(['India', 'China', 'United States', 'Australia', 'Brazil', 'Canada', 'France', 
                            'Germany', 'Israel', 'Japan', 'South Africa', 'Korea, Rep.', 
                            'Mexico', 'New Zealand', 'Netherlands', 'Pakistan', 'Portugal', 
                            'Russian Federation', 'Singapore', 'Spain', 'Thailand', 'United Kingdom', 'Vietnam'])

    related_attributes = set(dict(stats[0][1][3]).keys())
    for country, value in stats[1:]:
        if country in target_countries:
            coeff = dict(value[3])
            attributes = coeff.keys()
            related_attributes = related_attributes & attributes
    
    return related_attributes

"""
#########################################################

Function Name: compute_result

Parameters: 
1. all_stats: statistics obtained for all target_attributes

Output: key = target attributes, value = the list of attributes it is depended on

#########################################################
"""

def compute_result(all_stats):
    dependencies = {}
    for attribute in all_stats:
        dependency = find_intersection(all_stats[attribute])
        dependencies[attribute] = dependency

    return dependencies

"""
#########################################################

Function Name: main

Parameters: None

Output: Generates a JSON file for recommendation system

#########################################################
"""

def main():
    target_attributes = ['_Urban_population_percent_of_total_population', 
                        '_Net_bilateral_aid_flows_from_DAC_donors_United_States_current_US$', 
                        '_Net_bilateral_aid_flows_from_DAC_donors_Total_current_US$',
                        '_International_tourism_expenditures_percent_of_total_imports',
                        '_Current_Health_Expenditure',
                        '_Cost_of_business_startup_procedures_percent_of_GNI_per_capita',
                        '_Military_expenditure_percent_of_GDP',
                        '_Research_and_development_expenditure_percent_of_GDP',
                        '_Trade_percent_of_GDP'
                            ]


    df, col = data_sanitisation()
    file_rdd = sc.parallelize(df.to_numpy())

    all_stats = {}
    for attribute in target_attributes:
        statistics = test_hypothesis(attribute) # contains (key = Country_Name; value = (fvalue, pvalue, [(attribute: coefficient) () .... ()]))
        all_stats[attribute] = statistics

    dependencies = compute_result(all_stats2)

    for dependency in dependencies:
        dependencies [dependency] = list(dependencies[dependency])

    with open("student.json", "w") as write_file:
        json.dump(dependencies, write_file, indent=4)
    print('task completed')


main()

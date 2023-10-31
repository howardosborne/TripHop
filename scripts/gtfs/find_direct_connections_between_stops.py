import sys,csv,json
import pandas as pd
import numpy as np
from datetime import datetime


stop_dictionary = {}
stops_places_df = pd.read_json(sys.argv[1], orient='index')
stop_times_df = pd.read_csv(sys.argv[2])

from_df = pd.merge(stops_places_df, stop_times_df, on="stop_id")
to_df = from_df.copy()
from_to = pd.merge(from_df,to_df,on="trip_id")
from_to = from_to[from_to["stop_sequence_y"] > from_to["stop_sequence_x"]]
from_to = from_to[from_to["place_id_x"] != from_to["place_id_y"]]
from_to["departure_time_x"] = from_to["departure_time_x"].str.pad(width=8 , side='left', fillchar='0')
depart = pd.to_numeric(from_to["departure_time_x"].str.slice(0, 2))*3600 + pd.to_numeric(from_to["departure_time_x"].str.slice(3, 5))*60 + pd.to_numeric(from_to["departure_time_x"].str.slice(6, 8))
#from_to[["arrival_time_y_hour","arrival_time_y_minute","arrival_time_y_second"]] 
from_to["arrival_time_y"] = from_to["arrival_time_y"].str.pad(width=8 , side='left', fillchar='0')
arrival = pd.to_numeric(from_to["arrival_time_y"].str.slice(0, 2))*3600 + pd.to_numeric(from_to["arrival_time_y"].str.slice(3, 5))*60 + pd.to_numeric(from_to["arrival_time_y"].str.slice(6, 8))
from_to["duration"] = (arrival - depart)/60
summary = from_to.groupby(["place_id_x","place_id_y"],as_index=False).agg({"duration":["min","max","median","count"]})
summary.columns = ["place_id_x","place_id_y","duration_min", "duration_max", "duration_median", "duration_count"]
summary = summary.reset_index()
summary.to_csv("journeys.csv")

#where the journeys will be added (and summised)
#places_dictionary = {}
#with open(sys.argv[3]) as fp:
#    places = json.load(fp)


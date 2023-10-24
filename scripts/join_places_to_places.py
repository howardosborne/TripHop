import pandas as pd
import numpy as np
from datetime import datetime

from_to_summary_file = "./data/france/from_to_summary_france.csv"
from_to_places_file = "./data/france/from_to_places_france.csv"
#stops_places_df = pd.read_csv("./data/france/stops_places.csv")
stops_places_df = pd.read_csv("./data/france/stops_places_france.csv")
stop_times_df = pd.read_csv("./data/france/stop_times.txt")
#inner join the two to only get the stops that relate to interesting places
from_df = pd.merge(stops_places_df, stop_times_df, on="stop_id")
to_df = from_df.copy()
from_to = pd.merge(from_df,to_df,on="trip_id")
from_to = from_to[from_to["stop_sequence_y"] > from_to["stop_sequence_x"]]
depart = pd.to_numeric(from_to["departure_time_x"].str[0:2])*3600 + pd.to_numeric(from_to["departure_time_x"].str[3:5])*60 + pd.to_numeric(from_to["departure_time_x"].str[6:8])
arrival = pd.to_numeric(from_to["arrival_time_y"].str[0:2])*3600 + pd.to_numeric(from_to["arrival_time_y"].str[3:5])*60 + pd.to_numeric(from_to["arrival_time_y"].str[6:8])
from_to["duration"] = (arrival - depart)/60
summary = from_to.groupby(["place_id_x","place_id_y"],as_index=False)["duration"].mean()
summary.to_csv(from_to_summary_file)
#now join to places file on destination into
#places = pd.read_csv("./data/france/places.csv")
places = pd.read_csv("./data/france/places_france.csv")
wibble = pd.merge(places,summary,right_on="place_id_y",left_on="place_id")
wibble[["place_id","place_id_x","duration","place_id","place_name","stop_id","stop_name","stop_lat","stop_lon","place_brief_desc","place_longer_desc","place_image","place_tags","place_links"]].to_csv(from_to_places_file)
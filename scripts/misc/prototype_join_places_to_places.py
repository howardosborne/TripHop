import pandas as pd
import numpy as np
from datetime import datetime

#stops_places_df = pd.read_csv("./data/france/stops_places_france.csv")
stops_places_df = pd.read_csv("./data/spain/stops_places_spain.csv")
stop_times_df = pd.read_csv("./data/sources/20231022_010257_RENFE_AVLD/stop_times.txt")
#inner join the two to only get the stops that relate to interesting places
from_df = pd.merge(stops_places_df, stop_times_df, on="stop_id")
to_df = from_df.copy()
from_to = pd.merge(from_df,to_df,on="trip_id")
from_to = from_to[from_to["stop_sequence_y"] > from_to["stop_sequence_x"]]
#from_to[["departure_time_x_hour","departure_time_x_minute","departure_time_x_second"]] 
from_to["departure_time_x"] = from_to["departure_time_x"].str.pad(width=8 , side='left', fillchar='0')
depart = pd.to_numeric(from_to["departure_time_x"].str.slice(0, 2))*3600 + pd.to_numeric(from_to["departure_time_x"].str.slice(3, 5))*60 + pd.to_numeric(from_to["departure_time_x"].str.slice(6, 8))
#from_to[["arrival_time_y_hour","arrival_time_y_minute","arrival_time_y_second"]] 
from_to["arrival_time_y"] = from_to["arrival_time_y"].str.pad(width=8 , side='left', fillchar='0')
arrival = pd.to_numeric(from_to["arrival_time_y"].str.slice(0, 2))*3600 + pd.to_numeric(from_to["arrival_time_y"].str.slice(3, 5))*60 + pd.to_numeric(from_to["arrival_time_y"].str.slice(6, 8))
from_to["duration"] = (arrival - depart)/60
summary = from_to.groupby(["place_id_x","place_id_y"],as_index=False).agg({"duration":["min","max","median"]})
summary.columns = ["place_id_x","place_id_y","duration_min", "duration_max", "duration_median"]
summary = summary.reset_index()
summary.to_csv("./data/spain/from_to_summary_spain.csv")
from_to.to_csv("./data/spain/from_to_spain.csv")
#now join to places file on destination into
places = pd.read_csv("./data/spain/places_spain.csv")
wibble = pd.merge(places,summary,right_on="place_id_y",left_on="place_id")
from_to_places_file = "./data/spain/from_to_places_spain.csv"
wibble[["place_id","place_id_x","duration_min","duration_max","duration_median","place_id","place_name","stop_lat","stop_lon","place_brief_desc","place_longer_desc","place_image","place_tags","place_links"]].to_csv(from_to_places_file)
full_on = pd.merge(places,from_to,right_on="place_id_y",left_on="place_id")
full_on.to_csv("./data/spain/full_on_spain.csv")
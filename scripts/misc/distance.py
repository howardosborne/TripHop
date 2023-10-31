from math import sin, cos, sqrt, atan2, radians
import sys

# Approximate radius of earth in km
R = 6373.0

def distance_between_to_points(from_lat,from_lon,to_lat,to_lon):
    from_lat_rad = radians(from_lat)
    from_lon_rad = radians(from_lon)
    to_lat_rad = radians(to_lat)
    to_lon_rad = radians(to_lon)
    dist_lon = to_lon_rad - from_lon_rad
    dist_lat = to_lat_rad - from_lat_rad

    a = sin(dist_lat / 2)**2 + cos(from_lat_rad) * cos(to_lat_rad) * sin(dist_lon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    distance = R * c
    return distance

from_lat = float(sys.argv[1])
from_lon = float(sys.argv[2])
to_lat = float(sys.argv[3])
to_lon = float(sys.argv[4])
distance = distance_between_to_points(from_lat,from_lon,to_lat,to_lon)
print(f'{distance}')
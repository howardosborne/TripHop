import os, subprocess, glob
from flask import Flask, flash, render_template, abort, redirect, url_for, request, make_response, jsonify, session
import requests, csv, json
from werkzeug.utils import secure_filename
import random, string
import pandas as pd

app = Flask(__name__)
app.secret_key = b'dvdjldkvslfgjldkflgbgtjetkdlnfglnmdxcbzbmzbmzbmzxhdhjkhjfdgjrgrgrgrggke'

@app.route('/')
def root():
    return render_template('index.html')

@app.route('/map')
def projects(token=None):
    session['one_time_tokens'] = ""
    token = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    session['one_time_tokens'] = token
    return render_template('map.html', token=token)

@app.route('/accordion')
def accordion(token=None):
    return render_template('accordion.html', token=token)

@app.route('/play')
def play(token=None):
    return render_template('play.html', token=token)

#get a set of starting points
@app.route('/api/start')
def start():
    all_places = []
    places_file = "./data/france/places.csv"
    try:
        with open(places_file) as f:
            places = csv.DictReader(f)
            for place in places:
                 all_places.append(place)
    except:
        pass
    dump = json.dumps(all_places)
    return dump

#given a place id, get all the places that you can get to in a hop
@app.route('/api/destinations/<id>')
def destination(id=id):
    destinations = []
    places_file = "./data/france/from_to_places.csv"
    try:
        with open(places_file) as f:
            places = csv.DictReader(f)
            for place in places:
                if id == place["place_id_x"]:
                     destinations.append(place)
    except:
        print("summut went wrong...")
    dump = json.dumps(destinations)
    return dump

#get all the destinations
@app.route('/api/all_destinations')
def all_destinations():
    destinations = []
    destinations_file = "./data/france/from_to_places.csv"
    try:
        with open(destinations_file) as f:
            places = csv.DictReader(f)
            for place in places:
                 destinations.append(place)
    except:
        pass
    dump = json.dumps(destinations)
    return dump

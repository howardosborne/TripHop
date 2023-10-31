# TripHop

## process for making new places
fill out sheet
download tsv
make places files: make_places_json_files_from_places_tsv.py
make page cards: make_pages_cards_from_places_tsv.py

gtfs
get the stops relating to places and make a lookup : get_stops_for_entity_file.py
get the direct routes (hops) between places: find_direct_connections_between_stops.py
add (or modify) hops in places files: 

## where to get data 
There are various ways of getting night train and other transport information. Details of each are set out under the following headings

- [National Access Points](#National-Access-Points)
- [operator (and other) APIs](#Operator-APIs)
- [MERITS](#MERITS)


## Data formats
### GTFS
A commonly used format for gathering information is GTFS. You can find out more about the format here: https://developers.google.com/transit/gtfs and here: https://gtfs.org/

There are also resources on how to work with GTFS here: https://github.com/CUTR-at-USF/awesome-transit#gtfs-realtime-libraries--demo-apps

Core information such as operators, routes and stops is available as a zipped set of comma delimited .txt files to be downloaded periodically. This is referred to as static data.

Trafiklab, which serves Swedish transport, provides one of the clearest explanations of static data. The https://www.trafiklab.se/docs/using-trafiklab-data/using-gtfs-files/static-gtfs-files/

Realtime updates, or dynamic data is available via a call to an API. https://developers.google.com/transit/gtfs-realtime
A series of libraries have been created to interact with realtime data here: https://gtfs.org/resources/gtfs-realtime/

Extensions to the format include specifying which trains are night trains: 
https://developers.google.com/transit/gtfs/reference/extended-route-types

### NeTeX
An alternative format which is used in some cases is NeTeX. Details can be found here: https://netex-cen.eu/

## National Access Points
A model for accessing all transport information has been set up by the EU and consists of each member state being responsible for their own national access point.

The EU has provided links to each national access points (NAP) here: https://transport.ec.europa.eu/system/files/2023-09/its-national-access-points-2023-09-19.pdf

Further details on each NAP including practical information on how to access data is set out below.

### Austria
NAP: https://www.mobilitydata.gv.at/

A list of the datasets is here: https://data.mobilitaetsverbuende.at/de/data-sets

Static data (GTFS): Routes, stops and timetables can be downloaded here: https://data.oebb.at/de/datensaetze~soll-fahrplan-gtfs~

(not sure how to pick out the night train services)

For NeTeX: https://www.mobilitydata.gv.at/en/daten/soll-fahrplandaten-netex

### Belgium

NAP: https://www.transportdata.be/en/dataset/sncb-gfts-scheduled-timetable-and-real-time-data

TO access the service, you will need to complete a standard license agreement form and email it to sncb.be. Details are here: https://www.belgiantrain.be/en/support/forms/public-data

### Bulgaria
NAP: https://www.mtc.government.bg/en/category/294/national-access-points-transport-related-data

The NAP currently does not contain railway data

### Croatia
NAP: https://www.promet-info.hr/en/datasets

The endpoints were protected by basic authentication - not sure how to get access

### Cyprus
NAP: http://www.traffic4cyprus.org.cy/dataset

No trains...

### Czech Republic
NAP: http://registr.dopravniinfo.cz/en/

Site was down when last tried.

### Denmark
NAP: https://du-portal-ui.dataudveksler.app.vd.dk/

Static Data: https://www.rejseplanen.info/labs/GTFS.zip

### Estonia
NAP: https://web.peatus.ee/

Static Data: https://peatus.ee/gtfs/gtfs.zip

### Finland
NAP: http://www.finap.fi/

Static Data: https://traffic.navici.com/tiedostot/gtfs.zip

Route information (presumably a test site): https://vrgroup-test.apigee.io/

### France
NAP: https://transport.data.gouv.fr/

Intercites: https://eu.ftp.opendatasoft.com/sncf/gtfs/export-intercites-gtfs-last.zip

GTFS-RT, service Trip Updates : https://proxy.transport.data.gouv.fr/resource/sncf-ic-gtfs-rt-trip-updates

TER: https://eu.ftp.opendatasoft.com/sncf/gtfs/export-ter-gtfs-last.zip

TGV: https://eu.ftp.opendatasoft.com/sncf/gtfs/export_gtfs_voyages.zip

Thalys: https://www.data.gouv.fr/fr/datasets/r/cf7adb62-bbfe-4f1f-93f7-dbbad9fd60e4

### Germany 
NAP: https://service.mdm-portal.de/mdm-portal-application/

Download available to registered users: https://www.opendata-oepnv.de/ht/de/organisation/delfi/startseite

### Greece 
NAP: http://www.nap.gov.gr/

could not find dataset

### Hungary 
NAP: https://napportal.kozut.hu/#/

need to register and provide EU VAT number

### Ireland 
NAP: https://data.gov.ie

Static data: https://www.transportforireland.ie/transitData/Data/GTFS_Irish_Rail.zip

Real time: https://data.gov.ie/dataset/realtime-passenger-information-gtfsr/resource/cf4d42d8-9cde-45db-bac6-e2cfc9a9cc36?inner_span=True

### Italy 
NAP: http://www.cciss.it/

Can't find dataset

### Latvia

NAP: https://lvceli.lv/en/road-network/statistical-data/transport-sector-open-data/

Static data: https://www.pv.lv/xml/atdtransit/

### Lithuania 
NAP: www.visimarsrutai.lt/gtfs

Static data: https://www.visimarsrutai.lt/gtfs/gtfs_all.zip


### Luxembourg 
NAP: https://data.public.lu/en/

Static data: https://data.public.lu/fr/datasets/horaires-et-arrets-des-transport-publics-gtfs/

### Malta 
NAP: https://geoservices.transport.gov.mt/egis


### Netherlands
https://ntm.ndw.nu 

Static data: http://gtfs.openov.nl/gtfs-rt/gtfs-openov-nl.zip

### Norway 
NAP: https://transportportal.atlas.vegvesen.no/no/

Static data: https://storage.googleapis.com/marduk-production/outbound/gtfs/rb_norway-aggregated-gtfs.zip

Real time data: https://developer.entur.org/pages-real-time-intro

### Poland
NAP: https://dane.gov.pl/en/dataset

Cannot find static dataset

### Portugal 
NAP: https://nap-portugal.imt-ip.pt/nap/

Cannot find static dataset

### Romania 
NAP: https://pna.cestrin.ro/ 

https://data.gov.ro/organization/sc-informatica-feroviara-sa

### Slovakia 
NAP: https://odoprave.info

### Slovenia 
can't find NAP

### Spain 
NAP: https://nap.mitma.es/ 

filtering for trains https://nap.mitma.es/Files/List?filterTT=2&showFilterTT=true

RENFE - Media, Larga Distancia y AVE: https://nap.mitma.es/Account/Login?returnUrl=/Files/Detail/897

Cercanías Renfe: https://nap.mitma.es/Account/Login?returnUrl=/Files/Detail/929

### Sweden 
NAP: www.trafficdata.se 

Details on how to get static data: https://www.trafiklab.se/api/trafiklab-apis/gtfs-sverige-2/static-data/

You will need to get an API key to access the data.

Note - it doesn't include a shapes.txt file

### Switzerland 
NAP: www.opentransportdata.swiss

Static data: https://gtfs.geops.ch/dl/gtfs_complete.zip

### United Kingdom 
NAP: https://data.gov.uk/

## Operator APIs

### trafiklab (Sweden)

A full working example of how to make a gtfs-based application with real time updates is here:
https://github.com/trafiklab/gtfs-examples/tree/master/python/gtfsToTimetableApi

### Deutsche Bahn
Here's how to get started:
https://v5.db.transport.rest/getting-started.html

### SNCF
Details on what can be found at SNCF is here: https://ressources.data.sncf.com/

Here are some (vaguely useful) examples:

Object declared lost in real time
https://data.sncf.com/explore/dataset/objets-trouves-gares/table/?sort=date

And objects found
https://ressources.data.sncf.com/explore/dataset/objets-trouves-restitution/table/?sort=date

Prices in the bar
https://ressources.data.sncf.com/explore/dataset/menus-des-bars-tgv/table/?sort=date_debut

Cleanliness of stations
https://ressources.data.sncf.com/explore/dataset/proprete-en-gare/table/?sort=mois

Accessibility 
https://ressources.data.sncf.com/explore/dataset/equipements-accessibilite-en-gares/table/

Customer satisfaction
https://ressources.data.sncf.com/explore/dataset/barometre-client/information/

Pianos and table-football
https://ressources.data.sncf.com/explore/dataset/gares-pianos/information/?sort=piano

Accessibility
https://www.accessibilite.sncf.com/informations-et-services/accessibilite-gare-par-gare/

### The Trainline
https://github.com/trainline-eu

## MERITS
Railway information can also be obtained from MERITS, for which you need a licence.
https://uic.org/passenger/passenger-services-group/merits
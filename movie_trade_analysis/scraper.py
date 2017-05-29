# -*- coding: utf-8 -*-
# decoding: utf-8
#from BeautifulSoup import BeautifulSoup
from bs4 import BeautifulSoup
import urllib2
import re
from datetime import datetime
import xlsxwriter
import requests
from nameparser import HumanName
import os, sys
import MySQLdb
#import nltk
#nltk.download()
from nameparser.parser import HumanName

reload(sys)
sys.setdefaultencoding('utf-8')
 


#filters headlines to get only relevant content
headlineFilter = {"starts": 1, "adds": 1, "moving forward": 2, "in talks": 1, "to board":2, "boards":2, "teams up":1, 
"teams with":1, "reteams up": 1, "reteams with": 1, "picked up": 1, "picks up": 1,
"to star in": 2, "nabs": 1, "snags": 1, "in the works": 3, "lands":1, "lands at": 2, "sales": 1, "joins": 1, 
"to join": 2, "buys": 2, "to direct": 3, "to produce": 3, "casts": 2, "to play": 2, "debut": 1, 
"to make": 3, "acquire": 2, "development": 3, "circles": 2, "circling": 2, "sequel": -3, "trailer": -3, 
"dies": -3, "box office": -3, "film review": -3, "clip": -1, "remembers": -1, "release": -1, "award": -2,
"nominations": -3, "poll": -3, "$": -2, "oscars": -3, "rules": -1, "release": -1, "remember": -2, 
"premiere": -2, "spinoff": -3, "reboot": -3, "studio": -2, "sales": -1, "disney": -3}


agenciesFilter = ["WME", "CAA", "ICM", "UTA", "Paradigm", "Gersh", "APA", "Innovative Artists"]
def representation(text):
	res = ""
	for i in agenciesFilter:
		if i in text:
			if res != "":
				res += ", "
			res += i
	return res		


def developmentStage(text):
	if "acquire" in text.lower() or "acquisition" in text.lower():
		return "Acquired"
	else:
		return "Open for acquisition"


def nameExtraction(text, keyPhrase):
	'''Extract name roles from the article content.'''

	regEx = '([.][a-zA-Z0-9, ]*|[a-zA-Z0-9, ]*)' + keyPhrase + '(?!ly)(.*?)[.]'
	m = re.search(regEx, text)

	fullName = ''
	name = ""
	if m:
		found = m.group()
		subs = str(found)
		
		#print(subs)
		role = re.search('[A-Z][a-z]*[ ]([A-Z][a-z]*[ ]*)+', subs)
		allName = re.findall('([A-Z][a-z]*[ ][A-Z][a-z]*[ ](and[ ][A-Z][a-z]*[ ][A-Z][a-z]*[ ]?)?)',subs)
		print(allName)
		Names = {}
		NamesBeforekeyPhrase = {}
		NamesAfterkeyPhrase = {}
		print 'index of keyphrase: %s' % str(subs.index(keyPhrase))
		#print(subs.index(keyPhrase))
		dis = len(subs)
		for i in allName:
			#Names.append(i[0])
			
			if subs.index(i[0]) < subs.index(keyPhrase):
				NameToKeyword = subs.index(keyPhrase) - (subs.index(i[0])+len(i[0]) - 1)
				#Names[subs.index(keyPhrase) - subs.index(i[0])+len(i[0]) - 1] = i[0]
				#NamesBeforekeyPhrase[i[0]] = (subs.index(i[0])+len(i[0]))
			else:
				NameToKeyword = subs.index(i[0]) - (subs.index(keyPhrase) + len(keyPhrase) -1)
				#Names[subs.index(i[0]) - subs.index(keyPhrase) + len(keyPhrase) -1] = i[0]
				#NamesAfterkeyPhrase[i[0]] = subs.index(i[0])
			if NameToKeyword < dis:
				name = i[0]
				dis = NameToKeyword
			else:
				continue
		print 'index of name: %s' % str(dis)
		#print(name)
		#closest = sorted(Names.keys())
		#print(len(closest))
		if role:
			name = HumanName(str(role.group()))
			fullName = name.first + " " + name.last

	return str(name)






def scraper(url):
	'''Scrapes a full page'''

	movies = []

	#scrapes the full page
	html_page = urllib2.urlopen(url)
	soup = BeautifulSoup(html_page,"lxml")


	#scrapes all links on the home page that are film related
	links = []
	for link in soup.findAll('a', attrs={'href': re.compile("^http://variety.com/[a-zA-Z0-9_/]*film")}):
	    #print (link.get('href'))
	    if (link.get('href') in links):
	    	continue
	    else:
	    	links.append(link.get('href'))


	movieTitle = []
	tagsHeader = []

	#scrapes all the content from the links
	for link in links:
		movie = {}

		#scrapes the article
		link_page = urllib2.urlopen(link)
		articleHTML = BeautifulSoup(link_page,"lxml")

		#gets the title of the article
		tags = articleHTML.findAll('h1')
		tagsStr = str(tags[0])
		#print(articleHTML.findAll('time')[0]['datetime'][0:10])
		#gets the meta description of the article
		meta = articleHTML.find("meta", {"class":"swiftype", "data-type":"text"})

		#gets the article content from the meta description
		description = ''
		if meta:
			description = meta['content']


		#filters out relevant headlines based on keywords
		headerValue = 0;

		for key in headlineFilter.keys():
			if key in tagsStr.lower():
				headerValue = headerValue + headlineFilter[key]
		
		if(headerValue > 0):

			#finds name of roles
			movie["director"] = nameExtraction(description, "direct")
			movie["producer"] = nameExtraction(description, "produc")
			movie["actor"] = nameExtraction(description, "star")
			movie["developmentStage"] = developmentStage(description)
			movie["representation"] = representation(description)
			movie["dateTime"] = articleHTML.findAll('time')[0]['datetime'][0:10]
			movie["link"] = link
			print(link)


			tagsHeader.append(tagsStr.lower())
			start = tagsStr.find('\xe2\x80\x98') + 3
			end = tagsStr.find('\xe2\x80\x99', start)
			if("-" == tagsStr[end+3] 
				or "s\xe2\x80\x99" == tagsStr[end+3:end+7].lower()
				or "director" == tagsStr[end+4:end+12].lower()
				or "producer" == tagsStr[end+4:end+12].lower()
				or "writer" == tagsStr[end+4:end+10].lower()
				or "star" == tagsStr[end+4:end+8].lower()
				or "effects" == tagsStr[end+4:end+11].lower()):
				temp = tagsStr[end + 4:]
				start = temp.find('\xe2\x80\x98') + 3
				end = temp.find('\xe2\x80\x99', start)

				if("</h1" in temp[start:end]):
					start = 4
					end = temp.find("</h1", start)
				if (temp[start:end] in movieTitle):
					continue
				movie["title"] = temp[start:end]
				movies.append(movie)
				print(movie["title"])
				continue

			#if "d" == tagsStr[end+3].lower():
			#	end += tagsStr[end:].find('\xe2\x80\x99', 0)


			if("</h1" in tagsStr[start:end]):
				start = 4
				end = tagsStr.find("</h1", start)
			if (tagsStr[start:end] in movieTitle):
				continue

			movie["title"] = tagsStr[start:end]

			movies.append(movie)
			print(movie["title"])

	return movies


def excel_writer(movies):

	'''workbook = xlsxwriter.Workbook('Movies.xlsx')
	worksheet = workbook.add_worksheet()

	worksheet.set_column(0, 0, 50)

	worksheet.write('A1', 'Title')
	worksheet.write('B1', 'Actor')
	worksheet.write('C1', 'Director')
	worksheet.write('D1', 'Producer')
	worksheet.write('E1', 'Plot')
	worksheet.write('F1', 'IMDB Rating')
'''

	# Open database connection
	db = MySQLdb.connect("127.0.0.1","root","Lmy19940219","trade_analysis" )

	# prepare a cursor object using cursor() method
	cursor = db.cursor()

# Prepare SQL query to UPDATE required recordsv

	for movie in movies:

		#getting more info from the omdb API
		title = movie["title"]
		split = title.split()
		movieString = split[0]
		for i in range(1,len(split)):
			movieString+= "+" + split[i] 

		movieRequest = "http://www.omdbapi.com/?t=" + movieString

		r = requests.get(movieRequest)
		json = r.json()

		if 'imdbRating' in json.keys():
			imdbRating = json['imdbRating']
		else:
			imdbRating = 'Not found'

		if 'Plot' in json.keys():
			plot = json['Plot']
		else:
			plot = 'Not found'



		#sql = "INSERT INTO trade_analysis (TITLE,ACTORS,DIRECTOR, LOGLINE, PRODUCERS) VALUES (" + str(title) + "," + str(movie["actor"]) + "," + str(movie["director"]) + "," + str(plot) + "," + str(movie["producer"]) + ");"
		sql = "INSERT INTO trade_analysis (TITLE,ACTORS,DIRECTOR, PRODUCERS,Development_Stage,Representation,Date_Published,link) VALUES ('%s','%s','%s','%s','%s','%s','%s','%s');" %(str(title), str(movie["actor"]),str(movie["director"]),str(movie["producer"]),str(movie["developmentStage"]), str(movie["representation"]), str(movie["dateTime"]), str(movie["link"]))
		#sql = ""
		#sql = "INSERT INTO trade_analysis (DIRECTOR) VALUES ('%s'); where title = '%s'" % (movieTitle[movie],movie)
		#sql = "INSERT INTO trade_analysis (TITLE) VALUES ('%s');" % (title)
		#sql += "INSERT INTO trade_analysis (ACTORS) VALUES ('%s') where title = '%s';" % (movie["actor"],title)

		try:
   			# Execute the SQL command
   			cursor.execute(sql)
   			# Commit your changes in the database
   			print("commit")
   			db.commit()
		except:
			print("rollback")
   			# Rollback in case there is any error
   			db.rollback()

		#excel writer
		'''worksheet.write_string(movies.index(movie)+1, 0,title)
		worksheet.write_string(movies.index(movie)+1, 1,movie["actor"])
		worksheet.write_string(movies.index(movie)+1, 2,movie["director"])
		worksheet.write_string(movies.index(movie)+1, 3,movie["producer"])
		worksheet.write_string(movies.index(movie)+1, 4,plot)
		worksheet.write_string(movies.index(movie)+1, 5,imdbRating)'''

	#workbook.close()

	# disconnect from server
	db.close()


def main():

	movies = []


	for pageNum in range(16,18):
		if pageNum == 1:
			url = "http://variety.com/v/film/"
		url = "http://variety.com/v/film/page/" + str(pageNum) + "/"
		movie = scraper(url)
		for m in movie:
			movies.append(m)


	excel_writer(movies)



main()

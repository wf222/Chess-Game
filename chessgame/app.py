from flask import Flask, render_template, request
from random import random, seed
from flask_mysqldb import MySQL
import json
from datetime import date

app = Flask(__name__)
app.config['MYSQL_HOST'] = 'mysql.2021.lakeside-cs.org'
app.config['MYSQL_USER'] = 'student2021'
app.config['MYSQL_PASSWORD'] = 'm545CS42021'
app.config['MYSQL_DB'] = '2021playground'
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'
mysql = MySQL(app)

@app.route('/')
def index():
	cursor = mysql.connection.cursor()
	query = "SELECT * FROM `williamfang_games` ORDER BY id"
	cursor.execute(query)
	mysql.connection.commit()
	data = cursor.fetchall()
	print(str(data))

	temp = 1

	while temp <= len(data):
		if temp == data[temp - 1]['id']:
			temp = temp + 1
		else:
			break

	return render_template('home.html', gameId=temp)

#This method loads the game!
@app.route('/play', methods=['POST'])
def play():
	cursor = mysql.connection.cursor()
	

	
	gameId = request.form.get("id")
	whiteName = request.form.get("whiteName")
	blackName = request.form.get("blackName")
	isValid = True
	gameExists = False
	print(gameId)

	if len(gameId) < 1 or len(whiteName) < 1 or len(blackName) < 1:
		print(len(gameId))
		isValid = False
	elif not gameId.isnumeric():
		isValid = False
	else :
		query = "SELECT * FROM `williamfang_games` ORDER BY id"
		cursor.execute(query)
		mysql.connection.commit()
		data = cursor.fetchall()
		#Got this from python documentation
		current = date.today().strftime("%d/%m/%Y").split("/")
		hashed = int(current[0]) + int(current[1]) * 30 + int(current[2]) * 365

		for row in data:
			if str(row['id']) == gameId:
				print("was here")
				gameExists = True
			#Deletes a game after around 14 days if not played
			if hashed - hashDate(str(row['modified'])) > 14:
				deleteGame(row['id'])

	if isValid:
		if not gameExists:
			if request.form.get("isContinue") != None:
				isValid = False
				return render_template('invalid.html')
			query = "INSERT INTO `williamfang_games`(`id`, `turn`, `white`, `black`, `modified`) VALUES (" + gameId + ", 'white', %s, %s, CURRENT_DATE())"
			queryVars = (whiteName, blackName,)
			cursor.execute(query, queryVars)
			mysql.connection.commit()

			query = getStarterString(gameId)
			cursor.execute(query)
			mysql.connection.commit()

		query = "SELECT * FROM `williamfang_boards` WHERE id='" + gameId + "' ORDER BY y, x"
		cursor.execute(query)
		mysql.connection.commit()
		data = cursor.fetchall()

		query = "SELECT * FROM `williamfang_games` WHERE id='" + gameId + "'"
		cursor.execute(query)
		mysql.connection.commit()
		game = cursor.fetchone()
		turn = game['turn']
		whiteName = game['white']
		blackName = game['black']

		return render_template('index.html', data=data, turn=turn, id=gameId, whiteName=whiteName, blackName=blackName)
	else:
		return render_template('invalid.html')

def hashDate(dateString):
	current = dateString.split("-")
	hashed = int(current[2]) + int(current[1]) * 30 + int(current[0]) * 365
	return hashed

@app.route('/end', methods=['POST'])
def end():
	cursor = mysql.connection.cursor()
	query = "SELECT * FROM `williamfang_games` WHERE `id`=" + request.args['id']
	cursor.execute(query,)
	mysql.connection.commit()
	data = cursor.fetchone()

	whiteName = data['white']
	blackName = data['black']

	winner = request.args['winner']
	print("MADE IT HERE 1111")
	if winner == "draw":
		print("MADE IT HERE 1112")
		tie(blackName)
		tie(whiteName)
	elif winner == "black":
		print("MADE IT HERE 1113")
		win(blackName)
		lose(whiteName)
	else:
		print("MADE IT HERE 1114")
		win(whiteName)
		lose(blackName)
	print("MADE IT HERE 1115    " + str(int(request.args['id'])))
	deleteGame(int(request.args['id']))
	print("faoiofoiewfoiwjefowefewiewf")
	return "jfdkdfkd";

def win(winner):
	cursor = mysql.connection.cursor()
	query = "SELECT * FROM `williamfang_players` WHERE `name`=%s"
	queryVars = (winner,)
	cursor.execute(query, queryVars)
	mysql.connection.commit()
	data = cursor.fetchall()

	if len(data) > 0:
		query = "UPDATE `williamfang_players` SET `wins`=%s WHERE `name`=%s"
		queryVars = (str(data[0]['wins'] + 1),winner,) #Adding one to wins
	else:
		query = "INSERT INTO `williamfang_players`(`name`, `wins`, `losses`, `ties`) VALUES (%s,1,0,0)"
		queryVars= (winner,)
	cursor.execute(query, queryVars)
	mysql.connection.commit()

def lose(loser):
	cursor = mysql.connection.cursor()
	query = "SELECT * FROM `williamfang_players` WHERE `name`=%s"
	queryVars = (loser,)
	cursor.execute(query, queryVars)
	mysql.connection.commit()
	data = cursor.fetchall()

	if len(data) > 0:
		query = "UPDATE `williamfang_players` SET `losses`=%s WHERE `name`=%s"
		queryVars = (str(data[0]['losses'] + 1),loser,) #Adding one to losses
	else:
		query = "INSERT INTO `williamfang_players`(`name`, `wins`, `losses`, `ties`) VALUES (%s,0,1,0)"
		queryVars= (loser,)
	cursor.execute(query, queryVars)
	mysql.connection.commit()

def tie(player):
	cursor = mysql.connection.cursor()
	query = "SELECT * FROM `williamfang_players` WHERE `name`=%s"
	queryVars = (player,)
	cursor.execute(query, queryVars)
	mysql.connection.commit()
	data = cursor.fetchall()

	if len(data) > 0:
		query = "UPDATE `williamfang_players` SET `ties`=%s WHERE `name`=%s"
		queryVars = (str(data[0]['ties'] + 1),player,) #Adding one to ties
	else:
		query = "INSERT INTO `williamfang_players`(`name`, `wins`, `losses`, `ties`) VALUES (%s,0,0,1)"
		queryVars= (player,)
	cursor.execute(query, queryVars)
	mysql.connection.commit()

def deleteGame(gameId):
	cursor = mysql.connection.cursor()
	query = "DELETE FROM `williamfang_games` WHERE `id`=" + str(gameId)
	print(query)
	cursor.execute(query)
	mysql.connection.commit()

	print("ELLO MATE")

	query = "DELETE FROM `williamfang_boards` WHERE `id`=" + str(gameId)
	print(query)
	cursor.execute(query)
	mysql.connection.commit()

def getStarterString(gameId):
	print(gameId)
	query = "INSERT INTO `williamfang_boards`(`id`, `type`, `color`, `x`, `y`, `moved`) VALUES"
	for i in range(32):
		y = 5
		if i < 8:
			y = 2
		elif i < 16:
			y = 3
		elif i < 24:
			y = 4
		query = query + " (" + str(gameId) + ", ' ', 'none', " + str(i % 8) + ", " + str(y) + ", '0'),"
	for i in range(8):
		query = query + " (" + str(gameId) + ", 'p', 'black', " + str(i) + ", '1', '0'),"
	for i in range(8):
		query = query + " (" + str(gameId) + ", 'p', 'white', " + str(i) + ", '6', '0'),"
	for i in range(2):
		query = query + " (" + str(gameId) + ", 'r', 'black', " + str(i * 7) + ", '0', '0'),"
	for i in range(2):
		query = query + " (" + str(gameId) + ", 'r', 'white', " + str(i * 7) + ", '7', '0'),"
	for i in range(2):
		query = query + " (" + str(gameId) + ", 'n', 'black', " + str(i * 5 + 1) + ", '0', '0'),"
	for i in range(2):
		query = query + " (" + str(gameId) + ", 'n', 'white', " + str(i * 5 + 1) + ", '7', '0'),"
	for i in range(2):
		query = query + " (" + str(gameId) + ", 'b', 'black', " + str(i * 3 + 2) + ", '0', '0'),"
	for i in range(2):
		query = query + " (" + str(gameId) + ", 'b', 'white', " + str(i * 3 + 2) + ", '7', '0'),"
	query = query + " (" + str(gameId) + ", 'q', 'black', " + str(3) + ", '0', '0'),"
	query = query + " (" + str(gameId) + ", 'q', 'white', " + str(3) + ", '7', '0'),"
	query = query + " (" + str(gameId) + ", 'k', 'black', " + str(4) + ", '0', '0'),"
	query = query + " (" + str(gameId) + ", 'k', 'white', " + str(4) + ", '7', '0')"
	return query
	

# Generates a random number
def getRand():
	num = random()
	num = round(num, 3)
	num = int(1000*num)
	return num

@app.route('/getBoard', methods=['POST'])
def getBoard():
	cursor = mysql.connection.cursor()
	query =  "SELECT * FROM `williamfang_boards` WHERE id=" + request.args['id'] + " ORDER BY y, x"
	cursor.execute(query)

	boardString = cursor.fetchall()

	board = ((str(boardString).replace("'", "\"")).replace("(", "[")).replace(")", "]") #Turning it into JSON format

	cursor.close()
	return board


@app.route('/move', methods=['POST'])
def move():
	
	#print(request.args['pieceX'] + " " + request.args['pieceY'] + " " + request.args['moveX'] + " " + request.args['moveY'])

	cursor = mysql.connection.cursor()
	query =  ("DELETE FROM williamfang_boards WHERE x=" + request.args['moveX'] + " AND y=" + request.args['moveY'] + 
			 " AND id=" + request.args['id'])
	cursor.execute(query)
	mysql.connection.commit()

	query = ("UPDATE williamfang_boards SET `x`=" + request.args['moveX'] + ", `y`=" + request.args['moveY'] + 
	", `moved`=1 WHERE x=" + request.args['pieceX'] + " AND y=" + request.args['pieceY'] + " AND id=" + request.args['id'])
	cursor.execute(query)
	mysql.connection.commit()

	query = ("INSERT INTO `williamfang_boards`(`id`, `type`, `color`, `x`, `y`, `moved`) VALUES (" +
	request.args['id'] + ", ' ', 'none', " + request.args['pieceX'] + ", " + request.args['pieceY'] + ", 1)")
	cursor.execute(query)
	mysql.connection.commit()
	


	query = "SELECT * FROM `williamfang_boards` WHERE id=" + request.args['id'] + " ORDER BY y, x"

	cursor.execute(query)


	boardString = cursor.fetchall()
	
	movedPiece = boardString[int(request.args['moveX']) + 8 * int(request.args['moveY'])]
	print(str(movedPiece))
	movedColor = movedPiece["color"]
	print(movedColor)
	oppColor = "white"
	if movedColor == "white":
		oppColor = "black"

	query = "UPDATE `williamfang_games` SET `turn`='" + oppColor + "', `modified`=CURRENT_DATE() WHERE id=" + request.args['id']
	print(query)
	cursor.execute(query)
	mysql.connection.commit()



	board = ((str(boardString).replace("'", "\"")).replace("(", "[")).replace(")", "]") #Turning it into JSON format
	#print(board)
	cursor.close()
	return (board + oppColor)

@app.route('/update', methods=['POST'])
def update():
	cursor = mysql.connection.cursor()

	query = ("UPDATE williamfang_boards SET `type`='" + request.args['type'] + 
	"', `moved`=0 WHERE x=" + request.args['x'] + " AND y=" + request.args['y'] + " AND id=" + request.args['id'])

	cursor.execute(query)
	mysql.connection.commit()

	query = "SELECT * FROM `williamfang_boards` WHERE id=" + request.args['id'] + " ORDER BY y, x"

	cursor.execute(query)


	boardString = cursor.fetchall()

	board = ((str(boardString).replace("'", "\"")).replace("(", "[")).replace(")", "]") #Turning it into JSON format
	print(board)
	cursor.close()
	return board

@app.route('/players')
def players():
	cursor = mysql.connection.cursor()
	query = "SELECT * FROM `williamfang_players`"
	cursor.execute(query)
	mysql.connection.commit()
	data = cursor.fetchall()

	return render_template('players.html',data=data)
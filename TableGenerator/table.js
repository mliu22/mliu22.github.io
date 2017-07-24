var table_data = [ { first_name : 'Rose',
                     last_name  : 'Tyler',
                     home       : 'Earth' },
                   { first_name : 'Zoe',
                     last_name  : 'Heriot',
                     home       : 'Space Station W3'},
                   { first_name : 'Jo',
                     last_name  : 'Grant',
                     home       : 'Earth'},
                   { first_name : 'Leela',
                     last_name  : null,
                     home       : 'Unspecified'},
                   { first_name : 'Romana',
                     last_name  : null,
                     home       : 'Gallifrey'},
                   { first_name : 'Clara',
                     last_name  : 'Oswald',
                     home       : 'Earth'},
                   { first_name : 'Adric',
                     last_name  : null,
                     home       : 'Alzarius'},
                   { first_name : 'Susan',
                     last_name  : 'Foreman',
                     home       : 'Gallifrey'} ];


function generate(divID){
	var divElem = document.getElementById(divID.toString());

	if(divElem.childNodes[3] == undefined){
		var g = new Table(table_data, divID);
		g.generateTable();	
	}else{
 		divElem.removeChild(divElem.childNodes[3]);
	}

	if (divID == "jsTable" && divElem.childNodes.length > 2){
		divElem.removeChild(divElem.childNodes[2]);
	}
	
}

function Table(data, DivID){
	this.locDiv = document.getElementById(DivID.toString());
	this.data = data;
	this.keys = Object.keys(data[0])
	console.log("generateTable");
}

Table.prototype.generateTable = function() {
	// body...
	console.log("yeah");
	this.Div = document.createElement('div');
	this.Div.id = "Table";
	this.Div.style = "box-shadow: none;"

	this.tbl = document.createElement('table');

	this.trth = document.createElement('tr');
	th1 = document.createElement('th');
	th1.innerHTML = "First Name";
	this.trth.appendChild(th1);

	th2 = document.createElement('th');
	th2.innerHTML = "Last Name";
	this.trth.appendChild(th2);

	th3 = document.createElement('th');
	th3.innerHTML = "Home";
	this.trth.appendChild(th3);

	this.tbl.appendChild(this.trth);
	for(var c = 0; c < this.data.length; c++){
		this.tr = document.createElement('tr');
		for(var t = 0; t < this.keys.length; t++){
			td = document.createElement('td');

			td.innerHTML = this.data[c][this.keys[t]];
			if(this.data[c][this.keys[t]] == null){
				td.innerHTML = "N/A"
			}
			this.tr.appendChild(td);
		}
		this.tbl.appendChild(this.tr);
	}
	
	this.Div.appendChild(this.tbl);
	this.locDiv.appendChild(this.Div);

	console.log(this.Div)
};







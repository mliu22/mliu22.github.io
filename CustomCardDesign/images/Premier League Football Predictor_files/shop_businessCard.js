
var pickColorSel;
function pickColor(sel){
	switch(sel){
		case 1: 			//font color
			pickColorSel = 1;
			document.getElementById("backgroundColorPicker").style.display = "block";
			document.getElementById("backgroundColorPicker").style.top = "400px";
			document.getElementById("backgroundColorPicker").style.left = "950px";

			// draggable("backgroundColorPicker");
		break;
		case 2: 			//bg color
			pickColorSel = 2;
			document.getElementById("backgroundColorPicker").style.display = "block";
			document.getElementById("backgroundColorPicker").style.top = "280px";
			// draggable("backgroundColorPicker");
		break;
	}

	document.getElementById("fixedColorPickerID").style.display = "none";
	

	
}

function fixedPickColorSection(){
	if(document.getElementById("fixedColorPickerID").style.display == "block"){
		document.getElementById("fixedColorPickerID").style.display = "none";
	}else{
		document.getElementById("fixedColorPickerID").style.display = "block";
		document.getElementById("fixedColorPickerID").style.top = "320px";
		document.getElementById("fixedColorPickerID").style.left = "700px";
	}
	
}

function fixedColorChosen(hex){
	switch(pickColorSel){
		case 1: 			//font color
			// pickColorSel = 1;
			// document.getElementById("backgroundColorPicker").style.display = "block";

			document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).style.color = hex;
          	document.getElementById("fontColorSample" + selectedWorkZoneTextBoxID.toString()).style.backgroundColor = hex;

		break;
		case 2: 			//bg color
			// pickColorSel = 2;
			// document.getElementById("backgroundColorPicker").style.display = "block";

			document.getElementById("colorSample").style.backgroundColor = hex;
	        document.getElementById("plainColorID").style.backgroundColor = hex;
	        document.getElementById("plainColorID").style.display = "block";

		break;
	}
}

function BGChosen(imgId){
	document.getElementById("businessCardBGImg").src = "businessCardBG/img" + imgId + ".png";
	ActiveDefaultBg()

}

function closeColorPicker(){
	document.getElementById("backgroundColorPicker").style = "display: none;"
}

function businessCardFrontSide(){
	document.getElementById("frontSide").style.display = "block";
	document.getElementById("backSide").style.display = "none";
	document.getElementById("frontSideButton").style.backgroundColor = "lightgray";
	document.getElementById("backSideButton").style.backgroundColor = "white";
	document.getElementById("FrontSideEditor").style.display = "block";
	document.getElementById("backSideEditor").style.display = "none";
	
}

function businessCardBackSide(){
	document.getElementById("backSide").style.display = "block";
	document.getElementById("frontSide").style.display = "none";
	document.getElementById("frontSideButton").style.backgroundColor = "white";
	document.getElementById("backSideButton").style.backgroundColor = "lightgray";
	document.getElementById("FrontSideEditor").style.display = "none";
	document.getElementById("backSideEditor").style.display = "block";
}

function main(){
  draggable('workZoneTextBox1');
}

function addBGimg(){

}

function tabChosen(tabID, hiddenIDs,liID, liHiddenIDs){
	document.getElementById(tabID).style.display = "block";
	document.getElementById(liID).classList.add("selected");
	for(var i = 0; i < hiddenIDs.length; i++){
		document.getElementById(hiddenIDs[i]).style.display = "none";
		document.getElementById(liHiddenIDs[i]).classList.remove("selected")
	}
}

var businessCardTextBoxAmt = 4;

function addTextField(sel){
	switch(sel){
		case 1:    			//frontside
			businessCardTextBoxAmt += 1;
			var d = document.getElementById("tab1");
		   	d.innerHTML += '<input type="text" name="text' + businessCardTextBoxAmt.toString() + '" placeholder="New Text Box" onfocus="selectTextBox(' + businessCardTextBoxAmt.toString() + ');" oninput="updateTextBox();"> \n';

		   	var iDiv1 = document.createElement('div');
		   	iDiv1.className = 'TextBoxButtons';
		   	iDiv1.id = 'TextBoxButtonsID' + businessCardTextBoxAmt.toString();
		   	d.appendChild(iDiv1);

		   	document.getElementById('TextBoxButtonsID' + businessCardTextBoxAmt.toString()).innerHTML += '<button class="editTextBox" onclick="selectTextBox(' + businessCardTextBoxAmt.toString() + '); enableEdit();"><img src="images/editPencil.png" alt="editPencil" style="width: 70%;"></button>\n';
		   	
		   	document.getElementById('TextBoxButtonsID' + businessCardTextBoxAmt.toString()).innerHTML += '<button class="deleteTextBox">&#9747;</button>';
		 	

		   	var iDiv2 = document.createElement('div');
		   	iDiv2.className = 'editTextBoxOptions';
		   	iDiv2.id = 'editSection' + businessCardTextBoxAmt.toString();
		   	iDiv2.innerHTML += '<hr class="style6"> Font:';
		   	// iDiv2.style.display = 'block';
		   	d.appendChild(iDiv2);
		   	
		   	// document.getElementById("editSection" + businessCardTextBoxAmt.toString()).innerHTML += '<hr class="style6"> Font:';
		   	var iSel = document.createElement('select');
		   	iSel.className = "fontFamily";
		   	iSel.innerHTML = '<option value="volvo">Volvo</option>';
		   	iSel.innerHTML += '<option value="saab">Saab</option>';
		   	iSel.innerHTML += '<option value="mercedes">Mercedes</option>';
		   	iSel.innerHTML += '<option value="audi">Audi</option>';
		   	document.getElementById("editSection" + businessCardTextBoxAmt.toString()).appendChild(iSel);

		   	var iDiv3 = document.createElement('div');
		   	iDiv3.className = 'fontColor';
		   	iDiv3.id = 'fontColorSample' + businessCardTextBoxAmt.toString();
		   	document.getElementById("editSection" + businessCardTextBoxAmt.toString()).appendChild(iDiv3);

		   	var iBut = document.createElement('button');
		   	iBut.className = 'fontColorPicker';
		   	// iBut.id = 'fontColorPickerID' + businessCardTextBoxAmt.toString();
		   	// iBut.onclick = pickColor(businessCardTextBoxAmt);
		   	// iBut.innerHTML += '<button class="fontColorPicker" onclick="pickColor(' + businessCardTextBoxAmt.toString() + ');">';
		   	// iDiv3.innerHTML += '<img src="images/colorCircle.png" alt="colorCircle" style="width: 80%;">';
		   	// iDiv3.innerHTML += '</button>';
		   	document.getElementById("editSection" + businessCardTextBoxAmt.toString()).appendChild(iBut);
		   	// document.getElementById("fontColorPickerID" + businessCardTextBoxAmt.toString()).onclick

		   	// document.getElementById("editSection" + businessCardTextBoxAmt.toString()).innerHTML += '<select class="fontFamily"> <option value="volvo">Volvo</option><option value="saab">Saab</option><option value="mercedes">Mercedes</option><option value="audi">Audi</option></select>';

		   	console.log(d);



		   	document.getElementById('textBoxes').innerHTML += '<div class="businessCardTextBox" id="workZoneTextBox' + businessCardTextBoxAmt.toString() + '" style="top:250px; left:90px; text-transform: uppercase; font-size: 1em;" onclick="selectTextBox(' + businessCardTextBoxAmt.toString() + ');">New Text Box</div>';
		   	selectTextBox(businessCardTextBoxAmt);
		break;
		case 2: 			//backside
		break;
	}
	
}


var selectedWorkZoneTextBoxID = 1;

function updateTextBox(){
	//'workZoneTextBox4','text4'
	console.log("gets here!")
	document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).innerHTML = document.getElementsByName("text" + selectedWorkZoneTextBoxID.toString())[0].value;
}

function selectTextBox(ID){
	//"workZoneTextBox1"
	// console.log(ID)
	// console.log("workZoneTextBox" + selectedWorkZoneTextBoxID.toString())
	document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).classList.remove("selected");
	document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).style.zIndex = "1000";
	document.getElementById("workZoneTextBox" + ID.toString()).classList.add("selected");
	document.getElementById("workZoneTextBox" + ID.toString()).style.zIndex = "2000";

	if(selectedWorkZoneTextBoxID != ID){
		editSectionID = "editSection" + selectedWorkZoneTextBoxID.toString();
		document.getElementById(editSectionID).style.display = "none";
	}


	draggable("workZoneTextBox" + ID.toString());
	selectedWorkZoneTextBoxID = ID;
	editSectionID = "editSection" + selectedWorkZoneTextBoxID.toString();
	document.getElementById(editSectionID).style.display = "block";
}

var enabledEditSectionID = "";
var showEdit = false;

function enableEdit(){
	//'editSection1' as input
	editSectionID = "editSection" + selectedWorkZoneTextBoxID.toString();
	if(enabledEditSectionID == editSectionID){
		document.getElementById(enabledEditSectionID).style.display = "none";
		enabledEditSectionID = "";
	}else{
		if(enabledEditSectionID != ""){
			document.getElementById(enabledEditSectionID).style.display = "none";
		}
		document.getElementById(editSectionID).style.display = "block";
		enabledEditSectionID = editSectionID;
	}
	pickColorSel = 1;
}

function editFontSize(){
	fontID = "BusinessFont" + selectedWorkZoneTextBoxID.toString();
	size = Number(document.getElementsByName(fontID)[0].value) * 10;
	document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).style.fontSize = size + "px";
	
}

function BoldButton(){
	
	if(document.getElementById("bold" + selectedWorkZoneTextBoxID.toString()).classList.contains("selected")){
		document.getElementById("bold" + selectedWorkZoneTextBoxID.toString()).classList.remove("selected");
		document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).style.fontWeight = "normal";
	}else{
		document.getElementById("bold" + selectedWorkZoneTextBoxID.toString()).classList.add("selected");
		document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).style.fontWeight = "bold";
	}

}

function ItalicButton(){
	if(document.getElementById("italic" + selectedWorkZoneTextBoxID.toString()).classList.contains("selected")){
		document.getElementById("italic" + selectedWorkZoneTextBoxID.toString()).classList.remove("selected");
		document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).style.fontStyle = "normal";
	}else{
		document.getElementById("italic" + selectedWorkZoneTextBoxID.toString()).classList.add("selected");
		document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).style.fontStyle = "italic";
	}
}

function UnderlineButton(){
	if(document.getElementById("underline" + selectedWorkZoneTextBoxID.toString()).classList.contains("selected")){
		document.getElementById("underline" + selectedWorkZoneTextBoxID.toString()).classList.remove("selected");
		document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).style.textDecoration = "none";
	}else{
		document.getElementById("underline" + selectedWorkZoneTextBoxID.toString()).classList.add("selected");
		document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).style.textDecoration = "underline";
	}
}

function leftAlignButton(){
	document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).style.textAlign = "left";
	document.getElementById("left_align" + selectedWorkZoneTextBoxID.toString()).classList.add("selected");

	document.getElementById("center_align" + selectedWorkZoneTextBoxID.toString()).classList.remove("selected");
	document.getElementById("right_align" + selectedWorkZoneTextBoxID.toString()).classList.remove("selected");

}

function centerAlignButton(){
	document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).style.textAlign = "center";
	document.getElementById("center_align" + selectedWorkZoneTextBoxID.toString()).classList.add("selected");


	document.getElementById("left_align" + selectedWorkZoneTextBoxID.toString()).classList.remove("selected");
	document.getElementById("right_align" + selectedWorkZoneTextBoxID.toString()).classList.remove("selected");
}

function rightAlignButton(){
	document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).style.textAlign = "right";
	document.getElementById("right_align" + selectedWorkZoneTextBoxID.toString()).classList.add("selected");

	document.getElementById("left_align" + selectedWorkZoneTextBoxID.toString()).classList.remove("selected");
	document.getElementById("center_align" + selectedWorkZoneTextBoxID.toString()).classList.remove("selected");
	
}


function ActiveDefaultBg(){
	document.getElementById("plainColorID").style.display = "none";
}

function uploadImg(){
	path = document.getElementById("img1").value.slice(12,document.getElementById("img1").value.length);
	document.getElementById("businessCardBGImg").src = "";

}

//dragging code
window.onload = function(){
    // draggable('workZoneTextBox1');
};

var dragObj = null;
var xDrag;
var yDrag;
var xPos;
var yPos;

function draggable(id)
{
    var obj = document.getElementById(id);
    obj.style.position = "absolute";
    obj.onmousedown = function(e){
    	// selectTextBox(id.slice(15,id.length));
        dragObj = obj;
        xPos = e.pageX;
        yPos = e.pageY;
    }
}

document.onmouseup = function(e){
    
    if(document.getElementById("verticalDivider").style.opacity == "1"){
    	console.log("got it!!!!!!")
    	dragObj.style.left = Number(document.getElementById("verticalDivider").offsetLeft) - dragObj.offsetWidth/2 + "px";
    }

    if(document.getElementById("horizontalDivider").style.opacity == "1"){
    	dragObj.style.top = 210.5 - dragObj.offsetHeight/2 + "px";
    }

    dragObj = null;
    document.getElementById("horizontalDivider").style.opacity = "0";
    document.getElementById("verticalDivider").style.opacity = "0";
};

document.onmousemove = function(e){
    var x = e.pageX;
    var y = e.pageY;

    xDrag = x - xPos;
	yDrag = y - yPos;
    if(dragObj == null)
        return;
    // console.log(dragObj.style.left.slice(0,dragObj.style.left.length-2))
    dragObj.style.left = (Number(dragObj.style.left.slice(0,dragObj.style.left.length-2)) + Number(xDrag)) +"px";
    dragObj.style.top = (Number(dragObj.style.top.slice(0,dragObj.style.top.length-2)) + Number(yDrag)) +"px";

    console.log("dragging");
    dragObjWidthCenter = dragObj.offsetWidth/2 + Number(dragObj.style.left.slice(0,dragObj.style.left.length-2));

    if(dragObjWidthCenter - document.getElementById("verticalDivider").offsetLeft < 3 && dragObjWidthCenter - document.getElementById("verticalDivider").offsetLeft > -3){
    	document.getElementById("verticalDivider").style.opacity = "1";
    }else{
    	document.getElementById("verticalDivider").style.opacity = "0";
    }


    dragObjHeightCenter = dragObj.offsetHeight/2 + Number(dragObj.style.top.slice(0,dragObj.style.top.length-2));
    console.log(dragObjHeightCenter - 210.5)
    if(dragObjHeightCenter - 210.5 < 3 && dragObjHeightCenter - 210.5 > -3){
    	document.getElementById("horizontalDivider").style.opacity = "1";
    }else{
    	document.getElementById("horizontalDivider").style.opacity = "0";
    }

    xPos = x;
    yPos = y;

};


function convertIMG(){
	html2canvas(document.getElementById("workZone"), {
	    onrendered: function (canvas) {
	        var imageData = canvas.toDataURL('image/png',1.0); 
	 	}
	});
}


//dragging code end

function deselectTextBox() {
    if (window.event.srcElement.id != 'workZoneTextBox' + selectedWorkZoneTextBoxID) {
    	document.getElementById('workZoneTextBox'+selectedWorkZoneTextBoxID).classList.remove("selected");
    	// console.log(document.getElementById('workZoneTextBox'+selectedWorkZoneTextBoxID).clientHeight);
    	// console.log(document.getElementById('workZoneTextBox'+selectedWorkZoneTextBoxID).style.top);
    }
}



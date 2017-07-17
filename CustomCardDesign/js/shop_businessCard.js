
var pickColorSel;
function pickColor(sel){
	switch(sel){
		case 1: 			//font color
			pickColorSel = 1;
			document.getElementById("backgroundColorPicker").style.display = "block";
			posTop = document.getElementById("TexBoxEditor").style.top.slice(0,document.getElementById("TexBoxEditor").style.top.length-2);
			document.getElementById("backgroundColorPicker").style.top = Number(posTop) + 20 + "px";
			posLeft = document.getElementById("TexBoxEditor").style.left.slice(0,document.getElementById("TexBoxEditor").style.left.length-2)
			document.getElementById("backgroundColorPicker").style.left = Number(posLeft) + 550 + "px";

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

function fixedPickColorSection(sel){
	switch(sel){
		case 1: 				//font color
			if(document.getElementById("fixedColorPickerID").style.display == "block"){
				document.getElementById("fixedColorPickerID").style.display = "none";
			}else{
				document.getElementById("fixedColorPickerID").style.display = "block";
				posTop = document.getElementById("TexBoxEditor").style.top.slice(0,document.getElementById("TexBoxEditor").style.top.length-2);
				document.getElementById("fixedColorPickerID").style.top = Number(posTop) - 150 + "px";

				posLeft = document.getElementById("TexBoxEditor").style.left.slice(0,document.getElementById("TexBoxEditor").style.left.length-2)
				document.getElementById("fixedColorPickerID").style.left = Number(posLeft) + 100 + "px";

				document.getElementById("fixedColorPickerID").style.zIndex = 1300;

			}
		break;
		case 2: 				//background color
		break;
	}
	
	
}

function fixedColorChosen(hex){

	// switch(sel){
	// 	case 1: 			//font color
	// 		// pickColorSel = 1;
	// 		// document.getElementById("backgroundColorPicker").style.display = "block";

	// 		document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).style.color = hex;
 //          	document.getElementById("fontColorSample").style.backgroundColor = hex;

	// 	break;
	// 	case 2: 			//bg color
	// 		// pickColorSel = 2;
	// 		// document.getElementById("backgroundColorPicker").style.display = "block";

	// 		document.getElementById("colorSample").style.backgroundColor = hex;
	//         document.getElementById("plainColorID").style.backgroundColor = hex;
	//         document.getElementById("plainColorID").style.display = "block";

	// 	break;
	// }
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

	document.getElementById("TexBoxEditor").style.display = "none";
	
}

function businessCardBackSide(){
	document.getElementById("backSide").style.display = "block";
	document.getElementById("frontSide").style.display = "none";
	document.getElementById("frontSideButton").style.backgroundColor = "white";
	document.getElementById("backSideButton").style.backgroundColor = "lightgray";
	document.getElementById("FrontSideEditor").style.display = "none";
	document.getElementById("backSideEditor").style.display = "block";

	document.getElementById("TexBoxEditor").style.display = "none";

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
var businessCardBackTextBoxAmt = 2;
function addTextField(sel){
	switch(sel){
		case 1:    			//frontside
			businessCardTextBoxAmt += 1;
			var d1 = document.getElementById("FrontSideEditor");

			var iDiv = document.createElement('div');
		   	iDiv.id = 'textInput' + businessCardTextBoxAmt.toString();
		   	d1.appendChild(iDiv);

		   	var d = document.getElementById("textInput" + businessCardTextBoxAmt.toString());
			//
		   	d.innerHTML += '<input type="text" name="text' + businessCardTextBoxAmt.toString() + '" placeholder="New Text Box" onfocus="selectTextBox(' + businessCardTextBoxAmt.toString() + ',11);" oninput="updateTextBox(1);"> \n';

		   	var iDiv1 = document.createElement('div');
		   	iDiv1.className = 'TextBoxButtons';
		   	iDiv1.id = 'TextBoxButtonsID' + businessCardTextBoxAmt.toString();
		   	d.appendChild(iDiv1);

		   	// document.getElementById('TextBoxButtonsID' + businessCardTextBoxAmt.toString()).innerHTML += '<button class="editTextBox" onclick="selectTextBox(' + businessCardTextBoxAmt.toString() + '); enableEdit();"><img src="images/editPencil.png" alt="editPencil" style="width: 70%;"></button>\n';
		   	document.getElementById('TextBoxButtonsID' + businessCardTextBoxAmt.toString()).innerHTML += '<button class="deleteTextBox" onclick="deleteTextBox(' + businessCardTextBoxAmt.toString() + ',1)">&#9747;</button>';
		   	//
		   	document.getElementById('textBoxes').innerHTML += '<div class="businessCardTextBox" id="workZoneTextBox' + businessCardTextBoxAmt.toString() + '" style="top:250px; left:90px; text-transform: uppercase; font-size: 1em; text-align: center;" onclick="selectTextBox(' + businessCardTextBoxAmt.toString() + ', 11);">New Text Box</div>';
		   	selectTextBox(businessCardTextBoxAmt,1);
		break;
		case 2: 			//backside
			businessCardBackTextBoxAmt += 1;
			var d1 = document.getElementById("backSideEditor");

			var iDiv = document.createElement('div');
		   	iDiv.id = 'textInputBack' + businessCardBackTextBoxAmt.toString();
		   	d1.appendChild(iDiv);

		   	var d = document.getElementById("textInputBack" + businessCardBackTextBoxAmt.toString());
		   	d.innerHTML += '<input type="text" name="text' + businessCardBackTextBoxAmt.toString() + '" placeholder="New Text Box" onfocus="selectTextBox(' + businessCardBackTextBoxAmt.toString() + ', 21);" oninput="updateTextBox(2);"> \n';

		   	var iDiv1 = document.createElement('div');
		   	iDiv1.className = 'TextBoxButtons';
		   	iDiv1.id = 'TextBoxButtonsBackID' + businessCardBackTextBoxAmt.toString();
		   	d.appendChild(iDiv1);

		   	document.getElementById('TextBoxButtonsBackID' + businessCardBackTextBoxAmt.toString()).innerHTML += '<button class="deleteTextBox" onclick="deleteTextBox(' + businessCardBackTextBoxAmt.toString() + ',2)">&#9747;</button>';
		   	
		   	document.getElementById('textBoxesBack').innerHTML += '<div class="businessCardTextBox" id="workZoneTextBackBox' + businessCardBackTextBoxAmt.toString() + '" style="top:250px; left:90px; text-transform: uppercase; font-size: 1em; text-align: center;" onclick="selectTextBox(' + businessCardBackTextBoxAmt.toString() + ',21);">New Text Box</div>';
		   	selectTextBox(businessCardBackTextBoxAmt,21);

		break;
	}
	
}

function deleteTextBox(ID,sel){
	switch(sel){
		case 1:
			document.getElementById('workZoneTextBox' + ID.toString()).style.display = "none";
			document.getElementById('TexBoxEditor').style.display = "none";
			document.getElementById("backgroundColorPicker").style.display = "none";
			document.getElementById('textInput' + ID.toString()).style.display = "none";
			// document.getElementById('TextBoxButtonsID' + ID.toString()).style.display = "none";
		break;
		case 2:
		break;
	}
	
}

var selectedWorkZoneTextBoxID = 1;
var selectedWorkZoneTextBackBoxID = 1;

function updateTextBox(sel){
	//'workZoneTextBox4','text4'
	console.log("gets here!")
	switch(sel){
		case 1:   					//front side
			document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).innerHTML = document.getElementsByName("text" + selectedWorkZoneTextBoxID.toString())[0].value;
		break;
		case 2: 					//back side
		break;
	}
	
}

function selectTextBox(ID, sel){
	//"workZoneTextBox1"
	// console.log(ID)
	// console.log("workZoneTextBox" + selectedWorkZoneTextBoxID.toString())
	switch(sel){
		case 11: 					//front textbox
			document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).classList.remove("selected");
			document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).style.zIndex = "1000";
			document.getElementById("workZoneTextBox" + ID.toString()).classList.add("selected");
			document.getElementById("workZoneTextBox" + ID.toString()).style.zIndex = "2000";

			showTexBoxEditor("workZoneTextBox" + ID.toString());
			document.getElementById("fixedColorPickerID").style.display = "none";
			document.getElementById("backgroundColorPicker").style.display = "none";

			draggable("workZoneTextBox" + ID.toString());
			selectedWorkZoneTextBoxID = ID;
		break;
		case 12: 					//front img

		break;
		case 21: 					//back text box
			
			document.getElementById('logo' +  selectedBackImgId.toString()).classList.remove("selected");
			document.getElementById("logo" + selectedBackImgId.toString()).style.zIndex = "1000";

			document.getElementById("workZoneTextBackBox" + selectedWorkZoneTextBackBoxID.toString()).classList.remove("selected");
			document.getElementById("workZoneTextBackBox" + selectedWorkZoneTextBackBoxID.toString()).style.zIndex = "1000";
			document.getElementById("workZoneTextBackBox" + ID.toString()).classList.add("selected");
			document.getElementById("workZoneTextBackBox" + ID.toString()).style.zIndex = "2000";

			showTexBoxEditor("workZoneTextBackBox" + ID.toString());

			document.getElementById("fixedColorPickerID").style.display = "none";
			document.getElementById("backgroundColorPicker").style.display = "none";
			draggable("workZoneTextBackBox" + ID.toString());
			selectedWorkZoneTextBackBoxID = ID;
		break;
		case 22: 					//back img

			document.getElementById("workZoneTextBackBox" + selectedBackTextBoxID.toString()).classList.remove("selected");
			document.getElementById("workZoneTextBackBox" + selectedBackTextBoxID.toString()).style.zIndex = "1000";

			document.getElementById('logo' +  ID.toString()).classList.add("selected");
			document.getElementById("logo" + ID.toString()).style.zIndex = "2000";
			draggable('logo' +  ID.toString());
			// showTexBoxEditor("logo" + ID.toString());

			selectedBackImgId = ID;
		break;
	}
	

}

function showTexBoxEditor(ID){
	// console.log(ID);
	document.getElementById("TexBoxEditor").style.display = "block";
	document.getElementById("TexBoxEditor").style.zIndex = "1100";

	EditorLeftPos = document.getElementById(ID).offsetLeft + document.getElementById(ID).offsetWidth/2 - 250;
	document.getElementById("TexBoxEditor").style.left = EditorLeftPos + "px";

	EditorTopPos = document.getElementById(ID).offsetTop + 120;
	document.getElementById("TexBoxEditor").style.top = EditorTopPos + "px";

	console.log(document.getElementById("TexBoxEditor"))
	//text-alignment
	if(document.getElementById(ID).style.textAlign == "left"){
		document.getElementById("left_align").classList.add("selected");
		document.getElementById("center_align").classList.remove("selected");
		document.getElementById("right_align").classList.remove("selected");
	}else if(document.getElementById(ID).style.textAlign == "center"){
		document.getElementById("left_align").classList.remove("selected");
		document.getElementById("center_align").classList.add("selected");
		document.getElementById("right_align").classList.remove("selected");
	}else if(document.getElementById(ID).style.textAlign == "right"){
		document.getElementById("left_align").classList.remove("selected");
		document.getElementById("center_align").classList.remove("selected");
		document.getElementById("right_align").classList.add("selected");
	}

	//font size
	document.getElementsByName("BusinessFont")[0].value = document.getElementById(ID).style.fontSize.slice(0,document.getElementById(ID).style.fontSize.length-2)/10;
	
	//font color
	document.getElementById("fontColorSample").style.backgroundColor = document.getElementById(ID).style.color;

	//font family

	//BIU
	if(document.getElementById(ID).style.fontWeight == "bold"){
		document.getElementById("bold").classList.add("selected");
	}else{
		document.getElementById("bold").classList.remove("selected");
	}

	if(document.getElementById(ID).style.fontStyle == "italic"){
		document.getElementById("italic").classList.add("selected");
	}else{
		document.getElementById("italic").classList.remove("selected");
	}

	if(document.getElementById(ID).style.textDecoration == "underline"){
		document.getElementById("underline").classList.add("selected");
	}else{
		document.getElementById("underline").classList.remove("selected");
	}
	// console.log(document.getElementById("workZoneTextBox" + ID.toString()).style.textAlign)

}

var selectedBackTextBoxID = 1;
var selectedBackImgId = 1;

// function selectBackImg(){

// 	document.getElementById("workZoneTextBackBox" + selectedBackTextBoxID.toString()).classList.remove("selected");
// 	document.getElementById("workZoneTextBackBox" + selectedBackTextBoxID.toString()).style.zIndex = "1000";

// 	document.getElementById('logo' +  selectedBackImgId.toString()).classList.add("selected");
// 	draggable('logo' +  selectedBackImgId.toString());
// }

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
	fontID = "BusinessFont";
	size = Number(document.getElementsByName(fontID)[0].value) * 10;
	if(document.getElementById("backSide").style.display == "none"){
		document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).style.fontSize = size + "px";
	}else{
		document.getElementById("workZoneTextBackBox" + selectedBackTextBoxID.toString()).style.fontSize = size + "px";
	}
	
}

function BoldButton(){

	if(document.getElementById("backSide").style.display == "none"){
		if(document.getElementById("bold").classList.contains("selected")){
			document.getElementById("bold").classList.remove("selected");
			document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).style.fontWeight = "normal";
		}else{
			document.getElementById("bold").classList.add("selected");
			document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).style.fontWeight = "bold";
		}
	}else{
		if(document.getElementById("bold").classList.contains("selected")){
			document.getElementById("bold").classList.remove("selected");
			document.getElementById("workZoneTextBackBox" + selectedBackTextBoxID.toString()).style.fontWeight = "normal";
		}else{
			document.getElementById("bold").classList.add("selected");
			document.getElementById("workZoneTextBackBox" + selectedBackTextBoxID.toString()).style.fontWeight = "bold";
		}
	}
	

}

function ItalicButton(){
	if(document.getElementById("backSide").style.display == "none"){
		if(document.getElementById("italic").classList.contains("selected")){
			document.getElementById("italic").classList.remove("selected");
			document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).style.fontStyle = "normal";
		}else{
			document.getElementById("italic").classList.add("selected");
			document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).style.fontStyle = "italic";
		}
	}else{
		if(document.getElementById("italic").classList.contains("selected")){
			document.getElementById("italic").classList.remove("selected");
			document.getElementById("workZoneTextBackBox" + selectedBackTextBoxID.toString()).style.fontStyle = "normal";
		}else{
			document.getElementById("italic").classList.add("selected");
			document.getElementById("workZoneTextBackBox" + selectedBackTextBoxID.toString()).style.fontStyle = "italic";
		}
	}
}

function UnderlineButton(){
	if(document.getElementById("backSide").style.display == "none"){
		if(document.getElementById("underline").classList.contains("selected")){
			document.getElementById("underline").classList.remove("selected");
			document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).style.textDecoration = "none";
		}else{
			document.getElementById("underline").classList.add("selected");
			document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).style.textDecoration = "underline";
		}
	}else{
		if(document.getElementById("underline").classList.contains("selected")){
			document.getElementById("underline").classList.remove("selected");
			document.getElementById("workZoneTextBackBox" + selectedBackTextBoxID.toString()).style.textDecoration = "none";
		}else{
			document.getElementById("underline").classList.add("selected");
			document.getElementById("workZoneTextBackBox" + selectedBackTextBoxID.toString()).style.textDecoration = "underline";
		}
	}
}

function leftAlignButton(){
	if(document.getElementById("backSide").style.display == "none"){
		document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).style.textAlign = "left";
		document.getElementById("left_align").classList.add("selected");

		document.getElementById("center_align").classList.remove("selected");
		document.getElementById("right_align").classList.remove("selected");
	}else{
		document.getElementById("workZoneTextBackBox" + selectedBackTextBoxID.toString()).style.textAlign = "left";
		document.getElementById("left_align").classList.add("selected");

		document.getElementById("center_align").classList.remove("selected");
		document.getElementById("right_align").classList.remove("selected");
	}

}

function centerAlignButton(){
	if(document.getElementById("backSide").style.display == "none"){
		document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).style.textAlign = "center";
		document.getElementById("center_align").classList.add("selected");

		document.getElementById("left_align").classList.remove("selected");
		document.getElementById("right_align").classList.remove("selected");
	}else{
		document.getElementById("workZoneTextBackBox" + selectedBackTextBoxID.toString()).style.textAlign = "center";
		document.getElementById("center_align").classList.add("selected");

		document.getElementById("left_align").classList.remove("selected");
		document.getElementById("right_align").classList.remove("selected");
	}
}

function rightAlignButton(){
	if(document.getElementById("backSide").style.display == "none"){
		document.getElementById("workZoneTextBox" + selectedWorkZoneTextBoxID.toString()).style.textAlign = "right";
		document.getElementById("right_align").classList.add("selected");

		document.getElementById("left_align").classList.remove("selected");
		document.getElementById("center_align").classList.remove("selected");
	}else{
		document.getElementById("workZoneTextBackBox" + selectedBackTextBoxID.toString()).style.textAlign = "right";
		document.getElementById("right_align").classList.add("selected");

		document.getElementById("left_align").classList.remove("selected");
		document.getElementById("center_align").classList.remove("selected");
	}
	
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
    	dragObj.style.left = 340 - dragObj.offsetWidth/2 + "px";
    }

    if(document.getElementById("horizontalDivider").style.opacity == "1"){
    	dragObj.style.top = 210.5 - dragObj.offsetHeight/2 + "px";
    }

    dragObj = null;
    document.getElementById("horizontalDivider").style.opacity = "0";
    document.getElementById("verticalDivider").style.opacity = "0";

    // document.getElementById('TexBoxEditor').style.display = "none";
};

document.onmousemove = function(e){
	if(dragObj == null)
        return;
    var x = e.pageX;
    var y = e.pageY;

    xDrag = x - xPos;
	yDrag = y - yPos;
    

    // console.log(dragObj.style.left.slice(0,dragObj.style.left.length-2))
    dragObj.style.left = (Number(dragObj.style.left.slice(0,dragObj.style.left.length-2)) + Number(xDrag)) +"px";
    dragObj.style.top = (Number(dragObj.style.top.slice(0,dragObj.style.top.length-2)) + Number(yDrag)) +"px";

    // console.log("dragging");
    dragObjWidthCenter = dragObj.offsetWidth/2 + Number(dragObj.style.left.slice(0,dragObj.style.left.length-2));

    if(dragObjWidthCenter - 340 < 3 && dragObjWidthCenter - 340 > -3){
    	document.getElementById("verticalDivider").style.opacity = "1";
    }else{
    	document.getElementById("verticalDivider").style.opacity = "0";
    }


    dragObjHeightCenter = dragObj.offsetHeight/2 + Number(dragObj.style.top.slice(0,dragObj.style.top.length-2));
    // console.log(dragObjHeightCenter - 210.5)
    if(dragObjHeightCenter - 210.5 < 3 && dragObjHeightCenter - 210.5 > -3){
    	document.getElementById("horizontalDivider").style.opacity = "1";
    }else{
    	document.getElementById("horizontalDivider").style.opacity = "0";
    }

    document.getElementById('TexBoxEditor').style.display = "none";
    document.getElementById("backgroundColorPicker").style.display = "none";



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
    	document.getElementById('TexBoxEditor').style.display = "none";
    	document.getElementById("fixedColorPickerID").style.display = "none";
    	document.getElementById("backgroundColorPicker").style.display = "none";

    	// console.log(document.getElementById('workZoneTextBox'+selectedWorkZoneTextBoxID).clientHeight);
    	// console.log(document.getElementById('workZoneTextBox'+selectedWorkZoneTextBoxID).style.top);
    }
}

function deselectBackTextBox() {
	if (window.event.srcElement.id != 'workZoneTextBackBox' + selectedBackTextBoxID) {
		console.log("haha");
    	document.getElementById('workZoneTextBackBox'+selectedBackTextBoxID).classList.remove("selected");
    	document.getElementById('TexBoxEditor').style.display = "none";
    	document.getElementById("fixedColorPickerID").style.display = "none";
    	document.getElementById("backgroundColorPicker").style.display = "none";
    }else if(window.event.srcElement.id != 'logo' + selectedBackImgId){
    	document.getElementById('logo'+selectedBackImgId).classList.remove("selected");
    	// document.getElementById('TexBoxEditor').style.display = "none";
    	// document.getElementById("fixedColorPickerID").style.display = "none";
    	// document.getElementById("backgroundColorPicker").style.display = "none";
    }
}


<!DOCTYPE html>
<html>
<head>
  <title>Movie Trade Analysis</title>
  <link rel="stylesheet" type="text/css" href="trade_analysis.css">

<style media="screen" type="text/css">
.longText {

  white-space : nowrap;
  overflow : hidden;
  outline: none;

  

 }

 .longText:hover {
  overflow : scroll;
  overflow-y: hidden;
  
  z-index: 1;
  
  /*width: 100%;*/
}
</style>

</head>

<body>
<?php 
//echo "I have a color car.";
?>

<?php
$servername = "127.0.0.1:3306";
$username = "root";
$password = "Lmy19940219";
$dbname = "trade_analysis";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
} 

?>


<section>
  <!--for demo wrap-->

  <h1>Movie Trade Analysis</h1>

  <form action='<?php echo $_SERVER['PHP_SELF']; ?>' method='post' name='form_filter' style="color:white;display: inline-block;">

    <select name="value" style="margin-right:30px; height: 3em; width: 15em;">
        <option value="all">All Development Stages</option>
        <option value="Open">Open for acquisition</option>
        <option value="Acquired">Acquired</option>
    </select>

   

    Start Date:
    <input type="date" name="StartDate" value="2016-01-01" style="margin-right:30px; height: 2.8em;">

    End Date:
    <input type="date" name="EndDate" value="2018-01-01" style="margin-right:30px; height: 2.8em;">

 
    <input type='submit' value = 'Submit' style="padding: 1em;">


</form>



<button style="float: right; display: inline-block;"><a href='trade_analysis.php?hello=true'>Download as CSV</a></button>
<br>
<br>
  <div class="tbl-header">
    <table cellpadding="0" cellspacing="0" border="0">
      <thead>
        <tr>
          <th>Movie</th>
          <th>People</th>
          <!--<th>Director</th>
          <th>Logline</th>
          <th>Producer</th>-->
          <th>Representation</th>
          <th>Development Stage</th>
          <th>Date Published</th>
        </tr>
      </thead>
    </table>
  </div>
  <div class="tbl-content">
    <table cellpadding="0" cellspacing="0" border="0">
      <tbody>
      <?php

      if(!$_POST){
        $query = "SELECT * FROM trade_analysis";
      }else{
        if($_POST['value'] == 'Open') {
        // query to get all Fitzgerald records

          $query = "SELECT * FROM trade_analysis WHERE Development_Stage='Open for acquisition' and Date_Published >= '" . $_POST['StartDate'] . "' and Date_Published <= '" . $_POST['EndDate'] . "'";

        }
        elseif($_POST['value'] == 'Acquired') {
        // query to get all Herring records
          $query = "SELECT * FROM trade_analysis WHERE Development_Stage='Acquired' and Date_Published >= '" . $_POST['StartDate'] . "' and Date_Published <= '" . $_POST['EndDate'] . "'";
        } elseif($_POST['value'] == 'all') {
        // query to get all records
          $query = "SELECT * FROM trade_analysis where Date_Published >= '" . $_POST['StartDate'] . "' and Date_Published <= '" . $_POST['EndDate'] . "'";
        }

        #echo $_POST["StartDate"];
        #echo $_POST["EndDate"];


      }


            #$sql = "SELECT * FROM trade_analysis";
      $sql = $query;
      $result = $conn->query($sql);


    if (isset($_GET['hello'])) {
      ob_end_clean();

    // create a file pointer connected to the output stream
    
      $output = fopen('php://output', 'w');

      header('Content-Type: text/csv; charset=utf-8');
      header('Content-Disposition: attachment; filename=data.csv');
      fputcsv($output, array('Movie','Actors','Director','Producers','Representation','Development Stage','Date Published','Link'));
      while ($row = $result->fetch_assoc()){
        //echo $row;
        fputcsv($output, $row);

      }

      fclose($output);
      exit();
      //ob_end_clean();
    }
       




// output the column headings
    #fputcsv($output, array('Column 1', 'Column 2', 'Column 3', 'Column 4', 'Column 5', 'Column 6', 'Column 7'));


    // $rows = $result;

// loop over the rows, outputting them
     


      





      if ($result->num_rows > 0) {
      // output data of each row
        while($row = $result->fetch_assoc()) {
          //echo "movie: " . $row["Title"]. " - Name: " . $row["Title"]. " " . $row["Title"]. "<br>";

          echo "<tr>";
          echo "<td>" . $row['Title'] . "</td>";
          $people = "";
          if ($row['Actors'] == ""){
            $people .= "";
          }else{
            $people .= $row['Actors'] . "(Actor), <br>";
          }

          if ($row['Director'] == ""){
            $people .= "";
          }else{
            $people .= $row['Director'] . "(Director), <br>";
          }

          if ($row['Producers'] == ""){
            $people .= "";
          }else{
            $people .= $row['Producers'] . "(Producer)";
          }

          if ($people == ""){
            $people = "Not Found";
          }

          echo "<td>" . $people . "</td>";
          /*
          if ($row['Actors'] == ""){
            echo "<td>" . "Not Found" . "</td>";
          }else{
            echo "<td>" . $row['Actors'] . "</td>";
          }

          if ($row['Director'] == ""){
            echo "<td>" . "Not Found" . "</td>";
          }else{
            echo "<td>" . $row['Director'] . "</td>";
          }

          if ($row['Producers'] == ""){
            echo "<td>" . "Not Found" . "</td>";
          }else{
            echo "<td>" . $row['Producers'] . "</td>";
          }*/

          if ($row['Representation'] == ""){
            echo "<td>" . "Not Available" . "</td>";
          }else{
            echo "<td>" . $row['Representation'] . "</td>";
          }
          
          //echo "<td class='longText'>" . $row['Logline'] . "</td>";
          
          echo "<td>" . $row['Development_Stage'] . "</td>";
          echo "<td><a href=". $row['link'] . ">" . $row['Date_Published'] . "</a></td>";
          echo "</tr>";
        }
      } else {
        echo "0 results";
      }

      
?>
      
       
        
      </tbody>
    </table>

  </div>
</section>



  <script>

  function downloadCSV(){

  }
  

  </script>
  <?php
  //$conn->close();
  ?>
</body>
</html>

<?php
	$data = array(
		array('id' => 0, 'text' => 'ajax'),
		array('id' => 1, 'text' => 'sim ajax'),
		array('id' => 2, 'text' => 'a very long text so we can test the width property properly'),
		array('id' => 3, 'text' => 'aaaaa'),
		array('id' => 4, 'text' => 'aff'),
		array('id' => 5, 'text' => 'alguma coisa'),
		array('id' => 6, 'text' => 'something'),
		array('id' => 7, 'text' => 'omg'),
		array('id' => 8, 'text' => 'testing'),
		array('id' => 9, 'text' => 'so what?'),
		array('id' => 10, 'text' => 'other chars'),
		array('id' => 11, 'text' => 'á latin é'),
		array('id' => 12, 'text' => 'hmmm'),
		array('id' => 13, 'text' => 'chars test > gg'),
		array('id' => 14, 'text' => 'chars test < gg'),
		array('id' => 15, 'text' => 'chars test & gg'),
		array('id' => 16, 'text' => 'ok'),
		array('id' => 17, 'text' => 'it\' fine')
	);

	header('Content-type: application/json');

	if(isset($_GET['id'])){
		$id = $_GET['id'];
		foreach($data as $d){
			if($d['id'] == $id){
				echo json_encode(array($d));
				break;
			}
		}
	}else
	if(isset($_GET['q'])){
		$q = $_GET['q'];
		if($q){
			$ret = array();
			foreach($data as $d){
				if(mb_strpos($d['text'], $q) !== false){
					array_push($ret, $d);
				}
			}
		}else{
			$ret = $data;
		}
		if(isset($_GET['limit'])){
			$limit = $_GET['limit'];
			$ret = array_slice($ret, 0, $limit);
		}
		echo json_encode($ret);
	}
?>


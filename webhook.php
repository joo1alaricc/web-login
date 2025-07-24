<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Simpan ke file
    $file = 'status.json';
    $data = [];
    
    if (file_exists($file)) {
        $data = json_decode(file_get_contents($file), true);
    }
    
    $data[] = $input;
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
    
    echo json_encode(['status' => 'success']);
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
}
?>

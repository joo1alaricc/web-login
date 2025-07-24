<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

// Konfigurasi
$github_token = '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'; // Token Anda
$github_repo = 'joo1alaricc/dimasnathan';
$github_file = 'status.json';
$github_api_url = "https://api.github.com/repos/{$github_repo}/contents/{$github_file}";

// Hanya terima POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

// Baca data dari request
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['nomor'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid data']);
    exit;
}

try {
    // 1. Dapatkan file status.json dari GitHub
    $get_options = [
        'http' => [
            'method' => 'GET',
            'header' => [
                'Authorization: token ' . $github_token,
                'User-Agent: PHP-GitHub-Webhook',
                'Accept: application/vnd.github.v3+json'
            ]
        ]
    ];
    
    $get_context = stream_context_create($get_options);
    $get_result = file_get_contents($github_api_url, false, $get_context);
    
    $existing_data = [];
    $sha = null;
    
    if ($get_result !== false) {
        $github_response = json_decode($get_result, true);
        if (isset($github_response['content'])) {
            $existing_data = json_decode(base64_decode($github_response['content']), true);
            $sha = $github_response['sha'];
        }
    }
    
    // 2. Tambahkan data baru
    $existing_data[] = [
        'nomor' => $input['nomor'],
        'status' => true,
        'timestamp' => date('c')
    ];
    
    // 3. Encode ke base64
    $new_content = base64_encode(json_encode($existing_data, JSON_PRETTY_PRINT));
    
    // 4. Siapkan data untuk update
    $update_data = [
        'message' => 'Add status for ' . $input['nomor'],
        'content' => $new_content
    ];
    
    if ($sha) {
        $update_data['sha'] = $sha;
    }
    
    // 5. Update file di GitHub
    $put_options = [
        'http' => [
            'method' => 'PUT',
            'header' => [
                'Authorization: token ' . $github_token,
                'User-Agent: PHP-GitHub-Webhook',
                'Accept: application/vnd.github.v3+json',
                'Content-Type: application/json'
            ],
            'content' => json_encode($update_data)
        ]
    ];
    
    $put_context = stream_context_create($put_options);
    $put_result = file_get_contents($github_api_url, false, $put_context);
    
    if ($put_result !== false) {
        echo json_encode(['status' => 'success', 'message' => 'Data saved to GitHub']);
    } else {
        throw new Exception('Failed to update GitHub file');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>

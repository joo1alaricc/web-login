// File: api/save-status.js
export default async function handler(request, response) {
  const { nomor } = request.body;
  
  // Token dari environment variable (aman)
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = "joo1alaricc";
  const REPO_NAME = "dimasnathan";
  const FILE_PATH = "status.json";
  
  try {
    // Get current file
    const getFileResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    if (!getFileResponse.ok) {
      throw new Error(`Failed to get file: ${getFileResponse.status}`);
    }
    
    const fileData = await getFileResponse.json();
    
    // Parse existing data
    let existingData = [];
    try {
      const decoded = Buffer.from(fileData.content, 'base64').toString('utf-8');
      existingData = JSON.parse(decoded);
    } catch (e) {
      existingData = [];
    }
    
    // Add new entry
    const newEntry = {
      nomor: nomor,
      status: true,
      timestamp: new Date().toISOString()
    };
    
    existingData.push(newEntry);
    
    // Update file
    const updatedContent = JSON.stringify(existingData, null, 2);
    const encodedContent = Buffer.from(updatedContent).toString('base64');
    
    const updateResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Add status for ${nomor}`,
          content: encodedContent,
          sha: fileData.sha
        })
      }
    );
    
    if (!updateResponse.ok) {
      throw new Error(`Failed to update file: ${updateResponse.status}`);
    }
    
    return response.status(200).json({ success: true, message: "Status saved successfully" });
    
  } catch (error) {
    console.error("Error:", error);
    return response.status(500).json({ success: false, error: error.message });
  }
}

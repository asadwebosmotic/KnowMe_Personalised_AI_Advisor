const API_BASE_URL = 'http://localhost:8000'; // Adjust this to your FastAPI server URL

export interface ChatResponse {
  response: string;
  source: string | string[];
}

export interface UploadResponse {
  filename: string;
  chunks: any[];
  message: string;
  chunks_stored: number;
}

export interface PdfListResponse {
  pdfs: string[];
}

export interface DeleteResponse {
  message: string;
}

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new ApiError(errorData.detail || 'API request failed', response.status);
  }
  return response.json();
};

export const apiService = {
  // Get welcome message
  async getWelcome(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleApiResponse(response);
  },

  // Upload PDF
  async uploadPdf(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload_pdf/`, {
      method: 'POST',
      body: formData,
    });
    return handleApiResponse(response);
  },

  // Chat with KnowMe
  async chat(userMessage: string): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/chat/?user_msg=${encodeURIComponent(userMessage)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleApiResponse(response);
  },

  // Get list of PDFs
  async getPdfs(): Promise<PdfListResponse> {
    const response = await fetch(`${API_BASE_URL}/pdfs/`);
    return handleApiResponse(response);
  },

  // Delete PDF
  async deletePdf(pdfName: string): Promise<DeleteResponse> {
    const response = await fetch(`${API_BASE_URL}/pdfs/${encodeURIComponent(pdfName)}`, {
      method: 'DELETE',
    });
    return handleApiResponse(response);
  },
};
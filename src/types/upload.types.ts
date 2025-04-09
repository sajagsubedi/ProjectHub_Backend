export interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
  }

  export interface FileUpload {
    filename: string;
    mimetype: string;
    encoding: string;
    createReadStream: () => NodeJS.ReadableStream;
  }
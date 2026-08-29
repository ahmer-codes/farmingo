declare module "multer" {
  type FileFilterCallback = (error: Error | null, acceptFile?: boolean) => void;

  interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
    destination?: string;
    filename?: string;
    path?: string;
  }

  interface Options {
    storage?: unknown;
    limits?: {
      fileSize?: number;
      files?: number;
    };
    fileFilter?: (req: unknown, file: File, cb: FileFilterCallback) => void;
  }

  interface MulterInstance {
    single(
      fieldName: string,
    ): (req: unknown, res: unknown, next: (err?: unknown) => void) => void;
  }

  interface MulterStatic {
    (options?: Options): MulterInstance;
    memoryStorage(): unknown;
  }

  const multer: MulterStatic;
  export = multer;
}

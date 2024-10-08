import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

export const translatorDocumentStorage: MulterOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      let uploadPath = join(__dirname, '..', '..', 'uploads', 'documents');

      if (file.fieldname === 'cv') {
        uploadPath = join(uploadPath, 'cv');
      } else if (file.fieldname === 'certificate') {
        uploadPath = join(uploadPath, 'certificate');
      }

      // Create directory if it doesn't exist
      fs.mkdirSync(uploadPath, { recursive: true });

      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uuid = randomUUID();
      const extension = extname(file.originalname);
      const newFileName = uuid + extension;

      cb(null, newFileName);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new BadRequestException('Only PDF files are allowed!'), false);
    }

    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
};

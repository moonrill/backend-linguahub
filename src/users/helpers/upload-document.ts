import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';

// TODO : Fix doc upload
export const translatorDocumentStorage = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'cv') {
        cb(null, 'uploads/documents/cv');
      } else if (file.filename === 'certificate') {
        cb(null, 'uploads/documents/certificate');
      } else {
        cb(new BadRequestException('Invalid fieldname'), null);
      }
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const randomString = Array(5)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');
      const extension = extname(file.originalname);
      const newFileName = `${timestamp}-${randomString}${extension}`;

      cb(null, newFileName);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new BadRequestException('Only pdf files are allowed!'), null);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
};

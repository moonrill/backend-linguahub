import { HttpException, UnprocessableEntityException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';

export const flagStorage = {
  storage: diskStorage({
    destination: 'uploads/images/flag',
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const extension = extname(file.originalname);
      const newFileName = timestamp + extension;

      cb(null, newFileName);
    },
  }),

  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|svg)$/)) {
      cb(
        new UnprocessableEntityException('Only image files are allowed!'),
        false,
      );
    }

    cb(null, true);
  },

  limits: {
    fileSize: 2 * 1024 * 1024,
  },
};

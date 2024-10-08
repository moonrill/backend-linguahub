import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { extname } from 'path';

export const uploadImage = (destination: string) => {
  let path = './uploads/images/';

  const options: MulterOptions = {
    storage: diskStorage({
      destination: path + destination,
      filename: (req, file, cb) => {
        const uuid = randomUUID();
        const extension = extname(file.originalname);
        const filename = uuid + extension;

        cb(null, filename);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|svg)$/)) {
        cb(new BadRequestException('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  };

  return options;
};

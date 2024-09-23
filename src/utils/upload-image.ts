import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { extname } from 'path';

export const uploadImage = (destination: string) => {
  let path = './uploads/images/';

  const options: MulterOptions = {
    storage: diskStorage({
      destination: path + destination,
      filename: (req, file, cb) => {
        const timestamp = Date.now();
        const extension = extname(file.originalname);

        cb(null, timestamp + extension);
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

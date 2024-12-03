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
      // Cek MIME type untuk gambar biasa
      const isImage = file.mimetype.match(/^image\/(jpg|jpeg|png)$/);
      // Cek MIME type untuk SVG
      const isSvg = file.mimetype === 'image/svg+xml';

      if (!isImage && !isSvg) {
        cb(
          new BadRequestException(
            'Only image files (JPG, JPEG, PNG, SVG) are allowed!',
          ),
          false,
        );
        return;
      }

      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  };

  return options;
};

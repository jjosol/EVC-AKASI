import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles, NotFoundException, HttpStatus, HttpCode, InternalServerErrorException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { diskStorage } from 'multer';
import * as path from 'path';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 10, {
    // Configure multer for larger files
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB max file size
    },
    // Optional: Use disk storage for very large files
    // storage: diskStorage({
    //   destination: './uploads',
    //   filename: (req, file, cb) => {
    //     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    //     cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    //   }
    // })
  }))
  async create(@Body() post: any, @UploadedFiles() files: Express.Multer.File[]) {
    try {
      const adminIdNumber = parseInt(post.admin_id, 10);
      return await this.postsService.create({
        admin_id: isNaN(adminIdNumber) ? 0 : adminIdNumber,
        username: post.username,
        caption: post.caption || null
      }, files);
    } catch (error) {
      console.error('Post creation error:', error);
      throw new InternalServerErrorException('Failed to create post: ' + error.message);
    }
  }

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostDto: any) {
    return this.postsService.update(+id, updatePostDto);
  }

 
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    try {
      await this.postsService.remove(+id);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Post with ID ${id} not found`);
      }
      throw new InternalServerErrorException('Failed to delete post');
    }
  }
}
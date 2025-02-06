import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles, NotFoundException, HttpStatus, HttpCode,InternalServerErrorException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
// import { Controller, Delete, Param, HttpCode, HttpStatus, NotFoundException, InternalServerErrorException } from '@nestjs/common';
// import { PostsService } from './posts.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { Multer } from 'multer';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  create(@Body() createPostDto: any, @UploadedFiles() files: Array<{ 
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
  }>) {
    return this.postsService.create({ ...createPostDto, files });
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
      console.log(`Attempting to delete post with ID: ${id}`);
      await this.postsService.remove(+id);
    } catch (error) {
      console.error(`Error deleting post ${id}:`, error);
      
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Post with ID ${id} not found`);
      }
      
      throw new InternalServerErrorException('Failed to delete post');
    }
  }
}
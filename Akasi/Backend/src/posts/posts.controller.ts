import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles, NotFoundException, HttpStatus, HttpCode,InternalServerErrorException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { Multer } from 'multer';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async create(@Body() post: { admin_id: number; username: string; caption?: string }, 
               @UploadedFiles() files: Express.Multer.File[]) {
    return this.postsService.create(post, files);
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
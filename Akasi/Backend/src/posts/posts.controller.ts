import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles, NotFoundException, HttpStatus, HttpCode, InternalServerErrorException, Put, OnModuleInit, ParseIntPipe } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Controller('posts')
export class PostsController implements OnModuleInit {
  constructor(private readonly postsService: PostsService) {}

  onModuleInit() {
    console.log('Posts controller initialized with routes:');
    console.log('PUT /posts/:id - Update post endpoint registered');
    console.log('POST /posts/:id/update - Alternative update endpoint registered');
  }

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async create(
    @Body() post: { nurse_id: string; username: string; caption?: string; text?: string },
    @UploadedFiles() files: Express.Multer.File[] = []
  ) {
    // Handle text field by incorporating it into caption if both exist
    const combinedCaption = post.text && post.caption 
      ? `${post.caption}\n\n${post.text}` 
      : post.text || post.caption;

    // Convert nurse_id to number and pass along the username
    return this.postsService.create(
      { 
        nurse_id: Number(post.nurse_id), 
        username: post.username, 
        caption: combinedCaption 
      }, 
      files
    );
  }

  @Get()
  findAll() {
    return this.postsService.findAll();
  }
  
  @Put(':id')
  @UseInterceptors(FilesInterceptor('files'))
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updatePostDto: { caption?: string, text?: string, existingFiles?: string },
    @UploadedFiles() files: Express.Multer.File[] = []
  ) {
    // Handle text field by incorporating it into caption if both exist
    const combinedCaption = updatePostDto.text && updatePostDto.caption 
      ? `${updatePostDto.caption}\n\n${updatePostDto.text}` 
      : updatePostDto.text || updatePostDto.caption;

    // Parse existingFiles JSON string if it exists
    let existingFileIds: number[] | undefined = undefined;
    if (updatePostDto.existingFiles) {
      try {
        existingFileIds = JSON.parse(updatePostDto.existingFiles);
      } catch (e) {
        console.error('Failed to parse existingFiles:', e);
      }
    }

    return this.postsService.update(
      id, 
      { caption: combinedCaption }, 
      files,
      existingFileIds
    );
  }
  
  @Post(':id/update')
  @UseInterceptors(FilesInterceptor('files'))
  async updateAlternative(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updatePostDto: { caption?: string, text?: string, existingFiles?: string },
    @UploadedFiles() files: Express.Multer.File[] = []
  ) {
    // Handle text field by incorporating it into caption if both exist
    const combinedCaption = updatePostDto.text && updatePostDto.caption 
      ? `${updatePostDto.caption}\n\n${updatePostDto.text}` 
      : updatePostDto.text || updatePostDto.caption;

    // Parse existingFiles JSON string if it exists
    let existingFileIds: number[] | undefined = undefined;
    if (updatePostDto.existingFiles) {
      try {
        existingFileIds = JSON.parse(updatePostDto.existingFiles);
      } catch (e) {
        console.error('Failed to parse existingFiles:', e);
      }
    }

    return this.postsService.update(
      id, 
      { caption: combinedCaption }, 
      files,
      existingFileIds
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.postsService.remove(id);
  }
}

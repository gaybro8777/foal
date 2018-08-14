import {
  Class,
  Context,
  Controller,
  Delete,
  Get,
  HttpResponseCreated,
  HttpResponseMethodNotAllowed,
  HttpResponseNotFound,
  HttpResponseNotImplemented,
  HttpResponseOK,
  Patch,
  Post,
  Put,
  ServiceManager
} from '../../core';
import { isObjectDoesNotExist } from '../errors';
import { IResourceCollection } from '../services';

@Controller()
export abstract class RestController {
  abstract collectionClass: Class<Partial<IResourceCollection>>;

  constructor(private services: ServiceManager) { }
  // schema = {
  //   id: { type: 'number' }
  // };

  // requiredFields = {
  //   post: [], // do not include the id in post.
  //   put: [ 'id' ]
  // };

  // hooks = {
  //   post: [ LoginRequired(), /*AssignUserId()*/ ]
  // };

  getQuery(ctx: Context): object {
    return {};
  }

  @Delete('/')
  delete() {
    return new HttpResponseMethodNotAllowed();
  }

  @Delete('/:id')
  async deleteById(ctx: Context) {
    const collection = this.services.get(this.collectionClass);
    if (!collection.removeOne) {
      return new HttpResponseNotImplemented();
    }

    const query = { ...this.getQuery(ctx), id: ctx.request.params.id };
    try {
      return new HttpResponseOK(await collection.removeOne(query));
    } catch (error) {
      if (isObjectDoesNotExist(error)) {
        return new HttpResponseNotFound();
      }
      throw error;
    }
  }

  @Get('/')
  async get(ctx: Context) {
    // schema and id
    // hooks
    const collection = this.services.get(this.collectionClass);
    if (!collection.findMany) {
      return new HttpResponseNotImplemented();
    }

    const query = this.getQuery(ctx);
    return new HttpResponseOK(await collection.findMany(query));
  }

  @Get('/:id')
  async getById(ctx: Context) {
    const collection = this.services.get(this.collectionClass);
    if (!collection.findOne) {
      return new HttpResponseNotImplemented();
    }

    const query = { ...this.getQuery(ctx), id: ctx.request.params.id };
    try {
      return new HttpResponseOK(await collection.findOne(query));
    } catch (error) {
      if (isObjectDoesNotExist(error)) {
        return new HttpResponseNotFound();
      }
      throw error;
    }
  }

  @Patch('/')
  patch() {
    return new HttpResponseMethodNotAllowed();
  }

  @Patch('/:id')
  async patchById(ctx: Context) {
    const collection = this.services.get(this.collectionClass);
    if (!collection.updateOne) {
      return new HttpResponseNotImplemented();
    }

    const query = { ...this.getQuery(ctx), id: ctx.request.params.id };
    try {
      return new HttpResponseOK(await collection.updateOne(
        query, ctx.request.body
      ));
    } catch (error) {
      if (isObjectDoesNotExist(error)) {
        return new HttpResponseNotFound();
      }
      throw error;
    }
  }

  @Post('/')
  async post(ctx: Context) {
    const collection = this.services.get(this.collectionClass);
    if (!collection.createOne) {
      return new HttpResponseNotImplemented();
    }

    return new HttpResponseCreated(await collection.createOne(ctx.request.body));
  }

  @Post('/:id')
  postById() {
    return new HttpResponseMethodNotAllowed();
  }

  @Put('/')
  put() {
    return new HttpResponseMethodNotAllowed();
  }

  @Put('/:id')
  async putById(ctx: Context) {
    const collection = this.services.get(this.collectionClass);
    if (!collection.updateOne) {
      return new HttpResponseNotImplemented();
    }

    const query = { ...this.getQuery(ctx), id: ctx.request.params.id };
    try {
      return new HttpResponseOK(await collection.updateOne(
        query, ctx.request.body
      ));
    } catch (error) {
      if (isObjectDoesNotExist(error)) {
        return new HttpResponseNotFound();
      }
      throw error;
    }
  }

}
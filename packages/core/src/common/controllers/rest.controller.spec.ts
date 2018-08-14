// std
import { deepStrictEqual, fail, ok, strictEqual } from 'assert';

// FoalTS
import {
  Context,
  Controller,
  createController,
  getHttpMethod,
  getPath,
  HttpResponseCreated,
  HttpResponseMethodNotAllowed,
  HttpResponseNotFound,
  HttpResponseNotImplemented,
  HttpResponseOK,
  Service,
  ServiceManager
} from '../../core';
import { ObjectDoesNotExist } from '../errors';
import { IResourceCollection } from '../services';
import { RestController } from './rest.controller';

describe('RestController', () => {

  @Controller()
  class ConcreteController extends RestController {
    collectionClass = class {};
  }

  it('has a getQuery method that should return an empty object', () => {
    const controller = createController(ConcreteController);
    deepStrictEqual(controller.getQuery(new Context({})), {});
  });

  describe('has a "delete" method that', () => {

    it('should handle requests at DELETE /.', () => {
      strictEqual(getHttpMethod(ConcreteController, 'delete'), 'DELETE');
      strictEqual(getPath(ConcreteController, 'delete'), '/');
    });

    it('should return a HttpResponseMethodNotAllowed.', () => {
      const controller = createController(ConcreteController);
      ok(controller.delete() instanceof HttpResponseMethodNotAllowed);
    });

  });

  describe('has a "deleteById" method that', () => {

    it('should handle requests at DELETE /:id.', () => {
      strictEqual(getHttpMethod(ConcreteController, 'deleteById'), 'DELETE');
      strictEqual(getPath(ConcreteController, 'deleteById'), '/:id');
    });

    it('should return a HttpResponseNotImplemented if collection.removeOne is undefined.', async () => {
      @Service()
      class Collection implements Partial<IResourceCollection> {
        createMany() {}
        createOne() {}
        findMany() {}
        findOne() {}
        // removeOne() {}
        updateOne() {}
      }
      @Controller()
      class ConcreteController extends RestController {
        collectionClass = Collection;
      }

      const controller = createController(ConcreteController);
      ok(await controller.deleteById(new Context({})) instanceof HttpResponseNotImplemented);
    });

    describe('when collection.removeOne is defined', () => {

      it('should return an HttpResponseOK if collection.removeOne resolves.', async () => {
        const query = { foo: 'bar' };
        const objects = [ { bar: 'bar' }];
        let removeOneQuery;
        let getQueryCtx;
        @Service()
        class Collection implements Partial<IResourceCollection> {
          async removeOne(query) {
            removeOneQuery = query;
            return objects;
          }
        }
        @Controller()
        class ConcreteController extends RestController {
          collectionClass = Collection;

          getQuery(ctx) {
            getQueryCtx = ctx;
            return query;
          }
        }

        const services = new ServiceManager();
        const controller = new ConcreteController(services);

        const ctx = new Context({
          params: {
            id: 1
          }
        });

        const actual = await controller.deleteById(ctx);
        ok(actual instanceof HttpResponseOK);
        strictEqual(actual.content, objects);
        strictEqual(getQueryCtx, ctx);
        deepStrictEqual(removeOneQuery, { foo: 'bar', id: 1 });
      });

      it('should return a HttpResponseNotFound if collection.removeOne rejects an ObjectDoesNotExist.', async () => {
        @Service()
        class Collection implements Partial<IResourceCollection> {
          async removeOne(query) {
            throw new ObjectDoesNotExist();
          }
        }
        @Controller()
        class ConcreteController extends RestController {
          collectionClass = Collection;
        }

        const services = new ServiceManager();
        const controller = new ConcreteController(services);

        const ctx = new Context({
          params: {
            id: 1
          }
        });

        const actual = await controller.deleteById(ctx);
        ok(actual instanceof HttpResponseNotFound);
      });

      it('should rejects an error if collection.removeOne rejects one which'
          + ' is not an ObjectDoesNotExist.', () => {
        const err = new Error();
        @Service()
        class Collection implements Partial<IResourceCollection> {
          async removeOne(query) {
            throw err;
          }
        }
        @Controller()
        class ConcreteController extends RestController {
          collectionClass = Collection;
        }

        const services = new ServiceManager();
        const controller = new ConcreteController(services);

        const ctx = new Context({
          params: {
            id: 1
          }
        });

        return controller.deleteById(ctx)
          .then(() => fail('This promise should be rejected.'))
          .catch(error => strictEqual(error, err));
      });

    });

  });

  describe('has a "get" method that', () => {

    it('should handle requests at GET /.', () => {
      strictEqual(getHttpMethod(ConcreteController, 'get'), 'GET');
      strictEqual(getPath(ConcreteController, 'get'), '/');
    });

    it('should return an HttpResponseNotImplemented if collection.findMany is undefined.', async () => {
      @Service()
      class Collection implements Partial<IResourceCollection> {
        createMany() {}
        createOne() {}
        // findMany() {}
        findOne() {}
        removeOne() {}
        updateOne() {}
      }
      @Controller()
      class ConcreteController extends RestController {
        collectionClass = Collection;
      }

      const controller = createController(ConcreteController);
      ok(await controller.get(new Context({})) instanceof HttpResponseNotImplemented);
    });

    describe('when collection.findMany is defined', () => {

      it('should return an HttpResponseOK if collection.findMany resolves.', async () => {
        const query = { foo: 'bar' };
        const objects = [ { bar: 'bar' }];
        let findManyQuery;
        let getQueryCtx;
        @Service()
        class Collection implements Partial<IResourceCollection> {
          async findMany(query) {
            findManyQuery = query;
            return objects;
          }
        }
        @Controller()
        class ConcreteController extends RestController {
          collectionClass = Collection;

          getQuery(ctx) {
            getQueryCtx = ctx;
            return query;
          }
        }

        const services = new ServiceManager();
        const controller = new ConcreteController(services);

        const ctx = new Context({});

        const actual = await controller.get(ctx);
        ok(actual instanceof HttpResponseOK);
        strictEqual(actual.content, objects);
        strictEqual(getQueryCtx, ctx);
        strictEqual(findManyQuery, query);
      });

    });

  });

  describe('has a "getById" method that', () => {

    it('should handle requests at GET /:id.', () => {
      strictEqual(getHttpMethod(ConcreteController, 'getById'), 'GET');
      strictEqual(getPath(ConcreteController, 'getById'), '/:id');
    });

    it('should return a HttpResponseNotImplemented if collection.findOne is undefined.', async () => {

      @Service()
      class Collection implements Partial<IResourceCollection> {
        createMany() {}
        createOne() {}
        findMany() {}
        // findOne() {}
        removeOne() {}
        updateOne() {}
      }
      @Controller()
      class ConcreteController extends RestController {
        collectionClass = Collection;
      }

      const controller = createController(ConcreteController);
      ok(await controller.getById(new Context({})) instanceof HttpResponseNotImplemented);
    });

    describe('when collection.findOne is defined', () => {

      it('should return an HttpResponseOK if collection.findOne resolves.', async () => {
        const query = { foo: 'bar' };
        const objects = [ { bar: 'bar' }];
        let findOneQuery;
        let getQueryCtx;
        @Service()
        class Collection implements Partial<IResourceCollection> {
          async findOne(query) {
            findOneQuery = query;
            return objects;
          }
        }
        @Controller()
        class ConcreteController extends RestController {
          collectionClass = Collection;

          getQuery(ctx) {
            getQueryCtx = ctx;
            return query;
          }
        }

        const services = new ServiceManager();
        const controller = new ConcreteController(services);

        const ctx = new Context({
          params: {
            id: 1
          }
        });

        const actual = await controller.getById(ctx);
        ok(actual instanceof HttpResponseOK);
        strictEqual(actual.content, objects);
        strictEqual(getQueryCtx, ctx);
        deepStrictEqual(findOneQuery, { foo: 'bar', id: 1 });
      });

      it('should return a HttpResponseNotFound if collection.findOne rejects an ObjectDoesNotExist.', async () => {
        @Service()
        class Collection implements Partial<IResourceCollection> {
          async findOne(query) {
            throw new ObjectDoesNotExist();
          }
        }
        @Controller()
        class ConcreteController extends RestController {
          collectionClass = Collection;
        }

        const services = new ServiceManager();
        const controller = new ConcreteController(services);

        const ctx = new Context({
          params: {
            id: 1
          }
        });

        const actual = await controller.getById(ctx);
        ok(actual instanceof HttpResponseNotFound);
      });

      it('should rejects an error if collection.findOne rejects one which'
          + ' is not an ObjectDoesNotExist.', () => {
        const err = new Error();
        @Service()
        class Collection implements Partial<IResourceCollection> {
          async findOne(query) {
            throw err;
          }
        }
        @Controller()
        class ConcreteController extends RestController {
          collectionClass = Collection;
        }

        const services = new ServiceManager();
        const controller = new ConcreteController(services);

        const ctx = new Context({
          params: {
            id: 1
          }
        });

        return controller.getById(ctx)
          .then(() => fail('This promise should be rejected.'))
          .catch(error => strictEqual(error, err));
      });

    });

  });

  describe('has a "patch" method that', () => {

    it('should handle requests at PATCH /.', () => {
      strictEqual(getHttpMethod(ConcreteController, 'patch'), 'PATCH');
      strictEqual(getPath(ConcreteController, 'patch'), '/');
    });

    it('should return a HttpResponseMethodNotAllowed.', () => {
      const controller = createController(ConcreteController);
      ok(controller.patch() instanceof HttpResponseMethodNotAllowed);
    });

  });

  describe('has a "patchById" method that', () => {

    it('should handle requests at PATCH /:id.', () => {
      strictEqual(getHttpMethod(ConcreteController, 'patchById'), 'PATCH');
      strictEqual(getPath(ConcreteController, 'patchById'), '/:id');
    });

    it('should return a HttpResponseNotImplemented if collection.updateOne is undefined.', async () => {
      @Service()
      class Collection implements Partial<IResourceCollection> {
        createMany() {}
        createOne() {}
        findMany() {}
        findOne() {}
        removeOne() {}
        // updateOne() {}
      }
      @Controller()
      class ConcreteController extends RestController {
        collectionClass = Collection;
      }

      const controller = createController(ConcreteController);
      ok(await controller.patchById(new Context({})) instanceof HttpResponseNotImplemented);
    });

    describe('when collection.updateOne is defined', () => {

      it('should return an HttpResponseOK if collection.updateOne resolves.', async () => {
        const query = { foo: 'bar' };
        const objects = [ { bar: 'bar' }];
        let updateOneQuery;
        let updateOneRecord;
        let getQueryCtx;
        @Service()
        class Collection implements Partial<IResourceCollection> {
          async updateOne(query, record) {
            updateOneQuery = query;
            updateOneRecord = record;
            return objects;
          }
        }
        @Controller()
        class ConcreteController extends RestController {
          collectionClass = Collection;

          getQuery(ctx) {
            getQueryCtx = ctx;
            return query;
          }
        }

        const services = new ServiceManager();
        const controller = new ConcreteController(services);

        const ctx = new Context({
          body: {
            foobar: 'foo'
          },
          params: {
            id: 1
          },
        });

        const actual = await controller.patchById(ctx);
        ok(actual instanceof HttpResponseOK);
        strictEqual(actual.content, objects);
        strictEqual(getQueryCtx, ctx);
        deepStrictEqual(updateOneQuery, { foo: 'bar', id: 1 });
        strictEqual(updateOneRecord, ctx.request.body);
      });

      it('should return a HttpResponseNotFound if collection.updateOne rejects an ObjectDoesNotExist.', async () => {
        @Service()
        class Collection implements Partial<IResourceCollection> {
          async updateOne(query, record) {
            throw new ObjectDoesNotExist();
          }
        }
        @Controller()
        class ConcreteController extends RestController {
          collectionClass = Collection;
        }

        const services = new ServiceManager();
        const controller = new ConcreteController(services);

        const ctx = new Context({
          body: {
            foobar: 'foo'
          },
          params: {
            id: 1
          }
        });

        const actual = await controller.patchById(ctx);
        ok(actual instanceof HttpResponseNotFound);
      });

      it('should rejects an error if collection.updateOne rejects one which'
          + ' is not an ObjectDoesNotExist.', () => {
        const err = new Error();
        @Service()
        class Collection implements Partial<IResourceCollection> {
          async updateOne(query) {
            throw err;
          }
        }
        @Controller()
        class ConcreteController extends RestController {
          collectionClass = Collection;
        }

        const services = new ServiceManager();
        const controller = new ConcreteController(services);

        const ctx = new Context({
          params: {
            id: 1
          }
        });

        return controller.patchById(ctx)
          .then(() => fail('This promise should be rejected.'))
          .catch(error => strictEqual(error, err));
      });

    });

  });

  describe('has a "post" method that', () => {

    it('should handle requests at POST /.', () => {
      strictEqual(getHttpMethod(ConcreteController, 'post'), 'POST');
      strictEqual(getPath(ConcreteController, 'post'), '/');
    });

    it('should return a HttpResponseNotImplemented if collection.createOne is undefined.', async () => {
      @Service()
      class Collection implements Partial<IResourceCollection> {
        createMany() {}
        // createOne() {}
        findMany() {}
        findOne() {}
        removeOne() {}
        updateOne() {}
      }
      @Controller()
      class ConcreteController extends RestController {
        collectionClass = Collection;
      }

      const controller = createController(ConcreteController);
      ok(await controller.post(new Context({})) instanceof HttpResponseNotImplemented);
    });

    it('should return an HttpResponseCreated if collection.createOne is defined.', async () => {
      const objects = [ { bar: 'bar' }];
      let createOneRecord;
      @Service()
      class Collection implements Partial<IResourceCollection> {
        async createOne(record) {
          createOneRecord = record;
          return objects;
        }
      }
      @Controller()
      class ConcreteController extends RestController {
        collectionClass = Collection;
      }

      const services = new ServiceManager();
      const controller = new ConcreteController(services);

      const ctx = new Context({
        body: {
          foobar: 'foo'
        },
      });

      const actual = await controller.post(ctx);
      ok(actual instanceof HttpResponseCreated);
      strictEqual(actual.content, objects);
      strictEqual(createOneRecord, ctx.request.body);
    });

  });

  describe('has a "postById" method that', () => {

    it('should handle requests at POST /:id.', () => {
      strictEqual(getHttpMethod(ConcreteController, 'postById'), 'POST');
      strictEqual(getPath(ConcreteController, 'postById'), '/:id');
    });

    it('should return a HttpResponseMethodNotAllowed.', () => {
      const controller = createController(ConcreteController);
      ok(controller.postById() instanceof HttpResponseMethodNotAllowed);
    });

  });

  describe('has a "put" method that', () => {

    it('should handle requests at PUT /.', () => {
      strictEqual(getHttpMethod(ConcreteController, 'put'), 'PUT');
      strictEqual(getPath(ConcreteController, 'put'), '/');
    });

    it('should return a HttpResponseMethodNotAllowed.', () => {
      const controller = createController(ConcreteController);
      ok(controller.put() instanceof HttpResponseMethodNotAllowed);
    });

  });

  describe('has a "putById" method that', () => {

    it('should handle requests at PUT /:id.', () => {
      strictEqual(getHttpMethod(ConcreteController, 'putById'), 'PUT');
      strictEqual(getPath(ConcreteController, 'putById'), '/:id');
    });

    it('should return a HttpResponseNotImplemented if collection.updateOne is undefined.', async () => {
      @Service()
      class Collection implements Partial<IResourceCollection> {
        createMany() {}
        createOne() {}
        findMany() {}
        findOne() {}
        removeOne() {}
        // updateOne() {}
      }
      @Controller()
      class ConcreteController extends RestController {
        collectionClass = Collection;
      }

      const controller = createController(ConcreteController);
      ok(await controller.putById(new Context({})) instanceof HttpResponseNotImplemented);
    });

    describe('when collection.updateOne is defined', () => {

      it('should return an HttpResponseOK if collection.updateOne resolves.', async () => {
        const query = { foo: 'bar' };
        const objects = [ { bar: 'bar' }];
        let updateOneQuery;
        let updateOneRecord;
        let getQueryCtx;
        @Service()
        class Collection implements Partial<IResourceCollection> {
          async updateOne(query, record) {
            updateOneQuery = query;
            updateOneRecord = record;
            return objects;
          }
        }
        @Controller()
        class ConcreteController extends RestController {
          collectionClass = Collection;

          getQuery(ctx) {
            getQueryCtx = ctx;
            return query;
          }
        }

        const services = new ServiceManager();
        const controller = new ConcreteController(services);

        const ctx = new Context({
          body: {
            foobar: 'foo'
          },
          params: {
            id: 1
          },
        });

        const actual = await controller.putById(ctx);
        ok(actual instanceof HttpResponseOK);
        strictEqual(actual.content, objects);
        strictEqual(getQueryCtx, ctx);
        deepStrictEqual(updateOneQuery, { foo: 'bar', id: 1 });
        strictEqual(updateOneRecord, ctx.request.body);
      });

      it('should return a HttpResponseNotFound if collection.updateOne rejects an ObjectDoesNotExist.', async () => {
        @Service()
        class Collection implements Partial<IResourceCollection> {
          async updateOne(query, record) {
            throw new ObjectDoesNotExist();
          }
        }
        @Controller()
        class ConcreteController extends RestController {
          collectionClass = Collection;
        }

        const services = new ServiceManager();
        const controller = new ConcreteController(services);

        const ctx = new Context({
          body: {
            foobar: 'foo'
          },
          params: {
            id: 1
          }
        });

        const actual = await controller.putById(ctx);
        ok(actual instanceof HttpResponseNotFound);
      });

      it('should rejects an error if collection.updateOne rejects one which'
          + ' is not an ObjectDoesNotExist.', () => {
        const err = new Error();
        @Service()
        class Collection implements Partial<IResourceCollection> {
          async updateOne(query) {
            throw err;
          }
        }
        @Controller()
        class ConcreteController extends RestController {
          collectionClass = Collection;
        }

        const services = new ServiceManager();
        const controller = new ConcreteController(services);

        const ctx = new Context({
          params: {
            id: 1
          }
        });

        return controller.putById(ctx)
          .then(() => fail('This promise should be rejected.'))
          .catch(error => strictEqual(error, err));
      });

    });

  });

});
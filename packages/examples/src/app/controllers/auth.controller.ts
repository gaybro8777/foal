// 3p
import {
  Context,
  dependency,
  Get,
  HttpResponseRedirect,
  Post,
  removeSessionCookie,
  render,
  Session,
  setSessionCookie,
  TokenRequired,
  ValidateBody,
  verifyPassword
} from '@foal/core';
import { TypeORMStore } from '@foal/typeorm';
import { getRepository } from '@foal/typeorm/node_modules/typeorm';

// App
import { User } from '../entities';

export class AuthController {
  @dependency
  store: TypeORMStore;

  @Post('/logout')
  @TokenRequired({
    cookie: true,
    extendLifeTimeOrUpdate: false,
    redirectTo: '/login',
    store: TypeORMStore,
  })
  async logout(ctx: Context<any, Session>) {
    await this.store.destroy(ctx.session.sessionID);

    const response = new HttpResponseRedirect('/login');
    removeSessionCookie(response);
    return response;
  }

  @Post('/login')
  @ValidateBody({
    additionalProperties: false,
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string' }
    },
    required: [ 'email', 'password' ],
    type: 'object',
  })
  async login(ctx: Context) {
    const user = await getRepository(User)
      .findOne({ email: ctx.request.body.email });

    if (!user) {
      return new HttpResponseRedirect('/login?invalid_credentials=true');
    }

    if (!await verifyPassword(ctx.request.body.password, user.password)) {
      return new HttpResponseRedirect('/login?invalid_credentials=true');
    }

    const session = await this.store.createAndSaveSessionFromUser(user, { csrfToken: true });

    const response = new HttpResponseRedirect('/');
    const token = session.getToken();
    setSessionCookie(response, token);
    return response;
  }

  @Get('/login')
  renderLogin(ctx: Context) {
    return render('./templates/login.html', {});
  }
}

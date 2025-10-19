import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../src/user/user.module';
import { UserEntity } from '../src/user/entity/user.entity';
import { RoleChangeEntity } from '../src/roles/entity/role-change.entity';
import { RoleEntity } from '../src/roles/entity/role.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { RolesGuard } from '../src/auth/roles.guard';

jest.setTimeout(30000);

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let userRepo: any;
  let dataSource: DataSource;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
<<<<<<< HEAD
    require('dotenv').config({ path: '.env.test' });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.POSTGRES_HOST,
          port: Number(process.env.POSTGRES_PORT) || 5432,
          username: process.env.POSTGRES_USER,
          password: process.env.POSTGRES_PASSWORD,
          database: process.env.POSTGRES_DB,
          entities: [UserEntity, RoleChangeEntity, RoleEntity],
          synchronize: true,
        }),
        UserModule,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    userRepo = moduleFixture.get(getRepositoryToken(UserEntity));
    dataSource = moduleFixture.get(DataSource);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(async () => {
    // Limpiar tablas relacionadas respetando FKs. Usamos TRUNCATE ... CASCADE para evitar errores
    await dataSource.query('TRUNCATE TABLE role_changes, users_roles, roles, users RESTART IDENTITY CASCADE');
    await userRepo.save({ user_email: 'test@example.com', user_password: 'pwd', user_role: 'usuario' });
  });

  it('admin puede cambiar rol (200)', async () => {
    const users = await userRepo.find();
    const id = users[0].user_id;

    const res = await request(app.getHttpServer())
      .patch(`/user/${id}/role`)
      .send({ role: 'administrador', reason: 'Promoción' })
      .set('x-user-id', '999');

    expect(res.status).toBe(200);
    expect(res.text).toContain('Rol actualizado correctamente');
  });

  it('no-admin obtiene 403', async () => {
    // Para validar 403 debemos activar RolesGuard que devuelva false
    const moduleNoAdmin: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.POSTGRES_HOST,
          port: Number(process.env.POSTGRES_PORT) || 5432,
          username: process.env.POSTGRES_USER,
          password: process.env.POSTGRES_PASSWORD,
          database: process.env.POSTGRES_DB,
          entities: [UserEntity, RoleChangeEntity, RoleEntity],
          synchronize: true,
        }),
        UserModule,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => false })
      .compile();

    const appNoAdmin = moduleNoAdmin.createNestApplication();
    await appNoAdmin.init();

    const users = await userRepo.find();
    const id = users[0].user_id;

    const res = await request(appNoAdmin.getHttpServer())
      .patch(`/user/${id}/role`)
      .send({ role: 'administrador' });

    expect(res.status).toBe(403);

    await appNoAdmin.close();
  });

  it('rol inválido = 400', async () => {
    const users = await userRepo.find();
    const id = users[0].user_id;

    const res = await request(app.getHttpServer())
      .patch(`/user/${id}/role`)
      .send({ role: 'rol_invalido' });

    expect(res.status).toBe(400);
  });

  it('mismo rol => no-op (200)', async () => {
    const users = await userRepo.find();
    const id = users[0].user_id;

    const res = await request(app.getHttpServer())
      .patch(`/user/${id}/role`)
      .send({ role: 'usuario' });

    expect(res.status).toBe(200);
    expect(res.text).toBe('No hay cambios en el rol');
  });
});


jest.setTimeout(30000);

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let userRepo: any;
  let dataSource: DataSource;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    // Cargar .env.test si existe
=======
>>>>>>> 15c6839 (Documentación Swagger y actualización del README para el endpoint de gestión de roles)
    require('dotenv').config({ path: '.env.test' });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.POSTGRES_HOST,
          port: Number(process.env.POSTGRES_PORT) || 5432,
          username: process.env.POSTGRES_USER,
          password: process.env.POSTGRES_PASSWORD,
          database: process.env.POSTGRES_DB,
          entities: [UserEntity, RoleChangeEntity, RoleEntity],
          synchronize: true,
        }),
        UserModule,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    userRepo = moduleFixture.get(getRepositoryToken(UserEntity));
    dataSource = moduleFixture.get(DataSource);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(async () => {
    // Limpiar tablas relacionadas respetando FKs. Usamos TRUNCATE ... CASCADE para evitar errores
    await dataSource.query('TRUNCATE TABLE role_changes, users_roles, roles, users RESTART IDENTITY CASCADE');
    await userRepo.save({ user_email: 'test@example.com', user_password: 'pwd', user_role: 'usuario' });
  });

  it('admin puede cambiar rol (200)', async () => {
    const users = await userRepo.find();
    const id = users[0].user_id;

    const res = await request(app.getHttpServer())
      .patch(`/user/${id}/role`)
      .send({ role: 'administrador', reason: 'Promoción' })
      .set('x-user-id', '999');

    expect(res.status).toBe(200);
    expect(res.text).toContain('Rol actualizado correctamente');
  });

  it('no-admin obtiene 403', async () => {
    // Para validar 403 debemos activar RolesGuard que devuelva false
    const moduleNoAdmin: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.POSTGRES_HOST,
          port: Number(process.env.POSTGRES_PORT) || 5432,
          username: process.env.POSTGRES_USER,
          password: process.env.POSTGRES_PASSWORD,
          database: process.env.POSTGRES_DB,
          entities: [UserEntity, RoleChangeEntity, RoleEntity],
          synchronize: true,
        }),
        UserModule,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => false })
      .compile();

    const appNoAdmin = moduleNoAdmin.createNestApplication();
    await appNoAdmin.init();

    const users = await userRepo.find();
    const id = users[0].user_id;

    const res = await request(appNoAdmin.getHttpServer())
      .patch(`/user/${id}/role`)
      .send({ role: 'administrador' });

    expect(res.status).toBe(403);

    await appNoAdmin.close();
  });

  it('rol inválido = 400', async () => {
    const users = await userRepo.find();
    const id = users[0].user_id;

    const res = await request(app.getHttpServer())
      .patch(`/user/${id}/role`)
      .send({ role: 'rol_invalido' });

    expect(res.status).toBe(400);
  });

  it('mismo rol => no-op (200)', async () => {
    const users = await userRepo.find();
    const id = users[0].user_id;

    const res = await request(app.getHttpServer())
      .patch(`/user/${id}/role`)
      .send({ role: 'usuario' });

    expect(res.status).toBe(200);
    expect(res.text).toBe('No hay cambios en el rol');
  });
});